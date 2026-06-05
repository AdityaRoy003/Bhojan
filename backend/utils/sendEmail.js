const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

const sendEmail = async (options) => {
    // If SendGrid is configured
    if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: options.email,
            from: process.env.EMAIL_FROM, // Approved sender
            subject: options.subject,
            text: options.message,
            html: options.html,
        };
        await sgMail.send(msg);
        return;
    }

    // Fallback to Nodemailer (SMTP/Gmail)
    let transportConfig;
    if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
        transportConfig = {
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        };
    } else {
        transportConfig = {
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const message = {
        from: `${process.env.FROM_NAME || 'Bhojan'} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    await transporter.sendMail(message);
};

module.exports = sendEmail;
