import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import StatusTimeline from '../components/StatusTimeline';
import ThreeDDeliveryCanvas from '../components/ThreeDDeliveryCanvas';
import LiveTrackingMap from '../components/LiveTrackingMap';
import socket, { watchOrder } from '../utils/socket';

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    Placed:         { label: 'Order Placed',        icon: '📋', color: '#6b7280', bg: 'bg-gray-100 text-gray-600' },
    Preparing:      { label: 'Preparing Your Food', icon: '👨‍🍳', color: '#f59e0b', bg: 'bg-amber-100 text-amber-700' },
    Ready:          { label: 'Ready for Pickup',    icon: '✅', color: '#3b82f6', bg: 'bg-blue-100 text-blue-700' },
    OutForDelivery: { label: 'Rider is on the way!',icon: '🏍️', color: '#f97316', bg: 'bg-orange-100 text-orange-700' },
    Delivered:      { label: 'Delivered! Enjoy 🎉', icon: '🎊', color: '#10b981', bg: 'bg-green-100 text-green-700' },
    Cancelled:      { label: 'Order Cancelled',     icon: '✕',  color: '#ef4444', bg: 'bg-red-100 text-red-700' },
};

const OrderTracking = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.user);

    const [order, setOrder] = useState(null);
    const [tracking, setTracking] = useState(null);
    const [eta, setEta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('map');

    // Live rider state
    const [riderPosition, setRiderPosition] = useState(null);
    const [riderHeading, setRiderHeading] = useState(0);
    const [riderSpeed, setRiderSpeed] = useState(0);
    const [liveMode, setLiveMode] = useState(false);
    const [lastPing, setLastPing] = useState(null);

    // Chat state
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef(null);

    // ── Fetch order + tracking data ────────────────────────────────────────
    const fetchTrackingDetails = useCallback(async () => {
        try {
            const { data } = await api.get(`/tracking/${orderId}`);
            if (data.success) {
                setOrder(data.order);
                setTracking(data.tracking);
                setEta(data.eta);

                // Seed rider position from DB if live socket hasn't kicked in
                if (data.tracking.deliveryPartnerLocation?.latitude && !liveMode) {
                    setRiderPosition([
                        data.tracking.deliveryPartnerLocation.latitude,
                        data.tracking.deliveryPartnerLocation.longitude,
                    ]);
                    setRiderHeading(data.tracking.deliveryPartnerLocation.heading || 0);
                }
            }
        } catch (err) {
            console.error('Failed to fetch tracking:', err);
        } finally {
            setLoading(false);
        }
    }, [orderId, liveMode]);

    useEffect(() => {
        fetchTrackingDetails();

        // Poll every 15s as a fallback (socket takes priority)
        const interval = setInterval(() => {
            if (order?.orderStatus !== 'Delivered' && order?.orderStatus !== 'Cancelled') {
                fetchTrackingDetails();
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [orderId]);

    // ── Socket: live rider location ────────────────────────────────────────
    useEffect(() => {
        if (!orderId) return;

        socket.connect();
        watchOrder(orderId); // join `track_<orderId>` room

        const handleRiderLocation = (data) => {
            if (data.orderId !== orderId) return;

            setRiderPosition([data.latitude, data.longitude]);
            setRiderHeading(data.heading || 0);
            setRiderSpeed(data.speed || 0);
            setLiveMode(true);
            setLastPing(new Date());

            // Update ETA from socket payload if available
            if (data.eta) setEta(data.eta);
        };

        socket.on('rider_location', handleRiderLocation);

        // Also handle legacy event
        socket.on('location_update', (data) => {
            if (data.lat && data.orderId === orderId) {
                setRiderPosition([data.lat, data.lng]);
                setLiveMode(true);
            }
        });

        return () => {
            socket.off('rider_location', handleRiderLocation);
            socket.off('location_update');
        };
    }, [orderId]);

    // Detect stale signal (no ping for > 30s → go offline indicator)
    useEffect(() => {
        if (!lastPing) return;
        const timeout = setTimeout(() => setLiveMode(false), 30000);
        return () => clearTimeout(timeout);
    }, [lastPing]);

    // ── Socket: courier chat ───────────────────────────────────────────────
    useEffect(() => {
        if (!orderId || !order?.deliveryPartner) return;

        socket.emit('join_chat', orderId);

        const handleChatMessage = (msg) => setMessages(prev => [...prev, msg]);
        socket.on('chat_message', handleChatMessage);

        return () => { socket.off('chat_message', handleChatMessage); };
    }, [orderId, order?.deliveryPartner]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    // ── Cancel order ───────────────────────────────────────────────────────
    const handleCancelOrder = async () => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        try {
            const { data } = await api.put(`/order/${orderId}/cancel`);
            if (data.success) {
                alert('Order cancelled successfully');
                fetchTrackingDetails();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel order.');
        }
    };

    // ── Loading / Error states ─────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading tracking...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center text-white">
                    <p className="text-xl mb-4">Order not found</p>
                    <button onClick={() => navigate('/profile')} className="px-6 py-3 bg-orange-500 rounded-xl font-bold">
                        Back to Profile
                    </button>
                </div>
            </div>
        );
    }

    const statusCfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.Placed;
    const isOutForDelivery = order.orderStatus === 'OutForDelivery';
    const isDelivered = order.orderStatus === 'Delivered';
    const isCancellable = order.orderStatus === 'Placed';

    // Map pin data
    const restaurantCoords = tracking?.restaurantCoords || null;
    const deliveryCoords = tracking?.deliveryCoords || null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

            {/* ── Top Header ─────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        ←
                    </button>
                    <div className="flex-1">
                        <h1 className="text-base font-black text-gray-900 dark:text-white">
                            Order #{order._id.slice(-6).toUpperCase()}
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{order.shop?.name}</p>
                    </div>

                    {/* Status pill */}
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${statusCfg.bg}`}>
                        <span>{statusCfg.icon}</span>
                        {statusCfg.label}
                    </span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

                {/* ── ETA Banner (Out for Delivery) ───────────────────────── */}
                <AnimatePresence>
                    {isOutForDelivery && eta && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-xl shadow-orange-200 dark:shadow-none"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs opacity-80 uppercase tracking-widest font-bold mb-1">Estimated Arrival</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-5xl font-black leading-none">{eta.minutes}</span>
                                        <span className="text-lg font-bold opacity-80 mb-1">min</span>
                                    </div>
                                    {eta.distanceKm && (
                                        <p className="text-xs opacity-70 mt-1">{eta.distanceKm} km away</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-6xl opacity-20">🏍️</div>
                                    {liveMode && (
                                        <span className="flex items-center gap-1.5 text-xs font-black mt-1">
                                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                            Live tracking active
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Status Timeline ─────────────────────────────────────── */}
                <StatusTimeline
                    currentStatus={order.orderStatus}
                    statusHistory={tracking?.statusHistory || []}
                />

                {/* ── Map / 3D View ───────────────────────────────────────── */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800">

                    {/* Map header */}
                    <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <h3 className="font-black text-gray-900 dark:text-white">Live Tracking</h3>
                            {liveMode && (
                                <span className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Live
                                </span>
                            )}
                            {isOutForDelivery && riderSpeed > 0 && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                                    {(riderSpeed * 3.6).toFixed(0)} km/h
                                </span>
                            )}
                        </div>

                        {/* View mode toggle */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-0.5 text-[10px]">
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-3 py-1.5 rounded-full font-black transition-all ${viewMode === 'map' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                🗺️ Map
                            </button>
                            <button
                                onClick={() => setViewMode('3d')}
                                className={`px-3 py-1.5 rounded-full font-black transition-all ${viewMode === '3d' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                🎬 3D
                            </button>
                        </div>
                    </div>

                    {viewMode === 'map' ? (
                        <div className="h-[420px] lg:h-[500px]">
                            <LiveTrackingMap
                                mode="customer"
                                riderPosition={riderPosition}
                                restaurantCoords={restaurantCoords}
                                deliveryCoords={deliveryCoords}
                                riderHeading={riderHeading}
                                riderName={order.deliveryPartner?.fullname}
                                shopName={order.shop?.name}
                                deliveryAddress={order.deliveryAddress}
                                liveMode={liveMode}
                                height="100%"
                            />
                        </div>
                    ) : (
                        <div className="p-6 bg-gray-950">
                            <ThreeDDeliveryCanvas currentStatus={order.orderStatus} />
                            <p className="text-center text-xs text-gray-500 font-bold uppercase tracking-widest mt-3">
                                {order.orderStatus === 'OutForDelivery' ? 'Courier en route' :
                                 order.orderStatus === 'Preparing' ? 'Kitchen is preparing food' :
                                 order.orderStatus === 'Delivered' ? 'Food delivered! 🎉' : 'Waiting for confirmation'}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Delivery Partner Card ───────────────────────────────── */}
                {order.deliveryPartner && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-orange-200">
                                    {order.deliveryPartner.fullname?.[0]?.toUpperCase() || '🏍️'}
                                </div>
                                <div>
                                    <p className="font-black text-gray-900 dark:text-white">{order.deliveryPartner.fullname}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{order.deliveryPartner.mobile}</p>
                                    {liveMode && (
                                        <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mt-0.5">● Location sharing</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href={`tel:${order.deliveryPartner.mobile}`}
                                    className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                >
                                    📞
                                </a>
                                <button
                                    onClick={() => setChatOpen(true)}
                                    className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 transition-colors"
                                >
                                    💬
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Order Summary ───────────────────────────────────────── */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                    <h3 className="font-black text-gray-900 dark:text-white mb-4">Order Summary</h3>
                    <div className="space-y-3">
                        {/* Items */}
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700 dark:text-gray-300">
                                    {item.quantity}× {item.name}
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-bold dark:text-white">₹{order.totalAmount}</span>
                            </div>
                            {order.deliveryFee > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Delivery fee</span>
                                    <span className="font-bold dark:text-white">₹{order.deliveryFee}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-black text-base pt-1 border-t border-gray-100 dark:border-gray-800 mt-1">
                                <span className="dark:text-white">Total</span>
                                <span className="text-orange-500">₹{order.totalAmount + (order.deliveryFee || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Cancellation Button ─────────────────────────────────── */}
                {isCancellable && (
                    <button
                        onClick={handleCancelOrder}
                        className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-dashed border-red-200 dark:border-red-800 hover:bg-red-100 transition-all"
                    >
                        🚫 Cancel Order
                    </button>
                )}
            </div>

            {/* ── Courier Chat Drawer ─────────────────────────────────────── */}
            <AnimatePresence>
                {chatOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setChatOpen(false)}
                            className="fixed inset-0 bg-black z-50 cursor-pointer"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-gray-900 shadow-2xl z-[60] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                                        {order.deliveryPartner?.fullname?.[0]?.toUpperCase() || '🏍️'}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-sm">{order.deliveryPartner?.fullname || 'Courier'}</h3>
                                        <p className="text-[9px] uppercase tracking-wider opacity-85">Courier Chat</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setChatOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                >✕</button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                                        <span className="text-4xl mb-2">💬</span>
                                        <p className="text-sm font-bold">No messages yet</p>
                                        <p className="text-xs">Ask the courier about your delivery!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.senderRole === 'Customer';
                                        return (
                                            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[75%] p-3 rounded-2xl text-sm font-medium shadow-sm ${isMe ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'}`}>
                                                    {msg.message}
                                                </div>
                                                <span className="text-[8px] text-gray-400 mt-1 uppercase tracking-widest font-black">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                                    className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:outline-none dark:text-white"
                                />
                                <button
                                    onClick={sendChatMessage}
                                    disabled={!newMessage.trim()}
                                    className="bg-primary text-white p-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
                                >➔</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrderTracking;
