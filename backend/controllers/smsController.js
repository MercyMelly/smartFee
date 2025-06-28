// // backend/controllers/smsController.js

// const Student = require('../models/studentsDB');
// const { sendSMS } = require('../config/africasTalking');


// const normalizePhoneNumber = (phoneNumber) => {
//     if (!phoneNumber) return '';
//     let cleanedNumber = String(phoneNumber).trim().replace(/\s/g, '');

//     // If already in +254... format, return as is (and validate length)
//     if (cleanedNumber.startsWith('+254') && cleanedNumber.length === 13) { // +254 + 9 digits = 13
//         return cleanedNumber;
//     }
//     // If starts with 07... and is 10 digits, convert to +254...
//     if (cleanedNumber.startsWith('07') && cleanedNumber.length === 10) {
//         return '+254' + cleanedNumber.substring(1);
//     }
//     // For any other format, consider it invalid for now.
//     console.warn(`[SMS_CONTROLLER] Phone number ${phoneNumber} is not in a recognized Kenyan (07XXXXXXXX) or international (+254XXXXXXXXX) format. Skipping normalization.`);
//     return ''; // Return empty string for unrecognized formats
// };

// const sendIndividualSmsToParent = async (req, res) => {
//     // Role authorization
//     if (req.user.role !== 'bursar' && req.user.role !== 'admin' && req.user.role !== 'director') {
//         return res.status(403).json({ msg: 'Not authorized to send individual SMS messages.' });
//     }

//     const { admissionNumber, message } = req.body;

//     if (!admissionNumber || !message) {
//         return res.status(400).json({ msg: 'Student admission number and message are required.' });
//     }

//     try {
//         const student = await Student.findOne({ admissionNumber: admissionNumber.toUpperCase().trim() })
//                                      .select('fullName admissionNumber parent.phone feeDetails.feesPaid feeDetails.remainingBalance');

//         console.log("[SMS_CONTROLLER_DEBUG] Student object fetched for individual SMS:", JSON.stringify(student));


//         if (!student) {
//             return res.status(404).json({ msg: 'Student not found with provided admission number.' });
//         }

//         if (!student.parent || !student.parent.phone) {
//             console.warn(`[SMS_CONTROLLER] Parent phone number not found for individual SMS for student: ${student.fullName} (${student.admissionNumber}). Parent object: ${JSON.stringify(student.parent)}`);
//             return res.status(400).json({ msg: 'Parent phone number not found for this student.' });
//         }

//         const normalizedPhoneNumber = normalizePhoneNumber(student.parent.phone);

//         if (!normalizedPhoneNumber) {
//             console.warn(`[SMS_CONTROLLER] Could not normalize phone number for individual SMS for student: ${student.fullName} (${student.admissionNumber}) - Original: ${student.parent.phone}`);
//             return res.status(400).json({ msg: 'Invalid parent phone number format.' });
//         }

//         console.log(`[SMS_CONTROLLER] Sending individual SMS to ${normalizedPhoneNumber} for ${student.fullName}.`);
//         const smsResult = await sendSMS(normalizedPhoneNumber, message);

//         if (smsResult.success) {
//             res.status(200).json({ msg: 'SMS sent successfully!', smsResponse: smsResult.response });
//         } else {
//             res.status(500).json({ msg: 'Failed to send SMS.', error: smsResult.message, details: smsResult.errorDetails });
//         }

//     } catch (error) {
//         console.error('[SMS_CONTROLLER] Server error sending individual SMS:', error.message);
//         res.status(500).json({ msg: 'Server error.', error: error.message });
//     }
// };

// const sendOutstandingBalanceSms = async (req, res) => {
//     // Role authorization
//     if (req.user.role !== 'bursar' && req.user.role !== 'admin' && req.user.role !== 'director') {
//         return res.status(403).json({ msg: 'Not authorized to send bulk SMS messages.' });
//     }

//     try {
//         // Fetch students with outstanding balances to send SMS to
//         const studentsWithBalance = await Student.find({ 'feeDetails.remainingBalance': { $gt: 0 } })
//                                                  .select('fullName admissionNumber parent feeDetails.feesPaid feeDetails.remainingBalance');

//         console.log("[SMS_CONTROLLER_DEBUG] Students found with outstanding balances for bulk SMS:", studentsWithBalance.length);

//         if (studentsWithBalance.length === 0) {
//             console.log('[SMS_CONTROLLER] No students with outstanding balances found. No bulk SMS sent.');
//             // Return success: true and an empty results array for clarity on frontend
//             return res.status(200).json({
//                 success: true,
//                 msg: 'No students with outstanding balances found. No SMS sent.',
//                 summary: { totalStudentsConsidered: 0, results: [] }
//             });
//         }

