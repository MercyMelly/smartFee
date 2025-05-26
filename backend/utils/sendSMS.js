const at = require('../config/africasTalking');

const sms = at.SMS;

const sendSMS = async (to, message) => {
  try {
    const response = await sms.send({
      to,
      message,
      from: 'SmartFee', 
    });
    return response;
  } catch (error) {
    console.error('SMS send error:', error);
    throw error;
  }
};

module.exports = sendSMS;
