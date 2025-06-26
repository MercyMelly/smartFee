
const Student = require('../models/studentsDB');
const { sendSMS } = require('../config/africasTalking'); 

function normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    let cleanedNumber = String(phoneNumber).trim().replace(/\s/g, ''); 

    if (cleanedNumber.startsWith('+254') && cleanedNumber.length === 13) { // +254 + 9 digits = 13
        return cleanedNumber;
    }
    if (cleanedNumber.startsWith('07') && cleanedNumber.length === 10) {
        return '+254' + cleanedNumber.substring(1);
    }
    console.warn(`[SMS_CONTROLLER] Phone number ${phoneNumber} is not in a recognized Kenyan (07XXXXXXXX) or international (+254XXXXXXXXX) format. Skipping normalization.`);
    return ''; 
}

exports.sendIndividualSmsToParent = async (req, res) => {
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
            console.warn(`[SMS_CONTROLLER] Parent phone number not found for individual SMS for student: ${student.fullName} (${student.admissionNumber}). Parent object: ${JSON.stringify(student.parent)}`);
            return res.status(400).json({ msg: 'Parent phone number not found for this student.' });
        }

        const normalizedPhoneNumber = normalizePhoneNumber(student.parent.phone);

        if (!normalizedPhoneNumber) {
            console.warn(`[SMS_CONTROLLER] Could not normalize phone number for individual SMS for student: ${student.fullName} (${student.admissionNumber}) - Original: ${student.parent.phone}`);
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


exports.sendOutstandingBalanceSms = async (req, res) => {
    // Role authorization
    if (req.user.role !== 'bursar' && req.user.role !== 'admin' && req.user.role !== 'director') {
        return res.status(403).json({ msg: 'Not authorized to send bulk SMS messages.' });
    }

    try {
        // Select 'parent' entirely for bulk sending too
        const studentsWithBalance = await Student.find({ 'feeDetails.remainingBalance': { $gt: 0 } })
                                                 .select('fullName admissionNumber parent feeDetails.feesPaid feeDetails.remainingBalance');

        console.log("[SMS_CONTROLLER_DEBUG] Students found with outstanding balances:", studentsWithBalance.length);
        if (studentsWithBalance.length === 0) {
            console.log('[SMS_CONTROLLER] No students with outstanding balances found. No bulk SMS sent.');
            return res.status(200).json({ msg: 'No students with outstanding balances found. No SMS sent.' });
        }

        const sendPromises = []; // To track all SMS promises
        const sendResults = []; // To log results

        for (const student of studentsWithBalance) {
            console.log(`[SMS_CONTROLLER_DEBUG] Processing student ${student.fullName} (Adm: ${student.admissionNumber}), Parent object from DB:`, JSON.stringify(student.parent));

            // IMPORTANT: If parent object or phone is missing, skip and log.
            if (!student.parent || !student.parent.phone) {
                console.warn(`[SMS_CONTROLLER] Skipping SMS for ${student.fullName} (Adm: ${student.admissionNumber}): Parent phone number missing or invalid.`);
                sendResults.push({
                    student: student.fullName,
                    admissionNumber: student.admissionNumber,
                    status: 'skipped',
                    reason: 'Parent phone data missing'
                });
                continue;
            }

            const normalizedPhoneNumber = normalizePhoneNumber(student.parent.phone);

            if (!normalizedPhoneNumber) { // If normalization results in an empty string, it's invalid
                console.warn(`[SMS_CONTROLLER] Skipping SMS for ${student.fullName} (Adm: ${student.admissionNumber}): Normalized phone number is empty - Original: ${student.parent.phone}`);
                sendResults.push({
                    student: student.fullName,
                    admissionNumber: student.admissionNumber,
                    status: 'skipped',
                    reason: 'Invalid phone number format after normalization'
                });
                continue;
            }

            // Construct personalized message
            const message =
                `Dear Parent of ${student.fullName} (Adm: ${student.admissionNumber}),\n` +
                `Your child's fees paid: KSh ${student.feeDetails.feesPaid?.toLocaleString() || 0}.\n` +
                `Remaining balance: KSh ${student.feeDetails.remainingBalance?.toLocaleString() || 0}.\n` +
                `Thank you for your continued support.`;

            // Add the SMS promise to the array
            sendPromises.push(
                sendSMS(normalizedPhoneNumber, message)
                    .then(smsResult => {
                        sendResults.push({
                            student: student.fullName,
                            admissionNumber: student.admissionNumber,
                            status: smsResult.success ? 'sent' : 'failed',
                            details: smsResult.message
                        });
                        if (!smsResult.success) {
                            console.error(`[SMS_CONTROLLER] Failed to send bulk SMS to ${normalizedPhoneNumber} for ${student.fullName}: ${smsResult.message}`);
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

            // Small delay to avoid hitting rate limits if sending many messages rapidly
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // We are sending a 202 Accepted response immediately as SMS sending is asynchronous
        res.status(202).json({
            msg: 'Bulk SMS initiation successful. Messages are being sent in the background. Check server logs for detailed results.',
            summary: {
                totalStudentsConsidered: studentsWithBalance.length,
            }
        });

        // Optionally, you might want to await all promises here if you need to perform
        // further actions ONLY after all SMS attempts are done. For simple notifications,
        // fire-and-forget (with robust logging) is often sufficient.
        // await Promise.allSettled(sendPromises);
        // console.log("[SMS_CONTROLLER] All bulk SMS promises settled.");

    } catch (error) {
        console.error('[SMS_CONTROLLER] Server error sending bulk SMS:', error.message);
        res.status(500).json({ msg: 'Server error.', error: error.message });
    }
};

module.exports ;
