const redis = require('redis');
const logger = require('./logger');

let redisClient;
let redisErrorLogged = false;

(async () => {
    redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
            reconnectStrategy: (retries) => {
                const delay = Math.min(retries * 100, 30000);
                if (retries > 5 && !redisErrorLogged) {
                    logger.warn('Redis connection failed. Proceeding without caching (Performance might be slightly affected).');
                    redisErrorLogged = true;
                }
                return delay;
            }
        }
    });

    redisClient.on('error', (err) => {
        if (!redisErrorLogged) {
            logger.error(`Redis Client Error: ${err.message}`);
            logger.info('Note: Redis is optional for Bhojan. The server will run fine without it.');
            redisErrorLogged = true;
        }
    });

    redisClient.on('connect', () => {
        logger.info('Redis Client Connected');
        redisErrorLogged = false;
    });

    try {
        await redisClient.connect();
    } catch (err) {
        // Error already handled by listener, but we catch to prevent unhandled rejections
    }
})();

module.exports = redisClient;
