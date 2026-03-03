const Review = require('../models/Review');
const Shop = require('../models/Shop');
const Order = require('../models/Order');

// Add a Review
exports.addReview = async (req, res) => {
    try {
        const { shopId, orderId, rating, review } = req.body;

        // 1. Verify that the order exists and belongs to the user
        const order = await Order.findOne({
            _id: orderId,
            user: req.user.id
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found or not authorized' });
        }

        // 2. verify order status is Delivered
        if (order.orderStatus !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'You can only review delivered orders' });
        }

        // 3. Check if already reviewed
        const existingReview = await Review.findOne({
            user: req.user.id,
            order: orderId
        });

        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this order' });
        }

        // 4. Create Review
        const newReview = await Review.create({
            user: req.user.id,
            shop: shopId,
            order: orderId,
            rating,
            review
        });

        // 5. Update Shop Average Rating
        const stats = await Review.aggregate([
            { $match: { shop: new mongoose.Types.ObjectId(shopId) } },
            {
                $group: {
                    _id: '$shop',
                    avgRating: { $avg: '$rating' },
                    nRating: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            await Shop.findByIdAndUpdate(shopId, {
                rating: stats[0].avgRating,
                numReviews: stats[0].nRating
            });
        } else {
            await Shop.findByIdAndUpdate(shopId, {
                rating: rating,
                numReviews: 1
            });
        }

        res.status(201).json({
            success: true,
            review: newReview
        });

    } catch (error) {
        console.error('Add Review Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Shop Reviews
exports.getShopReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ shop: req.params.shopId })
            .populate('user', 'fullname')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
