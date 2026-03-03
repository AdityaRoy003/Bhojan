import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/userSlice';
import { detectLocation } from '../redux/locationSlice';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import socket from '../utils/socket';

const Navbar = () => {
    const { user, isAuthenticated } = useSelector((state) => state.user);
    const cartItems = useSelector((state) => state.cart.cartItems);
    const { city, state: locationState, loading: locationLoading } = useSelector((state) => state.location);
    const dispatch = useDispatch();
    const location = useLocation();
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileRef = useRef(null);
    const notificationRef = useRef(null);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(!darkMode);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!isAuthenticated) return;
        try {
            const { data } = await api.get('/notifications/my');
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications");
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [isAuthenticated, showNotifications]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark read");
        }
    };

    // Socket listeners for real-time notifications
    useEffect(() => {
        if (!isAuthenticated) return;

        const handleNewNotification = (data) => {
            fetchNotifications(); // Refresh list to get the new DB entry

            // Audio Beep Alert
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainParams = context.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, context.currentTime); // 800Hz beep
            gainParams.gain.setValueAtTime(0.5, context.currentTime);
            oscillator.connect(gainParams);
            gainParams.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.3); // 0.3 seconds duration

            // Browser Push Notification
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(data.title || "New Alert!", {
                    body: data.message,
                    icon: '/favicon.ico'
                });
            } else if ("Notification" in window && Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        };

        if (socket) {
            socket.on('order_notification', handleNewNotification);

            if (user?.role === 'Delivery') {
                socket.on('delivery_alert', handleNewNotification);
            }
        }

        return () => {
            if (socket) {
                socket.off('order_notification', handleNewNotification);
                if (user?.role === 'Delivery') {
                    socket.off('delivery_alert', handleNewNotification);
                }
            }
        };
    }, [isAuthenticated, user]);

    const handleLogout = () => {
        localStorage.removeItem('isShoppingMode');
        dispatch(logoutUser());
    };

    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Close menus on state change or click away
    useEffect(() => {
        setShowProfileMenu(false);
        setShowNotifications(false);
        setShowMobileMenu(false);
    }, [isAuthenticated, user?._id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuGroups = [
        {
            title: 'My Account',
            items: [
                { to: '/profile', label: 'Profile Settings', icon: <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />, show: isAuthenticated },
                { to: '/notifications', label: 'Notifications', icon: <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />, show: isAuthenticated },
            ]
        },
        {
            title: 'Bhojan Hub',
            items: [
                { to: '/', label: 'Home Feed', icon: <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />, show: true },
                { to: '/leaderboard', label: 'Leaderboard', icon: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-2v4h-2v-4h-2v-2h6v2z" />, show: true },
                { to: '/prime-membership', label: 'Prime Membership', icon: <path d="M11.99 2.02c-5.5 0-9.98 4.47-9.98 9.97s4.48 9.97 9.98 9.97 9.98-4.47 9.98-9.97-4.48-9.97-9.98-9.97zm3.16 11.66l-.91 3.19-2.25-1.18-2.25 1.18.91-3.19-2.58-1.9 3.29-.11 1.05-3.32 1.05 3.32 3.29.11-2.58 1.9z" />, show: isAuthenticated && user?.role === 'Customer' },
                { to: '/owner/dashboard', label: 'Owner Hub', icon: <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />, show: isAuthenticated && user?.role === 'Owner' },
                { to: '/delivery/dashboard', label: 'Delivery Hub', icon: <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />, show: isAuthenticated && user?.role === 'Delivery' },
            ]
        }
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 120 }}
            className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 transition-all duration-300"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-2 md:gap-6">
                        <Link to="/" className="text-xl md:text-2xl font-bold text-primary flex items-center gap-1 md:gap-2">
                            <motion.span
                                whileHover={{ rotate: 20 }}
                                className="text-xl md:text-3xl"
                            >🥣</motion.span>
                            <span className="text-lg md:text-2xl tracking-tighter">Bhojan</span>
                        </Link>

                        {/* Desktop Location Selector */}
                        {(!isAuthenticated || user?.role === 'Customer') && (
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="hidden lg:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-sm"
                                onClick={() => dispatch(detectLocation())}
                            >
                                <span className="text-primary">📍</span>
                                {locationLoading ? (
                                    <span className="text-xs text-gray-600 dark:text-gray-400 animate-pulse">Detecting...</span>
                                ) : city ? (
                                    <span className="text-xs text-gray-800 dark:text-gray-200 font-medium">{city}, {locationState?.split(' ')[0]}</span>
                                ) : (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Select Location</span>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Right side - Icons & Hamburger */}
                    <div className="flex items-center space-x-1 md:space-x-6">
                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setShowMobileMenu(true)}
                            className="md:hidden p-2 text-gray-500 dark:text-gray-400 focus:outline-none"
                        >
                            <svg className="w-6 h-6 outline-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                            {(!isAuthenticated || user?.role === 'Customer') && (
                                <>
                                    <NavLink to="/home">🏠 Home</NavLink>
                                    <NavLink to="/leaderboard">🏆 Leaders</NavLink>
                                    {isAuthenticated && (
                                        <Link
                                            to="/prime-membership"
                                            className="relative group text-amber-600 hover:text-amber-700 px-1 py-1 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full px-3 shadow-sm"
                                        >
                                            👑 Prime
                                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full"></span>
                                        </Link>
                                    )}
                                </>
                            )}
                            {isAuthenticated && user?.role !== 'Customer' && (
                                <NavLink to="/profile">🏠 Hub</NavLink>
                            )}
                        </div>

                        <Link to="/cart" className="relative text-gray-700 dark:text-gray-200 hover:text-primary transition-colors py-2 px-1 hidden md:block">
                            <span className="text-xl md:text-2xl">🛒</span>
                            {cartItems.length > 0 && (
                                <span className="absolute top-1 -right-1 md:-right-2 bg-primary text-white text-[8px] md:text-[10px] font-black w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex items-center justify-center shadow-sm">
                                    {cartItems.length}
                                </span>
                            )}
                        </Link>

                        {/* Mini Cart Preview - Desktop only */}
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                whileHover={{ opacity: 1, y: 0, scale: 1 }}
                                className="hidden md:block absolute right-0 top-full pt-2 w-72 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-all z-50"
                            >
                                <div className="bg-white dark:bg-gray-800 rounded-[24px] shadow-2xl border border-gray-100 dark:border-gray-700 p-4 overflow-hidden">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cart Preview</h4>
                                        <Link to="/cart" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All</Link>
                                    </div>

                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {cartItems.length > 0 ? (
                                            cartItems.slice(0, 3).map(item => (
                                                <div key={item._id} className="flex gap-3">
                                                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-black text-gray-900 dark:text-white truncate">{item.name}</p>
                                                        <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{item.quantity} x ₹{item.price}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[10px] text-gray-400 font-bold py-4 text-center">Your cart is empty</p>
                                        )}
                                        {cartItems.length > 3 && (
                                            <p className="text-[8px] font-black text-center text-gray-300 uppercase tracking-widest">+{cartItems.length - 3} more items</p>
                                        )}
                                    </div>

                                    {cartItems.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                                                <span className="text-sm font-black text-gray-900 dark:text-white">₹{cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0).toFixed(2)}</span>
                                            </div>
                                            <Link
                                                to="/checkout"
                                                className="block w-full bg-primary text-white text-center py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100 hover:bg-red-700 transition-all"
                                            >
                                                Checkout Now
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>


                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleDarkMode}
                            className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full shadow-sm text-lg md:text-xl hidden md:block"
                        >
                            {darkMode ? '🌙' : '☀️'}
                        </motion.button>

                        {/* Notifications */}
                        {isAuthenticated && (
                            <div className="relative hidden md:block" ref={notificationRef}>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                                    className="relative bg-gray-100 dark:bg-gray-800 p-2 rounded-full shadow-sm"
                                >
                                    <span className="text-lg md:text-xl">🔔</span>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                                    )}
                                </motion.button>

                                <AnimatePresence>
                                    {showNotifications && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-2 w-72 md:w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
                                        >
                                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                                <h4 className="font-black text-sm uppercase tracking-widest text-gray-900 dark:text-white">Notifications</h4>
                                                <button className="text-[10px] font-bold text-primary uppercase" onClick={() => setShowNotifications(false)}>Close</button>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <p className="text-center text-xs text-gray-400 py-4">No new notifications</p>
                                                ) : (
                                                    notifications.map(n => (
                                                        <div key={n._id} onClick={() => markAsRead(n._id)} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex gap-3 border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                                            <span className="text-lg">{n.type === 'order' ? '📦' : n.type === 'promotion' ? '🎉' : '📢'}</span>
                                                            <div>
                                                                <p className={`text-xs ${!n.isRead ? 'font-black text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-400'}`}>{n.message}</p>
                                                                <p className="text-[10px] text-gray-400 font-medium uppercase mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 text-center">
                                                <Link to="/notifications" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">View All</Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {isAuthenticated ? (
                            <>
                                {/* Profile Dropdown */}
                                <div className="relative" ref={profileRef}>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                                        className="flex items-center gap-1.5 md:gap-2 group"
                                    >
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 p-[1.5px] md:p-[2px]">
                                            <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden text-xs md:text-sm">
                                                {user?.avatar ? (
                                                    <img src={user.avatar} alt={user.fullname} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-amber-600 font-black">{user?.fullname?.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="hidden lg:block text-left">
                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate max-w-[80px]">Hi, {user?.fullname?.split(' ')[0]}</p>
                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{user?.role}</p>
                                        </div>
                                        <span className="text-gray-400 text-[10px] md:text-xs">▼</span>
                                    </motion.button>

                                    <AnimatePresence>
                                        {showProfileMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
                                            >
                                                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                                                    <p className="font-black text-sm text-gray-900 dark:text-white truncate">{user?.fullname}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                                                </div>
                                                <div className="py-2">
                                                    <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="block px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2">
                                                        <span>👤</span> My Profile
                                                    </Link>
                                                    {user?.role === 'Owner' && (
                                                        <>
                                                            <Link to="/owner/dashboard" onClick={() => setShowProfileMenu(false)} className="block px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2">
                                                                <span>🏢</span> Dashboard
                                                            </Link>
                                                            <Link to="/owner/virtual-brands" onClick={() => setShowProfileMenu(false)} className="block px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2">
                                                                <span>🏪</span> Virtual Brands
                                                            </Link>
                                                        </>
                                                    )}
                                                    {user?.role === 'Delivery' && (
                                                        <Link to="/delivery/dashboard" onClick={() => setShowProfileMenu(false)} className="block px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2">
                                                            <span>🚚</span> Dashboard
                                                        </Link>
                                                    )}
                                                    <Link to="/profile?tab=settings" onClick={() => setShowProfileMenu(false)} className="block px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2">
                                                        <span>⚙️</span> Settings
                                                    </Link>
                                                    <Link to="/profile?tab=support" onClick={() => setShowProfileMenu(false)} className="block px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2">
                                                        <span>❓</span> Help & Support
                                                    </Link>
                                                </div>
                                                <div className="border-t border-gray-100 dark:border-gray-800 p-2">
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full text-left px-4 py-2 text-xs font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition flex items-center gap-2"
                                                    >
                                                        <span>🔴</span> Logout
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-2 md:space-x-4">
                                <Link to="/login" className="hidden sm:block text-[10px] font-black uppercase text-gray-700 dark:text-gray-300 hover:text-primary transition-colors">Login</Link>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link to="/signup" className="text-white bg-primary hover:bg-red-600 px-3 md:px-5 py-2 md:py-2.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100 dark:shadow-none transition-all">
                                        Join <span className="hidden xs:inline">Now</span> ✨
                                    </Link>
                                </motion.div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Sub-Header: Location Selector (Swiggy Style) */}
            {location.pathname !== '/profile' && (
                <div className="md:hidden border-t border-gray-50 dark:border-gray-800/50 px-4 py-3 flex items-center justify-between bg-white dark:bg-gray-900 transition-colors">
                    <div
                        className="flex items-center gap-2 overflow-hidden flex-1 cursor-pointer"
                        onClick={() => dispatch(detectLocation())}
                    >
                        <span className="text-primary text-sm shrink-0">📍</span>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Delivering to</span>
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate leading-tight mt-0.5">
                                {locationLoading ? 'Detecting Location...' : city ? `${city}, ${locationState?.split(' ')[0]}` : 'Select your location'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                        <Link to="/search" className="p-2 text-gray-500 dark:text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </Link>
                        {isAuthenticated && (
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 p-0.5"
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                            >
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-[10px] font-black text-primary">{user?.fullname?.charAt(0).toUpperCase()}</span>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {showMobileMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileMenu(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                            className="fixed top-0 left-0 bottom-0 w-[300px] bg-white dark:bg-gray-900 z-50 md:hidden shadow-2xl flex flex-col"
                        >
                            {/* Drawer Header - User Info */}
                            <div className="p-6 pt-10 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800">
                                {isAuthenticated ? (
                                    <Link to="/profile" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center p-1 border-2 border-primary/20">
                                            {user?.avatar ? (
                                                <img src={user.avatar} alt={user.fullname} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <span className="text-xl font-black text-primary">{user?.fullname?.charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-gray-900 dark:text-white truncate text-lg leading-tight">{user?.fullname}</p>
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">View Profile →</p>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-xl font-black text-gray-900 dark:text-white">Welcome!</p>
                                        <Link
                                            to="/login"
                                            onClick={() => setShowMobileMenu(false)}
                                            className="inline-block bg-primary text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100 dark:shadow-none"
                                        >
                                            Login / Signup
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Drawer Body - Grouped Items */}
                            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-8 custom-scrollbar">
                                {menuGroups.map((group, gIdx) => {
                                    const visibleItems = group.items.filter(i => i.show);
                                    if (visibleItems.length === 0) return null;

                                    return (
                                        <div key={gIdx} className="space-y-1">
                                            <h5 className="px-4 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">{group.title}</h5>
                                            {visibleItems.map((item, iIdx) => (
                                                <Link
                                                    key={iIdx}
                                                    to={item.to}
                                                    onClick={() => setShowMobileMenu(false)}
                                                    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary dark:hover:text-white transition-all group"
                                                >
                                                    <svg className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity fill-current" viewBox="0 0 24 24">
                                                        {item.icon}
                                                    </svg>
                                                    <span className="text-sm font-bold tracking-tight">{item.label}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    );
                                })}

                                {/* Preferences Section */}
                                <div className="space-y-1">
                                    <h5 className="px-4 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">Preferences</h5>
                                    <button
                                        onClick={toggleDarkMode}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg opacity-40 group-hover:opacity-100 transition-opacity">{darkMode ? '☀️' : '🌙'}</span>
                                            <span className="text-sm font-bold tracking-tight">{darkMode ? 'Light' : 'Dark'} Mode</span>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${darkMode ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                                {isAuthenticated && (
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 text-red-500 font-bold text-sm px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all w-full"
                                    >
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                            <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                                        </svg>
                                        Logout Account
                                    </button>
                                )}
                                <p className="text-[8px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest text-center mt-6 italic">Bhojan v3.0 • Premium Taste</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

const NavLink = ({ to, children, className }) => (
    <Link to={to} className={`relative group text-gray-700 dark:text-gray-300 hover:text-primary px-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${className}`}>
        {children}
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full"></span>
    </Link>
);

export default Navbar;
