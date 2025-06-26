// backend/services/africastalkingService.js

const AfricasTalking = require('africastalking');
require('dotenv').config(); // Load environment variables from .env file

// Initialize Africa's Talking with your API Key and Username from environment variables
const AfricasTalkingApi = AfricasTalking({
    apiKey: process.env.AT_API_KEY,    // Your Africa's Talking API Key
    username: process.env.AT_USERNAME  // Your Africa's Talking Username (e.g., 'sandbox' for testing)
});

// Get the SMS service from the initialized Africa's Talking API
const sms = AfricasTalkingApi.SMS;

/**
 * Sends an SMS message to a single recipient.
 * This function handles the actual communication with the Africa's Talking API.
 * It's designed to be called by other services/controllers.
 *
 * @param {string} phoneNumber - The recipient's phone number, including country code (e.g., "+254712345678").
 * @param {string} message - The content of the SMS message.
 * @returns {Promise<object>} - An object indicating success/failure and the API response/error details.
 */
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
            // *** IMPORTANT: REMOVED THE 'from' PARAMETER ENTIRELY ***
            // Africa's Talking will now use a default Sender ID, which is usually enabled by default.
            // For production, you should register and use your own approved Sender ID here.
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
    sendSMS
};