//         const sendPromises = [];
//         const sendResults = []; // This array will hold detailed results for the frontend

//         for (const student of studentsWithBalance) {
//             console.log(`[SMS_CONTROLLER_DEBUG] Processing student ${student.fullName} (Adm: ${student.admissionNumber}), Parent object from DB:`, JSON.stringify(student.parent));

//             // Check if parent and phone number exist
//             if (!student.parent || !student.parent.phone) {
//                 console.warn(`[SMS_CONTROLLER] Skipping SMS for ${student.fullName} (Adm: ${student.admissionNumber}): Parent phone number missing or invalid.`);
//                 sendResults.push({
//                     student: student.fullName,
//                     admissionNumber: student.admissionNumber,
//                     status: 'skipped',
//                     reason: 'Parent phone data missing or invalid',
//                     details: 'SMS not sent due to missing or invalid parent phone number.'
//                 });
//                 continue; // Skip to the next student
//             }

//             const normalizedPhoneNumber = normalizePhoneNumber(student.parent.phone);

//             // Check if phone number could be normalized
//             if (!normalizedPhoneNumber) {
//                 console.warn(`[SMS_CONTROLLER] Skipping SMS for ${student.fullName} (Adm: ${student.admissionNumber}): Normalized phone number is empty - Original: ${student.parent.phone}`);
//                 sendResults.push({
//                     student: student.fullName,
//                     admissionNumber: student.admissionNumber,
//                     status: 'skipped',
//                     reason: 'Invalid phone number format after normalization',
//                     details: 'SMS not sent due to invalid phone number format.'
//                 });
//                 continue; // Skip to the next student
//             }

//             // Construct the personalized SMS message
//             const message =
//                 `Dear Parent of ${student.fullName} (Adm: ${student.admissionNumber}),\n` +
//                 `Your child's fees paid: KSh ${student.feeDetails.feesPaid?.toLocaleString() || 0}.\n` +
//                 `Remaining balance: KSh ${student.feeDetails.remainingBalance?.toLocaleString() || 0}.\n` +
//                 `Thank you for your continued support.`;

//             // Push a promise to the array; it will resolve with the SMS result for this student
//             sendPromises.push(
//                 sendSMS(normalizedPhoneNumber, message)
//                     .then(smsResult => {
//                         let status = smsResult.success ? 'sent' : 'failed';
//                         let details = smsResult.success ? 'Message successfully queued for delivery.' : smsResult.message;
//                         // Attempt to get a more specific status from Africa's Talking response if available
//                         if (smsResult.errorDetails && smsResult.errorDetails.SMSMessageData && smsResult.errorDetails.SMSMessageData.Recipients && smsResult.errorDetails.SMSMessageData.Recipients[0]) {
//                             details = smsResult.errorDetails.SMSMessageData.Recipients[0].status || details;
//                         }
//                         sendResults.push({
//                             student: student.fullName,
//                             admissionNumber: student.admissionNumber,
//                             status: status,
//                             details: details
//                         });
//                         if (!smsResult.success) {
//                             console.error(`[SMS_CONTROLLER] Failed to send bulk SMS to ${normalizedPhoneNumber} for ${student.fullName}: ${details}`);
//                         } else {
//                             console.log(`[SMS_CONTROLLER] Bulk SMS sent to ${normalizedPhoneNumber} for ${student.fullName}: ${details}`);
//                         }
//                     })
//                     .catch(err => {
//                         // Handle unexpected errors during the sendSMS call
//                         console.error(`[SMS_CONTROLLER] Exception sending bulk SMS to ${normalizedPhoneNumber} for ${student.fullName}:`, err.message);
//                         sendResults.push({
//                             student: student.fullName,
//                             admissionNumber: student.admissionNumber,
//                             status: 'failed',
//                             details: err.message
//                         });
//                     })
//             );

//             // Consider adding a small delay between sending messages to avoid hitting rate limits or overwhelming the service.
//             // For production with many SMS, this might be crucial.
//             // await new Promise(resolve => setTimeout(resolve, 500));
//         }

//         // Wait for all SMS promises to resolve (even if some fail) before sending the final response
//         await Promise.allSettled(sendPromises); // allSettled waits for all promises to settle (fulfilled or rejected)

