const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const emailTemplates = require('../utils/emailTemplates');

const getDeviceDetails = (userAgentStr) => {
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    if (!userAgentStr) return { browser, os };

    const ua = userAgentStr.toLowerCase();

    // Browser detection
    if (ua.includes('firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Google Chrome';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Apple Safari';
    else if (ua.includes('edge')) browser = 'Microsoft Edge';
    else if (ua.includes('opr') || ua.includes('opera')) browser = 'Opera';

    // OS detection
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    return { browser, os };
};

const handleDeviceSessionAndAlert = async (user, req) => {
    const { browser, os } = getDeviceDetails(req.headers['user-agent']);
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown IP';
    
    if (!user.securitySettings) {
        user.securitySettings = { twoFactorEnabled: false, otpMethod: 'Email', activeSessions: [], backupCodes: [] };
    }
    if (!user.securitySettings.activeSessions) {
        user.securitySettings.activeSessions = [];
    }

    const isNewDevice = !user.securitySettings.activeSessions.some(
        s => s.browser === browser && s.os === os
    );

    if (isNewDevice) {
        // Register session
        user.securitySettings.activeSessions.push({
            deviceId: Math.random().toString(36).substring(7),
            lastActive: Date.now(),
            browser,
            os
        });
        // Cap active sessions at 5
        if (user.securitySettings.activeSessions.length > 5) {
            user.securitySettings.activeSessions.shift();
        }
        await user.save();

        // Send login alert email
        try {
            await sendEmail({
                email: user.email,
                subject: '⚠️ Security Alert: New Device Login Detected',
                html: emailTemplates.loginAlert({
                    browser,
                    os,
                    ip,
                    timestamp: new Date().toLocaleString()
                }),
                message: `New login detected from browser ${browser} on ${os}.`
            });
        } catch (mailErr) {
            console.error('Failed to send login alert email:', mailErr.message);
        }
    } else {
        // Update last active of existing session
        const sessionIndex = user.securitySettings.activeSessions.findIndex(
            s => s.browser === browser && s.os === os
        );
        if (sessionIndex !== -1) {
            user.securitySettings.activeSessions[sessionIndex].lastActive = Date.now();
            await user.save();
        }
    }
};

// Generate JWT Token
// Generate JWT Tokens
const sendToken = (user, statusCode, res) => {
    // Extended Access Token for stability
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '24h',
    });

    // Long-lived Refresh Token
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

    const options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.status(statusCode)
        .cookie('refreshToken', refreshToken, options)
        .cookie('token', accessToken, { ...options, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) })
        .json({
            success: true,
            user,
            accessToken,
        });
};

