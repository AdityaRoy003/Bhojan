const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');

// --- AI RECOMMENDER ---
exports.getAIRecommendations = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Query too short.' });
        }

        const q = query.toLowerCase();

        // Parse dietary intent
        const isVeg = /\bveg(an|etarian)?\b/.test(q);
        const isNonVeg = /\bnon.?veg|chicken|mutton|fish|egg|meat|prawn|seafood\b/.test(q);
        const isSpicy = /\bspic(y|e)|hot\b/.test(q);
        const isMild = /\bmild\b/.test(q);
        const isSweet = /\bsweet|dessert|gulab|halwa|kheer|cake\b/.test(q);
        const isCheap = /\bcheap|budget|affordable|under ?(\d+)\b/.test(q);

        // Extract price ceiling if mentioned
        const priceMatch = q.match(/under\s*(\d+)/);
        const maxPrice = priceMatch ? parseInt(priceMatch[1]) : null;

        // Cuisine keywords
        const cuisines = ['pizza', 'burger', 'biryani', 'sushi', 'chinese', 'italian',
            'south indian', 'north indian', 'thai', 'mexican', 'pasta', 'sandwich',
            'momos', 'rolls', 'kebab', 'dosa', 'idli', 'paneer', 'salad', 'soup'];
        const matchedCuisines = cuisines.filter(c => q.includes(c));

        // Build mongo query
        const mongoQuery = {};

        if (isVeg && !isNonVeg) mongoQuery.foodType = 'Veg';
        if (isNonVeg && !isVeg) mongoQuery.foodType = 'Non-Veg';
        if (maxPrice) mongoQuery.price = { $lte: maxPrice };

        if (matchedCuisines.length > 0) {
            mongoQuery.$or = matchedCuisines.map(c => ({
                $or: [
                    { name: { $regex: c, $options: 'i' } },
                    { description: { $regex: c, $options: 'i' } },
                    { category: { $regex: c, $options: 'i' } }
                ]
            })).flat();
            // Flatten nested $or properly
            const orConditions = matchedCuisines.flatMap(c => [
                { name: { $regex: c, $options: 'i' } },
                { description: { $regex: c, $options: 'i' } },
                { category: { $regex: c, $options: 'i' } }
            ]);
            mongoQuery.$or = orConditions;
        } else {
            // General text search
            const words = q.split(/\s+/).filter(w => w.length > 2);
            if (words.length > 0) {
                mongoQuery.$or = words.flatMap(w => [
                    { name: { $regex: w, $options: 'i' } },
                    { description: { $regex: w, $options: 'i' } },
                    { category: { $regex: w, $options: 'i' } }
                ]);
            }
        }

        const items = await Item.find(mongoQuery)
            .populate('shop', 'name city image')
            .sort({ rating: -1, isPopular: -1 })
            .limit(12);

        // Build a human-readable response summary
        let summary = `Found ${items.length} result${items.length !== 1 ? 's' : ''}`;
        if (isVeg) summary += ' (Veg only)';
        if (isNonVeg) summary += ' (Non-Veg)';
        if (maxPrice) summary += ` under ₹${maxPrice}`;
        if (matchedCuisines.length) summary += ` for ${matchedCuisines.join(', ')}`;

        res.json({ success: true, items, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

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
// --- LEADERBOARDS ---

exports.getLeaderboardCustomers = async (req, res) => {
    try {
        const customers = await User.find({ role: 'Customer' })
            .sort({ 'milestones.totalOrders': -1, loyaltyPoints: -1 })
            .limit(10)
            .select('fullname avatar milestones.totalOrders loyaltyPoints');
        res.json({ success: true, customers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLeaderboardRestaurants = async (req, res) => {
    try {
        const Shop = require('../models/Shop');
        const restaurants = await Shop.find()
            .sort({ orderCount: -1, rating: -1 })
            .limit(10)
            .select('name logo orderCount rating city');
        res.json({ success: true, restaurants });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLeaderboardDelivery = async (req, res) => {
    try {
        const partners = await User.find({ role: 'Delivery' })
            .sort({ 'deliverySpecs.completedDeliveries': -1, 'deliverySpecs.rating': -1 })
            .limit(10)
            .select('fullname avatar deliverySpecs.completedDeliveries deliverySpecs.rating');
        res.json({ success: true, partners });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- PREDICTIVE MEAL PLANNING ---

exports.getPredictiveMealPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({ user: userId }).populate('items.item').limit(30);

        if (orders.length < 3) {
            return res.json({ success: true, message: 'Ordering more often helps us create better plans!', plan: [] });
        }

        // Simple AI logic: analyze favorite categories
        const categoryFreq = {};
        orders.forEach(o => {
            o.items.forEach(it => {
                if (it.item) {
                    categoryFreq[it.item.category] = (categoryFreq[it.item.category] || 0) + 1;
                }
            });
        });

        const sortedCategories = Object.keys(categoryFreq).sort((a, b) => categoryFreq[b] - categoryFreq[a]);
        const topCategories = sortedCategories.slice(0, 3);

        const suggestedItems = await Item.find({ category: { $in: topCategories } })
            .populate('shop', 'name')
            .limit(7)
            .sort({ rating: -1 });

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const plan = days.map((day, i) => ({
            day,
            suggestion: suggestedItems[i % suggestedItems.length],
            type: i % 2 === 0 ? 'Lunch' : 'Dinner'
        }));

        res.json({ success: true, plan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
