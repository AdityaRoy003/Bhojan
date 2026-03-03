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
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true
    }
});

const PORT = process.env.PORT || 8000;

const morgan = require('morgan');
const logger = require('./config/logger');

// Standard Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
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


// Database Connection
connectDB();

// Socket.io Real-time Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    socket.on('update_location', (data) => {
        // Broadcast driver location to relevant tracking rooms
        io.to(`track_${data.orderId}`).emit('location_update', data);
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

// Global Error Handler
const { errorHandler } = require('./middlewares/errorMiddleware');
app.use(errorHandler);

// Initialize Jobs
const initRetentionJob = require('./jobs/retentionJob');
initRetentionJob();

server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
