const Shop = require('../models/Shop');
const User = require('../models/User');

// Create Shop
exports.createShop = async (req, res) => {
    try {
        const { name, image, city, state, address, location } = req.body;

        const shop = await Shop.create({
            name,
            image,
            owner: req.user.id,
            city,
            state,
            address,
            location
        });

        // Update user role to Owner if not already
        if (req.user.role !== 'Owner') {
            await User.findByIdAndUpdate(req.user.id, { role: 'Owner' });
        }

        res.status(201).json({ success: true, shop });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Shops (with city filter and dietary preferences)
exports.getAllShops = async (req, res) => {
    try {
        const { city, dietaryTags, shopType } = req.query;
        const userId = req.user?.id;

        let query = {};
        if (city) {
            query.city = city;
        }
        if (shopType) {
            query.shopType = shopType;
        }

        let shops = await Shop.find(query).populate('items');

        // Apply dietary filters if provided
        if (dietaryTags) {
            const tags = Array.isArray(dietaryTags) ? dietaryTags : [dietaryTags];
            shops = shops.filter(shop => {
                return shop.items.some(item =>
                    tags.some(tag => item.dietaryTags.includes(tag))
                );
            });
        }

        // Prioritize shops based on user's order history
        if (userId) {
            const Order = require('../models/Order');
            const userOrders = await Order.find({ user: userId }).select('shop');
            const shopOrderCounts = {};

            userOrders.forEach(order => {
                const shopId = order.shop.toString();
                shopOrderCounts[shopId] = (shopOrderCounts[shopId] || 0) + 1;
            });

            // Sort shops: frequently ordered first
            shops.sort((a, b) => {
                const aCount = shopOrderCounts[a._id.toString()] || 0;
                const bCount = shopOrderCounts[b._id.toString()] || 0;
                return bCount - aCount;
            });
        }

        const responseData = { success: true, shops };

        res.status(200).json(responseData);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Shop Details
exports.getShopDetails = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id).populate('items');
        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found' });
        }
        res.status(200).json({ success: true, shop });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Search Shops
exports.searchShops = async (req, res) => {
    try {
        const { query } = req.params;
        if (!query) return res.status(400).json({ success: false, message: "Query required" });

        // Case-insensitive regex search on Name, City, or Address
        const searchRegex = new RegExp(query, 'i');

        const shops = await Shop.find({
            $or: [
                { name: searchRegex },
                { city: searchRegex },
                { address: searchRegex },
                { 'items.name': searchRegex } // If we want to search via items (requires aggregation or population, simplified for now)
            ]
        });
        // Note: Simple find won't search populated items easily. Let's stick to Shop fields first.

        const refinedShops = await Shop.find({
            $or: [
                { name: searchRegex },
                { city: searchRegex },
                { address: searchRegex }
            ]
        });

        res.status(200).json({ success: true, shops: refinedShops });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get My Shop with Dashboard Insights
exports.getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.user.id }).populate('items');
        if (!shop) {
            return res.status(200).json({ success: true, shop: null, message: 'No shop found for this owner.' });
        }

        const Order = require('../models/Order');
        const orders = await Order.find({ shop: shop._id });

        // Calculate Insights
        const totalRevenue = orders.reduce((sum, order) => sum + (order.isPaid ? order.totalAmount : 0), 0);
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => ['Placed', 'Preparing'].includes(o.orderStatus)).length;

        // Sales grouping by category (simplified)
        const categoryStats = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const cat = item.category || 'Others';
                categoryStats[cat] = (categoryStats[cat] || 0) + item.quantity;
            });
        });

        res.status(200).json({
            success: true,
            shop,
            insights: {
                totalRevenue,
                totalOrders,
                pendingOrders,
                categoryStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Shop Settings
exports.updateShopSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const { gstin, fssai, timing, minOrderValue, settings, logo, banner } = req.body;

        let shop = await Shop.findById(id);
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

        if (shop.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (gstin) shop.gstin = gstin;
        if (fssai) shop.fssai = fssai;
        if (timing) shop.timing = timing;
        if (minOrderValue !== undefined) shop.minOrderValue = minOrderValue;
        if (settings) shop.settings = { ...shop.settings, ...settings };
        if (logo) shop.logo = logo;
        if (banner) shop.banner = banner;

        await shop.save();

        res.status(200).json({ success: true, message: 'Shop settings updated', shop });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Shop
exports.updateShop = async (req, res) => {
    try {
        let shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

        if (shop.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, shop });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Shop
exports.deleteShop = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

        if (shop.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const Item = require('../models/Item');
        await Item.deleteMany({ shop: shop._id });
        await shop.deleteOne();

        res.status(200).json({ success: true, message: 'Shop deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Shop Analytics
exports.getShopAnalytics = async (req, res) => {
    try {
        const shopId = req.params.shopId;
        const shop = await Shop.findById(shopId);

        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found' });
        }

        // Verify ownership
        if (shop.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const Order = require('../models/Order');
        const { isToday, isThisWeek, getLast7DaysRevenue, getOrderDistribution } = require('../utils/dateHelpers');

        // Fetch all orders for this shop
        const orders = await Order.find({ shop: shopId }).populate('user', 'fullname');

        // Calculate real revenue from paid orders
        const totalRevenue = orders.filter(o => o.isPaid).reduce((sum, o) => sum + o.totalAmount, 0);

        // Order statistics
        const todayOrders = orders.filter(o => isToday(o.createdAt));
        const weekOrders = orders.filter(o => isThisWeek(o.createdAt));
        const todayRevenue = todayOrders.filter(o => o.isPaid).reduce((sum, o) => sum + o.totalAmount, 0);

        // Average order value
        const paidOrders = orders.filter(o => o.isPaid);
        const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

        // Popular items analysis
        const itemStats = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!itemStats[item.name]) {
                    itemStats[item.name] = {
                        name: item.name,
                        count: 0,
                        revenue: 0,
                        image: item.image || ''
                    };
                }
                itemStats[item.name].count += item.quantity;
                itemStats[item.name].revenue += item.price * item.quantity;
            });
        });

        const popularItems = Object.values(itemStats)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Peak hours analysis (24-hour format)
        const hourlyOrders = Array(24).fill(0);
        orders.forEach(o => {
            const hour = new Date(o.createdAt).getHours();
            hourlyOrders[hour]++;
        });

        // Find peak hour
        const peakHour = hourlyOrders.indexOf(Math.max(...hourlyOrders));

        // Revenue by day (last 7 days)
        const revenueByDay = getLast7DaysRevenue(orders);

        // Order distribution by status
        const orderDistribution = getOrderDistribution(orders);

        // Customer insights
        const uniqueCustomers = new Set(orders.map(o => o.user?._id?.toString()).filter(Boolean)).size;
        const repeatCustomers = orders.reduce((acc, order) => {
            const userId = order.user?._id?.toString();
            if (userId) {
                acc[userId] = (acc[userId] || 0) + 1;
            }
            return acc;
        }, {});
        const repeatCustomerCount = Object.values(repeatCustomers).filter(count => count > 1).length;

        res.status(200).json({
            success: true,
            analytics: {
                // Revenue metrics
                totalRevenue,
                todayRevenue,
                avgOrderValue,

                // Order metrics
                totalOrders: orders.length,
                todayOrders: todayOrders.length,
                weekOrders: weekOrders.length,
                pendingOrders: orderDistribution.Placed + orderDistribution.Preparing,

                // Customer metrics
                uniqueCustomers,
                repeatCustomers: repeatCustomerCount,
                customerRetentionRate: uniqueCustomers > 0 ? (repeatCustomerCount / uniqueCustomers * 100).toFixed(1) : 0,

                // Item insights
                popularItems,
                totalMenuItems: shop.items?.length || 0,

                // Time insights
                peakHour,
                peakHourOrders: hourlyOrders[peakHour],
                hourlyOrders,

                // Trends
                revenueByDay,
                orderDistribution
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// --- PROMOTIONS (COUPONS) ---

// Create Coupon
exports.createCoupon = async (req, res) => {
    try {
        const { code, discountType, value, maxDiscount, minOrderValue, validUntil } = req.body;
        const Coupon = require('../models/Coupon');

        // Check if shop exists and user owns it
        const shop = await Shop.findOne({ owner: req.user.id });
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

        const coupon = await Coupon.create({
            code,
            shop: shop._id,
            discountType,
            value,
            maxDiscount,
            minOrderValue,
            validUntil
        });

        res.status(201).json({ success: true, coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Shop Coupons
exports.getShopCoupons = async (req, res) => {
    try {
        const Coupon = require('../models/Coupon');
        const shop = await Shop.findOne({ owner: req.user.id });
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

        const coupons = await Coupon.find({ shop: shop._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Coupon
exports.deleteCoupon = async (req, res) => {
    try {
        const Coupon = require('../models/Coupon');
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

        // Verify ownership via shop
        const shop = await Shop.findById(coupon.shop);
        if (shop.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await coupon.deleteOne();
        res.status(200).json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// --- FINANCES ---

// Get Shop Finances
exports.getShopFinances = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.user.id });
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

        const Order = require('../models/Order');
        const orders = await Order.find({ shop: shop._id, orderStatus: 'Delivered' });

        // Calculate Totals
        const totalEarnings = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const withdrawn = 0; // Placeholder for now until Payout model exists
        const availableBalance = totalEarnings - withdrawn;

        // Recent Transactions (Mocking from Orders)
        const recentTransactions = orders.slice(0, 10).map(o => ({
            id: o._id,
            date: o.createdAt,
            amount: o.totalAmount,
            type: 'Order Credit',
            status: 'Completed'
        }));

        res.status(200).json({
            success: true,
            finances: {
                totalEarnings,
                withdrawn,
                availableBalance,
                recentTransactions
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
