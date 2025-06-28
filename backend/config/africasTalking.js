
// const AfricasTalking = require('africastalking');
// require('dotenv').config();

// const AfricasTalkingApi = AfricasTalking({
//     apiKey: process.env.AT_API_KEY,    
//     username: process.env.AT_USERNAME 
// });
// const sms = AfricasTalkingApi.SMS;

// async function sendSMS(phoneNumber, message) {
//     if (!phoneNumber || !message) {
//         console.error('[AFRICA_TALKING_SERVICE] Phone number or message is missing. Cannot send SMS.');
//         return { success: false, message: 'Phone number or message is missing.' };
//     }
//     try {
//         console.log(`[AFRICA_TALKING_SERVICE] Attempting to send SMS to ${phoneNumber} with message: "${message.substring(0, Math.min(message.length, 50))}..."`);

//         const response = await sms.send({
//             to: phoneNumber, // The recipient's phone number
//             message: message, // The message content
//         });

//         console.log('[AFRICA_TALKING_SERVICE] SMS sent successfully:', JSON.stringify(response));
//         return { success: true, response };
//     } catch (error) {
//         console.error(`[AFRICA_TALKING_SERVICE] Error sending SMS to ${phoneNumber}:`, error.message);
//         if (error.response) {
//             console.error('[AFRICA_TALKING_SERVICE] Africa\'s Talking API Error Response Data:', JSON.stringify(error.response.data));
//         }
//         return { success: false, message: error.message, errorDetails: error.response?.data };
//     }
// }

// module.exports = {
//     sendSMS
// };

// backend/config/africasTalking.js

const AfricasTalking = require('africastalking');
require('dotenv').config();

const AfricasTalkingApi = AfricasTalking({
    apiKey: process.env.AT_API_KEY,    
    username: process.env.AT_USERNAME 
});
const sms = AfricasTalkingApi.SMS;

/**
 * Normalizes a phone number to an international format (e.g., +254XXXXXXXXX).
 * Handles common Kenyan formats (07..., 2547..., 7...).
 * @param {string} phoneNumber - The phone number to normalize.
 * @returns {string|null} Normalized phone number or null if invalid.
 */
function normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;

    let normalized = phoneNumber.replace(/\s+/g, ''); // Remove all whitespace

    // If starts with 0, replace with +254 (assuming Kenya for demonstration)
    if (normalized.startsWith('0')) {
        normalized = '+254' + normalized.substring(1);
    }
    // If starts with 254, add + (if not already present)
    else if (normalized.startsWith('254') && !normalized.startsWith('+254')) {
        normalized = '+' + normalized;
    }
    // If starts with 7 or 1 (common Safaricom/Airtel prefixes in Kenya) and is 9 digits, assume it's missing +254
    // This regex matches numbers like 712345678, 123456789 etc. assuming a 9 digit local number part.
    else if (/^[7891]\d{8}$/.test(normalized) && normalized.length === 9) { // Added '1' for new prefixes and explicit length check
        normalized = '+254' + normalized;
    }

    // Basic validation for common Kenyan formats: must start with +254 and have 9 more digits
    if (!/^\+254\d{9}$/.test(normalized)) {
        console.warn(`[SMS] Invalid phone number format after normalization: Original: ${phoneNumber} -> Normalized: ${normalized}`);
        return null; // Return null if it's still not a valid format
    }

    return normalized;
}


async function sendSMS(phoneNumber, message) {
    if (!phoneNumber || !message) {
        console.error('[AFRICA_TALKING_SERVICE] Phone number or message is missing. Cannot send SMS.');
        return { success: false, message: 'Phone number or message is missing.' };
    }
    try {
        console.log(`[AFRICA_TALKING_SERVICE] Attempting to send SMS to ${phoneNumber} with message: "${message.substring(0, Math.min(message.length, 50))}..."`);

        const response = await sms.send({
            to: phoneNumber, // The recipient's phone number
            message: message, // The message content
            // from: process.env.AFRICASTALKING_SHORT_CODE, // Uncomment and set if you use a custom sender ID
        });

        console.log('[AFRICA_TALKING_SERVICE] SMS sent successfully:', JSON.stringify(response));
        return { success: true, response };
    } catch (error) {
        console.error(`[AFRICA_TALKING_SERVICE] Error sending SMS to ${phoneNumber}:`, error.message);
        if (error.response) {
            console.error('[AFRICA_TALKING_SERVICE] Africa\'s Talking API Error Response Data:', JSON.stringify(error.response.data));
        }
        return { success: false, message: error.message, errorDetails: error.response?.data };
    }
}

module.exports = {
    sendSMS,
    normalizePhoneNumber // <-- NOW EXPORT normalizePhoneNumber
};
