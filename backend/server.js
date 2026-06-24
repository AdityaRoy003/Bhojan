const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const helmet = require('helmet');
const xss = require('xss-clean');
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Security Middleware
app.use(helmet());
app.use((req, res, next) => {
    if (req.body) req.body = sanitize(req.body);
    if (req.params) req.params = sanitize(req.params);
    if (req.query && typeof req.query === 'object') {
        const sanitized = sanitize(req.query);
        // Modify keys in-place to avoid reassigning the read-only property
        Object.keys(req.query).forEach(key => delete req.query[key]);
        Object.assign(req.query, sanitized);
    }
    next();
});
// app.use(xss()); // Temporarily disabled for Express 5 compatibility

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

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Limit each IP to 5000 requests per windowMs (increased specifically for development frequency)
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Strict Rate Limiting for Authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 authentication requests per windowMs
    message: { success: false, message: 'Too many authentication requests, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// Extra-Strict Rate Limiting for OTP and Password Resets (spammer protection)
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 password recovery requests per windowMs
    message: { success: false, message: 'Too many password recovery attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth/forgot-password', otpLimiter);
app.use('/api/auth/reset-password', otpLimiter);


// Database Connection
connectDB();

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

    socket.on('send_chat_message', ({ orderId, message, senderName, senderRole, timestamp }) => {
        // Broadcast to everyone in the chat room (customer + courier)
        io.to(`chat_${orderId}`).emit('chat_message', { message, senderName, senderRole, timestamp });
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

server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
// Trigger nodemon reload to load updated env vars
