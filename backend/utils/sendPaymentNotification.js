const { sendSMS, normalizePhoneNumber } = require('../config/africasTalking');

exports.sendPaymentNotification = async (student, paymentDetails) => {
  if (!student.parent || !student.parent.phone) {
    console.warn(`[SMS] Parent phone missing for student ${student.fullName}.`);
    return;
  }

  const normalizedPhone = normalizePhoneNumber(student.parent.phone);

  if (!normalizedPhone) {
    console.warn(`[SMS] Could not normalize parent phone: ${student.parent.phone}`);
    return;
  }

  const smsText =
    `Dear Parent of ${student.fullName} (Adm: ${student.admissionNumber}),\n` +
    `An in-kind payment has been recorded:\n` +
    `- ${paymentDetails.quantity} ${paymentDetails.unitSize}-kg ${paymentDetails.itemType}\n` +
    `- KSh ${paymentDetails.amount.toLocaleString()}\n` +
    `Remaining balance: KSh ${paymentDetails.remainingBalance.toLocaleString()}\n` +
    `Thank you.`;

  const result = await sendSMS(normalizedPhone, smsText);

  if (result.success) {
    console.log(`[SMS] Notification sent to ${normalizedPhone}`);
  } else {
    console.error(`[SMS] Failed to send notification: ${result.message}`);
  }
};
