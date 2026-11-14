const compression = require('compression');
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const helmet = require('helmet');
const xss = require('xss-clean');
const maintenanceModeMiddleware = require('./middlewares/maintenanceMode');
const sanitize = require('mongo-sanitize');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);

// Allowed origins for CORS (shared between Express and Socket.io)
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    }
});
global.io = io; // Expose globally for notificationHelper and background tasks

const PORT = process.env.PORT || 8000;

const morgan = require('morgan');
const logger = require('./config/logger');

// Standard Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(compression({
    level: 6, // Optimal speed-to-compression ratio
    threshold: 1024 // Only compress payloads > 1KB
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://maps.googleapis.com", "https://accounts.google.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'", "http://localhost:8000", "ws://localhost:8000", process.env.FRONTEND_URL || ''].filter(Boolean),
            frameSrc: ["'none'"],                       // block iframing entirely
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    // Prevent clickjacking
    frameguard: { action: 'deny' },
    // Force HTTPS in production
    hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    // Prevent MIME sniffing
    noSniff: true,
    // Disable X-Powered-By header (hides Express)
    hidePoweredBy: true,
    // XSS Filter
    xssFilter: true,
}));
app.use((req, res, next) => {
    if (req.body) req.body = sanitize(req.body);
    if (req.params) req.params = sanitize(req.params);
    if (req.query && typeof req.query === 'object') {
        const sanitized = sanitize(req.query);
        Object.keys(req.query).forEach(key => delete req.query[key]);
        Object.assign(req.query, sanitized);
    }
    next();
});

// Strip any HTML/script tags from string body fields to prevent XSS
const stripXSS = (obj) => {
    if (typeof obj === 'string') return obj.replace(/<[^>]*>/g, '');
    if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(k => { obj[k] = stripXSS(obj[k]); });
    }
    return obj;
};
app.use((req, res, next) => {
    if (req.body) req.body = stripXSS(req.body);
    next();
});

// Logging Middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health Check Endpoint
app.get('/health', async (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now()
    };
    try {
        res.send(healthcheck);
    } catch (error) {
        healthcheck.message = error;
        res.status(503).send();
    }
});

// Environment-aware rate limits — strict in production, generous in development
const isDev = process.env.NODE_ENV !== 'production';

// Global API limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 5000 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests from this IP, please slow down.' },
});
app.use('/api', limiter);

// Auth endpoints limiter — skip passive session-check and logout calls
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 500 : 50,
    message: { success: false, message: 'Too many authentication requests, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
    // /me = passive session check on every page load; /logout = housekeeping — neither should eat quota
    skip: (req) => req.path === '/me' || req.path === '/logout',
});
app.use('/api/auth', authLimiter);

// Login/Signup limiter — strict in production, relaxed in development
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 100 : 10,
    message: { success: false, message: 'Too many login attempts. Please wait 15 minutes and try again.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isDev && process.env.BYPASS_RATE_LIMIT === 'true',
});
app.use('/api/auth/signin', loginLimiter);
app.use('/api/auth/signup', loginLimiter);

// OTP and Password Reset limiter
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 30 : 5,
    message: { success: false, message: 'Too many password recovery attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth/forgot-password', otpLimiter);
app.use('/api/auth/reset-password', otpLimiter);


// Database Connection
connectDB();

// In-memory status cache for ultra-low latency (< 1ms response)
let cachedStatus = null;
let lastStatusFetch = 0;
const STATUS_CACHE_TTL_MS = 15000; // 15 seconds cache

app.get('/api/status', async (req, res) => {
    try {
        const now = Date.now();
        if (cachedStatus && (now - lastStatusFetch < STATUS_CACHE_TTL_MS)) {
            return res.status(200).json(cachedStatus);
        }
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json(cachedStatus || { success: true, maintenanceMode: false, globalBanner: '' });
        }
        const SystemConfig = require('./models/SystemConfig');
        const config = await SystemConfig.findOne().select('maintenanceMode globalBanner').lean();
        cachedStatus = {
            success: true,
            maintenanceMode: config?.maintenanceMode ?? false,
            globalBanner: config?.globalBanner ?? ''
        };
        lastStatusFetch = now;
        res.status(200).json(cachedStatus);
    } catch (err) {
        res.status(200).json({ success: true, maintenanceMode: false, globalBanner: '' });
    }
});

