const Order = require('../models/Order');

// Haversine formula — returns distance in km between two lat/lng points
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Update delivery partner location (called by delivery boy app)
const updateLocation = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { latitude, longitude, heading = 0, speed = 0 } = req.body;
        const deliveryPartnerId = req.user.id;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify the user is the assigned delivery partner
        if (order.deliveryPartner?.toString() !== deliveryPartnerId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Update location with heading and speed
        order.deliveryPartnerLocation = {
            latitude,
            longitude,
            heading,
            speed,
            lastUpdated: new Date()
        };

        await order.save();

        // Calculate real-time ETA using Haversine if we have delivery coords
        let eta = null;
        if (order.deliveryCoords?.lat && order.deliveryCoords?.lng) {
            const distKm = haversineDistance(latitude, longitude, order.deliveryCoords.lat, order.deliveryCoords.lng);
            const avgSpeedKmh = 25; // Average delivery speed in city
            const etaMinutes = Math.ceil((distKm / avgSpeedKmh) * 60);
            eta = {
                minutes: etaMinutes,
                distanceKm: distKm.toFixed(2),
                time: new Date(Date.now() + etaMinutes * 60000)
            };
        }

        // Broadcast real-time via Socket.io to customers tracking this order
        if (global.io) {
            global.io.to(`track_${orderId}`).emit('rider_location', {
                orderId,
                latitude,
                longitude,
                heading,
                speed,
                eta,
                timestamp: new Date().toISOString()
            });
        }

        res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            location: order.deliveryPartnerLocation,
            eta
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
            .populate('shop', 'name address location')
            .populate('deliveryPartner', 'fullname mobile avatar')
            .populate('items.item');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Self-heal/populate coordinates if missing
        let hasCoordsChanged = false;
        if (!order.restaurantCoords || !order.restaurantCoords.lat) {
            const shopLat = order.shop?.location?.coordinates?.[1];
            const shopLng = order.shop?.location?.coordinates?.[0];
            if (shopLat && shopLng && shopLng !== 0) {
                order.restaurantCoords = { lat: shopLat, lng: shopLng };
            } else {
                order.restaurantCoords = { lat: 28.5355, lng: 77.3910 };
            }
            hasCoordsChanged = true;
        }

        if (!order.deliveryCoords || !order.deliveryCoords.lat) {
            const latOffset = (Math.random() - 0.5) * 0.02;
            const lngOffset = (Math.random() - 0.5) * 0.02;
            order.deliveryCoords = {
                lat: order.restaurantCoords.lat + latOffset,
                lng: order.restaurantCoords.lng + lngOffset
            };
            hasCoordsChanged = true;
        }

        if (hasCoordsChanged) {
            await order.save();
        }

        // Calculate ETA if delivery partner location is available
        let eta = null;
        if (order.deliveryPartnerLocation?.latitude && order.deliveryCoords?.lat) {
            const distKm = haversineDistance(
                order.deliveryPartnerLocation.latitude,
                order.deliveryPartnerLocation.longitude,
                order.deliveryCoords.lat,
                order.deliveryCoords.lng
            );
            const avgSpeedKmh = 25;
            const etaMinutes = Math.ceil((distKm / avgSpeedKmh) * 60);
            eta = {
                minutes: etaMinutes,
                distanceKm: distKm.toFixed(2),
                time: new Date(Date.now() + etaMinutes * 60000)
            };
        } else if (order.deliveryPartnerLocation?.latitude) {
            // Fallback ETA based on status
            eta = calculateStatusETA(order.orderStatus);
        }

        res.status(200).json({
            success: true,
            order,
            eta,
            tracking: {
                currentStatus: order.orderStatus,
                statusHistory: order.statusHistory,
                deliveryPartnerLocation: order.deliveryPartnerLocation,
                restaurantCoords: order.restaurantCoords,
                deliveryCoords: order.deliveryCoords,
                estimatedDeliveryTime: order.estimatedDeliveryTime
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Fallback ETA based on order status (no GPS data)
function calculateStatusETA(status) {
    const now = new Date();
    const etaMap = {
        Placed: 45,
        Preparing: 30,
        Ready: 20,
        OutForDelivery: 15,
        Delivered: 0
    };
    const estimatedMinutes = etaMap[status] ?? 30;
    return {
        minutes: estimatedMinutes,
        distanceKm: null,
        time: new Date(now.getTime() + estimatedMinutes * 60000)
    };
}

module.exports = { updateLocation, getTrackingDetails };
