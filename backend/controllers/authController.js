// const africastalking = require('africastalking')({
//   apiKey: process.env.AT_API_KEY,
//   username: process.env.AT_USERNAME,
// });
// const jwt = require('jsonwebtoken');
// const { generateOTP, saveOTP, verifyOTP } = require('../utils/otp');

// exports.sendOTP = async (req, res) => {
//   const { phone } = req.body;
//   if (!phone) return res.status(400).json({ error: 'Phone number required' });

//   const otp = generateOTP();
//   saveOTP(phone, otp);

//   try {
//     await africastalking.SMS.send({
//       to: [phone],
//       message: `Your OTP is ${otp}`,
//     });
//     res.json({ message: 'OTP sent successfully' });

//   } catch (err) {
//     console.error('Africa\'s Talking error:', err); 

//     res.status(500).json({ error: 'Failed to send OTP' });
//   }
// };

// exports.verifyOTP = (req, res) => {
//   const { phone, otp, role } = req.body;
//   if (!verifyOTP(phone, otp)) {
//     return res.status(401).json({ error: 'Invalid or expired OTP' });
//   }

//   const token = jwt.sign({ phone, role }, process.env.JWT_SECRET, {
//     expiresIn: '1h',
//   });

//   res.json({ token, role });
// };