// Apply maintenance mode gate BEFORE all other /api routes
app.use('/api', maintenanceModeMiddleware);

// Socket.io Real-time Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    // ── Delivery Location Tracking ──
    // Delivery boy joins a tracking room for a specific order
    socket.on('join_tracking_room', (orderId) => {
        socket.join(`track_${orderId}`);
        console.log(`Socket ${socket.id} joined tracking room: track_${orderId}`);
    });

    // Customer joins tracking room to watch a delivery
    socket.on('watch_order', (orderId) => {
        socket.join(`track_${orderId}`);
        socket.join(`order_${orderId}`);
        console.log(`Customer socket ${socket.id} watching order: ${orderId}`);
    });

    // Delivery boy broadcasts his live location (fires every 3-5 sec from GPS)
    socket.on('delivery_location_update', (data) => {
        // data: { orderId, latitude, longitude, heading, speed }
        if (!data.orderId) return;
        io.to(`track_${data.orderId}`).emit('rider_location', {
            ...data,
            timestamp: new Date().toISOString()
        });
    });

    // Legacy handler — kept for backward compat
    socket.on('update_location', (data) => {
        io.to(`track_${data.orderId}`).emit('location_update', data);
    });

    // --- Group Ordering ---
    socket.on('join_group', (groupId) => {
        socket.join(`group_${groupId}`);
        // Notify others in the group that a new member joined
        socket.to(`group_${groupId}`).emit('group_member_joined', { socketId: socket.id });
    });

    socket.on('update_group_cart', ({ groupId, userId, userName, cartItems, total }) => {
        // Broadcast updated cart from one member to all others in the group
        io.to(`group_${groupId}`).emit('group_cart_updated', { userId, userName, cartItems, total });
    });

    socket.on('leave_group', (groupId) => {
        socket.leave(`group_${groupId}`);
        socket.to(`group_${groupId}`).emit('group_member_left', { socketId: socket.id });
    });

    // --- Courier Chat ---
    socket.on('join_chat', (orderId) => {
        socket.join(`chat_${orderId}`);
    });

    socket.on('send_chat_message', async ({ orderId, message, senderName, senderRole, timestamp }) => {
        if (!orderId || !message || typeof message !== 'string') return;
        // Strip HTML / script tags from socket chat messages to prevent Stored & DOM XSS
        const sanitizedMessage = message.replace(/<[^>]*>/g, '').trim().slice(0, 1000);
        const safeSenderName = typeof senderName === 'string' ? senderName.replace(/<[^>]*>/g, '').slice(0, 50) : 'Anonymous';
        const safeRole = ['Customer', 'Delivery', 'Owner', 'Admin'].includes(senderRole) ? senderRole : 'Customer';
        const msgTime = timestamp || new Date().toISOString();

        io.to(`chat_${orderId}`).emit('chat_message', {
            message: sanitizedMessage,
            senderName: safeSenderName,
            senderRole: safeRole,
            timestamp: msgTime
        });

        try {
            const Order = require('./models/Order');
            await Order.findByIdAndUpdate(orderId, {
                $push: {
                    chatMessages: {
                        senderName: safeSenderName,
                        senderRole: safeRole,
                        message: sanitizedMessage,
                        timestamp: new Date(msgTime)
                    }
                }
            });
        } catch (err) {
            // non-fatal chat save error
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Middleware to inject io into routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/shop', require('./routes/shopRoutes'));
app.use('/api', require('./routes/paymentRoutes'));
app.use('/api/order', require('./routes/orderRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/tracking', require('./routes/trackingRoutes'));
app.use('/api/delivery', require('./routes/deliveryRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/social', require('./routes/socialRoutes'));
app.use('/api/subscription', require('./routes/subscriptionRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/cloud-kitchen', require('./routes/cloudKitchenRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/user-actions', require('./routes/userActionRoutes'));
app.use('/api/review', require('./routes/reviewRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/quests', require('./routes/questRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));

// Global Error Handler
const { errorHandler } = require('./middlewares/errorMiddleware');
app.use(errorHandler);

// Initialize Jobs
const initRetentionJob = require('./jobs/retentionJob');
initRetentionJob();

// Global Process Safety Handlers
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception: ' + (err && err.message ? err.message : err), { stack: err ? err.stack : '' });
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at: ' + promise + ', reason: ' + reason);
});

server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
// Trigger nodemon reload to load updated controller changes