//         // Send a successful response indicating the initiation was successful and include detailed results
//         res.status(202).json({
//             success: true, // Indicates that the initiation process was successful
//             msg: 'Bulk SMS initiation successful. Check the delivery report for individual statuses.',
//             summary: {
//                 totalStudentsConsidered: studentsWithBalance.length,
//                 results: sendResults // This is the key: return the detailed results array
//             }
//         });

//     } catch (error) {
//         // Handle unexpected errors during the overall bulk SMS process
//         console.error('[SMS_CONTROLLER] Server error sending bulk SMS:', error.message);
//         res.status(500).json({ success: false, msg: 'Server error initiating bulk SMS.', error: error.message });
//     }
// };

// module.exports = {
//     sendIndividualSmsToParent,
//     sendOutstandingBalanceSms,
//     normalizePhoneNumber
// };



const Student = require('../models/studentsDB');
const { sendSMS } = require('../config/africasTalking');

const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    let cleanedNumber = String(phoneNumber).trim().replace(/\s/g, '');

    // If already in +254... format, return as is (and validate length)
    // Kenyan +254 numbers have 13 digits (+254 followed by 9 digits)
    if (cleanedNumber.startsWith('+254') && cleanedNumber.length === 13) {
        return cleanedNumber;
    }
    // If starts with 07... and is 10 digits, convert to +254...
    if (cleanedNumber.startsWith('07') && cleanedNumber.length === 10) {
        return '+254' + cleanedNumber.substring(1);
    }
    // For any other format, consider it invalid for now.
    console.warn(`[SMS_CONTROLLER] Phone number ${phoneNumber} is not in a recognized Kenyan (07XXXXXXXX) or international (+254XXXXXXXXX) format. Skipping normalization.`);
    return ''; // Return empty string for unrecognized formats
};


const sendIndividualSmsToParent = async (req, res) => {
    // Role authorization
    if (req.user.role !== 'bursar' && req.user.role !== 'admin' && req.user.role !== 'director') {
        return res.status(403).json({ msg: 'Not authorized to send individual SMS messages.' });
    }

    const { admissionNumber, message } = req.body;

    if (!admissionNumber || !message) {
        return res.status(400).json({ msg: 'Student admission number and message are required.' });
    }

    try {
        const student = await Student.findOne({ admissionNumber: admissionNumber.toUpperCase().trim() })
                                     .select('fullName admissionNumber parent.phone feeDetails.feesPaid feeDetails.remainingBalance');

        console.log("[SMS_CONTROLLER_DEBUG] Student object fetched for individual SMS:", JSON.stringify(student));


        if (!student) {
            return res.status(404).json({ msg: 'Student not found with provided admission number.' });
        }

        if (!student.parent || !student.parent.phone) {
            console.warn(`[SMS_CONTROLLER] Skipping SMS for ${student.fullName} (Adm: ${student.admissionNumber}): Parent phone number missing or invalid.`);
            return res.status(400).json({ msg: 'Parent phone number not found for this student.' });
        }

        const normalizedPhoneNumber = normalizePhoneNumber(student.parent.phone);

        if (!normalizedPhoneNumber) {
            console.warn(`[SMS_CONTROLLER] Could not normalize phone number for individual SMS for student: ${student.fullName} (Adm: ${student.admissionNumber}) - Original: ${student.parent.phone}`);
            return res.status(400).json({ msg: 'Invalid parent phone number format.' });
        }

        console.log(`[SMS_CONTROLLER] Sending individual SMS to ${normalizedPhoneNumber} for ${student.fullName}.`);
        const smsResult = await sendSMS(normalizedPhoneNumber, message);

        if (smsResult.success) {
            res.status(200).json({ msg: 'SMS sent successfully!', smsResponse: smsResult.response });
        } else {
            res.status(500).json({ msg: 'Failed to send SMS.', error: smsResult.message, details: smsResult.errorDetails });
        }

    } catch (error) {
        console.error('[SMS_CONTROLLER] Server error sending individual SMS:', error.message);
        res.status(500).json({ msg: 'Server error.', error: error.message });
    }
};

/**
 * @route POST /api/sms/send-outstanding-balances
 * @desc Send bulk SMS to parents of students with outstanding balances.
 * @access Private (Bursar, Admin, Director)
 */
