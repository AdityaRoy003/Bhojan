import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import socket from '../utils/socket';

const ACTIVE_STATUSES = ['Placed', 'Accepted', 'Preparing', 'Ready', 'OutForDelivery'];

const STATUS_DETAILS = {
    Placed: {
        label: 'Order Confirmed',
        icon: '🧾',
        color: 'from-amber-500 to-orange-500',
        textColor: 'text-amber-500',
        step: 1
    },
    Accepted: {
        label: 'Order Accepted',
        icon: '👨‍🍳',
        color: 'from-orange-500 to-amber-600',
        textColor: 'text-orange-500',
        step: 1
    },
    Preparing: {
        label: 'Kitchen is Cooking',
        icon: '🍳',
        color: 'from-orange-500 to-rose-500',
        textColor: 'text-orange-500',
        step: 2
    },
    Ready: {
        label: 'Order Ready for Pickup',
        icon: '📦',
        color: 'from-emerald-500 to-teal-600',
        textColor: 'text-emerald-500',
        step: 3
    },
    OutForDelivery: {
        label: 'Rider is on the Way!',
        icon: '🛵',
        color: 'from-emerald-500 to-green-600',
        textColor: 'text-emerald-500',
        step: 3
    }
};

const GlobalActiveOrderBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useSelector((state) => state.user);
    const [activeOrder, setActiveOrder] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);

    const userRoleLower = (user?.role || '').toLowerCase();
    const isCustomer = !['admin', 'owner', 'delivery'].includes(userRoleLower);

    // Hide on tracking page, checkout, or auth pages
    const isTrackingPage = location.pathname.startsWith('/track/');
    const isHiddenRoute = ['/', '/login', '/signup', '/checkout'].includes(location.pathname);

    const fetchActiveOrder = useCallback(async () => {
        if (!isAuthenticated || !isCustomer) {
            setActiveOrder(null);
            return;
        }
        try {
            const { data } = await api.get('/order/active');
            if (data.success && data.order && ACTIVE_STATUSES.includes(data.order.orderStatus)) {
                setActiveOrder(data.order);
            } else {
                setActiveOrder(null);
            }
        } catch (_) {
            // Silently ignore background polling errors
        }
    }, [isAuthenticated, isCustomer]);

    useEffect(() => {
        fetchActiveOrder();
        // Background check every 18 seconds
        const interval = setInterval(fetchActiveOrder, 18000);
        return () => clearInterval(interval);
    }, [fetchActiveOrder]);

    // Socket listener for real-time status updates
    useEffect(() => {
        if (!socket) return;
        const handleStatusUpdate = (data) => {
            if (data && data.orderId) {
                fetchActiveOrder();
            }
        };
        socket.on('orderStatusUpdated', handleStatusUpdate);
        socket.on('orderAssigned', handleStatusUpdate);
        return () => {
            socket.off('orderStatusUpdated', handleStatusUpdate);
            socket.off('orderAssigned', handleStatusUpdate);
        };
    }, [fetchActiveOrder]);

    if (!activeOrder || isTrackingPage || isHiddenRoute || !isCustomer) {
        return null;
    }

    const statusConfig = STATUS_DETAILS[activeOrder.orderStatus] || STATUS_DETAILS.Placed;
    const shopName = activeOrder.shop?.name || 'Your Order';

    const handleOpenTracking = () => {
        if (window.navigator?.vibrate) {
            try { window.navigator.vibrate(10); } catch (_) {}
        }
        navigate(`/track/${activeOrder._id}`);
    };

    return (
        <aside aria-label="Active order tracker">
            <AnimatePresence>
                {isMinimized ? (
                    // Minimized Floating Pill
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsMinimized(false)}
                        className="fixed bottom-20 md:bottom-8 right-4 z-[95] bg-gray-900/90 dark:bg-black/90 text-white p-3 rounded-full shadow-2xl border border-white/20 backdrop-blur-md cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                        title="Click to view live order progress"
                    >
                        <span className="text-xl animate-bounce">{statusConfig.icon}</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    </motion.div>
                ) : (
                    // Full Dynamic Telemetry Island Bar
                    <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 240 }}
                        className="fixed bottom-20 md:bottom-8 left-3 right-3 sm:left-6 sm:right-6 md:left-1/2 md:-translate-x-1/2 md:max-w-lg z-[95] pointer-events-auto"
                    >
                        <div className="bg-gray-950/95 dark:bg-black/95 text-white p-3 sm:p-3.5 rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.45)] border border-white/15 backdrop-blur-xl flex flex-col gap-2">
                            {/* Top Row: Icon, Info, Live Badge, Tracking Action */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={handleOpenTracking}>
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${statusConfig.color} flex items-center justify-center text-xl shrink-0 shadow-md`}>
                                        {statusConfig.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black text-xs sm:text-sm text-white truncate">{shopName}</h4>
                                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                Live
                                            </span>
                                        </div>
                                        <p className="text-[11px] font-bold text-gray-300 truncate mt-0.5">
                                            {statusConfig.label}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleOpenTracking}
                                        className="bg-primary hover:bg-orange-600 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                                    >
                                        <span>Track</span>
                                        <span>➔</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsMinimized(true)}
                                        className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                                        title="Minimize"
                                        aria-label="Minimize order tracker"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Bottom Row: 4-Segment Progress Track */}
                            <div className="grid grid-cols-4 gap-1.5 pt-1">
                                {[
                                    { step: 1, title: 'Confirmed' },
                                    { step: 2, title: 'Kitchen' },
                                    { step: 3, title: 'On Way' },
                                    { step: 4, title: 'Delivered' }
                                ].map((s) => {
                                    const isReached = statusConfig.step >= s.step;
                                    const isCurrent = statusConfig.step === s.step;
                                    return (
                                        <div key={s.step} className="flex flex-col gap-0.5">
                                            <div className={`h-1.5 rounded-full transition-all duration-500 ${
                                                isCurrent
                                                    ? 'bg-orange-500 animate-pulse'
                                                    : isReached
                                                        ? 'bg-emerald-500'
                                                        : 'bg-white/15'
                                            }`} />
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest text-center truncate">
                                                {s.title}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </aside>
    );
};

export default GlobalActiveOrderBar;