// Signup
exports.signup = async (req, res) => {
    try {
        const { fullname, email, password, mobile, role } = req.body;

        // Input validation
        if (!fullname || !email || !password || !mobile) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields: fullname, email, password, mobile' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        }

        // Password strength validation
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        // Mobile validation
        if (mobile.length < 10) {
            return res.status(400).json({ success: false, message: 'Please provide a valid mobile number' });
        }

        // Role whitelist validation
        const allowedRoles = ['Customer', 'Owner', 'Delivery'];
        if (role && !allowedRoles.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const crypto = require('crypto');
        const referralCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        let referredBy = null;
        let loyaltyPoints = 0;

        // Check for referral code
        if (req.body.referralCode) {
            const referrer = await User.findOne({ referralCode: req.body.referralCode });
            if (referrer) {
                referredBy = referrer._id;
                loyaltyPoints = 500; // Bonus for new user

                // Bonus for referrer
                referrer.loyaltyPoints += 500;
                await referrer.save();
            }
        }

        const user = await User.create({
            fullname,
            email,
            password: hashedPassword,
            mobile,
            role,
            referralCode,
            referredBy,
            loyaltyPoints
        });

        const { sendNotification } = require('../utils/notificationHelper');
        await sendNotification(user._id, 'Welcome to Bhojan! 🥣', `Hi ${user.fullname}, welcome to Bhojan! Start exploring delicious home-cooked meals from home chefs and top restaurants in your area.`, 'system');

        sendToken(user, 201, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Signin
exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please enter email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
            return res.status(423).json({
                success: false,
                message: `Account is temporarily locked due to multiple failed login attempts. Try again in ${minutesLeft} minutes.`
            });
        }

        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if (!isPasswordMatched) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

            // Warning email at 3 attempts
            if (user.failedLoginAttempts === 3) {
                try {
                    await sendEmail({
                        email: user.email,
                        subject: '⚠️ Warning: Multiple Failed Login Attempts',
                        html: emailTemplates.suspiciousActivity({
                            attempts: user.failedLoginAttempts,
                            isLocked: false,
                            ip: req.ip || req.headers['x-forwarded-for'] || 'Unknown'
                        }),
                        message: `We noticed 3 failed login attempts on your account.`
                    });
                } catch (mailErr) {
                    console.error('Failed to send failed attempts warning email:', mailErr.message);
                }
            }

            // Lockout email at 5 attempts
            if (user.failedLoginAttempts >= 5) {
                user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 mins lockout
                try {
                    await sendEmail({
                        email: user.email,
                        subject: '🚨 Alert: Account Temporarily Locked',
                        html: emailTemplates.suspiciousActivity({
                            attempts: user.failedLoginAttempts,
                            isLocked: true,
                            ip: req.ip || req.headers['x-forwarded-for'] || 'Unknown'
                        }),
                        message: `Your account has been locked for 15 minutes due to 5 consecutive failed login attempts.`
                    });
                } catch (mailErr) {
                    console.error('Failed to send lockout email:', mailErr.message);
                }
            }

            await user.save();

            return res.status(401).json({
                success: false,
                message: user.failedLoginAttempts >= 5
                    ? 'Invalid email or password. Your account has been temporarily locked.'
                    : `Invalid email or password. Attempt ${user.failedLoginAttempts} of 5 before lockout.`
            });
        }

        // Reset failed login fields
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        // 2FA Flow
        if (user.securitySettings?.twoFactorEnabled) {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            user.securitySettings.twoFactorCode = code;
            user.securitySettings.twoFactorCodeExpires = Date.now() + 10 * 60 * 1000; // 10 mins
            await user.save();

            try {
                await sendEmail({
                    email: user.email,
                    subject: '🔒 Bhojan Two-Factor Verification Code',
                    html: emailTemplates.twoFactorVerification({ code }),
                    message: `Your 2FA verification code is: ${code}`
                });
            } catch (mailErr) {
                console.error('Failed to send 2FA code email:', mailErr.message);
            }

            return res.status(200).json({
                success: true,
                twoFactorRequired: true,
                method: 'Email',
                userId: user._id
            });
        }

        // Record session and check device alert
        await handleDeviceSessionAndAlert(user, req);

        // Update lastActive
        user.lastActive = Date.now();
        await user.save();

        sendToken(user, 200, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Logout
exports.logout = async (req, res) => {
    const cookieOptions = {
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.cookie('token', null, cookieOptions);
    res.cookie('refreshToken', null, cookieOptions);

    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

        await user.save();

        const message = `Your Password Reset OTP is: ${otp}`;

        try {
            if (process.env.SENDGRID_API_KEY || (process.env.EMAIL_USER && process.env.EMAIL_PASS)) {
                await sendEmail({
                    email: user.email,
                    subject: '🔒 Bhojan Password Recovery',
                    html: emailTemplates.forgotPassword(otp),
                    message,
                });
                res.status(200).json({ success: true, message: `Email sent to ${user.email}` });
            } else {
                console.log(`\n==================================================`);
                console.log(`[DEVELOPMENT MODE] Password Reset OTP for ${user.email}: ${otp}`);
                console.log(`==================================================\n`);
                res.status(200).json({
                    success: true,
                    message: `OTP sent to console in development mode (OTP: ${otp})`,
                    otp
                });
            }
        } catch (error) {
            console.error('Email send error:', error);
            console.log(`\n==================================================`);
            console.log(`[FALLBACK MODE] Password Reset OTP for ${user.email}: ${otp}`);
            console.log(`==================================================\n`);
            res.status(200).json({
                success: true,
                message: `Email failed but OTP sent to console (OTP: ${otp})`,
                otp
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body;

        if (!email || !otp || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'Please provide email, OTP, new password, and confirmation password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        const user = await User.findOne({
            email,
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'OTP is invalid or has expired' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        const { sendNotification } = require('../utils/notificationHelper');
        await sendNotification(user._id, '🔒 Password Reset Success', 'Your account password has been successfully reset using an OTP. You can now login with your new password.', 'system');

        sendToken(user, 200, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Current User
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get Addresses
exports.getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('addresses');
        res.status(200).json({ success: true, addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Address
exports.deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.id);

        // Ensure one address is default if list not empty
        if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
            user.addresses[0].isDefault = true;
        }

        await user.save();
        res.status(200).json({ success: true, addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Profile
exports.updateProfile = async (req, res) => {
    try {
        const { fullname, email, mobile, alternateMobile, avatar } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            user.email = email;
        }

        if (fullname) user.fullname = fullname;
        if (mobile) user.mobile = mobile;
        if (alternateMobile) user.alternateMobile = alternateMobile;
        if (avatar !== undefined) user.avatar = avatar;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect current password' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        const { sendNotification } = require('../utils/notificationHelper');
        await sendNotification(user._id, '🔒 Password Changed Successfully', 'Your account password has been changed from settings. If you did not make this change, contact support immediately.', 'system');

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/*
# Fix Redis Connection Spam

The backend is currently flooding the logs with `ECONNREFUSED` errors because Redis is not running on the host machine and the client keeps retrying.

## Proposed Changes

### Backend

#### [MODIFY] [redisClient.js](file:///c:/Users/adity/OneDrive/Desktop/Bhojan/backend/config/redisClient.js)

- Modify the error listener to avoid spamming the log.
- Only log a connection error once, and then silences further errors unless the connection is recovered.
- Ensure the application continues to run without crashing when Redis is unavailable.

## Verification Plan

### Manual Verification
- Start the backend server (`npm start`).
- Verify that only one "Redis not available" warning appears instead of a continuous stream of errors.
- Ensure the API is still responsive.
*/
// Update Preferences
exports.updatePreferences = async (req, res) => {
    try {
        const { dietaryRestrictions, allergies, favoriteCategories, spicePreference } = req.body;
        const user = await User.findById(req.user.id);

        if (dietaryRestrictions) user.preferences.dietaryRestrictions = dietaryRestrictions;
        if (allergies) user.preferences.allergies = allergies;
        if (favoriteCategories) user.preferences.favoriteCategories = favoriteCategories;
        if (spicePreference) user.preferences.spicePreference = spicePreference;

        await user.save();
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Settings
exports.updateSettings = async (req, res) => {
    try {
        const { notifications, theme, language } = req.body;
        const user = await User.findById(req.user.id);

        /*
        ## Phase 30: Security Middleware Refinement (Completed)
        - [x] Fix `express-mongo-sanitize` TypeError (read-only query property)
        - [x] Reorder server middleware for robust sanitization
        - [x] Verification: Test login and secure routes
        
        ## Phase 31: Infrastructure Resilience
        - [/] Resolve Redis connection spam (`ECONNREFUSED`)
        - [ ] Implement graceful fallback for optional Redis caching
        - [ ] Verification: Confirm logs are clean and API is stable
        */
        if (notifications) user.userSettings.notifications = { ...user.userSettings.notifications, ...notifications };
        if (theme) user.userSettings.theme = { ...user.userSettings.theme, ...theme };
        if (language) user.userSettings.language = language;

        await user.save();
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Account
exports.deleteAccount = async (req, res) => {
    try {
        console.log('Received delete account request');
        console.log('User ID from Token:', req.user.id);
        console.log('Request Request Body:', req.body);

        const { password } = req.body;

        if (!password) {
            console.log('Error: Password missing in request body');
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            console.log('Error: User not found in DB');
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Error: Password mismatch');
            return res.status(401).json({ success: false, message: 'Incorrect password. Account deletion cancelled.' });
        }

        // Send data deletion privacy notice email BEFORE deleting from DB
        try {
            await sendEmail({
                email: user.email,
                subject: '📄 GDPR: Account Deletion Confirmation',
                html: emailTemplates.dataPrivacyNotice({
                    type: 'Account Deletion Confirmation',
                    status: 'Completed'
                }),
                message: 'Your account deletion request has been processed.'
            });
        } catch (mailErr) {
            console.error('Failed to send deletion confirmation email:', mailErr.message);
        }

        // Potential cleanup: Delete orders, reviews, etc. if required
        // For now, permanent deletion
        await User.findByIdAndDelete(req.user.id);
        console.log('Success: User deleted');

        res.cookie('token', null, { expires: new Date(Date.now()), httpOnly: true });
        res.status(200).json({ success: true, message: 'Account deleted permanently' });
    } catch (error) {
        console.error('SERVER ERROR during deletion:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add Address (Updated for label)
exports.addAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { label, street, city, state, pincode, isDefault } = req.body;

        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push({
            label: label || 'Home',
            street, city, state, pincode,
            isDefault: isDefault || user.addresses.length === 0
        });
        await user.save();

        res.status(200).json({ success: true, addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get Addresses
exports.getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Address
exports.deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.id);
        await user.save();
        res.status(200).json({ success: true, addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Raise Support Ticket
exports.raiseSupportTicket = async (req, res) => {
    try {
        const { subject, message, category, orderId } = req.body;
        const SupportTicket = require('../models/SupportTicket');

        const ticket = await SupportTicket.create({
            user: req.user.id,
            subject,
            message,
            category,
            orderId: orderId || undefined
        });

        res.status(201).json({ success: true, ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh token not found. Please login again.' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate new tokens
        sendToken(user, 200, res);
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid refresh token. Please login again.' });
    }
};

// Update Delivery Location
exports.updateDeliveryLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'Delivery') {
            return res.status(403).json({ success: false, message: 'Not authorized as delivery partner' });
        }

        user.deliverySpecs.currentLocation = {
            lat,
            lng,
            updatedAt: new Date()
        };

        // Also update last active
        user.lastActive = Date.now();
        await user.save();

        res.status(200).json({ success: true, message: 'Location updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send Mobile OTP for Login
exports.sendMobileOTP = async (req, res) => {
    try {
        const { mobile } = req.body;

        if (!mobile) {
            return res.status(400).json({ success: false, message: 'Please enter a mobile number' });
        }

        const user = await User.findOne({ mobile });
        if (!user) {
            return res.status(404).json({ success: false, message: 'No registered account found with this mobile number' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

        await user.save();

        const message = `Your Bhojan Login OTP is: ${otp}. Valid for 10 minutes.`;
        const sendSMS = require('../utils/sendSMS');
        const smsSent = await sendSMS({
            mobile,
            message,
            type: 'LOGIN OTP'
        });

        // If Twilio is not configured, we return OTP in response for development / testing
        const isTwilioConfigured = process.env.TWILIO_SID && process.env.TWILIO_AUTH && process.env.TWILIO_NUMBER;
        
        if (isTwilioConfigured && smsSent) {
            res.status(200).json({ success: true, message: `OTP sent successfully to ${mobile}` });
        } else {
            console.log(`\n==================================================`);
            console.log(`[DEVELOPMENT MODE] Mobile Login OTP for ${mobile}: ${otp}`);
            console.log(`==================================================\n`);
            res.status(200).json({
                success: true,
                message: `OTP logged to console in development mode (OTP: ${otp})`,
                otp
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Verify Mobile OTP & Log In
exports.verifyMobileOTP = async (req, res) => {
    try {
        const { mobile, otp } = req.body;

        if (!mobile || !otp) {
            return res.status(400).json({ success: false, message: 'Please provide mobile number and OTP' });
        }

        const user = await User.findOne({
            mobile,
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'OTP is invalid or has expired' });
        }

        // Clear OTP fields
        user.otp = undefined;
        user.otpExpires = undefined;
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        // 2FA Flow
        if (user.securitySettings?.twoFactorEnabled) {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            user.securitySettings.twoFactorCode = code;
            user.securitySettings.twoFactorCodeExpires = Date.now() + 10 * 60 * 1000; // 10 mins
            await user.save();

            try {
                await sendEmail({
                    email: user.email,
                    subject: '🔒 Bhojan Two-Factor Verification Code',
                    html: emailTemplates.twoFactorVerification({ code }),
                    message: `Your 2FA verification code is: ${code}`
                });
            } catch (mailErr) {
                console.error('Failed to send 2FA code email:', mailErr.message);
            }

            return res.status(200).json({
                success: true,
                twoFactorRequired: true,
                method: 'Email',
                userId: user._id
            });
        }

        // Record session and check device alert
        await handleDeviceSessionAndAlert(user, req);

        // Update lastActive
        user.lastActive = Date.now();
        await user.save();

        // Send login notification
        const { sendNotification } = require('../utils/notificationHelper');
        await sendNotification(user._id, '🔒 Login Alert', `Successful login detected using Mobile OTP on ${new Date().toLocaleString()}`, 'system');

        // Log in user
        sendToken(user, 200, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Verify Two-Factor Authentication (2FA)
exports.verify2FA = async (req, res) => {
    try {
        const { userId, code } = req.body;

        if (!userId || !code) {
            return res.status(400).json({ success: false, message: 'Please provide user ID and verification code' });
        }

        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.lockUntil && user.lockUntil > Date.now()) {
            const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
            return res.status(423).json({
                success: false,
                message: `Account is locked. Try again in ${minutesLeft} minutes.`
            });
        }

        let isCodeValid = false;
        let isBackupCode = false;

        // Check backup codes
        if (user.securitySettings?.backupCodes?.includes(code.toUpperCase())) {
            isCodeValid = true;
            isBackupCode = true;
            // Remove backup code
            user.securitySettings.backupCodes = user.securitySettings.backupCodes.filter(c => c !== code.toUpperCase());
        } 
        // Check normal 2FA OTP
        else if (
            user.securitySettings?.twoFactorCode === code &&
            user.securitySettings?.twoFactorCodeExpires > Date.now()
        ) {
            isCodeValid = true;
            user.securitySettings.twoFactorCode = undefined;
            user.securitySettings.twoFactorCodeExpires = undefined;
        }

        if (!isCodeValid) {
            return res.status(400).json({ success: false, message: 'Invalid or expired 2FA verification code' });
        }

        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        user.lastActive = Date.now();
        await user.save();

        // Alert on device check
        await handleDeviceSessionAndAlert(user, req);

        sendToken(user, 200, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Enable/Disable 2FA
exports.toggle2FA = async (req, res) => {
    try {
        const { enabled } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.securitySettings) {
            user.securitySettings = { twoFactorEnabled: false, otpMethod: 'Email', activeSessions: [], backupCodes: [] };
        }

        user.securitySettings.twoFactorEnabled = enabled;

        let backupCodes = [];
        if (enabled) {
            const crypto = require('crypto');
            for (let i = 0; i < 5; i++) {
                backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
            }
            user.securitySettings.backupCodes = backupCodes;
        } else {
            user.securitySettings.backupCodes = [];
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: enabled ? '2FA enabled successfully' : '2FA disabled successfully',
            twoFactorEnabled: enabled,
            backupCodes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Generate New Backup Codes
exports.generateBackupCodes = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.securitySettings?.twoFactorEnabled) {
            return res.status(400).json({ success: false, message: 'Enable 2FA first before generating backup codes' });
        }

        const crypto = require('crypto');
        const backupCodes = [];
        for (let i = 0; i < 5; i++) {
            backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }

        user.securitySettings.backupCodes = backupCodes;
        await user.save();

        res.status(200).json({ success: true, backupCodes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GDPR Data Export Request
exports.requestGDPRDataExport = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Send privacy notice email
        await sendEmail({
            email: user.email,
            subject: '📄 GDPR: Personal Data Archive Export',
            html: emailTemplates.dataPrivacyNotice({
                type: 'Personal Data Archive Export',
                status: 'Sent (Completed)'
            }),
            message: 'Your personal data export request has been processed.'
        });

        res.status(200).json({ success: true, message: 'GDPR data export processed. Check your email archive.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
