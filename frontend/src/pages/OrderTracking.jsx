import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import StatusTimeline from '../components/StatusTimeline';
import ThreeDDeliveryCanvas from '../components/ThreeDDeliveryCanvas';
import socket from '../utils/socket';

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
    const { user } = useSelector((state) => state.user);
    const [order, setOrder] = useState(null);
    const [tracking, setTracking] = useState(null);
    const [eta, setEta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Default: Delhi
    const [viewMode, setViewMode] = useState('3d');

    // Courier Chat State
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef(null);

    // Join chat room and listen for messages
    useEffect(() => {
        if (!orderId || !order?.deliveryPartner) return;

        socket.connect();
        socket.emit('join_chat', orderId);

        const handleChatMessage = (msg) => {
            setMessages(prev => [...prev, msg]);
        };

        socket.on('chat_message', handleChatMessage);

        return () => {
            socket.off('chat_message', handleChatMessage);
        };
    }, [orderId, order?.deliveryPartner]);

    // Auto scroll chat to bottom
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, chatOpen]);

    const sendChatMessage = () => {
        if (!newMessage.trim() || !orderId) return;

        socket.emit('send_chat_message', {
            orderId,
            message: newMessage,
            senderName: user?.fullname || 'Customer',
            senderRole: 'Customer',
            timestamp: new Date().toISOString()
        });
        setNewMessage('');
    };

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

                        {/* Live Tracking Map / 3D Visualizer */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-4 bg-primary text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-bold">Live Tracking</h3>
                                    {order.orderStatus === 'OutForDelivery' && (
                                        <span className="flex items-center gap-2 text-sm bg-green-600 px-3 py-1 rounded-full border border-green-400/30">
                                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                            Live
                                        </span>
                                    )}
                                </div>
                                <div className="flex bg-white/10 backdrop-blur-md rounded-full p-0.5 border border-white/20 text-[10px] self-start sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('3d')}
                                        className={`px-4 py-2 rounded-full font-black uppercase tracking-widest transition-all cursor-pointer ${viewMode === '3d' ? 'bg-white text-primary shadow-md' : 'text-white/80 hover:text-white hover:bg-white/5'}`}
                                    >
                                        🎬 3D Cinematic
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('map')}
                                        className={`px-4 py-2 rounded-full font-black uppercase tracking-widest transition-all cursor-pointer ${viewMode === 'map' ? 'bg-white text-primary shadow-md' : 'text-white/80 hover:text-white hover:bg-white/5'}`}
                                    >
                                        🗺️ Map View
                                    </button>
                                </div>
                            </div>
                            {viewMode === 'map' ? (
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
                            ) : (
                                <div className="p-6 bg-gray-950 flex flex-col justify-center items-center">
                                    <div className="w-full">
                                        <ThreeDDeliveryCanvas currentStatus={order.orderStatus} />
                                    </div>
                                    <div className="mt-4 text-center">
                                        <p className="text-xs font-black uppercase tracking-widest text-amber-500 mb-1">
                                            Status: {order.orderStatus === 'OutForDelivery' ? 'Courier en route' : order.orderStatus === 'Preparing' ? 'Kitchen is preparing food' : order.orderStatus === 'Placed' ? 'Waiting for confirmation' : order.orderStatus === 'Delivered' ? 'Food delivered!' : 'Order Placed'}
                                        </p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                            Interactive 3D Corridor visualizer of your delivery path
                                        </p>
                                    </div>
                                </div>
                            )}
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
                                    <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Delivery Partner</p>
                                            <p className="font-bold text-gray-900">{order.deliveryPartner.fullname}</p>
                                            <p className="text-xs text-gray-600">{order.deliveryPartner.mobile}</p>
                                        </div>
                                        <button
                                            onClick={() => setChatOpen(true)}
                                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-none mt-2 flex items-center justify-center gap-2"
                                        >
                                            <span>💬</span> Chat with Courier
                                        </button>
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

            {/* Courier Chat Drawer */}
            <AnimatePresence>
                {chatOpen && (
                    <>
                        {/* Overlay backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setChatOpen(false)}
                            className="fixed inset-0 bg-black z-50 cursor-pointer"
                        />
                        {/* Chat Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-gray-900 shadow-2xl z-[60] flex flex-col border-l border-gray-100 dark:border-gray-800"
                        >
                            {/* Header */}
                            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                                        {order.deliveryPartner?.fullname?.[0]?.toUpperCase() || '🏍️'}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-sm">{order.deliveryPartner?.fullname || 'Courier'}</h3>
                                        <p className="text-[9px] uppercase tracking-wider opacity-85">Courier Chat Portal</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setChatOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors font-bold text-sm"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-gray-600">
                                        <span className="text-4xl mb-2">💬</span>
                                        <p className="text-sm font-bold">No messages yet</p>
                                        <p className="text-xs">Ask the courier about your delivery status!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => {
                                        const isMe = msg.senderRole === 'Customer';
                                        return (
                                            <div
                                                key={index}
                                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[75%] p-3 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${isMe ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'}`}
                                                >
                                                    {msg.message}
                                                </div>
                                                <span className="text-[8px] text-gray-400 dark:text-gray-600 mt-1 uppercase tracking-widest font-black">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input Form */}
                            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                                    className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:outline-none dark:text-white dark:placeholder-gray-500 font-medium"
                                />
                                <button
                                    onClick={sendChatMessage}
                                    disabled={!newMessage.trim()}
                                    className="bg-primary text-white p-3 rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-red-100 dark:shadow-none disabled:opacity-50"
                                >
                                    ➔
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrderTracking;
