import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { getCachedData } from '../utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, replaceCart, updateQuantity, removeFromCart } from '../redux/cartSlice';
import { motion, AnimatePresence } from 'framer-motion';
import FollowButton from '../components/FollowButton';
import DishPreviewModal from '../components/DishPreviewModal';
import ItemCustomizationModal from '../components/ItemCustomizationModal';

// Guaranteed culinary SVG fallbacks so broken image placeholders never appear
const SVG_SHOP_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%231f2937'/><stop offset='100%25' stop-color='%23111827'/></linearGradient></defs><rect width='800' height='400' fill='url(%23g)'/><circle cx='400' cy='180' r='60' fill='%23374151'/><text x='50%25' y='49%25' font-size='56' text-anchor='middle' dominant-baseline='central' fill='%23f97316'>🍲</text><text x='50%25' y='72%25' font-size='22' font-family='sans-serif' font-weight='900' text-anchor='middle' fill='%23f3f4f6'>Bhojan Kitchen</text></svg>";
const SVG_DISH_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><defs><linearGradient id='d' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%23374151'/><stop offset='100%25' stop-color='%231f2937'/></linearGradient></defs><rect width='400' height='400' fill='url(%23d)'/><circle cx='200' cy='180' r='50' fill='%234b5563'/><text x='50%25' y='48%25' font-size='48' text-anchor='middle' dominant-baseline='central' fill='%23fb923c'>🍽️</text><text x='50%25' y='72%25' font-size='16' font-family='sans-serif' font-weight='700' text-anchor='middle' fill='%23e5e7eb'>Delicious Meal</text></svg>";

const DEFAULT_SHOP_IMG = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80';
const DEFAULT_ITEM_IMG = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';

