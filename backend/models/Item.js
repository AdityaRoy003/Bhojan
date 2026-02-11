const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String, required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    moderationStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Approved'
    },
    ingredients: [String], // e.g., ['Organic Rice', 'Mustard Oil', 'Fresh Vegetables']
    nutritionalInfo: {
        calories: { type: Number },
        protein: { type: Number },
        carbs: { type: Number },
        fats: { type: Number }
    },
    transparencyTags: [{
        type: String,
        enum: ['Organic', 'Mustard Oil', 'Ghee', 'No Preservatives', 'Gluten-Free', 'Farm Fresh']
    }],
    allergens: [String],
    category: {
        type: String,
        required: true,
        enum: ['Snacks', 'Main Course', 'Dessert', 'Pizza', 'Burger', 'Sandwich', 'South Indian', 'North Indian', 'Chinese', 'Fast Food', 'Others']
    },
    price: { type: Number, required: true },
    foodType: { type: String, enum: ['Veg', 'Non-Veg'], required: true },
    dietaryTags: {
        type: [String],
        enum: ['Vegan', 'Gluten-Free', 'Jain', 'Keto', 'Dairy-Free', 'Nut-Free', 'Organic'],
        default: []
    },
    spiceLevel: {
        type: String,
        enum: ['Mild', 'Medium', 'Spicy'],
        default: 'Medium'
    },
    isPopular: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
