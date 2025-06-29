const Payment = require('../models/paymentsDB');
const Student = require('../models/studentsDB'); // IMPORTANT: Verify this path (studentDB.js or studentsDB.js)
const FeeStructure = require('../models/feeStructure');
const User = require('../models/user'); // For req.user
const PendingPayment = require('../models/pendingPayment'); 
const { generateReceiptPdf } = require('../utils/receiptGen');
const mongoose = require('mongoose');
const { normalizePhoneNumber, sendSMS } = require('../config/africasTalking'); // Consolidated SMS functions
const axios = require('axios'); 
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const { sendPaymentNotification } = require('../utils/sendPaymentNotification');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const FRONTEND_BASE_URL_FOR_REDIRECT = process.env.FRONTEND_BASE_URL; 

const calculateTotalExpectedFees = async (gradeLevel, boardingStatus, hasTransport, transportRoute) => {
    let feeRecord = null;

    if (boardingStatus === 'Day' && hasTransport && transportRoute) {
        feeRecord = await FeeStructure.findOne({
            gradeLevel,
            boardingStatus: 'Day',
            hasTransport: true,
            [`transportRoutes.${transportRoute.toLowerCase()}`]: { $exists: true }
        });
        if (feeRecord) {
            let total = feeRecord.totalCalculated || feeRecord.totalAmount || 0;
            const transportAmount = feeRecord.transportRoutes.get(transportRoute.toLowerCase());
            return total + (transportAmount || 0);
        }
    }

    if (!feeRecord && boardingStatus === 'Day' && !hasTransport) {
        feeRecord = await FeeStructure.findOne({ gradeLevel, boardingStatus: 'Day', hasTransport: false });
    } else if (!feeRecord && boardingStatus === 'Boarding') {
        feeRecord = await FeeStructure.findOne({ gradeLevel, boardingStatus: 'Boarding' });
    } else if (!feeRecord && boardingStatus === 'Day' && hasTransport) { // Fallback if specific route wasn't found
        feeRecord = await FeeStructure.findOne({ gradeLevel, boardingStatus: 'Day', hasTransport: true });
    }

    if (!feeRecord) {
        console.warn(`[FeeCalc] No definitive fee structure found for: Grade: ${gradeLevel}, Boarding: ${boardingStatus}, Transport: ${hasTransport}, Route: ${transportRoute}. Returning 0.`);
        return 0;
    }

    let totalCalculatedFee = feeRecord.totalCalculated || feeRecord.totalAmount || 0;

    if (hasTransport && boardingStatus === 'Day' && transportRoute && feeRecord.transportRoutes) {
        const routeKey = transportRoute.toLowerCase();
        const transportAmount = feeRecord.transportRoutes.get(routeKey);
        if (transportAmount !== undefined && transportAmount !== null) {
            totalCalculatedFee += transportAmount;
        } else {
            console.warn(`[FeeCalc] Transport route '${transportRoute}' fee not found in fee structure for grade ${gradeLevel}. Transport component not added.`);
        }
    }
    return totalCalculatedFee;
};

const getPaystackHeaders = () => ({
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
});