// Skeleton Shimmer Screen
const ShopDetailsSkeleton = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 animate-pulse pb-36">
        <div className="relative h-64 sm:h-72 bg-gray-300 dark:bg-gray-800">
            <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/40 dark:bg-gray-700/60" />
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div className="space-y-2.5">
                    <div className="h-7 w-48 bg-white/40 dark:bg-gray-700/60 rounded-xl" />
                    <div className="h-4 w-32 bg-white/30 dark:bg-gray-700/40 rounded-lg" />
                    <div className="h-4 w-56 bg-white/30 dark:bg-gray-700/40 rounded-lg" />
                </div>
                <div className="h-9 w-24 bg-white/40 dark:bg-gray-700/60 rounded-full" />
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-9 w-24 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0" />
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex gap-4">
                        <div className="w-28 h-28 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-3">
                            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="h-3 w-full bg-gray-100 dark:bg-gray-750 rounded" />
                            <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded-xl mt-2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const ShopDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector(state => state.user);
    const cart = useSelector(state => state.cart);
    const cartItems = cart.cartItems;
    const cartRestaurant = cart.restaurant;

    const [shop, setShop] = useState(() => {
        const cached = getCachedData(`/shop/${id}`);
        return cached?.shop || null;
    });
    const [items, setItems] = useState(() => {
        const cached = getCachedData(`/shop/${id}/items`);
        return cached?.items || [];
    });
    const [loading, setLoading] = useState(() => {
        const cached = getCachedData(`/shop/${id}`);
        return !cached?.shop;
    });

    const [wishlist, setWishlist] = useState([]);
    const [previewDish, setPreviewDish] = useState(null);
    const [customizingItem, setCustomizingItem] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [foodFilter, setFoodFilter] = useState('All'); // 'All' | 'Veg' | 'Non-Veg' | 'TopRated'
    const [showMenuSheet, setShowMenuSheet] = useState(false);
    const categoryRefs = useRef({});

    // Calculate totals for current shop
    const totalItems = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const totalAmount = cartItems.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0);
    const isCartFromThisShop = cartRestaurant && cartRestaurant._id === id;

    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/home');
        }
    };

    useEffect(() => {
        const fetchShopDetails = async () => {
            if (!shop && !getCachedData(`/shop/${id}`)) {
                setLoading(true);
            }
            try {
                const [shopRes, itemsRes] = await Promise.all([
                    api.get(`/shop/${id}`),
                    api.get(`/shop/${id}/items`)
                ]);
                if (shopRes.data?.success) setShop(shopRes.data.shop);
                if (itemsRes.data?.success) setItems(itemsRes.data.items);

                if (isAuthenticated) {
                    const wishlistRes = await api.get('/user-actions/wishlist');
                    if (wishlistRes.data?.success) {
                        setWishlist(wishlistRes.data.wishlist.map(item => item._id));
                    }
                }
            } catch (error) {
                console.error("Error fetching shop details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchShopDetails();
    }, [id, isAuthenticated]);

    // Categories list derived from dishes
    const rawCategories = Array.from(new Set(items.map(i => i.category || 'Specialties').filter(Boolean)));
    const categories = ['All', ...rawCategories];

    // Filter dishes based on Category & Food Filter
    const filteredItems = items.filter(item => {
        const matchesCategory = selectedCategory === 'All' || (item.category || 'Specialties') === selectedCategory;
        const matchesFood = foodFilter === 'All'
            ? true
            : foodFilter === 'Veg'
                ? item.foodType === 'Veg'
                : foodFilter === 'Non-Veg'
                    ? item.foodType === 'Non-Veg'
                    : foodFilter === 'TopRated'
                        ? Number(item.rating || 4.2) >= 4.2
                        : true;
        return matchesCategory && matchesFood;
    });

    // Group filtered dishes by category for Section Navigation
    const groupedItems = categories
        .filter(cat => cat !== 'All')
        .map(cat => ({
            category: cat,
            items: filteredItems.filter(i => (i.category || 'Specialties') === cat)
        }))
        .filter(group => group.items.length > 0);

    const handleSelectCategory = (cat) => {
        setSelectedCategory(cat);
        setShowMenuSheet(false);
        if (window.navigator?.vibrate) {
            try { window.navigator.vibrate(8); } catch (_) {}
        }
        if (cat === 'All') {
            window.scrollTo({ top: 320, behavior: 'smooth' });
        } else {
            const el = categoryRefs.current[cat] || document.getElementById(`category-${cat}`);
            if (el) {
                const yOffset = -120;
                const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
    };

    const handleToggleWishlist = async (itemId) => {
        try {
            const { data } = await api.post('/user-actions/wishlist/toggle', { itemId });
            if (data.success) {
                setWishlist(data.wishlist);
                if (window.navigator?.vibrate) {
                    try { window.navigator.vibrate(12); } catch (_) {}
                }
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error);
        }
    };

    const handleAddToCart = (item) => {
        if (isAuthenticated && !['Customer', 'User'].includes(user?.role)) {
            alert(`You are logged in as a ${user.role}. Only Customers can order food.`);
            return;
        }

        if (window.navigator?.vibrate) {
            try { window.navigator.vibrate(10); } catch (_) {}
        }

        if (cartRestaurant && cartRestaurant._id !== shop._id) {
            if (window.confirm("Your cart contains items from another restaurant. Would you like to reset your cart for adding items from this restaurant?")) {
                dispatch(replaceCart({ ...item, shop }));
            }
        } else {
            dispatch(addToCart({ ...item, shop }));
        }
    };

    const handleIncrement = (item) => {
        if (window.navigator?.vibrate) {
            try { window.navigator.vibrate(10); } catch (_) {}
        }
        const cartItem = cartItems.find(ci => ci._id === item._id);
        if (cartItem) {
            dispatch(updateQuantity({ cartItemId: cartItem.cartItemId || cartItem._id, quantity: (cartItem.quantity || 1) + 1 }));
        } else {
            handleAddToCart(item);
        }
    };

    const handleDecrement = (item) => {
        if (window.navigator?.vibrate) {
            try { window.navigator.vibrate(10); } catch (_) {}
        }
        const cartItem = cartItems.find(ci => ci._id === item._id);
        if (!cartItem) return;
        if ((cartItem.quantity || 1) <= 1) {
            dispatch(removeFromCart(cartItem.cartItemId || cartItem._id));
        } else {
            dispatch(updateQuantity({ cartItemId: cartItem.cartItemId || cartItem._id, quantity: cartItem.quantity - 1 }));
        }
    };

    if (loading) {
        return <ShopDetailsSkeleton />;
    }

    if (!shop) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-950 font-black text-gray-500 dark:text-gray-400 gap-4">
                <span className="text-5xl">🏪</span>
                <p className="text-xl">Restaurant not found</p>
                <button
                    onClick={handleBack}
                    className="px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md active:scale-95 transition-all"
                >
                    ← Back to Restaurants
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-44 transition-colors duration-300">
            {/* ── 1. Hero Restaurant Header ───────────────────────────────── */}
            <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800">
                <div className="relative h-64 sm:h-72 bg-gray-900 overflow-hidden">
                    {/* Floating Back Button & Share */}
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md shadow-lg border border-white/20 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                            aria-label="Back to restaurants"
                            title="Back to restaurants"
                        >
                            <svg className="w-5 h-5 -translate-x-0.5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={handleBack}
                            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-black text-white bg-black/40 hover:bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20 transition-all cursor-pointer"
                        >
                            <span>Back</span>
                        </button>
                    </div>

                    <img
                        src={shop.image || DEFAULT_SHOP_IMG}
                        alt={shop.name}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = SVG_SHOP_FALLBACK;
                        }}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />

                    <div className="absolute bottom-0 left-0 p-4 sm:p-6 text-white max-w-7xl mx-auto w-full">
                        <div className="flex justify-between items-end gap-3">
                            <div className="min-w-0 flex-1">
                                <motion.h1
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-2xl sm:text-4xl font-black mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3 flex-wrap"
                                >
                                    <span className="truncate">{shop.name}</span>
                                    {shop.isLocal && (
                                        <span className="text-[10px] sm:text-xs bg-orange-500 text-white px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full font-black uppercase tracking-wider shadow-sm align-middle whitespace-nowrap">
                                            ❤️ Local Gem
                                        </span>
                                    )}
                                </motion.h1>
                                <p className="text-gray-200 text-xs sm:text-sm mb-1 truncate">{shop.address}, {shop.city}</p>
                                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm mt-2 font-bold flex-wrap">
                                    <span className="flex items-center gap-1 bg-green-600 px-2 py-0.5 rounded text-white font-black text-xs shadow-sm">
                                        ★ {shop.rating || '4.5'}
                                    </span>
                                    <span>•</span>
                                    <span className="text-gray-200">{shop.deliveryTime || '30-40'} mins</span>
                                    <span>•</span>
                                    <span className="text-gray-200">₹{shop.priceForTwo || '350'} for two</span>
                                </div>
                            </div>
                            <div className="shrink-0">
                                <FollowButton targetUserId={shop.owner?._id || shop.owner} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 2. Sticky Category Scroll-Spy Bar & Dietary Quick Filters ── */}
            <div className="sticky top-14 md:top-16 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
                <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col gap-2">
                    {/* Category Pills Strip */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                        {categories.map(cat => {
                            const count = cat === 'All' ? items.length : items.filter(i => (i.category || 'Specialties') === cat).length;
                            const isActive = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => handleSelectCategory(cat)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                                        isActive
                                            ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-500/20'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <span>{cat}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                        isActive ? 'bg-white/25 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Secondary Quick Dietary Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-gray-100/60 dark:border-gray-800/60">
                        {[
                            { id: 'All', label: 'All Dishes' },
                            { id: 'Veg', label: '🟢 Pure Veg' },
                            { id: 'Non-Veg', label: '🔴 Non-Veg' },
                            { id: 'TopRated', label: '⭐ 4.2+ Rated' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => {
                                    setFoodFilter(f.id);
                                    if (window.navigator?.vibrate) {
                                        try { window.navigator.vibrate(8); } catch (_) {}
                                    }
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-black shrink-0 transition-all cursor-pointer ${
                                    foodFilter === f.id
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                                        : 'bg-gray-50 dark:bg-gray-800/70 text-gray-600 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/60'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── 3. Menu Items by Section / Grid ──────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
                {selectedCategory === 'All' ? (
                    // Section-wise view
                    <div className="space-y-10">
                        {groupedItems.map(group => (
                            <div
                                key={group.category}
                                id={`category-${group.category}`}
                                ref={el => categoryRefs.current[group.category] = el}
                                className="scroll-mt-36"
                            >
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                                    <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                        <span>{group.category}</span>
                                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500">({group.items.length})</span>
                                    </h2>
                                    <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                        Popular Choice
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {group.items.map((item, index) => renderDishCard(item, index))}
                                </div>
                            </div>
                        ))}

                        {groupedItems.length === 0 && (
                            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                                <span className="text-4xl block mb-2">🍽️</span>
                                <p className="font-black text-gray-700 dark:text-gray-300">No dishes match the selected filter</p>
                                <button
                                    onClick={() => { setFoodFilter('All'); setSelectedCategory('All'); }}
                                    className="mt-3 text-xs font-black text-orange-600 hover:underline"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    // Single category view
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {selectedCategory} ({filteredItems.length})
                            </h2>
                            <span className="text-[10px] sm:text-xs bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/40 font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                ✨ Customisations available
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {filteredItems.map((item, index) => renderDishCard(item, index))}
                        </div>

                        {filteredItems.length === 0 && (
                            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                                <span className="text-4xl block mb-2">🍽️</span>
                                <p className="font-black text-gray-700 dark:text-gray-300">No dishes in this category</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── 4. Floating "Menu" Quick-Jump Bottom Sheet Button (Swiggy/Zomato style) ── */}
            <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setShowMenuSheet(true)}
                className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40 bg-gray-950/90 dark:bg-black/95 text-white font-black text-xs px-5 py-3 rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.5)] border border-white/20 flex items-center gap-2.5 backdrop-blur-md cursor-pointer hover:bg-black transition-all"
            >
                <span className="text-base">📖</span>
                <span className="tracking-wider uppercase">Menu</span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-orange-400 font-bold">{filteredItems.length} Dishes</span>
            </motion.button>

            {/* ── 5. Menu Quick-Jump Bottom Sheet Modal ────────────────────── */}
            <AnimatePresence>
                {showMenuSheet && (
                    <div className="fixed inset-0 z-[120] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMenuSheet(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                            className="relative bg-white dark:bg-gray-900 rounded-t-[32px] w-full max-w-lg max-h-[75vh] flex flex-col shadow-2xl border-t border-gray-100 dark:border-gray-800 p-5 overflow-hidden"
                        >
                            <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 mx-auto mb-4" />
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                                <div>
                                    <h3 className="font-black text-lg text-gray-900 dark:text-white">Browse Categories</h3>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold">{shop.name} • {items.length} items</p>
                                </div>
                                <button
                                    onClick={() => setShowMenuSheet(false)}
                                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center font-bold text-sm cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="overflow-y-auto py-3 space-y-2 divide-y divide-gray-100/50 dark:divide-gray-800/50">
                                {categories.map(cat => {
                                    const count = cat === 'All' ? items.length : items.filter(i => (i.category || 'Specialties') === cat).length;
                                    const isCurrent = selectedCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => handleSelectCategory(cat)}
                                            className={`w-full py-3 px-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-left ${
                                                isCurrent
                                                    ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-black'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold'
                                            }`}
                                        >
                                            <span className="text-sm">{cat}</span>
                                            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Customization Modal */}
            <ItemCustomizationModal
                item={customizingItem}
                isOpen={!!customizingItem}
                onClose={() => setCustomizingItem(null)}
                onAddToCart={(customized) => handleAddToCart(customized)}
            />

            {/* 3D Preview Modal */}
            {previewDish && (
                <DishPreviewModal
                    dish={previewDish}
                    isOpen={!!previewDish}
                    onClose={() => setPreviewDish(null)}
                    onAddToCart={(dish) => setCustomizingItem(dish)}
                />
            )}

            {/* ── 6. Sticky Floating Cart Pill (Shows when items in cart) ── */}
            <AnimatePresence>
                {isCartFromThisShop && cartItems.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-20 left-4 right-4 md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:max-w-xl z-[90]"
                    >
                        <Link
                            to="/cart"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 sm:p-4 rounded-2xl shadow-[0_8px_30px_rgb(5,150,105,0.4)] flex items-center justify-between transition-all active:scale-95 group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg animate-pulse">
                                    🛒
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest opacity-80">
                                        {totalItems} {totalItems === 1 ? 'Item' : 'Items'} Added
                                    </p>
                                    <p className="font-black text-base sm:text-lg">₹{totalAmount.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-black uppercase tracking-widest">View Cart</span>
                                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    // Helper: Dish Card Component with Stepper & Safe Fallback
    function renderDishCard(item, index) {
        const cartItem = cartItems.find(ci => ci._id === item._id);
        const quantity = cartItem?.quantity || 0;
        const isCustomisable = item.hasCustomizations || (item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0);
        const isCustomer = !isAuthenticated || ['Customer', 'User'].includes(user?.role);

        return (
            <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.4) }}
                className="bg-white dark:bg-gray-800/90 p-3.5 sm:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 flex gap-3 sm:gap-4 hover:shadow-md transition group"
            >
                {/* Dish Thumbnail */}
                <div
                    className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden relative cursor-pointer"
                    onClick={() => setPreviewDish(item)}
                >
                    <img
                        src={item.image || DEFAULT_ITEM_IMG}
                        alt={item.name}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = SVG_DISH_FALLBACK;
                        }}
                        className="w-full h-full object-cover transition group-hover:scale-105"
                    />
                    {/* Food Type Indicator */}
                    <div className="absolute top-2 left-2 pointer-events-none">
                        <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center bg-white dark:bg-gray-900 shadow-sm ${
                            item.foodType === 'Veg' ? 'border-green-600' : 'border-red-600'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                item.foodType === 'Veg' ? 'bg-green-600' : 'bg-red-600'
                            }`} />
                        </span>
                    </div>
                    {/* Wishlist Heart */}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleToggleWishlist(item._id); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform active:scale-95 cursor-pointer"
                        aria-label="Save to wishlist"
                    >
                        <span className={`text-base leading-none ${wishlist.includes(item._id) ? 'text-red-500' : 'text-gray-300 dark:text-gray-500'}`}>
                            {wishlist.includes(item._id) ? '❤️' : '🤍'}
                        </span>
                    </button>
                </div>

                {/* Dish Info & Actions */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                        <div className="flex items-start justify-between gap-1">
                            <h3 className="font-black text-sm sm:text-base text-gray-800 dark:text-white line-clamp-1">{item.name}</h3>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                            <span className="text-yellow-400 text-xs">★</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.rating || '4.2'}</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">({item.ratingCount || '100+'})</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                            {item.description || 'Delightful meal prepared with fresh ingredients.'}
                        </p>
                        <p className="font-black text-gray-900 dark:text-white text-sm sm:text-base">₹{item.price}</p>
                    </div>

                    {/* Stepper / Add Button */}
                    <div className="mt-2.5">
                        {!isCustomer ? (
                            <button
                                disabled
                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-400 border border-gray-200 dark:border-gray-600 py-2 rounded-xl text-xs font-black cursor-not-allowed uppercase"
                            >
                                Customer Only
                            </button>
                        ) : quantity > 0 ? (
                            <div className="flex items-center justify-between bg-orange-600 text-white rounded-xl shadow-md overflow-hidden font-black">
                                <button
                                    type="button"
                                    onClick={() => handleDecrement(item)}
                                    className="w-10 h-8 flex items-center justify-center hover:bg-orange-700 active:scale-90 transition-all font-black text-base cursor-pointer select-none"
                                    aria-label="Decrease quantity"
                                >
                                    −
                                </button>
                                <motion.span
                                    key={quantity}
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    className="text-xs font-black px-2 select-none"
                                >
                                    {quantity}
                                </motion.span>
                                <button
                                    type="button"
                                    onClick={() => isCustomisable ? setCustomizingItem(item) : handleIncrement(item)}
                                    className="w-10 h-8 flex items-center justify-center hover:bg-orange-700 active:scale-90 transition-all font-black text-base cursor-pointer select-none"
                                    aria-label="Increase quantity"
                                >
                                    +
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => isCustomisable ? setCustomizingItem(item) : handleAddToCart(item)}
                                className="w-full font-black py-2 px-3 rounded-xl transition-all text-xs tracking-wider shadow-sm flex items-center justify-between bg-white dark:bg-gray-750 text-orange-600 dark:text-orange-400 border-2 border-orange-200 dark:border-orange-500/30 hover:bg-orange-50 dark:hover:bg-gray-700 hover:border-orange-500 cursor-pointer active:scale-95"
                            >
                                <span className="font-black">ADD</span>
                                <span className="text-[9px] text-gray-400 dark:text-gray-400 uppercase tracking-widest font-black">
                                    {isCustomisable ? 'Customise +' : '+'}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }
};

export default ShopDetails;