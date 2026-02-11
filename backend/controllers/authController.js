const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Generate JWT Token
// Generate JWT Tokens
const sendToken = (user, statusCode, res) => {
    // Short-lived Access Token
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '15m',
    });

    // Long-lived Refresh Token
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { // Using same secret for simplicity unless env var differs
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
        .cookie('token', accessToken, { ...options, expires: new Date(Date.now() + 15 * 60 * 1000) }) // Fallback for existing middleware
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

        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if (!isPasswordMatched) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

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
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

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
            await sendEmail({
                email: user.email,
                subject: 'Bhojan Password Recovery',
                message,
            });

            res.status(200).json({ success: true, message: `Email sent to ${user.email}` });
        } catch (error) {
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();

            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { otp, newPassword, confirmPassword } = req.body;

        const user = await User.findOne({
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'OTP is invalid or has expired' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

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
        if (avatar) user.avatar = avatar;

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
            orderId
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
