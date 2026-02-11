import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/userSlice';
import { detectLocation } from '../redux/locationSlice';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { user, isAuthenticated } = useSelector((state) => state.user);
    const cartItems = useSelector((state) => state.cart.cartItems);
    const { city, state: locationState, loading: locationLoading } = useSelector((state) => state.location);
    const dispatch = useDispatch();

    const handleLogout = () => {
        localStorage.removeItem('isShoppingMode');
        dispatch(logoutUser());
    };

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 120 }}
            className="bg-white shadow-md sticky top-0 z-50 transition-all duration-300"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
                            <motion.span
                                whileHover={{ rotate: 20 }}
                                className="text-3xl"
                            >🥣</motion.span>
                            Bhojan
                        </Link>

                        {(!isAuthenticated || user?.role === 'Customer') && (
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="hidden md:flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 cursor-pointer hover:bg-gray-200 transition-all shadow-sm"
                                onClick={() => dispatch(detectLocation())}
                            >
                                <span className="text-primary">📍</span>
                                {locationLoading ? (
                                    <span className="text-sm text-gray-600 animate-pulse">Detecting...</span>
                                ) : city ? (
                                    <span className="text-sm text-gray-800 font-medium">{city}, {locationState?.split(' ')[0]}</span>
                                ) : (
                                    <span className="text-sm text-gray-500">Select Location</span>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Mobile Location */}
                    {(!isAuthenticated || user?.role === 'Customer') && (
                        <div className="flex md:hidden items-center absolute left-1/2 -translate-x-1/2">
                            <div className="flex items-center gap-1 bg-gray-50 rounded-full px-2 py-0.5 cursor-pointer text-xs" onClick={() => dispatch(detectLocation())}>
                                <span className="text-primary text-sm">📍</span>
                                {city ? (
                                    <span className="text-gray-800 font-medium max-w-[80px] truncate">{city}</span>
                                ) : (
                                    <span className="text-gray-400">Location</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-6">
                        {(!isAuthenticated || user?.role === 'Customer') && (
                            <>
                                <NavLink to="/">🏠 Home</NavLink>
                                {isAuthenticated && (
                                    <Link
                                        to="/prime-membership"
                                        className="relative group text-amber-600 hover:text-amber-700 px-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full px-3 shadow-sm"
                                    >
                                        👑 Prime
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full"></span>
                                    </Link>
                                )}
                                <div className="relative group">
                                    <Link to="/cart" className="relative text-gray-700 hover:text-primary transition-colors block py-2">
                                        <span className="text-2xl">🛒</span>
                                        {cartItems.length > 0 && (
                                            <span className="absolute -top-1 -right-2 bg-primary text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                                                {cartItems.length}
                                            </span>
                                        )}
                                    </Link>

                                    {/* Mini Cart Preview */}
                                    <AnimatePresence>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            whileHover={{ opacity: 1, y: 0, scale: 1 }}
                                            className="absolute right-0 top-full pt-2 w-72 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-all z-50"
                                        >
                                            <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 p-4 overflow-hidden">
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
                                                                    <p className="text-[10px] font-black text-gray-900 truncate">{item.name}</p>
                                                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{item.quantity} x ₹{item.price}</p>
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
                                                    <div className="mt-4 pt-4 border-t border-gray-50">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                                                            <span className="text-sm font-black text-gray-900">₹{cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0).toFixed(2)}</span>
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
                                </div>
                            </>
                        )}

                        {isAuthenticated ? (
                            <>
                                {user?.role !== 'Customer' && (
                                    <NavLink to="/">🏠 Hub</NavLink>
                                )}

                                <Link to="/profile" className="flex items-center gap-2 text-gray-700 font-black hover:text-primary transition group">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-black shadow-inner border border-white group-hover:scale-110 transition-transform">
                                        {user?.fullname?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden md:block text-sm uppercase tracking-tight">Hi, {user?.fullname?.split(' ')[0]}</span>
                                </Link>

                                {user?.role === 'Owner' && (
                                    <>
                                        <NavLink to="/owner/dashboard">🏢 Dashboard</NavLink>
                                        <NavLink to="/owner/virtual-brands">🏪 Virtual Brands</NavLink>
                                    </>
                                )}
                                {user?.role === 'Delivery' && (
                                    <NavLink to="/delivery/dashboard">🚚 Dashboard</NavLink>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-white bg-primary hover:bg-red-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200 transition-all"
                                >
                                    <span>Logout</span>
                                    <span className="text-xs">🔴</span>
                                </motion.button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login">👤 Login</NavLink>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link to="/signup" className="text-white bg-primary hover:bg-red-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200 transition-all">
                                        Join Now ✨
                                    </Link>
                                </motion.div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

const NavLink = ({ to, children }) => (
    <Link to={to} className="relative group text-gray-700 hover:text-primary px-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5">
        {children}
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full"></span>
    </Link>
);

export default Navbar;
