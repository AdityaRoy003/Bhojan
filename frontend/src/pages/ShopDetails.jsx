import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { getCachedData } from '../utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, replaceCart, updateQuantity, removeFromCart } from '../redux/cartSlice';
import { motion, AnimatePresence } from 'framer-motion';
import FollowButton from '../components/FollowButton';
import DishPreviewModal from '../components/DishPreviewModal';
import ItemCustomizationModal from '../components/ItemCustomizationModal';

const ShopDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
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
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector(state => state.user);
    const cart = useSelector(state => state.cart);
    const cartItems = cart.cartItems;
    const cartRestaurant = cart.restaurant;

    // Calculate totals for current shop
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const isCartFromThisShop = cartRestaurant && cartRestaurant._id === id;

    const [wishlist, setWishlist] = useState([]);
    const [previewDish, setPreviewDish] = useState(null);
    const [customizingItem, setCustomizingItem] = useState(null);

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

    const handleToggleWishlist = async (itemId) => {
        try {
            const { data } = await api.post('/user-actions/wishlist/toggle', { itemId });
            if (data.success) {
                setWishlist(data.wishlist);
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error);
            alert("Failed to update wishlist");
        }
    };

    const handleAddToCart = (item) => {
        if (isAuthenticated && user?.role !== 'Customer') {
            alert(`You are logged in as a ${user.role}. Only Customers can order food.`);
            return;
        }

        // If cart has items from another shop, confirm replacement
        if (cartRestaurant && cartRestaurant._id !== shop._id) {
            if (window.confirm("Your cart contains items from another restaurant. Would you like to reset your cart for adding items from this restaurant?")) {
                dispatch(replaceCart({ ...item, shop }));
            }
        } else {
            dispatch(addToCart({ ...item, shop }));
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen font-black text-gray-500">Loading shop...</div>;
    if (!shop) return <div className="flex justify-center items-center h-screen font-black text-gray-500">Shop not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Shop Header */}
            <div className="bg-white shadow-sm">
                <div className="relative h-64 bg-gray-300">
                    <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40"></div>
                    <div className="absolute bottom-0 left-0 p-6 text-white max-w-7xl mx-auto w-full">
                        <div className="flex justify-between items-end">
                            <div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-4xl font-bold mb-2 flex items-center gap-3"
                                >
                                    {shop.name}
                                    {shop.isLocal && <span className="text-sm bg-orange-500 text-white px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm align-middle">❤️ Local Gem</span>}
                                </motion.h1>
                                <p className="text-gray-200 text-sm mb-1">{shop.address}, {shop.city}</p>
                                <div className="flex items-center gap-4 text-sm mt-3">
                                    <span className="flex items-center gap-1 bg-green-600 px-2 py-0.5 rounded text-white font-bold">
                                        ★ {shop.rating || '4.5'}
                                    </span>
                                    <span>•</span>
                                    <span>{shop.deliveryTime || '30-40'} mins</span>
                                    <span>•</span>
                                    <span>₹{shop.priceForTwo || '350'} for two</span>
                                </div>
                            </div>
                            <div>
                                <FollowButton targetUserId={shop.owner?._id || shop.owner} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Full Menu ({items.length})</h2>
                    <span className="text-xs bg-orange-100 text-orange-700 font-black px-3 py-1 rounded-full uppercase tracking-wider">
                        ✨ Customisations available
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item, index) => {
                        const quantity = cartItems.filter(ci => ci._id === item._id).reduce((s, ci) => s + ci.quantity, 0);

                        return (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition group"
                            >
                                <div className="w-32 h-32 flex-shrink-0 bg-gray-200 rounded-xl overflow-hidden relative cursor-pointer" onClick={() => setPreviewDish(item)}>
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition group-hover:scale-105" />
                                    <div className="absolute top-2 left-2 pointer-events-none">
                                        <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center bg-white ${item.foodType === 'Veg' ? 'border-green-600' : 'border-red-600'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${item.foodType === 'Veg' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleWishlist(item._id); }}
                                        className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform active:scale-95"
                                    >
                                        <span className={`text-lg leading-none ${wishlist.includes(item._id) ? 'text-red-500' : 'text-gray-300'}`}>
                                            {wishlist.includes(item._id) ? '❤️' : '🤍'}
                                        </span>
                                    </button>
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between">
                                            <h3 className="font-black text-base text-gray-800 line-clamp-1">{item.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-yellow-400 text-sm">★</span>
                                            <span className="text-xs font-bold text-gray-700">{item.rating || '4.2'}</span>
                                            <span className="text-xs text-gray-400">({item.ratingCount || '100+'})</span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.description || 'Delightful meal prepared with fresh ingredients.'}</p>
                                        <p className="font-black text-gray-900">₹{item.price}</p>
                                    </div>

                                    <div className="mt-3">
                                        <button
                                            onClick={() => setCustomizingItem(item)}
                                            className={`w-full font-black py-2 rounded-xl transition-all text-xs tracking-wider shadow-sm ${(isAuthenticated && user?.role !== 'Customer')
                                                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                                : 'bg-white text-orange-600 border-2 border-orange-200 hover:bg-orange-50 hover:border-orange-500 shadow-sm flex flex-col items-center justify-center'
                                                }`}
                                        >
                                            <span className="text-sm font-black">
                                                {(isAuthenticated && user?.role !== 'Customer') ? 'CUSTOMER ONLY' : (quantity > 0 ? `ADD MORE (${quantity})` : 'ADD')}
                                            </span>
                                            <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Customisable</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    {items.length === 0 && <p className="col-span-3 text-center text-gray-500">No items available yet.</p>}
                </div>
            </div>

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

            {/* Sticky Cart Footer (Swiggy Style) - Visible only if cart has items from this shop */}
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(5,150,105,0.4)] flex items-center justify-between transition-all active:scale-95 group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center text-lg animate-pulse">
                                    🛒
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest opacity-80">
                                        {totalItems} {totalItems === 1 ? 'Item' : 'Items'} Added
                                    </p>
                                    <p className="font-black text-lg">₹{totalAmount.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black uppercase tracking-widest">View Cart</span>
                                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ShopDetails;
