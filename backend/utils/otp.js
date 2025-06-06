const otpStore = new Map(); 
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function saveOTP(phone, otp) {
  const expiresAt = Date.now() + 1000 * 60 * Number(process.env.OTP_EXPIRY_MINUTES);
  otpStore.set(phone, { otp, expiresAt });
}

function verifyOTP(phone, otp) {
  const record = otpStore.get(phone);
  if (!record) return false;
  const isValid = record.otp === otp && Date.now() < record.expiresAt;
  if (isValid) otpStore.delete(phone);
  return isValid;
}

module.exports = { generateOTP, saveOTP, verifyOTP };
