const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Shop = require('./models/Shop');

dotenv.config();

const diag = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const userCount = await User.countDocuments();
        const shopCount = await Shop.countDocuments();
        const users = await User.find().limit(5).select('fullname email role');
        const shops = await Shop.find().limit(5).select('name city');

        console.log('--- DB DIAGNOSTICS ---');
        console.log(`Total Users: ${userCount}`);
        console.log(`Total Shops: ${shopCount}`);
        console.log('Sample Users:', JSON.stringify(users, null, 2));
        console.log('Sample Shops:', JSON.stringify(shops, null, 2));
        console.log('----------------------');

        process.exit(0);
    } catch (err) {
        console.error('DIAG ERROR:', err.message);
        process.exit(1);
    }
};

diag();
