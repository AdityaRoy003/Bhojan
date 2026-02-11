import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, replaceCart, updateQuantity, removeFromCart } from '../redux/cartSlice';
import { motion, AnimatePresence } from 'framer-motion';
import FollowButton from '../components/FollowButton';

const ShopDetails = () => {
    const { id } = useParams();
    const [shop, setShop] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
    const cart = useSelector(state => state.cart);
    const cartRestaurant = cart.restaurant;
    const cartItems = cart.cartItems;

    const { isAuthenticated, user } = useSelector(state => state.user);

    useEffect(() => {
        const fetchShopDetails = async () => {
            try {
                const shopRes = await api.get(`/shop/${id}`);
                const itemsRes = await api.get(`/shop/${id}/items`);
                if (shopRes.data.success) setShop(shopRes.data.shop);
                if (itemsRes.data.success) setItems(itemsRes.data.items);
            } catch (error) {
                console.error("Error fetching shop details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchShopDetails();
    }, [id]);

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

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    if (!shop) return <div className="flex justify-center items-center h-screen">Shop not found</div>;

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
                                <p className="opacity-90">{shop.city}, {shop.state}</p>
                                <p className="text-sm opacity-80">{shop.address}</p>
                            </div>
                            <div className="flex gap-4 items-end">
                                <FollowButton
                                    shopId={shop._id}
                                    followersCount={shop.followers?.length || 0}
                                    onUpdate={(isFollowing) => {
                                        // Optional: local state update if needed
                                    }}
                                />
                                <div className="bg-green-600 px-4 py-2 rounded-xl text-white font-bold flex flex-col items-center shadow-lg">
                                    <span className="text-xl">4.2</span>
                                    <span className="text-[10px] opacity-80 uppercase tracking-widest">Rating</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vendor Story Section */}
            {shop.story && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-orange-500"
                    >
                        <h3 className="text-orange-600 font-black uppercase tracking-widest text-xs mb-2">Our Story</h3>
                        <p className="text-gray-700 italic text-lg leading-relaxed">"{shop.story}"</p>
                    </motion.div>
                </div>
            )}

            {/* Vendor Story Section */}
            {shop.story && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-orange-500"
                    >
                        <h3 className="text-orange-600 font-black uppercase tracking-widest text-xs mb-2">Our Story</h3>
                        <p className="text-gray-700 italic text-lg leading-relaxed">"{shop.story}"</p>
                    </motion.div>
                </div>
            )}

            {/* Menu Items */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-2xl font-bold mb-6">Menu</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item, index) => {
                        const cartItem = cartItems.find(i => i._id === item._id);
                        const quantity = cartItem ? cartItem.quantity : 0;

                        return (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition group"
                            >
                                <div className="w-32 h-32 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden relative">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition group-hover:scale-105" />
                                    <div className="absolute top-2 left-2">
                                        <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center bg-white ${item.foodType === 'Veg' ? 'border-green-600' : 'border-red-600'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${item.foodType === 'Veg' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between">
                                            <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">{item.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-yellow-400 text-sm">★</span>
                                            <span className="text-xs font-bold text-gray-700">{item.rating || '4.2'}</span>
                                            <span className="text-xs text-gray-400">({item.ratingCount || '100+'})</span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.description || 'Delightful meal prepared with fresh ingredients.'}</p>
                                        <p className="font-bold text-gray-900">₹{item.price}</p>
                                    </div>

                                    <div className="mt-3">
                                        {quantity > 0 ? (
                                            <div className="flex items-center justify-between bg-primary/10 rounded-lg border border-primary/20 px-2 py-1.5">
                                                <button
                                                    onClick={() => (isAuthenticated && user?.role === 'Customer') ? dispatch(updateQuantity({ id: item._id, quantity: quantity - 1 })) : alert("Only customers can adjust quantity")}
                                                    className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center text-primary font-bold hover:bg-gray-50"
                                                >
                                                    -
                                                </button>
                                                <span className="text-primary font-bold text-sm mx-3">{quantity}</span>
                                                <button
                                                    onClick={() => (isAuthenticated && user?.role === 'Customer') ? dispatch(updateQuantity({ id: item._id, quantity: quantity + 1 })) : alert("Only customers can adjust quantity")}
                                                    className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center text-primary font-bold hover:bg-gray-50"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAddToCart(item)}
                                                className={`w-full font-bold py-1.5 rounded-lg transition-all text-sm shadow-sm ${(isAuthenticated && user?.role !== 'Customer')
                                                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                                    : 'bg-white text-primary border border-primary/30 hover:bg-primary/5 hover:border-primary'
                                                    }`}
                                            >
                                                {(isAuthenticated && user?.role !== 'Customer') ? 'CUSTOMER ONLY' : 'ADD'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    {items.length === 0 && <p className="col-span-3 text-center text-gray-500">No items available yet.</p>}
                </div>
            </div>
        </div>
    );
};

export default ShopDetails;
