const Order = require('../models/Order');
const User = require('../models/User');
const Shop = require('../models/Shop');

// Predictive sales analytics for owners
exports.getPredictiveSales = async (req, res) => {
    try {
        const { shopId } = req.params;

        // Get historical order data
        const orders = await Order.find({ shop: shopId })
            .sort({ createdAt: -1 })
            .limit(100);

        // Simple prediction based on day of week and time patterns
        const dayOfWeekStats = {};
        const hourlyStats = {};

        orders.forEach(order => {
            const date = new Date(order.createdAt);
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
            const hour = date.getHours();

            dayOfWeekStats[dayOfWeek] = (dayOfWeekStats[dayOfWeek] || 0) + 1;
            hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
        });

        // Predict next 7 days
        const predictions = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            const dayName = futureDate.toLocaleDateString('en-US', { weekday: 'long' });

            predictions.push({
                date: futureDate.toLocaleDateString(),
                day: dayName,
                predictedOrders: dayOfWeekStats[dayName] || 5,
                confidence: dayOfWeekStats[dayName] ? 'High' : 'Low'
            });
        }

        res.status(200).json({
            success: true,
            predictions,
            peakHours: Object.entries(hourlyStats)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([hour, count]) => ({ hour: `${hour}:00`, orders: count }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delivery heatmap data
exports.getDeliveryHeatmap = async (req, res) => {
    try {
        const { city } = req.query;

        const orders = await Order.find({
            'deliveryAddress.city': city,
            status: 'Delivered'
        }).select('deliveryAddress.location');

        // Cluster orders by approximate location (simplified)
        const clusters = {};
        orders.forEach(order => {
            if (order.deliveryAddress?.location) {
                const lat = Math.round(order.deliveryAddress.location.coordinates[1] * 100) / 100;
                const lng = Math.round(order.deliveryAddress.location.coordinates[0] * 100) / 100;
                const key = `${lat},${lng}`;
                clusters[key] = (clusters[key] || 0) + 1;
            }
        });

        const heatmapData = Object.entries(clusters).map(([coords, count]) => {
            const [lat, lng] = coords.split(',').map(Number);
            return {
                lat,
                lng,
                intensity: count,
                radius: Math.min(count * 10, 100) // Scale radius based on order count
            };
        });

        res.status(200).json({ success: true, heatmapData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Customer insights dashboard
exports.getCustomerInsights = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        const orders = await Order.find({ user: userId }).populate('items.foodItem');

        // Calculate insights
        const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

        // Cuisine preferences
        const cuisineCount = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const cuisine = item.foodItem?.category || 'Other';
                cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
            });
        });

        const favoriteCuisines = Object.entries(cuisineCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([cuisine, count]) => ({ cuisine, orders: count }));

        // Calorie tracking (if nutritional data available)
        let totalCalories = 0;
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.foodItem?.nutritionalInfo?.calories) {
                    totalCalories += item.foodItem.nutritionalInfo.calories * item.quantity;
                }
            });
        });

        // Spending pattern by month
        const monthlySpending = {};
        orders.forEach(order => {
            const month = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            monthlySpending[month] = (monthlySpending[month] || 0) + order.totalAmount;
        });

        res.status(200).json({
            success: true,
            insights: {
                totalSpent,
                totalOrders,
                avgOrderValue,
                favoriteCuisines,
                totalCalories,
                monthlySpending: Object.entries(monthlySpending).map(([month, amount]) => ({ month, amount })),
                loyaltyPoints: user.loyaltyPoints,
                memberSince: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
