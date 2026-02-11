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
            return;
        }

        // Mocking API call
        logger.info(`[${type} ALERT] Sending to ${mobile}: ${message}`);

        // Logic for Twilio (example):
        /*
        const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
        await client.messages.create({
            body: message,
            from: process.env.TWILIO_NUMBER,
            to: mobile
        });
        */

        return true;
    } catch (error) {
        logger.error(`SMS Utility Error: ${error.message}`);
        return false;
    }
};

module.exports = sendSMS;
