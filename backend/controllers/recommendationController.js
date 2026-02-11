const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');

// Get personalized recommendations based on order history
exports.getPersonalizedRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user's order history
        const orders = await Order.find({ user: userId })
            .populate('items.item')
            .sort({ createdAt: -1 })
            .limit(20);

        if (orders.length === 0) {
            // New user - return popular items
            return exports.getTrendingItems(req, res);
        }

        // Extract categories and items from order history
        const orderedCategories = new Set();
        const orderedItemIds = new Set();

        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.item) {
                    orderedCategories.add(item.item.category);
                    orderedItemIds.add(item.item._id.toString());
                }
            });
        });

        // Get user preferences
        const user = await User.findById(userId);
        const dietaryRestrictions = user?.preferences?.dietaryRestrictions || [];

        // Build recommendation query
        const query = {
            _id: { $nin: Array.from(orderedItemIds).slice(0, 10) }, // Exclude recently ordered
            category: { $in: Array.from(orderedCategories) }
        };

        // Apply dietary filters
        if (dietaryRestrictions.length > 0) {
            query.dietaryTags = { $in: dietaryRestrictions };
        }

        // Get recommended items
        const recommendations = await Item.find(query)
            .populate('shop')
            .limit(10)
            .sort({ rating: -1, isPopular: -1 });

        res.status(200).json({
            success: true,
            recommendations,
            reason: 'Based on your order history'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get trending items in user's location
exports.getTrendingItems = async (req, res) => {
    try {
        const { city } = req.query;
        const userId = req.user?.id;

        let query = { isPopular: true };

        // Apply dietary filters if user is logged in
        if (userId) {
            const user = await User.findById(userId);
            const dietaryRestrictions = user?.preferences?.dietaryRestrictions || [];
            if (dietaryRestrictions.length > 0) {
                query.dietaryTags = { $in: dietaryRestrictions };
            }
        }

        const trendingItems = await Item.find(query)
            .populate('shop')
            .sort({ ratingCount: -1, rating: -1 })
            .limit(12);

        res.status(200).json({
            success: true,
            items: trendingItems,
            reason: 'Trending in your area'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get time-based suggestions
exports.getTimeBasedSuggestions = async (req, res) => {
    try {
        const currentHour = new Date().getHours();
        const userId = req.user?.id;

        let suggestedCategories = [];
        let mealTime = '';

        // Determine meal time and categories
        if (currentHour >= 6 && currentHour < 11) {
            mealTime = 'Breakfast';
            suggestedCategories = ['Snacks', 'South Indian', 'Sandwich'];
        } else if (currentHour >= 11 && currentHour < 16) {
            mealTime = 'Lunch';
            suggestedCategories = ['Main Course', 'North Indian', 'South Indian', 'Chinese'];
        } else if (currentHour >= 16 && currentHour < 19) {
            mealTime = 'Evening Snacks';
            suggestedCategories = ['Snacks', 'Fast Food', 'Pizza', 'Burger'];
        } else {
            mealTime = 'Dinner';
            suggestedCategories = ['Main Course', 'North Indian', 'Chinese', 'Pizza'];
        }

        const query = { category: { $in: suggestedCategories } };

        // Apply dietary filters if user is logged in
        if (userId) {
            const user = await User.findById(userId);
            const dietaryRestrictions = user?.preferences?.dietaryRestrictions || [];
            if (dietaryRestrictions.length > 0) {
                query.dietaryTags = { $in: dietaryRestrictions };
            }
        }

        const suggestions = await Item.find(query)
            .populate('shop')
            .sort({ rating: -1, isPopular: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            items: suggestions,
            mealTime,
            reason: `Perfect for ${mealTime}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
