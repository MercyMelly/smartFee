const otpStore = new Map(); 

const saveOtp = (email, otp) => {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, 
  });
};

// const verifyOtp = (email, inputOtp) => {
//   const record = otpStore.get(email);
//   if (!record) return false;

//   const isExpired = Date.now() > record.expiresAt;
//   const isMatch = record.otp === inputOtp;

//   if (!isExpired && isMatch) {
//     otpStore.delete(email); 
//     return true;
//   }

//   return false;
// };

const verifyOtp = (email, inputOtp) => {
  const record = otpStore.get(email);
  if (!record) return false;

  const isExpired = Date.now() > record.expiresAt;
  const isMatch = record.otp === String(inputOtp);

  console.log("Stored OTP:", record.otp);
  console.log("Input OTP:", inputOtp);
  console.log("Expired:", isExpired);
  console.log("Match:", isMatch);

  if (!isExpired && isMatch) {
    otpStore.delete(email); 
    return true;
  }

  return false;
};


module.exports = { saveOtp, verifyOtp };
