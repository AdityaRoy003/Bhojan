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
    Ready:          { label: 'Food Ready! Courier Assigned', icon: '🍲', color: '#3b82f6', bg: 'bg-blue-100 text-blue-700' },
    OutForDelivery: { label: 'Rider is on the way!',icon: '🏍️', color: '#f97316', bg: 'bg-orange-100 text-orange-700' },
    Delivered:      { label: 'Delivered! Enjoy 🎉', icon: '🎊', color: '#10b981', bg: 'bg-green-100 text-green-700' },
    Cancelled:      { label: 'Order Cancelled',     icon: '✕',  color: '#ef4444', bg: 'bg-red-100 text-red-700' },
};

const PRESET_LABELS = {
    leave_at_door: '🚪 Leave at door',
    dont_ring_bell: "🔕 Don't ring bell",
    call_at_gate: '📞 Call at gate',
    hand_to_security: '👮 Hand to security',
    contactless: '🚫 Contactless drop-off'
};

const QUICK_REPLIES = [
    '🚪 Please leave at the door',
    '🔕 Please do not ring bell',
    '📞 Call me when at gate',
    '🏃 I am coming down right now',
    '🙏 Thank you so much!'
];

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

                // Seed messages from order if not already loaded
                if (data.order?.chatMessages && data.order.chatMessages.length > 0) {
                    setMessages(prev => {
                        const existingTimestamps = new Set(prev.map(m => new Date(m.timestamp).getTime()));
                        const merged = [...prev];
                        for (const msg of data.order.chatMessages) {
                            if (!existingTimestamps.has(new Date(msg.timestamp).getTime())) {
                                merged.push(msg);
                            }
                        }
                        return merged;
                    });
                }

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

            if (data.eta) setEta(data.eta);
        };

        const handleStatusUpdate = (data) => {
            if (data.orderId === orderId) {
                setOrder(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        orderStatus: data.status || data.orderStatus || prev.orderStatus,
                        deliveryPartner: data.deliveryPartner || prev.deliveryPartner
                    };
                });
                fetchTrackingDetails();
            }
        };

        socket.on('rider_location', handleRiderLocation);
        socket.on('status_update', handleStatusUpdate);

        socket.on('location_update', (data) => {
            if (data.lat && data.orderId === orderId) {
                setRiderPosition([data.lat, data.lng]);
                setLiveMode(true);
            }
        });

        return () => {
            socket.off('rider_location', handleRiderLocation);
            socket.off('status_update', handleStatusUpdate);
            socket.off('location_update');
        };
    }, [orderId]);

    // Detect stale signal (no ping for > 30s)
    useEffect(() => {
        if (!lastPing) return;
        const timeout = setTimeout(() => setLiveMode(false), 30000);
        return () => clearTimeout(timeout);
    }, [lastPing]);

    // ── Socket: courier chat ───────────────────────────────────────────────
    useEffect(() => {
        if (!orderId) return;

        socket.emit('join_chat', orderId);

        const handleChatMessage = (msg) => {
            setMessages(prev => [...prev, msg]);
        };
        socket.on('chat_message', handleChatMessage);

        return () => { socket.off('chat_message', handleChatMessage); };
    }, [orderId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, chatOpen]);

    const sendChatMessage = (text) => {
        const msgToSend = (text || newMessage).trim();
        if (!msgToSend || !orderId) return;
        socket.emit('send_chat_message', {
            orderId,
            message: msgToSend,
            senderName: user?.fullname || 'Customer',
            senderRole: 'Customer',
            timestamp: new Date().toISOString()
        });
        if (!text) setNewMessage('');
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
            {/* ── Top Bar ─────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                    >
                        ←
                    </button>
                    <div className="text-center">
                        <h1 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                            Order #{order._id.slice(-6).toUpperCase()}
                        </h1>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                            {order.shop?.name || 'Restaurant'}
                        </p>
                    </div>
                    {/* View Switcher */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setViewMode('map')}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${viewMode === 'map' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}
                        >
                            🗺️
                        </button>
                        <button
                            onClick={() => setViewMode('3d')}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${viewMode === '3d' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}
                        >
                            🎮 3D
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Visual Canvas / Map ─────────────────────────────────────── */}
            <div className="relative w-full" style={{ height: '360px' }}>
                {viewMode === 'map' ? (
                    <LiveTrackingMap
                        mode="customer"
                        riderPosition={riderPosition}
                        restaurantCoords={restaurantCoords}
                        deliveryCoords={deliveryCoords}
                        riderHeading={riderHeading}
                        riderName={order.deliveryPartner?.fullname || 'Courier'}
                        shopName={order.shop?.name}
                        deliveryAddress={order.deliveryAddress}
                        liveMode={liveMode}
                        height="100%"
                    />
                ) : (
                    <ThreeDDeliveryCanvas orderStatus={order.orderStatus} />
                )}

                {/* Floating Status Pill */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-lg backdrop-blur-md ${statusCfg.bg}`}>
                        <span>{statusCfg.icon}</span>
                        <span>{statusCfg.label}</span>
                    </span>
                    {liveMode && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-lg animate-pulse">
                            ● Live GPS
                        </span>
                    )}
                </div>

                {/* ETA badge on canvas */}
                {eta && isOutForDelivery && (
                    <div className="absolute bottom-4 right-4 z-10 bg-gray-900/90 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-gray-700">
                        <p className="text-[9px] uppercase tracking-widest text-orange-400 font-black">Estimated Arrival</p>
                        <p className="text-xl font-black">{eta.minutes} mins</p>
                        {eta.distanceKm && (
                            <p className="text-[10px] text-gray-400">{eta.distanceKm} km away</p>
                        )}
                    </div>
                )}
            </div>

            {/* ── Main Info Content ────────────────────────────────────────── */}
            <div className="max-w-2xl mx-auto px-4 mt-6 space-y-4">

                {/* ── Scheduled Delivery Alert (if scheduled) ───────────── */}
                {order.isScheduled && order.scheduledSlot && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3">
                        <span className="text-2xl">📅</span>
                        <div>
                            <p className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">Scheduled Delivery</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">
                                {order.scheduledSlot.date} • {order.scheduledSlot.time}
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Proof of Delivery (if Delivered & verified) ─────────── */}
                {isDelivered && order.proofOfDelivery?.photoUrl && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500/30 rounded-3xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📸</span>
                                <h3 className="font-black text-sm text-emerald-900 dark:text-emerald-100">Drop-off Proof of Delivery</h3>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                                Verified Drop-off ✅
                            </span>
                        </div>
                        <img
                            src={order.proofOfDelivery.photoUrl}
                            alt="Drop-off Proof"
                            className="w-full h-48 object-cover rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-sm"
                        />
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-2 font-bold">
                            Photo taken by {order.deliveryPartner?.fullname || 'your courier'} at your doorstep.
                        </p>
                    </div>
                )}

                {/* ── Delivery Instructions & Preset ───────────────────────── */}
                {(order.deliveryPreset !== 'none' || order.instructions || order.optOutCutlery) && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery Instructions</p>
                        <div className="flex flex-wrap gap-2">
                            {order.deliveryPreset && order.deliveryPreset !== 'none' && (
                                <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-bold border border-orange-200 dark:border-orange-800">
                                    {PRESET_LABELS[order.deliveryPreset] || order.deliveryPreset}
                                </span>
                            )}
                            {order.optOutCutlery && (
                                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                                    🌿 No Plastic Cutlery
                                </span>
                            )}
                        </div>
                        {order.instructions && (
                            <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 italic">
                                "{order.instructions}"
                            </p>
                        )}
                    </div>
                )}

                {/* ── Status Timeline ─────────────────────────────────────── */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                    <StatusTimeline
                        currentStatus={order.orderStatus}
                        statusHistory={order.statusHistory || []}
                    />
                </div>

                {/* ── Courier Card & Live Chat Button ───────────────────────── */}
                {order.deliveryPartner && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
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
                                        <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mt-0.5">● Location sharing active</p>
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
                                    className="relative w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 transition-colors"
                                >
                                    💬
                                    {messages.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                                            {messages.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Order Summary ───────────────────────────────────────── */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                    <h3 className="font-black text-gray-900 dark:text-white mb-4">Order Summary</h3>
                    <div className="space-y-3">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-sm">
                                <div>
                                    <p className="text-gray-800 dark:text-gray-200 font-bold">
                                        {item.quantity}× {item.name}
                                    </p>
                                    {item.selectedVariant && (
                                        <p className="text-[10px] text-orange-600 font-semibold">{item.selectedVariant.option}</p>
                                    )}
                                    {item.selectedAddOns?.length > 0 && (
                                        <p className="text-[9px] text-emerald-600">+{item.selectedAddOns.map(a => a.name).join(', ')}</p>
                                    )}
                                </div>
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
                            {order.tipAmount > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600 font-bold">
                                    <span>Rider tip</span>
                                    <span>₹{order.tipAmount}</span>
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

            {/* ── Courier Live Chat Drawer ─────────────────────────────────── */}
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
                            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white dark:bg-gray-900 shadow-2xl z-[60] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                                        {order.deliveryPartner?.fullname?.[0]?.toUpperCase() || '🏍️'}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-sm">{order.deliveryPartner?.fullname || 'Courier'}</h3>
                                        <p className="text-[9px] uppercase tracking-wider opacity-85">Live Courier Chat</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setChatOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                >✕</button>
                            </div>

                            {/* Pinned Delivery Note in Chat */}
                            {(order.deliveryPreset !== 'none' || order.instructions) && (
                                <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 px-4 py-2.5 flex items-center gap-2">
                                    <span className="text-sm">📌</span>
                                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-bold truncate">
                                        Note: {PRESET_LABELS[order.deliveryPreset] || ''} {order.instructions ? `• ${order.instructions}` : ''}
                                    </p>
                                </div>
                            )}

                            {/* Messages Body */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                                        <span className="text-4xl mb-2">💬</span>
                                        <p className="text-sm font-bold">No messages yet</p>
                                        <p className="text-xs">Ask the courier about your delivery or tap quick presets below!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.senderRole === 'Customer';
                                        return (
                                            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[78%] p-3.5 rounded-2xl text-xs font-semibold shadow-sm ${
                                                    isMe
                                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tr-none'
                                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
                                                }`}>
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

                            {/* Quick Presets Carousel Above Input */}
                            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex gap-2 overflow-x-auto no-scrollbar">
                                {QUICK_REPLIES.map((reply, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendChatMessage(reply)}
                                        className="shrink-0 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap active:scale-95"
                                    >
                                        {reply}
                                    </button>
                                ))}
                            </div>

                            {/* Input Bar */}
                            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type message to courier..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-xs focus:outline-none dark:text-white"
                                />
                                <button
                                    onClick={() => sendChatMessage()}
                                    disabled={!newMessage.trim()}
                                    className="bg-primary text-white p-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
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
