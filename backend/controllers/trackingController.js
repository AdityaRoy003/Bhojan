const Order = require('../models/Order');

// Update delivery partner location
const updateLocation = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { latitude, longitude } = req.body;
        const deliveryPartnerId = req.user.id;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify the user is the assigned delivery partner
        if (order.deliveryPartner?.toString() !== deliveryPartnerId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Update location
        order.deliveryPartnerLocation = {
            latitude,
            longitude,
            lastUpdated: new Date()
        };

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            location: order.deliveryPartnerLocation
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get tracking details for an order
const getTrackingDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('user', 'fullname mobile')
            .populate('shop', 'name address')
            .populate('deliveryPartner', 'fullname mobile')
            .populate('items.item');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Calculate ETA if delivery partner location is available
        let eta = null;
        if (order.deliveryPartnerLocation?.latitude && order.deliveryPartnerLocation?.longitude) {
            eta = calculateETA(order);
        }

        res.status(200).json({
            success: true,
            order,
            eta,
            tracking: {
                currentStatus: order.orderStatus,
                statusHistory: order.statusHistory,
                deliveryPartnerLocation: order.deliveryPartnerLocation,
                estimatedDeliveryTime: order.estimatedDeliveryTime
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Calculate ETA based on distance (simplified)
function calculateETA(order) {
    if (!order.deliveryPartnerLocation?.latitude) {
        return null;
    }

    // Simplified ETA calculation
    // In production, use Google Maps Distance Matrix API or similar
    // For now, assume average speed of 30 km/h and estimate based on status

    const now = new Date();
    let estimatedMinutes = 30; // Default 30 minutes

    switch (order.orderStatus) {
        case 'Placed':
            estimatedMinutes = 45;
            break;
        case 'Preparing':
            estimatedMinutes = 30;
            break;
        case 'Ready':
            estimatedMinutes = 20;
            break;
        case 'OutForDelivery':
            estimatedMinutes = 15;
            break;
        case 'Delivered':
            estimatedMinutes = 0;
            break;
    }

    const etaTime = new Date(now.getTime() + estimatedMinutes * 60000);
    return {
        minutes: estimatedMinutes,
        time: etaTime
    };
}

module.exports = { updateLocation, getTrackingDetails };
