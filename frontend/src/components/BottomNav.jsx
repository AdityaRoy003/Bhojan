import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { preloadRoute } from '../utils/routePreloader';

// Pages where the bottom nav should NOT appear
const HIDDEN_ON_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];

const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.user);
    const cartItems = useSelector((state) => state.cart.cartItems);

    // Hide on landing/auth pages
    if (HIDDEN_ON_ROUTES.includes(location.pathname)) return null;

    const roleLower = (user?.role || '').toLowerCase();
    const isAdmin = roleLower === 'admin';
    const isOwner = roleLower === 'owner';
    const isDelivery = roleLower === 'delivery';
    const isCustomer = !isAdmin && !isOwner && !isDelivery;

    // Calculate cart totals
    const totalCartItems = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const totalCartAmount = cartItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
    const showFloatingCart = isCustomer && totalCartItems > 0 && !['/cart', '/checkout'].includes(location.pathname);

    // --- ADMIN bottom nav ---
    const adminNavItems = [
        { label: 'Overview', icon: '🌐', to: '/profile?tab=admin-overview' },
        { label: 'Users', icon: '👥', to: '/profile?tab=admin-users' },
        { label: 'Shops', icon: '🏪', to: '/profile?tab=admin-shops' },
        { label: 'Orders', icon: '🧾', to: '/profile?tab=admin-orders' },
        { label: 'Fleet', icon: '🚚', to: '/profile?tab=admin-delivery' },
    ];

    // --- OWNER bottom nav ---
    const ownerNavItems = [
        { label: 'Dashboard', icon: '📊', to: '/owner/dashboard' },
        { label: 'My Shop', icon: '🏪', to: '/profile?tab=owner-shops' },
        { label: 'Menu', icon: '🍳', to: '/profile?tab=owner-menu' },
        { label: 'Orders', icon: '🧾', to: '/profile?tab=owner-overview' },
        { label: 'Account', icon: '👤', to: '/profile' },
    ];

    // --- DELIVERY bottom nav ---
    const deliveryNavItems = [
        { label: 'Available', icon: '🟢', to: '/profile?tab=delivery-available' },
        { label: 'My Runs', icon: '📦', to: '/profile?tab=delivery-active' },
        { label: 'Earnings', icon: '💰', to: '/profile?tab=delivery-earnings' },
        { label: 'Account', icon: '👤', to: '/profile' },
    ];

    // --- CUSTOMER bottom nav ---
    const customerNavItems = [
        { label: 'Home', icon: '🏠', to: '/home' },
        { label: 'Cart', icon: '🛒', to: '/cart', badge: totalCartItems },
        { label: 'Orders', icon: '📋', to: '/profile?tab=orders', show: isAuthenticated },
        { label: 'Profile', icon: '👤', to: '/profile' },
    ];

    const navItems = (isAdmin ? adminNavItems
        : isOwner ? ownerNavItems
            : isDelivery ? deliveryNavItems
                : customerNavItems).filter(item => item.show !== false);

    const roleColor = isAdmin ? 'text-indigo-500 dark:text-indigo-400'
        : isOwner ? 'text-amber-500 dark:text-amber-400'
            : isDelivery ? 'text-emerald-500 dark:text-emerald-400'
                : 'text-primary';

    const handleTap = () => {
        if (window.navigator?.vibrate) {
            try { window.navigator.vibrate(10); } catch (e) {}
        }
    };

    return (
        <div className="fixed bottom-2 left-2 right-2 sm:left-4 sm:right-4 z-[100] md:hidden pointer-events-none">
            {/* ── 3D Floating Quick Cart Bar ─────────────────────────────── */}
            <AnimatePresence>
                {showFloatingCart && (
                    <motion.div
                        initial={{ y: 30, opacity: 0, scale: 0.94 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 30, opacity: 0, scale: 0.94 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                        onClick={() => {
                            handleTap();
                            navigate('/cart');
                        }}
                        className="pointer-events-auto mb-2 w-full bg-gradient-to-r from-orange-600 via-primary to-rose-600 text-white rounded-2xl p-3 px-4 shadow-[0_12px_30px_rgba(230,57,70,0.4)] flex items-center justify-between cursor-pointer border border-white/25 active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-sm shadow-inner">
                                🛒
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-orange-200 leading-none">
                                    {totalCartItems} {totalCartItems === 1 ? 'Item' : 'Items'} Added
                                </p>
                                <p className="text-sm font-black text-white leading-none mt-1">
                                    ₹{totalCartAmount.toFixed(0)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider bg-white/20 hover:bg-white/30 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-sm transition-colors">
                            <span>View Cart</span>
                            <span className="text-sm">➔</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── 3D Floating Glassmorphic Dock ──────────────────────────── */}
            <motion.nav
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                className="pointer-events-auto glass-3d-dock rounded-[28px] px-2 py-1.5 flex justify-around items-center"
            >
                {navItems.map((item, idx) => {
                    const itemPath = item.to.split('?')[0];
                    const itemTab = item.to.includes('?tab=') ? new URLSearchParams(item.to.split('?')[1]).get('tab') : null;
                    const currentTab = new URLSearchParams(location.search).get('tab');

                    let isActive = false;
                    if (itemTab) {
                        isActive = location.pathname === itemPath && (currentTab === itemTab || (!currentTab && isAdmin && itemTab === 'admin-overview'));
                    } else {
                        const hasActiveSiblingTab = navItems.some(otherItem => {
                            if (!otherItem.to.includes('?tab=')) return false;
                            const otherTab = new URLSearchParams(otherItem.to.split('?')[1]).get('tab');
                            return otherTab === currentTab && otherItem.to.split('?')[0] === location.pathname;
                        });
                        isActive = location.pathname === itemPath && (!currentTab || !hasActiveSiblingTab);
                    }

                    return (
                        <Link
                            key={idx}
                            to={item.to}
                            onMouseEnter={() => preloadRoute(item.to)}
                            onTouchStart={() => preloadRoute(item.to)}
                            onClick={handleTap}
                            className="relative flex-1 flex flex-col items-center justify-center min-h-[52px] py-1 rounded-2xl transition-all duration-300"
                        >
                            {/* Icon with Orange Circular Glow (Uber Eats / CRED / Swiggy style) */}
                            <div className="relative flex items-center justify-center">
                                {isActive && (
                                    <motion.div
                                        layoutId="bottomNavGlowOrb"
                                        className="absolute -inset-1 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 blur-sm opacity-80"
                                        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                                    />
                                )}
                                <motion.div
                                    whileTap={{ scale: 0.75, y: -2 }}
                                    transition={{ type: 'spring', stiffness: 450, damping: 15 }}
                                    className={`relative flex items-center justify-center transition-all duration-300 ${
                                        isActive
                                            ? 'w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-400 text-white shadow-[0_4px_16px_rgba(249,115,22,0.6)] ring-2 ring-white/40 dark:ring-gray-900/40 text-lg'
                                            : 'text-xl opacity-50 grayscale hover:opacity-80'
                                    }`}
                                >
                                    {item.icon}
                                </motion.div>
                            </div>

                            <span
                                className={`text-[8.5px] font-black uppercase tracking-wider transition-all duration-300 mt-1 ${
                                    isActive
                                        ? 'text-orange-600 dark:text-orange-400 font-black drop-shadow-[0_1px_3px_rgba(249,115,22,0.4)]'
                                        : 'text-gray-400 dark:text-gray-500'
                                }`}
                            >
                                {item.label}
                            </span>

                            {/* Badge Indicator */}
                            {item.badge > 0 && (
                                <span className="absolute top-0.5 right-[18%] bg-gradient-to-r from-orange-500 to-rose-600 text-white text-[8px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-md animate-pulse">
                                    {item.badge}
                                </span>
                            )}

                            {/* CRED / Uber Eats style Active Ambient Glow Capsule */}
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavActiveBg"
                                    className="absolute inset-0 bg-gradient-to-t from-orange-500/15 via-orange-500/10 to-transparent dark:from-orange-500/25 dark:via-orange-500/15 rounded-[22px] -z-10 border border-orange-500/30 dark:border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.25)]"
                                    transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </motion.nav>
        </div>
    );
};

export default BottomNav;