exports.recordPayment = asyncHandler(async (req, res) => {
  if (!['bursar', 'admin', 'director'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized to record payments.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      admissionNumber,
      amountPaid,
      paymentMethod,
      transactionReference,
      payerName,
      notes,
    } = req.body;

    if (!admissionNumber || !paymentMethod || !amountPaid || isNaN(parseFloat(amountPaid)) || parseFloat(amountPaid) <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Admission number, a positive Amount Paid, and Payment Method are required.' });
    }

    const parsedAmountPaid = parseFloat(amountPaid);

    const requiresReference = ['M-Pesa', 'Bank Transfer', 'Cheque'].includes(paymentMethod);
    if (requiresReference && (!transactionReference || transactionReference.trim() === '')) {
      await session.abortTransaction();
      return res.status(400).json({ message: `Transaction Reference is required for ${paymentMethod} payments.` });
    }

    const student = await Student.findOne({ admissionNumber: admissionNumber.toUpperCase().trim() }).session(session);
    if (!student) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Student not found.' });
    }

    const currentExpectedFees = await calculateTotalExpectedFees(
      student.gradeLevel,
      student.boardingStatus,
      student.hasTransport,
      student.transportRoute
    );

    const totalPaymentsMadeResult = await Payment.aggregate([
      { $match: { student: student._id } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]).session(session);
    const existingFeesPaid = totalPaymentsMadeResult.length > 0 ? totalPaymentsMadeResult[0].total : 0;

    const newTotalFeesPaid = existingFeesPaid + parsedAmountPaid;
    const newRemainingBalance = currentExpectedFees - newTotalFeesPaid;

    const newPayment = new Payment({
      student: student._id,
      admissionNumber: student.admissionNumber,
      amountPaid: parsedAmountPaid,
      paymentMethod,
      transactionReference: transactionReference?.trim(),
      payerName: payerName?.trim(),
      notes: notes?.trim(),
      paymentDate: new Date(),
      recordedBy: req.user.id,
      source: 'Manual Bursar Entry',
    });

    await newPayment.save({ session });

    student.feeDetails.totalFees = currentExpectedFees;
    student.feeDetails.feesPaid = newTotalFeesPaid;
    student.feeDetails.remainingBalance = newRemainingBalance;

    await student.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send SMS Confirmation
    if (student.parent && student.parent.phone) {
      const parentPhoneNumber = normalizePhoneNumber(student.parent.phone);

      if (parentPhoneNumber) {
        const smsMessage =
          `Dear Parent, this confirms payment of KSh ${parsedAmountPaid.toLocaleString()} for ${student.fullName} (Adm: ${student.admissionNumber}). ` +
          `Current balance: KSh ${student.feeDetails.remainingBalance?.toLocaleString() || 0}.\nThank you for your continued support.`;

        sendSMS(parentPhoneNumber, smsMessage)
          .then((smsRes) => {
            if (!smsRes.success) {
              console.error(`[PAYMENT_CONTROLLER] Failed to send SMS to ${parentPhoneNumber}: ${smsRes.message}`);
            } else {
              console.log(`[PAYMENT_CONTROLLER] SMS sent to ${parentPhoneNumber} for ${student.fullName}.`);
            }
          })
          .catch((smsError) => {
            console.error(`[PAYMENT_CONTROLLER] Error sending SMS:`, smsError);
          });
      } else {
        console.warn(`[PAYMENT_CONTROLLER] Invalid normalized phone for ${student.fullName}.`);
      }
    }

    res.status(200).json({
      message: 'Payment recorded successfully!',
      payment: newPayment,
      updatedStudentBalance: {
        feesPaid: student.feeDetails.feesPaid,
        remainingBalance: student.feeDetails.remainingBalance,
        totalFees: student.feeDetails.totalFees,
      },
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Internal Server Error.', error: error.message });
  } finally {
    if (session.inTransaction()) session.endSession();
  }
});

// exports.recordInKindPayment = asyncHandler(async (req, res) => {
  
//   const {
//     admissionNumber,
//     amountPaid,
//     transactionReference,
//     payerName,
//     notes,
//     inKindItemType,
//     inKindQuantity,
//     inKindUnitPrice,
//     unitSizeKg,
//     county,
//     market,
//   } = req.body;

//   if (
//     !admissionNumber ||
//     !amountPaid ||
//     !inKindItemType ||
//     !inKindQuantity ||
//     !inKindUnitPrice
//   ) {
//     return res.status(400).json({
//       message: 'Admission number, in-kind item type, quantity, unit price, and amount are required.',
//     });
//   }

//   const quantityNumber = parseFloat(inKindQuantity);
//   const unitPriceNumber = parseFloat(inKindUnitPrice);
//   const amountNumber = parseFloat(amountPaid);
//   const kgPerUnit = unitSizeKg ? parseFloat(unitSizeKg) : 90;

//   if (isNaN(quantityNumber) || quantityNumber <= 0) {
//     return res.status(400).json({ message: 'Quantity must be a positive number.' });
//   }
//   if (isNaN(unitPriceNumber) || unitPriceNumber < 0) {
//     return res.status(400).json({ message: 'Unit price must be a non-negative number.' });
//   }
//   if (isNaN(kgPerUnit) || kgPerUnit <= 0) {
//     return res.status(400).json({ message: 'Unit size must be a positive number.' });
//   }

//   const expectedAmount = quantityNumber * kgPerUnit * unitPriceNumber;

//   if (Math.abs(expectedAmount - amountNumber) > 5) {
//     return res.status(400).json({
//       message: `Calculated amount mismatch. Expected ~KSh ${expectedAmount.toFixed(2)}, got KSh ${amountNumber.toFixed(2)}.`,
//     });
//   }

//   const student = await Student.findOne({
//     admissionNumber: admissionNumber.trim().toUpperCase(),
//   });
//   if (!student) {
//     return res.status(404).json({ message: 'Student not found.' });
//   }

//   const finalReference = transactionReference?.trim() || `IN-KIND-${Date.now()}`;

//   const payment = new Payment({
//     student: student._id,
//     admissionNumber: student.admissionNumber,
//     amountPaid: amountNumber,
//     paymentMethod: 'In-Kind',
//     transactionReference: finalReference,
//     payerName: payerName || '',
//     notes,
//     paymentDate: new Date(),
//     recordedBy: req.user?.id,
//     source: 'In-Kind Produce Entry',
//     inKindDetails: {
//       itemType: inKindItemType.trim(),
//       quantity: quantityNumber,
//       unitSizeKg: kgPerUnit,
//       unitPrice: unitPriceNumber,
//       ...(county && { county }),
//       ...(market && { market }),
//     },
//     status: 'confirmed',
//     confirmedAt: new Date(),
//     confirmedBy: req.user?.id,
//   });

//   await payment.save();

//   student.feeDetails.feesPaid += amountNumber;
//   student.feeDetails.remainingBalance = Math.max(
//     student.feeDetails.totalFees - student.feeDetails.feesPaid,
//     0
//   );

//   await student.save();

//   // ✅ Send SMS via helper
//   await require('../utils/sendPaymentNotification').sendPaymentNotification(student, {
//     quantity: quantityNumber,
//     unitSize: kgPerUnit,
//     itemType: inKindItemType.trim(),
//     amount: amountNumber,
//     remainingBalance: student.feeDetails.remainingBalance,
//   });

//   res.json({
//     message: 'In-kind payment recorded successfully.',
//     updatedStudentBalance: student.feeDetails,
//   });
// });

exports.recordInKindPayment = asyncHandler(async (req, res) => {
  try {
    const {
      admissionNumber,
      amountPaid,
      transactionReference,
      payerName,
      notes,
      inKindItemType,
      inKindQuantity,
      inKindUnitPrice,
      county,
      market,
    } = req.body;

    // Basic student lookup
    const student = await Student.findOne({
      admissionNumber: admissionNumber?.trim().toUpperCase(),
    });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Prepare payment data with defaults
    const paymentData = {
      student: student._id,
      admissionNumber: student.admissionNumber,
      amountPaid: parseFloat(amountPaid) || 0,
      paymentMethod: 'In-Kind',
      transactionReference: transactionReference?.trim() || `IN-KIND-${Date.now()}`,
      payerName: payerName || '',
      notes: notes || '',
      paymentDate: new Date(),
      inKindItemType: inKindItemType || '',
      inKindQuantity: parseFloat(inKindQuantity) || 0,
      inKindUnitPrice: parseFloat(inKindUnitPrice) || 0,
      county: county || '',
      market: market || '',
      status: 'confirmed',
      confirmedAt: new Date()
    };

    // Create and save payment
    const payment = new Payment(paymentData);
    await payment.save();

    // Update student balance
    student.feeDetails.feesPaid += payment.amountPaid;
    student.feeDetails.remainingBalance = Math.max(
      student.feeDetails.totalFees - student.feeDetails.feesPaid,
      0
    );
    await student.save();

    // Send notification with proper data structure
    await require('../utils/sendPaymentNotification').sendPaymentNotification(student, {
      quantity: payment.inKindQuantity || 0,
      unitSize: 90, // Standard bag size
      itemType: payment.inKindItemType || '',
      amount: payment.amountPaid,
      remainingBalance: student.feeDetails.remainingBalance,
    });

    res.json({
      success: true,
      message: 'In-kind payment recorded successfully',
      payment,
      updatedStudentBalance: student.feeDetails
    });

  } catch (error) {
    console.error('Error recording in-kind payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording payment',
      error: error.message
    });
  }
});

exports.getPendingInKind = asyncHandler(async (req, res) => {
    if (!['bursar', 'admin', 'director'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized to view pending in-kind payments.' });
    }
    try {
        const pendingInKindPayments = await PendingPayment.find({
            paymentMethod: 'In-Kind', 
            isLinked: false // This flag is crucial for pending (unlinked)
        }).populate('student', 'fullName admissionNumber parent.name'); 

        const formatted = pendingInKindPayments.map(p => ({
            id: p._id,
            studentName: p.student?.fullName || 'N/A',
            admissionNumber: p.student?.admissionNumber || 'N/A',
            payerName: p.payerName || p.student?.parent?.name || 'N/A',
            inKindDetails: p.inKindDetails, 
            transactionReference: p.transactionReference || 'N/A',
            paymentDate: p.paymentDate,
            amountPaid: p.amount // Use 'amount' from PendingPayment
        }));

        res.status(200).json(formatted);
    } catch (error) {
        console.error('Error fetching pending in-kind payments:', error.message);
        res.status(500).json({ message: 'Server error fetching pending in-kind payments.', error: error.message });
    }
});


exports.getPaymentByReferenceNumber = asyncHandler(async (req, res) => {
    if (!['bursar', 'admin', 'director'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized to view payment by reference number.' });
    }
    try {
        const payment = await Payment.findOne({ transactionReference: req.params.referenceNumber }).populate('student', 'fullName admissionNumber');

        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found with this reference number.' });
        }

        res.status(200).json({
            studentName: payment.student?.fullName || 'Unknown',
            studentAdmissionNumber: payment.student?.admissionNumber || 'Unknown',
            amountPaid: payment.amountPaid,
            paymentMethod: payment.paymentMethod,
            transactionReference: payment.transactionReference,
            payerName: payment.payerName,
            paymentDate: payment.paymentDate,
            notes: payment.notes,
            inKindDetails: payment.paymentMethod === 'In-Kind' && payment.inKindDetails ? {
                itemType: payment.inKindDetails.itemType,
                quantity: payment.inKindDetails.quantity,
                unitPrice: payment.inKindDetails.unitPrice,
            } : null
        });
    } catch (error) {
        console.error('Error fetching payment by reference number:', error.message);
        res.status(500).json({ message: 'Server error fetching payment by reference number.', error: error.message });
    }
});

exports.getPaymentsByStudent = asyncHandler(async (req, res) => {
    if (!['bursar', 'admin', 'director'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized to view student payments.' });
    }
    try {
        const student = await Student.findOne({ admissionNumber: req.params.admissionNumber.toUpperCase() }).lean();
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        const payments = await Payment.find({ student: student._id })
            .populate('recordedBy', 'fullName')
            .sort({ paymentDate: -1 })
            .lean();

        const currentExpectedFees = await calculateTotalExpectedFees(
            student.gradeLevel,
            student.boardingStatus,
            student.hasTransport,
            student.transportRoute
        );

        const totalPaymentsMadeResult = await Payment.aggregate([
            { $match: { student: student._id } },
            { $group: { _id: null, total: { $sum: '$amountPaid' } } }
        ]);
        const feesPaidForLife = totalPaymentsMadeResult.length > 0 ? totalPaymentsMadeResult[0].total : 0;
        const remainingBalance = currentExpectedFees - feesPaidForLife;

        let needsUpdate = false;
        const updateFields = {};
        if (student.feeDetails.totalFees !== currentExpectedFees) {
            updateFields['feeDetails.totalFees'] = currentExpectedFees;
            needsUpdate = true;
        }
        if (student.feeDetails.remainingBalance !== remainingBalance) {
            updateFields['feeDetails.remainingBalance'] = remainingBalance;
            needsUpdate = true;
        }
        if (feesPaidForLife !== student.feeDetails.feesPaid) {
            updateFields['feeDetails.feesPaid'] = feesPaidForLife;
            needsUpdate = true;
        }

        if (needsUpdate) {
            await Student.updateOne({ _id: student._id }, { $set: updateFields });
            student.feeDetails.totalFees = currentExpectedFees;
            student.feeDetails.remainingBalance = remainingBalance;
            student.feeDetails.feesPaid = feesPaidForLife;
        }

        res.status(200).json({ student, payments });

    } catch (error) {
        console.error('Error fetching student payments:', error.message);
        res.status(500).json({ message: 'Server error fetching student payments.', error: error.message });
    }
});

exports.generateReceipt = asyncHandler(async (req, res) => {
    if (!['bursar', 'admin', 'director'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized to generate receipts.' });
    }
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId).populate('student').populate('recordedBy', 'fullName');
        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found.' });
        }

        const student = await Student.findById(payment.student._id);
        if (!student) {
            return res.status(404).json({ message: 'Associated student not found for this payment.' });
        }

        const currentBalance = student.feeDetails.remainingBalance;

        const pdfBuffer = await generateReceiptPdf(payment.toObject(), student.toObject(), currentBalance, payment.recordedBy?.fullName);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt_${payment.transactionReference || payment._id}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating receipt:', error.message);
        res.status(500).json({ message: 'Server error generating receipt.', error: error.message });
    }
});

exports.initializePaystackTransaction = asyncHandler(async (req, res) => {
    console.log("📡 [Backend] Paystack Transaction Initialization Hit");

    if (req.user.role !== 'parent') {
        res.status(403);
        throw new Error('Not authorized to initiate payments.');
    }

    const { studentId, amount: requestedAmount, payerEmail } = req.body;

    if (!studentId || !requestedAmount || requestedAmount <= 0 || !payerEmail) {
        res.status(400);
        throw new Error('Missing required fields: studentId, amount, payerEmail.');
    }

    const authenticatedParentUser = req.user; 

    const student = await Student.findById(studentId);
    if (!student) {
        res.status(404);
        throw new Error('Student not found for the provided ID.');
    }

    const isAuthorized = (
        (student.parent && student.parent.email && student.parent.email === authenticatedParentUser.email) ||
        (student.parent && student.parent.phone && normalizePhoneNumber(student.parent.phone) === normalizePhoneNumber(authenticatedParentUser.phoneNumber))
    );

    if (!isAuthorized) {
        console.warn(`[Backend] Unauthorized payment initiation attempt: Student ${student.admissionNumber} not linked to user ${authenticatedParentUser.email}`);
        res.status(403);
        throw new Error('You are not authorized to pay for this student.');
    }

    const amountInKobo = Math.round(requestedAmount * 100); 
    const reference = `TDEC_PAY_${student.admissionNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: payerEmail,
                amount: amountInKobo,
                reference: reference,
                callback_url: `${FRONTEND_BASE_URL_FOR_REDIRECT}/--/payment-success`, 
                metadata: {
                    studentId: student._id.toString(), 
                    studentAdmissionNumber: student.admissionNumber, 
                    studentFullName: student.fullName,
                    payerUserId: authenticatedParentUser._id.toString(),
                    payerEmail: authenticatedParentUser.email,
                    paymentSource: 'parent_app', // Indicate source for webhook
                },
                currency: 'KES', 
            },
            {
                headers: getPaystackHeaders(),
            }
        );

        res.status(200).json({
            message: 'Payment initiation successful',
            authorization_url: response.data.data.authorization_url, 
            reference: reference, 
        });

    } catch (error) {
        console.error('[Backend] Error calling Paystack Initialize API:', error.response?.data || error.message);
        res.status(500);
        throw new Error(`Failed to initialize Paystack transaction: ${error.response?.data?.message || error.message}`);
    }
});

// exports.handlePaystackWebhook = async (req, res) => {
//   // 1️⃣ Validate signature
//   const secret = process.env.PAYSTACK_SECRET_KEY;
//   const hash = crypto
//     .createHmac('sha512', secret)
//     .update(req.rawBody)
//     .digest('hex');

//   if (hash !== req.headers['x-paystack-signature']) {
//     console.error('[WEBHOOK] Invalid signature');
//     return res.status(400).send('Invalid signature');
//   }

//   const event = req.body;
//   console.log('[WEBHOOK] Event received:', event.event);

//   if (event.event === 'charge.success') {
//     const tx = event.data;

//     // Check if payment already exists
//     const exists = await PendingPayment.findOne({ gatewayTransactionId: tx.reference });
//     if (exists) {
//       console.log(`[WEBHOOK] Payment ${tx.reference} already exists`);
//       return res.status(200).send('Already recorded');
//     }

//     // Extract metadata
//     const studentIdFromMeta = tx.metadata?.studentId;
//     const admissionNumberUsed = tx.metadata?.studentAdmissionNumber || 
//                               tx.metadata?.custom_fields?.find(f => f.variable_name === 'admission_number')?.value || '';
//     const paymentSource = tx.metadata?.paymentSource || 'unknown';

//     // --- Handle Parent App Payments Differently ---
//     if (paymentSource === 'parent_app' && studentIdFromMeta) {
//       const session = await mongoose.startSession();
//       session.startTransaction();

//       try {
//         const student = await Student.findById(studentIdFromMeta).populate('parent').session(session);
//         if (!student) {
//           await session.abortTransaction();
//           console.error(`Parent app payment student not found: ${studentIdFromMeta}`);
//           return res.status(404).send('Student not found');
//         }

//         // Create the payment record
//         const newPayment = new Payment({
//           student: student._id,
//           admissionNumber: student.admissionNumber,
//           amountPaid: tx.amount / 100,
//           paymentMethod: tx.channel === 'mobile_money' ? 'M-Pesa' : 'Paystack Online',
//           transactionReference: tx.reference,
//           payerName: `${tx.customer.first_name} ${tx.customer.last_name}`.trim() || 'Parent App Payer',
//           notes: `Parent app payment via Paystack. Ref: ${tx.reference}`,
//           paymentDate: tx.paid_at ? new Date(tx.paid_at) : new Date(),
//           recordedBy: tx.metadata?.payerUserId || null,
//           source: 'Parent App (Auto-Processed)',
//         });
//         await newPayment.save({ session });

//         // Update student fees
//         const currentExpectedFees = await calculateTotalExpectedFees(
//           student.gradeLevel,
//           student.boardingStatus,
//           student.hasTransport,
//           student.transportRoute
//         );
        
//         const totalPaymentsMadeResult = await Payment.aggregate([
//           { $match: { student: student._id } },
//           { $group: { _id: null, total: { $sum: '$amountPaid' } } }
//         ]).session(session);
        
//         const feesPaidForLife = totalPaymentsMadeResult[0]?.total || 0;
//         student.feeDetails.totalFees = currentExpectedFees;
//         student.feeDetails.feesPaid = feesPaidForLife;
//         student.feeDetails.remainingBalance = currentExpectedFees - feesPaidForLife;
//         await student.save({ session });

//         // Create audit record in pending payments
//         const pendingRecord = new PendingPayment({
//           gatewayTransactionId: tx.reference,
//           amount: tx.amount / 100,
//           paymentMethod: newPayment.paymentMethod,
//           paymentDate: tx.paid_at ? new Date(tx.paid_at) : new Date(),
//           payerDetails: { 
//             email: tx.customer.email, 
//             phone: tx.customer.phone, 
//             name: `${tx.customer.first_name} ${tx.customer.last_name}`.trim() 
//           },
//           student: student._id,
//           admissionNumberUsed: student.admissionNumber,
//           status: 'confirmed',
//           confirmedBy: 'system',
//           confirmedAt: new Date(),
//           rawWebhookData: event,
//           notes: 'Auto-confirmed parent app payment'
//         });
//         await pendingRecord.save({ session });

//         await session.commitTransaction();
//         console.log(`✅ Parent app payment for ${student.admissionNumber} processed`);
        
//         // Send SMS notification
//         if (student.parent?.phone) {
//           const parentPhone = normalizePhoneNumber(student.parent.phone);
//           if (parentPhone) {
//             const smsMessage = `Payment of KSh ${tx.amount/100} received for ${student.fullName}. Ref: ${tx.reference}. Balance: KSh ${student.feeDetails.remainingBalance || 0}`;
//             sendSMS(parentPhone, smsMessage).catch(e => console.error('SMS send error:', e));
//           }
//         }

//         return res.status(200).send('Parent app payment processed successfully');
//       } catch (err) {
//         await session.abortTransaction();
//         console.error('Error processing parent app payment:', err);
//         return res.status(500).send('Error processing parent app payment');
//       } finally {
//         session.endSession();
//       }
//     }

//     // --- Handle Regular Payments ---
//     const pendingPayment = new PendingPayment({
//       gatewayTransactionId: tx.reference,
//       amount: tx.amount / 100,
//       currency: tx.currency,
//       paymentMethod: tx.channel,
//       status: 'pending',
//       payerDetails: {
//         email: tx.customer.email,
//         phone: tx.customer.phone,
//         name: `${tx.customer.first_name} ${tx.customer.last_name}`.trim()
//       },
//       paidAt: tx.paid_at ? new Date(tx.paid_at) : new Date(),
//       admissionNumberUsed: admissionNumberUsed,
//       paystackMetadata: tx
//     });

//     await pendingPayment.save();
//     console.log(`[WEBHOOK] Pending payment created for ${tx.reference}`);
//     return res.status(200).send('Payment recorded');
//   }

//   return res.status(200).send('Event ignored');
// };

exports.handlePaystackWebhook = async (req, res) => {
  // Validate Paystack signature
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto.createHmac('sha512', secret).update(req.rawBody).digest('hex');
  
  if (hash !== req.headers['x-paystack-signature']) {
    console.error('⚠️ Invalid webhook signature');
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;
  
  // Only process successful charges
  if (event.event !== 'charge.success') {
    return res.status(200).send('Event not handled');
  }

  const transaction = event.data;
  const metadata = transaction.metadata || {};
  
  try {
    // Check for duplicate processing
    const existingPayment = await Payment.findOne({ 
      transactionReference: transaction.reference 
    });
    
    if (existingPayment) {
      return res.status(200).send('Payment already processed');
    }

    // Verify we have required student information
    const studentId = metadata.studentId;
    if (!studentId) {
      console.error('Missing studentId in metadata');
      return res.status(400).send('Student ID required');
    }

    // Start database transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Find the student with fee details
      const student = await Student.findById(studentId)
        .populate('parent')
        .session(session);
      
      if (!student) {
        await session.abortTransaction();
        return res.status(404).send('Student not found');
      }

      // 2. Create the payment record
      const paymentAmount = transaction.amount / 100; // Convert to KES
      
      const newPayment = new Payment({
        student: student._id,
        admissionNumber: student.admissionNumber,
        amountPaid: paymentAmount,
        paymentMethod: transaction.channel === 'mobile_money' ? 'M-Pesa' : 'Card',
        transactionReference: transaction.reference,
        payerName: `${transaction.customer.first_name || ''} ${transaction.customer.last_name || ''}`.trim(),
        paymentDate: new Date(transaction.paid_at),
        recordedBy: metadata.payerUserId || 'system',
        source: 'Parent App',
        notes: `Auto-confirmed payment via ${transaction.channel}`
      });
      
      await newPayment.save({ session });

      // 3. Update student's fee balance
      const totalExpectedFees = await calculateTotalExpectedFees(
        student.gradeLevel,
        student.boardingStatus,
        student.hasTransport,
        student.transportRoute
      );
      
      // Get sum of all payments for this student
      const paymentsAggregate = await Payment.aggregate([
        { $match: { student: student._id } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]).session(session);
      
      const totalPaid = paymentsAggregate[0]?.total || 0;
      
      // Update student record
      student.feeDetails = {
        totalFees: totalExpectedFees,
        feesPaid: totalPaid,
        remainingBalance: totalExpectedFees - totalPaid
      };
      
      await student.save({ session });

      // 4. Create audit log (optional)
      const paymentLog = new PendingPayment({
        gatewayTransactionId: transaction.reference,
        amount: paymentAmount,
        paymentMethod: newPayment.paymentMethod,
        status: 'confirmed',
        confirmedBy: metadata.payerUserId || null,
        confirmedAt: new Date(),
        student: student._id,
        admissionNumberUsed: student.admissionNumber,
        payerDetails: {
          email: transaction.customer.email,
          phone: transaction.customer.phone,
          name: newPayment.payerName
        },
        notes: 'Auto-confirmed parent payment'
      });
      
      await paymentLog.save({ session });

      // Commit transaction
      await session.commitTransaction();
      
      // 5. Send confirmation to parent
      if (student.parent?.phone) {
        const message = `Payment of KSh ${paymentAmount} received for ${student.fullName}. New balance: KSh ${student.feeDetails.remainingBalance}`;
        await sendSMS(student.parent.phone, message);
      }

      return res.status(200).send('Payment processed successfully');
      
    } catch (err) {
      await session.abortTransaction();
      console.error('Transaction error:', err);
      throw err;
    } finally {
      session.endSession();
    }
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).send('Error processing payment');
  }
};

// exports.getPendingPayments = asyncHandler(async (req, res) => {
//     if (!['bursar', 'admin', 'director'].includes(req.user.role)) {
//         return res.status(403).json({ message: 'Not authorized to view pending payments.' });
//     }
//     try {
//         // Fetch payments that are marked as 'pending' and are not yet linked to a student
//         const pending = await PendingPayment.find({ status: 'pending', isLinked: false })
//                                             .populate('student', 'fullName admissionNumber gradeLevel boardingStatus hasTransport transportRoute')
//                                             .sort({ paymentDate: -1 }); // Sort by payment date descending
//         res.status(200).json(pending);
//     } catch (error) {
//         console.error('Error fetching pending payments:', error.message);
//         res.status(500).json({ message: 'Server error fetching pending payments.', error: error.message });
//     }
// });

exports.linkPendingPayment = asyncHandler(async (req, res) => {
    if (!['bursar', 'admin', 'director'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized to link payments.' });
    }

    const { paymentId, studentId } = req.body; // paymentId is the _id of the PendingPayment document
    if (!paymentId || !studentId) {
        return res.status(400).json({ message: 'Pending payment ID and Student ID are required.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const pendingPayment = await PendingPayment.findById(paymentId).session(session);
        if (!pendingPayment) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Pending payment record not found.' });
        }

        if (pendingPayment.isLinked) { // Check if already linked
            await session.abortTransaction();
            return res.status(409).json({ message: 'This payment is already linked. Cannot link again.' });
        }

        const student = await Student.findById(studentId).session(session);
        if (!student) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Student not found.' });
        }

        // Update the pending payment record to link it
        pendingPayment.student = student._id;
        pendingPayment.admissionNumberUsed = student.admissionNumber; // For consistency
        pendingPayment.isLinked = true; 
        pendingPayment.linkedBy = req.user.id;
        pendingPayment.linkedAt = new Date();
        pendingPayment.notes = pendingPayment.notes ? `${pendingPayment.notes}; Manually linked by ${req.user.fullName}` : `Manually linked by ${req.user.fullName}`;
        pendingPayment.reason = `Manually linked by ${req.user.fullName}`; // Add reason field for pending payment


        await pendingPayment.save({ session });

        await session.commitTransaction();
        session.endSession();

        // The frontend will likely call confirm-pending next, so we just confirm linking here.
        res.status(200).json({ 
            message: 'Pending payment successfully linked to student.', 
            linkedPayment: pendingPayment 
        });

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error('Error linking pending payment:', error.message, error);
        res.status(500).json({ message: 'Internal Server Error linking payment.', error: error.message });
    } finally {
        if (session.inTransaction()) {
            session.endSession();
        }
    }
});

// exports.confirmPendingPayment = asyncHandler(async (req, res) => {
//     if (!['bursar', 'admin', 'director'].includes(req.user.role)) {
//         return res.status(403).json({ message: 'Not authorized to confirm payments.' });
//     }

//     const { paymentId } = req.params; // paymentId is the _id of the PendingPayment document

//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const pendingPayment = await PendingPayment.findById(paymentId).session(session);
//         if (!pendingPayment) {
//             await session.abortTransaction();
//             return res.status(404).json({ message: 'Pending payment record not found.' });
//         }

//         if (pendingPayment.status === 'confirmed') { // Already confirmed
//             await session.abortTransaction();
//             console.warn(`[Backend] Confirmation: Pending payment ${paymentId} already confirmed.`);
//             return res.status(200).json({ message: 'Payment already confirmed and processed.' });
//         }

//         if (!pendingPayment.isLinked || !pendingPayment.student) {
//             await session.abortTransaction();
//             return res.status(400).json({ message: 'Payment must be linked to a student before confirmation.' });
//         }

//         // Ensure the payment hasn't already been moved to the main Payment collection by another process
//         const existingMainPayment = await Payment.findOne({ transactionReference: pendingPayment.transactionReference }).session(session);
//         if (existingMainPayment) {
//             // If it exists in main Payment, remove the pending record and send success
//             pendingPayment.status = 'confirmed'; // Mark as confirmed in pending also
//             pendingPayment.confirmedBy = req.user.id;
//             pendingPayment.confirmedAt = new Date();
//             await pendingPayment.save({session});
//             await session.commitTransaction(); // Commit the status update to pendingPayment
//             await PendingPayment.deleteOne({ _id: paymentId }).session(mongoose.startSession().then(s => s)); // Delete in a separate session if needed for idempotency, or just trust the status update
//             console.warn(`[Backend] Confirmation: Pending payment ${paymentId} already exists in main Payments. Marking as confirmed and removing from pending.`);
//             return res.status(200).json({ message: 'Payment already confirmed and processed (duplicate found in main payments).' });
//         }

//         const student = await Student.findById(pendingPayment.student).session(session);
//         if (!student) {
//             await session.abortTransaction();
//             return res.status(404).json({ message: 'Associated student not found.' });
//         }

//         // Create the final Payment record
//         const newPayment = new Payment({
//             student: student._id,
//             admissionNumber: student.admissionNumber,
//             amountPaid: pendingPayment.amount, 
//             paymentMethod: pendingPayment.paymentMethod,
//             transactionReference: pendingPayment.transactionReference,
//             payerName: pendingPayment.payerName || student.parent?.name || 'Manual Confirmed Payer',
//             notes: pendingPayment.notes || `Manual confirmation by ${req.user.fullName}. Original metadata: ${JSON.stringify(pendingPayment.metadata)}`,
//             paymentDate: pendingPayment.paymentDate,
//             recordedBy: req.user.id, 
//             source: 'Manual Confirmation',
//             ...(pendingPayment.inKindDetails && { inKindDetails: pendingPayment.inKindDetails })
//         });
//         await newPayment.save({ session });

//         // Update student's fee details
//         const currentExpectedFees = await calculateTotalExpectedFees(
//             student.gradeLevel,
//             student.boardingStatus,
//             student.hasTransport,
//             student.transportRoute
//         );

//         const totalPaymentsMadeResult = await Payment.aggregate([
//             { $match: { student: student._id } },
//             { $group: { _id: null, total: { $sum: '$amountPaid' } } }
//         ]).session(session);
//         const feesPaidForLife = totalPaymentsMadeResult.length > 0 ? totalPaymentsMadeResult[0].total : 0;

//         student.feeDetails.totalFees = currentExpectedFees;
//         student.feeDetails.feesPaid = feesPaidForLife;
//         student.feeDetails.remainingBalance = currentExpectedFees - feesPaidForLife;

//         await student.save({ session });

//         // Update pending payment status and remove it
//         pendingPayment.status = 'confirmed';
//         pendingPayment.confirmedBy = req.user.id;
//         pendingPayment.confirmedAt = new Date();
//         await pendingPayment.save({ session }); // Save status update first
//         await PendingPayment.deleteOne({ _id: paymentId }).session(session); // Then delete


//         await session.commitTransaction();
//         session.endSession();

//         res.status(200).json({ message: 'Payment confirmed and recorded successfully!', payment: newPayment });

//         // Send SMS notification
//         if (student.parent && student.parent.phone) {
//             const parentPhoneNumber = normalizePhoneNumber(student.parent.phone);
//             if (parentPhoneNumber) {
//                 const smsMessage =
//                     `Dear Parent, this confirms a manual payment confirmation of KSh ${pendingPayment.amount.toLocaleString()} for ${student.fullName} (Adm: ${student.admissionNumber}). ` +
//                     `Reference: ${pendingPayment.transactionReference}. Current balance: KSh ${student.feeDetails.remainingBalance?.toLocaleString() || 0}.\n` +
//                     `Thank you for your continued support.`;
//                 sendSMS(parentPhoneNumber, smsMessage).catch(err => console.error(`[PAYMENT_CONTROLLER] SMS error for manual confirmation ${student.fullName}:`, err));
//             }
//         }

//     } catch (error) {
//         if (session.inTransaction()) {
//             await session.abortTransaction();
//         }
//         console.error('Error confirming pending payment:', error.message, error);
//         res.status(500).json({ message: 'Internal Server Error confirming payment.', error: error.message });
//     } finally {
//         if (session.inTransaction()) {
//             session.endSession();
//         }
//     }
// });


exports.getPendingPayments = async (req, res) => {
  const pendingPayments = await PendingPayment.find({ status: 'pending' }).populate('student');
  res.json(pendingPayments);
};

/**
 * Confirm a pending payment manually
 */
exports.confirmPendingPayment = async (req, res) => {
  const paymentId = req.params.id;
  const userId = req.user.id; // Make sure you have authentication middleware attaching req.user

  const payment = await PendingPayment.findById(paymentId);
  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  if (payment.status !== 'pending') {
    return res.status(400).json({ message: 'Payment is not pending' });
  }

  if (!payment.student) {
    return res.status(400).json({ message: 'Cannot confirm without linked student' });
  }

  // Update student's fee records
  const student = await Student.findById(payment.student);
  student.feeDetails.feesPaid += payment.amount;
  student.feeDetails.remainingBalance = Math.max(
    student.feeDetails.totalFees - student.feeDetails.feesPaid,
    0
  );
  await student.save();

  // Mark payment as confirmed
  payment.status = 'confirmed';
  payment.confirmedBy = userId;
  payment.confirmedAt = new Date();
  await payment.save();

  console.log(`[CONFIRM] Payment confirmed: ${payment.gatewayTransactionId}`);

  res.json({ message: 'Payment confirmed and student fees updated.' });
};