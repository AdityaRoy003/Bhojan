const SystemConfig = require('../models/SystemConfig');
const logger = require('../config/logger');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Cache the maintenance status for 10 seconds to avoid hammering the DB on every request
let cachedStatus = { maintenanceMode: false, lastFetch: 0 };
const CACHE_TTL_MS = 10_000;

const maintenanceModeMiddleware = async (req, res, next) => {
    try {
        const now = Date.now();

        // Refresh cache if stale
        if (now - cachedStatus.lastFetch > CACHE_TTL_MS) {
            const config = await SystemConfig.findOne().select('maintenanceMode').lean();
            cachedStatus = {
                maintenanceMode: config?.maintenanceMode ?? false,
                lastFetch: now
            };
        }

        if (!cachedStatus.maintenanceMode) {
            return next(); // Not in maintenance — pass through
        }

        // ── Admin Bypass: check JWT and DB role so Admins can use ALL routes —
        // This prevents the reload loop when admin loads their dashboard during maintenance
        // (pages like /profile make calls to /order/*, /shop/* etc. that would otherwise 503)
        try {
            const token = req.cookies?.token;
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userRole = await User.findById(decoded.id).select('role').lean();
                if (userRole?.role === 'Admin') {
                    return next(); // Admin — bypass all maintenance blocks
                }
            }
        } catch (e) {
            // Invalid / expired token — fall through to normal maintenance checks
        }

        // req.path is relative to the /api mount point, so strip the /api prefix
        // e.g. middleware mounted at /api means req.path = '/admin/config'
        const path = req.path;

        // Routes always allowed (admin bypass so they can log in & turn off maintenance)
        const alwaysAllow = [
            /^\/admin/,                    // All /api/admin/* routes
            /^\/auth\/signin$/,            // Admin sign-in
            /^\/auth\/phone\/send-otp$/,   // Mobile OTP request
            /^\/auth\/phone\/verify-otp$/, // Mobile OTP verification
            /^\/auth\/2fa\/verify$/,       // 2FA verification
            /^\/auth\/refresh$/,           // Token refresh
            /^\/auth\/logout$/,            // Logout
            /^\/auth\/me$/,                // So App.jsx can hydrate user role (needed to bypass for Admins)
            /^\/status$/,                  // Public status endpoint (already handled before this middleware)
            /^\/notifications\/my/,        // Allow loading personal notifications to avoid infinite HMR/redirect loops
        ];

        if (alwaysAllow.some(r => r.test(path))) {
            return next();
        }

        // Block everything else with a 503
        logger.info(`[MAINTENANCE] Blocked: ${req.method} /api${path}`);
        return res.status(503).json({
            success: false,
            maintenance: true,
            message: 'The platform is currently under maintenance. Please try again later.'
        });

    } catch (err) {
        // Fail open on errors — never block users due to a bug in this middleware
        logger.error(`[MAINTENANCE] Middleware error: ${err.message}`);
        next();
    }
};

// Bust the in-memory cache so the next request re-reads from DB instantly
maintenanceModeMiddleware.bustCache = () => {
    cachedStatus.lastFetch = 0;
};

module.exports = maintenanceModeMiddleware;
