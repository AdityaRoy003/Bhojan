import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

// Pages where the bottom nav should NOT appear
const HIDDEN_ON_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];

const BottomNav = () => {
    const location = useLocation();
    const { isAuthenticated, user } = useSelector((state) => state.user);
    const cartItems = useSelector((state) => state.cart.cartItems);

    // Hide on landing/auth pages
    if (HIDDEN_ON_ROUTES.includes(location.pathname)) return null;

    const role = user?.role;
    const isCustomer = !role || role === 'Customer';

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
        { label: 'Search', icon: '🔍', to: '/home' },
        { label: 'Cart', icon: '🛒', to: '/cart', badge: cartItems.length },
        { label: 'Orders', icon: '📋', to: '/profile?tab=orders', show: isAuthenticated },
        { label: 'Profile', icon: '👤', to: '/profile' },
    ];

    const navItems = role === 'Admin' ? adminNavItems
        : role === 'Owner' ? ownerNavItems
            : role === 'Delivery' ? deliveryNavItems
                : customerNavItems;

    const roleColor = role === 'Admin' ? 'text-indigo-500'
        : role === 'Owner' ? 'text-red-500'
            : role === 'Delivery' ? 'text-emerald-500'
                : 'text-primary';

    return (
        <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-2 py-2 pb-6 md:hidden z-[100] flex justify-around items-center shadow-[0_-8px_30px_rgba(0,0,0,0.07)]"
        >
            {navItems.map((item, idx) => {
                const isActive = location.pathname === item.to.split('?')[0]
                    || location.search === `?tab=${item.to.split('?tab=')[1]}`;

                return (
                    <Link
                        key={idx}
                        to={item.to}
                        className="relative flex flex-col items-center justify-center gap-0.5 group min-h-[44px] min-w-[52px]"
                    >
                        <motion.span
                            whileTap={{ scale: 0.75 }}
                            className={`text-2xl transition-all ${isActive ? 'scale-110' : 'opacity-50 grayscale'}`}
                        >
                            {item.icon}
                        </motion.span>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? roleColor : 'text-gray-400'}`}>
                            {item.label}
                        </span>
                        {(item.badge > 0) && (
                            <span className="absolute -top-1 right-1 bg-primary text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                                {item.badge}
                            </span>
                        )}
                        {isActive && (
                            <motion.div
                                layoutId="bottomNavDot"
                                className={`absolute -bottom-1 w-1 h-1 rounded-full ${role === 'Admin' ? 'bg-indigo-500' : role === 'Owner' ? 'bg-red-500' : role === 'Delivery' ? 'bg-emerald-500' : 'bg-primary'}`}
                            />
                        )}
                    </Link>
                );
            })}
        </motion.div>
    );
};

export default BottomNav;