const sendOutstandingBalanceSms = async (req, res) => {
    // Role authorization
    if (req.user.role !== 'bursar' && req.user.role !== 'admin' && req.user.role !== 'director') {
        return res.status(403).json({ msg: 'Not authorized to send bulk SMS messages.' });
    }

    try {
        // Fetch students with outstanding balances to send SMS to
        const studentsWithBalance = await Student.find({ 'feeDetails.remainingBalance': { $gt: 0 } })
                                                 .select('fullName admissionNumber parent feeDetails.feesPaid feeDetails.remainingBalance');

        console.log("[SMS_CONTROLLER_DEBUG] Students found with outstanding balances for bulk SMS:", studentsWithBalance.length);

        if (studentsWithBalance.length === 0) {
            console.log('[SMS_CONTROLLER] No students with outstanding balances found. No bulk SMS sent.');
            return res.status(200).json({
                success: true,
                msg: 'No students with outstanding balances found. No SMS sent.',
                summary: { totalStudentsConsidered: 0, results: [] }
            });
        }

        const sendPromises = [];
        const sendResults = []; // This array will hold detailed results for the frontend

        for (const student of studentsWithBalance) {
            console.log(`[SMS_CONTROLLER_DEBUG] Processing student ${student.fullName} (Adm: ${student.admissionNumber}), Parent object from DB:`, JSON.stringify(student.parent));

            if (!student.parent || !student.parent.phone) {
                console.warn(`[SMS_CONTROLLER] Skipping SMS for ${student.fullName} (Adm: ${student.admissionNumber}): Parent phone number missing or invalid.`);
                sendResults.push({
                    student: student.fullName,
                    admissionNumber: student.admissionNumber,
                    status: 'skipped',
                    reason: 'Parent phone data missing or invalid',
                    details: 'SMS not sent due to missing or invalid parent phone number.'
                });
                continue;
            }

            const normalizedPhoneNumber = normalizePhoneNumber(student.parent.phone);

            if (!normalizedPhoneNumber) {
                console.warn(`[SMS_CONTROLLER] Skipping SMS for ${student.fullName} (Adm: ${student.admissionNumber}): Normalized phone number is empty - Original: ${student.parent.phone}`);
                sendResults.push({
                    student: student.fullName,
                    admissionNumber: student.admissionNumber,
                    status: 'skipped',
                    reason: 'Invalid phone number format after normalization',
                    details: 'SMS not sent due to invalid phone number format.'
                });
                continue;
            }

            const message =
                `Dear Parent of ${student.fullName} (Adm: ${student.admissionNumber}),\n` +
                `Your child's fees paid: KSh ${student.feeDetails.feesPaid?.toLocaleString() || 0}.\n` +
                `Remaining balance: KSh ${student.feeDetails.remainingBalance?.toLocaleString() || 0}.\n` +
                `Thank you for your continued support.`;

            sendPromises.push(
                sendSMS(normalizedPhoneNumber, message)
                    .then(smsResult => {
                        let status = smsResult.success ? 'sent' : 'failed';
                        let details = smsResult.success ? 'Message successfully queued for delivery.' : smsResult.message;
                        if (smsResult.errorDetails && smsResult.errorDetails.SMSMessageData && smsResult.errorDetails.SMSMessageData.Recipients && smsResult.errorDetails.SMSMessageData.Recipients[0]) {
                            details = smsResult.errorDetails.SMSMessageData.Recipients[0].status || details;
                        }
                        sendResults.push({
                            student: student.fullName,
                            admissionNumber: student.admissionNumber,
                            status: status,
                            details: details
                        });
                        if (!smsResult.success) {
                            console.error(`[SMS_CONTROLLER] Failed to send bulk SMS to ${normalizedPhoneNumber} for ${student.fullName}: ${details}`);
                        } else {
                            console.log(`[SMS_CONTROLLER] Bulk SMS sent to ${normalizedPhoneNumber} for ${student.fullName}: ${details}`);
                        }
                    })
                    .catch(err => {
                        console.error(`[SMS_CONTROLLER] Exception sending bulk SMS to ${normalizedPhoneNumber} for ${student.fullName}:`, err.message);
                        sendResults.push({
                            student: student.fullName,
                            admissionNumber: student.admissionNumber,
                            status: 'failed',
                            details: err.message
                        });
                    })
            );
        }

        await Promise.allSettled(sendPromises);

        res.status(202).json({
            success: true,
            msg: 'Bulk SMS initiation successful. Check the delivery report for individual statuses.',
            summary: {
                totalStudentsConsidered: studentsWithBalance.length,
                results: sendResults
            }
        });

    } catch (error) {
        console.error('[SMS_CONTROLLER] Server error sending bulk SMS:', error.message);
        res.status(500).json({ success: false, msg: 'Server error initiating bulk SMS.', error: error.message });
    }
};

module.exports = {
    sendIndividualSmsToParent,
    sendOutstandingBalanceSms,
    normalizePhoneNumber // IMPORTANT: Ensure this function is exported!
};
