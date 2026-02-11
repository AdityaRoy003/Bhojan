import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import StatusTimeline from '../components/StatusTimeline';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const OrderTracking = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [tracking, setTracking] = useState(null);
    const [eta, setEta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Default: Delhi

    const fetchTrackingDetails = async () => {
        try {
            const { data } = await api.get(`/tracking/${orderId}`);
            if (data.success) {
                setOrder(data.order);
                setTracking(data.tracking);
                setEta(data.eta);

                // Update map center if delivery partner location is available
                if (data.tracking.deliveryPartnerLocation?.latitude) {
                    setMapCenter([
                        data.tracking.deliveryPartnerLocation.latitude,
                        data.tracking.deliveryPartnerLocation.longitude
                    ]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch tracking details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!orderId) {
            alert("Unexpected error: Order ID missing from URL");
            return;
        }
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            console.log('Attempting to cancel order:', orderId);
            const { data } = await api.put(`/order/${orderId}/cancel`);
            if (data.success) {
                alert("Order cancelled successfully");
                fetchTrackingDetails();
            }
        } catch (error) {
            console.error('Cancel error details:', error);
            alert(error.response?.data?.message || "Failed to cancel order. Check console for details.");
        }
    };

    useEffect(() => {
        fetchTrackingDetails();

        // Auto-refresh every 10 seconds
        const interval = setInterval(() => {
            if (order?.orderStatus !== 'Delivered' && order?.orderStatus !== 'Cancelled') {
                fetchTrackingDetails();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading tracking details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600">Order not found</p>
                    <button
                        onClick={() => navigate('/profile')}
                        className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>
        );
    }

    // Prepare coordinates for map
    const userLocation = [28.6139, 77.2090]; // In production, get from order.deliveryAddress coordinates
    const deliveryPartnerLocation = tracking?.deliveryPartnerLocation?.latitude
        ? [tracking.deliveryPartnerLocation.latitude, tracking.deliveryPartnerLocation.longitude]
        : null;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold"
                    >
                        <span>←</span> Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Track Order</h1>
                    <div className="w-20"></div> {/* Spacer for centering */}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Map and Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Timeline */}
                        <StatusTimeline
                            currentStatus={order.orderStatus}
                            statusHistory={tracking?.statusHistory || []}
                        />

                        {/* Live Map */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-4 bg-primary text-white flex items-center justify-between">
                                <h3 className="text-lg font-bold">Live Tracking</h3>
                                {order.orderStatus === 'OutForDelivery' && (
                                    <span className="flex items-center gap-2 text-sm">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        Live
                                    </span>
                                )}
                            </div>
                            <div className="h-96">
                                <MapContainer
                                    center={mapCenter}
                                    zoom={13}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />

                                    {/* User Location Marker */}
                                    <Marker position={userLocation} icon={userIcon}>
                                        <Popup>
                                            <strong>Delivery Address</strong>
                                            <br />
                                            {order.deliveryAddress}
                                        </Popup>
                                    </Marker>

                                    {/* Delivery Partner Location Marker */}
                                    {deliveryPartnerLocation && (
                                        <>
                                            <Marker position={deliveryPartnerLocation} icon={deliveryIcon}>
                                                <Popup>
                                                    <strong>Delivery Partner</strong>
                                                    <br />
                                                    {order.deliveryPartner?.fullname || 'On the way'}
                                                </Popup>
                                            </Marker>

                                            {/* Route Line */}
                                            <Polyline
                                                positions={[userLocation, deliveryPartnerLocation]}
                                                color="#EF4444"
                                                weight={3}
                                                opacity={0.7}
                                                dashArray="10, 10"
                                            />
                                        </>
                                    )}
                                </MapContainer>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Order Details */}
                    <div className="space-y-6">
                        {/* ETA Card */}
                        {eta && order.orderStatus !== 'Delivered' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-primary to-red-700 text-white rounded-2xl shadow-lg p-6"
                            >
                                <p className="text-sm opacity-90 mb-2">Estimated Delivery</p>
                                <p className="text-4xl font-black mb-1">{eta.minutes} min</p>
                                <p className="text-xs opacity-75">
                                    {new Date(eta.time).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </motion.div>
                        )}

                        {/* Order Summary */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Order ID</span>
                                    <span className="font-bold text-gray-900">#{order._id.slice(-6).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Restaurant</span>
                                    <span className="font-bold text-gray-900">{order.shop?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Items</span>
                                    <span className="font-bold text-gray-900">{order.items.length} items</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total Amount</span>
                                    <span className="font-bold text-primary">₹{order.totalAmount}</span>
                                </div>
                                {order.deliveryPartner && (
                                    <div className="pt-3 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">Delivery Partner</p>
                                        <p className="font-bold text-gray-900">{order.deliveryPartner.fullname}</p>
                                        <p className="text-xs text-gray-600">{order.deliveryPartner.mobile}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cancellation Button */}
                        {order.orderStatus === 'Placed' && (
                            <button
                                onClick={handleCancelOrder}
                                className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-dashed border-red-200 hover:bg-red-100 transition-all shadow-sm"
                            >
                                🚫 Cancel Order
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
