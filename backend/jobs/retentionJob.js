const cron = require('node-cron');
const User = require('../models/User');
const logger = require('../config/logger');

const initRetentionJob = () => {
    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        logger.info('Running Data Retention Job: Cleaning up inactive accounts...');

        try {
            // Define threshold: 2 years ago
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

            // Find and deleted users inactive for > 2 years
            const result = await User.deleteMany({
                lastActive: { $lt: twoYearsAgo },
                role: { $ne: 'Admin' } // Safety: Never auto-delete admins
            });

            if (result.deletedCount > 0) {
                logger.info(`Retention Job Success: Deleted ${result.deletedCount} inactive users.`);
            } else {
                logger.info('Retention Job: No inactive accounts found to delete.');
            }
        } catch (error) {
            logger.error(`Retention Job Failed: ${error.message}`);
        }
    });
};

module.exports = initRetentionJob;
