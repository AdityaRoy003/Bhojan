const logger = require('../config/logger');

/**
 * Utility to send SMS/WhatsApp Alerts
 * Placeholder for Twilio / MessageBird / Gupshup
 */
const sendSMS = async (options) => {
    try {
        const { mobile, message, type = 'SMS' } = options;

        if (!mobile) {
            logger.warn('SMS failed: No mobile number provided');
            return false;
        }

        // Always log message to console/logger
        logger.info(`[${type} ALERT] Sending to ${mobile}: ${message}`);

        // Check if Twilio is configured
        if (process.env.TWILIO_SID && process.env.TWILIO_AUTH && process.env.TWILIO_NUMBER) {
            const twilio = require('twilio');
            const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
            
            // Format phone number to E.164 if not already done (assuming India default +91)
            const formattedMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;
            
            await client.messages.create({
                body: message,
                from: process.env.TWILIO_NUMBER,
                to: formattedMobile
            });
            logger.info(`[${type} ALERT] Successfully sent via Twilio to ${formattedMobile}`);
        } else {
            logger.info(`[${type} ALERT] Twilio not configured. Message logged to console.`);
        }

        return true;
    } catch (error) {
        logger.error(`SMS Utility Error: ${error.message}`);
        return false;
    }
};

module.exports = sendSMS;
