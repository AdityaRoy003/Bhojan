const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

exports.isAuthenticated = async (req, res, next) => {
    try {
        const { token } = req.cookies;

        logger.info(`[AUTH] Token from cookies: ${token ? 'Present' : 'Missing'}`);

        if (!token) {
            logger.info(`[AUTH] Unauthorized: No token found in cookies`);
            return res.status(401).json({ success: false, message: "Login first to access this resource" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.info(`[AUTH] Decoded token ID: ${decoded.id}`);

        req.user = await User.findById(decoded.id);

        if (!req.user) {
            logger.info(`[AUTH] Unauthorized: User ${decoded.id} not found in database`);
            return res.status(401).json({ success: false, message: "User not found" });
        }

        req.user.id = req.user._id.toString();
        logger.info(`[AUTH] Authenticated user: ${req.user.fullname} | Role: ${req.user.role}`);

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            logger.warn(`[AUTH] Unauthorized: ${error.message}`);
            return res.status(401).json({ success: false, message: "Session expired, please login again" });
        }
        logger.error(`[AUTH] Middleware Error: ${error.message}`);
        res.status(500).json({ success: false, message: "Server Error during authentication" });
    }
};

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role (${req.user.role}) is not allowed to acccess this resource`
            });
        }
        next();
    };
};
