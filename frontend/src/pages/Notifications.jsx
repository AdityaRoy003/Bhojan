import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'react-toastify';

const Notifications = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useSelector((state) => state.user);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/notifications/my?limit=100');
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchNotifications();
    }, [isAuthenticated, navigate]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { data } = await api.put('/notifications/read/all');
            if (data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                toast.success("All notifications marked as read");
            }
        } catch (error) {
            console.error("Failed to mark all as read:", error);
            toast.error("Failed to mark all as read");
        }
    };

    const deleteNotification = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            const deleted = notifications.find(n => n._id === id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (deleted && !deleted.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            toast.success("Notification deleted");
        } catch (error) {
            console.error("Failed to delete notification:", error);
            toast.error("Failed to delete notification");
        }
    };

    const clearAllNotifications = async () => {
        if (!window.confirm("Are you sure you want to clear all notifications? This cannot be undone.")) {
            return;
        }
        try {
            await api.delete('/notifications/clear/all');
            setNotifications([]);
            setUnreadCount(0);
            toast.success("All notifications cleared");
        } catch (error) {
            console.error("Failed to clear notifications:", error);
            toast.error("Failed to clear notifications");
        }
    };

    const handleNotificationClick = async (n) => {
        if (!n.isRead) {
            await markAsRead(n._id);
        }
        
        // Redirect logic based on type and user role
        if (n.type === 'order') {
            if (user?.role === 'Owner') {
                navigate('/owner/dashboard');
            } else if (user?.role === 'Delivery') {
                navigate('/delivery/dashboard');
            } else {
                navigate('/profile?tab=orders');
            }
        } else if (n.type === 'delivery') {
            navigate('/delivery/dashboard');
        } else if (n.type === 'payments') {
            navigate('/profile?tab=payments');
        } else if (n.type === 'quests') {
            navigate('/profile?tab=quests');
        } else if (n.type === 'wishlist') {
            navigate('/profile?tab=wishlist');
        } else if (n.type === 'system') {
            navigate('/profile?tab=settings');
        } else {
            navigate('/profile');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order':
                return '📦';
            case 'delivery':
                return '🛵';
            case 'promotion':
                return '🎉';
            case 'system':
                return '📢';
            case 'social':
                return '👥';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'order':
                return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400';
            case 'delivery':
                return 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400';
            case 'promotion':
                return 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400';
            case 'system':
                return 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400';
            default:
                return 'bg-red-50 text-primary dark:bg-red-950/30 dark:text-red-400';
        }
    };

    // Format timestamps nicely
    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
                <div className="flex flex-col items-center space-y-4">
                    <svg className="animate-spin h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 animate-pulse">Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-950 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/40 dark:border-gray-800/50 shadow-xl">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400"
                            title="Go Back"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                        </button>
                        <div className="text-left">
                            <h1 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent uppercase tracking-wider">
                                Notification Center
                            </h1>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                {unreadCount > 0 ? `You have ${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                            </p>
                        </div>
                    </div>

                    {notifications.length > 0 && (
                        <div className="flex items-center space-x-3 self-end md:self-auto">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="px-4 py-2 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-transparent transition-all shadow-sm"
                                >
                                    ✓ Mark All Read
                                </button>
                            )}
                            <button
                                onClick={clearAllNotifications}
                                className="px-4 py-2 bg-red-50 dark:bg-red-950/20 text-xs font-bold text-primary dark:text-red-400 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm shadow-red-100 dark:shadow-none"
                            >
                                🗑 Clear All
                            </button>
                        </div>
                    )}
                </div>

                {/* Notifications List Container */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-gray-800/50 shadow-2xl overflow-hidden p-6">
                    <AnimatePresence mode="popLayout">
                        {notifications.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center justify-center py-16 text-center space-y-6"
                            >
                                <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-red-50 dark:bg-red-950/30 text-primary text-5xl">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-10 animate-ping"></span>
                                    🔔
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-wider">No Notifications Yet</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                                        We'll let you know when there's an update on your order, promos, or activity.
                                    </p>
                                </div>
                                <Link
                                    to="/"
                                    className="bg-primary text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-full hover:bg-red-600 shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all"
                                >
                                    Return to Feed
                                </Link>
                            </motion.div>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map((n) => (
                                    <motion.div
                                        key={n._id}
                                        layoutId={n._id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex gap-4 text-left ${
                                            !n.isRead
                                                ? 'bg-gradient-to-r from-red-50/40 to-orange-50/40 dark:from-red-950/10 dark:to-orange-950/10 border-red-100 dark:border-red-900/20 shadow-sm'
                                                : 'bg-gray-50/30 dark:bg-gray-950/20 hover:bg-gray-50/80 dark:hover:bg-gray-950/50 border-gray-100 dark:border-gray-800/80'
                                        }`}
                                    >
                                        {/* Left Status Indicator dot */}
                                        {!n.isRead && (
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shadow-lg shadow-red-500/50 animate-pulse"></span>
                                        )}

                                        {/* Icon container */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl font-bold shadow-sm ${getNotificationColor(n.type)}`}>
                                            {getNotificationIcon(n.type)}
                                        </div>

                                        {/* Message details */}
                                        <div className="flex-1 pr-8 min-w-0">
                                            <h4 className={`text-sm tracking-tight ${!n.isRead ? 'font-black text-gray-900 dark:text-white' : 'font-bold text-gray-700 dark:text-gray-300'}`}>
                                                {n.title || 'Alert notification'}
                                            </h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                                {n.message}
                                            </p>
                                            <span className="inline-block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2">
                                                {formatTime(n.createdAt)}
                                            </span>
                                        </div>

                                        {/* Individual Delete Button */}
                                        <button
                                            onClick={(e) => deleteNotification(e, n._id)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete alert"
                                        >
                                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
