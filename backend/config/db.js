const mongoose = require('mongoose');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let isConnecting = false;

const startLocalMongoIfWindows = () => {
    if (process.platform !== 'win32') return false;
    const uri = process.env.MONGO_URI || '';
    if (!uri.includes('127.0.0.1') && !uri.includes('localhost')) return false;

    // 1. Try starting Windows MongoDB service if installed
    try {
        execSync('net start MongoDB', { stdio: 'ignore' });
        console.log('[Bhojan DB] Windows MongoDB service started successfully.');
        return true;
    } catch (e) {
        // Service might already be starting, require admin, or service name differs
    }

    const possiblePaths = [
        'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
        'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
        'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
        'C:\\data\\bin\\mongod.exe'
    ];

    let mongodPath = null;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            mongodPath = p;
            break;
        }
    }

    if (!mongodPath) return false;

    const dbPath = 'C:\\data\\db';
    if (!fs.existsSync(dbPath)) {
        try { fs.mkdirSync(dbPath, { recursive: true }); } catch (e) {}
    }

    // Clean up stale lock files in fallback dbPath
    try {
        const lock1 = path.join(dbPath, 'mongod.lock');
        const lock2 = path.join(dbPath, 'WiredTiger.lock');
        if (fs.existsSync(lock1)) fs.unlinkSync(lock1);
        if (fs.existsSync(lock2)) fs.unlinkSync(lock2);
    } catch (e) {}

    console.log(`[Bhojan DB] Spawning local MongoDB process: "${mongodPath}" --dbpath "${dbPath}"...`);
    try {
        const child = spawn(mongodPath, ['--dbpath', dbPath], {
            detached: true,
            stdio: 'ignore'
        });
        child.unref();
        return true;
    } catch (err) {
        console.warn(`[Bhojan DB] Could not auto-spawn mongod: ${err.message}`);
        return false;
    }
};

const connectDB = async (retryCount = 0) => {
    if (isConnecting) return;
    isConnecting = true;

    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bhojan';

    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 4000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        isConnecting = false;
    } catch (error) {
        isConnecting = false;
        console.warn(`⚠️  MongoDB not connected (${error.message}). Retrying in 4s (server stays running)...`);

        // If local connection refused on Windows and first attempt, auto-start mongod
        if (retryCount === 0 && (
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('EACCES') ||
            error.message.includes('Server selection timed out') ||
            error.message.includes('connect')
        )) {
            startLocalMongoIfWindows();
        }

        // Auto-retry with backoff without crashing node
        setTimeout(() => {
            connectDB(retryCount + 1);
        }, 4000);
    }
};

// Reconnection listeners
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected successfully.');
});

module.exports = connectDB;
