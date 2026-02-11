const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Order = require('./backend/models/Order');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const debugOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Find Aditya
        const user = await User.findOne({ fullname: { $regex: 'Aditya', $options: 'i' } });
        if (!user) {
            console.log('User Aditya not found');
            return;
        }
        console.log(`Found User: ${user.fullname} (${user._id})`);

        // Check for active orders
        const activeOrder = await Order.findOne({
            user: user._id,
            orderStatus: { $in: ['Placed', 'Preparing', 'Ready', 'On the Way'] }
        });

        if (activeOrder) {
            console.log(`Active Order Found: ${activeOrder._id} [${activeOrder.orderStatus}]`);
        } else {
            console.log('No Active Order found via Query.');

            // Find LATEST order
            const lastOrder = await Order.findOne({ user: user._id }).sort({ createdAt: -1 });
            if (lastOrder) {
                console.log(`Latest Order: ${lastOrder._id} is currently [${lastOrder.orderStatus}]`);

                // FORCE UPDATE to 'Preparing' for testing
                lastOrder.orderStatus = 'Preparing';
                await lastOrder.save();
                console.log(`UPDATED Order ${lastOrder._id} to 'Preparing' to test UI.`);
            } else {
                console.log('User has NO orders at all.');
            }
        }

        mongoose.connection.close();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debugOrders();
