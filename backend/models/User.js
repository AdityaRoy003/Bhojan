const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for Google Auth users
    mobile: { type: String },
    role: {
        type: String,
        enum: ['User', 'Customer', 'Owner', 'Delivery', 'Admin'],
        default: 'Customer'
    },
    otp: { type: String },
    otpExpires: { type: Date },
    googleId: { type: String },
    avatar: { type: String },
    alternateMobile: { type: String },
    status: {
        type: String,
        enum: ['Active', 'Suspended', 'Banned'],
        default: 'Active'
    },
    adminNotes: { type: String },
    addresses: [{
        label: { type: String, default: 'Home' }, // Home, Work, etc.
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
    }],
    securitySettings: {
        twoFactorEnabled: { type: Boolean, default: false },
        otpMethod: { type: String, enum: ['Email', 'SMS'], default: 'Email' },
        activeSessions: [{
            deviceId: String,
            lastActive: Date,
            browser: String,
            os: String
        }]
    },
    userSettings: {
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: true },
            push: { type: Boolean, default: true }
        },
        theme: {
            darkMode: { type: Boolean, default: false },
            fontSize: { type: String, enum: ['Small', 'Normal', 'Large'], default: 'Normal' }
        },
        language: { type: String, default: 'English' }
    },
    preferences: {
        dietaryRestrictions: {
            type: [String],
            enum: ['Vegan', 'Gluten-Free', 'Jain', 'Keto', 'Dairy-Free', 'Nut-Free', 'Organic', 'Non-Veg'],
            default: []
        },
        allergies: {
            type: [String],
            default: []
        },
        favoriteCategories: {
            type: [String],
            default: []
        },
        spicePreference: {
            type: String,
            enum: ['Mild', 'Medium', 'Spicy'],
            default: 'Medium'
        }
    },
    businessVerification: {
        gstin: { type: String },
        fssai: { type: String },
        panAadhaar: { type: String },
        status: {
            type: String,
            enum: ['Pending', 'Verified', 'Rejected'],
            default: 'Pending'
        }
    },
    lastOrderTime: { type: Date },
    // Loyalty & Wallet
    isPrime: { type: Boolean, default: false },
    primeExpiry: { type: Date },
    walletBalance: { type: Number, default: 0 },
    bhojanMoney: { type: Number, default: 0 },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    followingUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followingShops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }],
    socialStats: {
        followersCount: { type: Number, default: 0 },
        followingCount: { type: Number, default: 0 }
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    badges: [{
        name: { type: String },
        icon: { type: String },
        earnedAt: { type: Date, default: Date.now }
    }],
    gamification: {
        lastSpinDate: { type: Date },
        totalSpins: { type: Number, default: 0 },
        challengesCompleted: { type: Number, default: 0 }
    },
    coupons: [{
        code: { type: String },
        type: { type: String, enum: ['discount', 'free_delivery'] },
        value: { type: mongoose.Schema.Types.Mixed },
        expiresAt: { type: Date },
        isUsed: { type: Boolean, default: false }
    }],
    milestones: {
        orderCounts: { type: Map, of: Number, default: {} }, // shopId -> count
        totalOrders: { type: Number, default: 0 }
    },
    // Delivery Partner Specifics
    deliverySpecs: {
        balance: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 },
        rating: { type: Number, default: 5 },
        completedDeliveries: { type: Number, default: 0 },
        isOnline: { type: Boolean, default: false },
        currentLocation: {
            lat: { type: Number },
            lng: { type: Number },
            updatedAt: { type: Date }
        },
        // Performance & Wallet Metrics
        acceptanceRate: { type: Number, default: 100 },
        cancellationRate: { type: Number, default: 0 },
        completionRate: { type: Number, default: 100 },
        cashCollected: { type: Number, default: 0 },
        totalOffered: { type: Number, default: 0 },
        totalCancelled: { type: Number, default: 0 },
        rejectedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
        // Extra Features
        kyc: {
            aadhaar: { type: String },
            pan: { type: String },
            dl: { type: String },
            status: { type: String, enum: ['Not Started', 'Pending', 'Verified'], default: 'Not Started' }
        },
        vehicle: {
            model: { type: String },
            number: { type: String },
            vehicleType: { type: String, enum: ['Bike', 'Scooter', 'Cycle', 'Electric Bike'] },
            mileage: { type: Number }
        },
        health: {
            dailySteps: { type: Number, default: 0 },
            waterIntake: { type: Number, default: 0 }, // in glasses
            lastWellnessUpdate: { type: Date }
        },
        training: {
            completedModules: { type: [String], default: [] },
            badges: { type: [String], default: [] }
        },
        language: { type: String, enum: ['English', 'Bhojpuri', 'Maithili'], default: 'English' }
    },
    lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

// Performance Indexes
userSchema.index({ mobile: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'loyaltyPoints': -1 }); // For leaderboards

module.exports = mongoose.model('User', userSchema);
