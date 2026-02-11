import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import RecommendationCard from '../components/RecommendationCard';
import StoryFeed from '../components/StoryFeed';
import SpinTheWheel from '../components/SpinTheWheel';
import FestivalModeToggle from '../components/FestivalModeToggle';

import { useSelector } from 'react-redux';

const categories = [
    { name: 'Snacks', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=200&auto=format' },
    { name: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&auto=format' },
    { name: 'Burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&auto=format' },
    { name: 'Chinese', image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?q=80&w=200&auto=format' },
    { name: 'Main Course', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format' },
    { name: 'Dessert', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=200&auto=format' },
    { name: 'South Indian', image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=200&auto=format' },
    { name: 'Fast Food', image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=200&auto=format' },
];

const dietaryOptions = [
    { name: 'Vegan', icon: '🌱', color: 'bg-green-100 text-green-700 border-green-300' },
    { name: 'Gluten-Free', icon: '🌾', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { name: 'Jain', icon: '🙏', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { name: 'Keto', icon: '🥑', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    { name: 'Organic', icon: '🍃', color: 'bg-lime-100 text-lime-700 border-lime-300' },
];

const Home = () => {
    const navigate = useNavigate();
    const [shops, setShops] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedDietaryTags, setSelectedDietaryTags] = useState([]);
    const [personalizedRecs, setPersonalizedRecs] = useState([]);
    const [trendingItems, setTrendingItems] = useState([]);
    const [timeBasedSuggestions, setTimeBasedSuggestions] = useState([]);
    const [mealTime, setMealTime] = useState('');
    const { city } = useSelector((state) => state.location);
    const { isAuthenticated, user } = useSelector((state) => state.user);
    const [showSpinWheel, setShowSpinWheel] = useState(false);
    const [activeOrder, setActiveOrder] = useState(null);

    const fetchActiveOrder = async () => {
        if (!isAuthenticated) return;
        try {
            console.log('Fetching active order...');
            const { data } = await api.get('/order/active');
            console.log('Active Order Response:', data);
            if (data.success && data.order) {
                console.log('Setting active order:', data.order);
                setActiveOrder(data.order);
            } else {
                console.log('No active order found or success false');
                setActiveOrder(null);
            }
        } catch (error) {
            console.error("Failed to fetch active order", error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchActiveOrder();
            // Poll every 10 seconds to keep it fresh
            const interval = setInterval(fetchActiveOrder, 10000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const isShoppingMode = localStorage.getItem('isShoppingMode') === 'true';
        if (isAuthenticated && !isShoppingMode) {
            if (user?.role === 'Admin') {
                navigate('/profile');
            } else if (user?.role === 'Owner') {
                navigate('/owner/dashboard');
            } else if (user?.role === 'Delivery') {
                navigate('/delivery/dashboard');
            }
        }
    }, [isAuthenticated, user, navigate]);

    const fetchShops = async (query = '') => {
        setLoading(true);
        try {
            let endpoint = '/shop/all';
            const params = new URLSearchParams();

            if (query) {
                endpoint = `/shop/search/${query}`;
            } else {
                if (city) params.append('city', city);
                if (selectedDietaryTags.length > 0) {
                    selectedDietaryTags.forEach(tag => params.append('dietaryTags', tag));
                }
                if (params.toString()) {
                    endpoint += `?${params.toString()}`;
                }
            }

            const { data } = await api.get(endpoint);
            if (data.success) {
                setShops(data.shops);
            }
        } catch (error) {
            console.error("Failed to fetch shops");
        } finally {
            setLoading(false);
        }
    };

    const fetchRecommendations = async () => {
        if (!isAuthenticated) return;

        try {
            const [personalized, trending, timeBased] = await Promise.all([
                api.get('/recommendations/personalized').catch(() => ({ data: { recommendations: [] } })),
                api.get('/recommendations/trending').catch(() => ({ data: { items: [] } })),
                api.get('/recommendations/time-based').catch(() => ({ data: { items: [], mealTime: '' } }))
            ]);

            if (personalized.data.success) {
                setPersonalizedRecs(personalized.data.recommendations || []);
            }
            if (trending.data.success) {
                setTrendingItems(trending.data.items || []);
            }
            if (timeBased.data.success) {
                setTimeBasedSuggestions(timeBased.data.items || []);
                setMealTime(timeBased.data.mealTime || '');
            }
        } catch (error) {
            console.error("Failed to fetch recommendations");
        }
    };

    useEffect(() => {
        fetchShops();
        fetchRecommendations();
    }, [city, selectedDietaryTags, isAuthenticated]);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            fetchShops(searchQuery);
        } else {
            fetchShops(); // Reset
        }
    };

    const toggleDietaryTag = (tagName) => {
        setSelectedDietaryTags(prev =>
            prev.includes(tagName)
                ? prev.filter(t => t !== tagName)
                : [...prev, tagName]
        );
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Hero Section */}
            <div className="relative bg-primary text-white py-20 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
                >
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-md">Delicious Food, Delivered to You</h1>
                    <p className="text-xl md:text-2xl mb-8 drop-shadow-sm">Order from your favorite restaurants near you.</p>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex justify-center"
                    >
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Search for restaurants or cities..."
                            className="px-4 py-3 rounded-l-full w-full max-w-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent shadow-lg"
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-accent text-white px-8 py-3 rounded-r-full font-semibold hover:bg-gray-800 transition shadow-lg transform hover:scale-105 active:scale-95 duration-200"
                        >
                            Search
                        </button>
                    </motion.div>
                </motion.div>

                {/* Decorative Circles */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="absolute -top-20 -left-20 w-64 h-64 bg-white opacity-10 rounded-full"
                ></motion.div>
                <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                    transition={{ duration: 25, repeat: Infinity }}
                    className="absolute -bottom-20 -right-20 w-80 h-80 bg-white opacity-10 rounded-full"
                ></motion.div>
            </div>

            {/* Stories Section */}
            <StoryFeed />

            {/* Category Slider */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Inspiration for your first order</h2>
                    <div className="flex gap-2">
                        <button onClick={() => document.getElementById('cat-slider').scrollBy({ left: -200, behavior: 'smooth' })} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-white hover:shadow-md transition">←</button>
                        <button onClick={() => document.getElementById('cat-slider').scrollBy({ left: 200, behavior: 'smooth' })} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-white hover:shadow-md transition">→</button>
                    </div>
                </div>
                <div id="cat-slider" className="flex gap-8 overflow-x-auto no-scrollbar pb-4">
                    {categories.map((cat, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            className="flex-shrink-0 cursor-pointer text-center"
                            onClick={() => {
                                setSearchQuery(cat.name);
                                fetchShops(cat.name);
                            }}
                        >
                            <div className="w-32 h-32 rounded-full overflow-hidden mb-3 border-4 border-white shadow-sm hover:shadow-lg transition">
                                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-medium text-gray-700">{cat.name}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Dietary Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🥗 Dietary Preferences</h3>
                <div className="flex flex-wrap gap-3">
                    {dietaryOptions.map((option, idx) => (
                        <motion.button
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleDietaryTag(option.name)}
                            className={`px-4 py-2 rounded-full font-bold text-sm border-2 transition-all duration-300 ${selectedDietaryTags.includes(option.name)
                                ? option.color + ' shadow-md'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className="mr-1">{option.icon}</span>
                            {option.name}
                        </motion.button>
                    ))}
                    {selectedDietaryTags.length > 0 && (
                        <button
                            onClick={() => setSelectedDietaryTags([])}
                            className="px-4 py-2 rounded-full font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                        >
                            Clear All ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Personalized Recommendations */}
            {isAuthenticated && personalizedRecs.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>✨</span> For You
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {personalizedRecs.slice(0, 4).map((item) => (
                            <RecommendationCard key={item._id} item={item} reason="Based on your orders" />
                        ))}
                    </div>
                </div>
            )}

            {/* Time-Based Suggestions */}
            {timeBasedSuggestions.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>🕐</span> Perfect for {mealTime}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {timeBasedSuggestions.slice(0, 4).map((item) => (
                            <RecommendationCard key={item._id} item={item} reason={mealTime} />
                        ))}
                    </div>
                </div>
            )}

            {/* Trending Items */}
            {trendingItems.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>🔥</span> Trending Now
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {trendingItems.slice(0, 4).map((item) => (
                            <RecommendationCard key={item._id} item={item} reason="Popular in your area" />
                        ))}
                    </div>
                </div>
            )}

            {/* Support Local Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-gradient-to-r from-orange-100 to-amber-50 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between border border-orange-200">
                    <div className="mb-6 md:mb-0 md:pr-8">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Hyperlocal</span>
                            <span className="text-orange-600 font-bold text-sm">❤️ Support Small Businesses</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Taste the Authentic Local Flavors</h2>
                        <p className="text-gray-600 mb-6">Discover hidden gems and family-run eateries in your neighborhood. Every order makes a difference!</p>
                        <button
                            onClick={() => {
                                const localShops = shops.filter(s => s.isLocal);
                                setShops(localShops.length > 0 ? localShops : shops);
                                // A better implementation would be a dedicated filter state, but for this 'Boost' feature, this works visually.
                            }}
                            className="bg-orange-600 text-white px-6 py-3 rounded-full font-bold hover:bg-orange-700 transition shadow-lg"
                        >
                            Show Local Gems
                        </button>
                    </div>
                    <div className="relative">
                        <div className="w-64 h-48 bg-white p-2 rounded-xl shadow-xl transform rotate-3 hover:rotate-0 transition duration-300">
                            <img src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=400&auto=format" className="w-full h-full object-cover rounded-lg" alt="Local Vendor" />
                            <div className="absolute -bottom-4 -left-4 bg-white px-4 py-2 rounded-lg shadow-lg">
                                <p className="font-bold text-gray-800 text-xs">Bhalla Da Dhaba</p>
                                <p className="text-[10px] text-gray-500">Since 1985</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Shops Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="text-2xl font-bold text-gray-800 mb-6"
                >
                    {searchQuery ? `Search Results for "${searchQuery}"` : city ? `Restaurants in ${city}` : "Popular Restaurants"}
                </motion.h2>

                {loading ? (
                    <div className="text-center py-10">Loading restaurants...</div>
                ) : shops.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <p className="text-gray-500">No restaurants found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {shops.map((shop, index) => (
                            <Link to={`/shop/${shop._id}`} key={shop._id}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -5 }}
                                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition duration-300 h-full flex flex-col"
                                >
                                    <div className="h-48 w-full relative overflow-hidden group">
                                        <img src={shop.image || "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1000&auto=format"} alt={shop.name} className="w-full h-full object-cover transition duration-300 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                            <span className="text-white font-semibold flex items-center gap-2">View Menu →</span>
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{shop.name}</h3>
                                                <div className="flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                                                    <span>4.2</span>
                                                    <span className="text-[10px]">★</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {shop.isLocal && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold border border-orange-200">❤️ Local Gem</span>}
                                                {shop.story && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold border border-blue-100">📖 Has Story</span>}
                                            </div>
                                            <p className="text-gray-500 text-sm mb-3 line-clamp-1">{shop.description || "North Indian, Continental, Chinese"}</p>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-medium text-gray-600 border-t pt-3 mt-auto">
                                            <div className="flex items-center gap-1">
                                                <span className="text-primary">⌛</span>
                                                <span>30-35 mins</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-400">●</span>
                                                <span>₹250 for two</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Gamification - Spin the Wheel */}
            {isAuthenticated && user?.role === 'Customer' && (
                <>
                    <button
                        onClick={() => setShowSpinWheel(true)}
                        className="fixed bottom-48 right-6 z-[60] bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform animate-bounce"
                    >
                        <span className="text-3xl">🎰</span>
                    </button>
                    {showSpinWheel && (
                        <SpinTheWheel onClose={() => setShowSpinWheel(false)} />
                    )}
                </>
            )}

            {/* Live Order Tracking Card */}
            {activeOrder && (
                <div className="fixed bottom-4 left-0 right-0 z-[100] px-4 pointer-events-none">
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="max-w-xl mx-auto bg-white/95 backdrop-blur-xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/20 p-6 pointer-events-auto ring-1 ring-black/5 relative overflow-hidden group"
                    >
                        {/* Glow effect */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400" />

                        <div className="flex flex-col gap-6">
                            {/* Header & Status */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl shadow-inner border border-emerald-100/50">
                                        {activeOrder.orderStatus === 'OutForDelivery' ? '🛵' :
                                            activeOrder.orderStatus === 'Preparing' ? '👨‍🍳' :
                                                activeOrder.orderStatus === 'Ready' ? '🥡' : '📝'}
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Order Status: {
                                            activeOrder.orderStatus === 'Placed' ? 'Confirmed' :
                                                activeOrder.orderStatus === 'OutForDelivery' ? 'On the Way' :
                                                    activeOrder.orderStatus
                                        }</h4>
                                        <h3 className="font-black text-gray-900 text-lg leading-tight">{activeOrder.shop?.name}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Order #{activeOrder._id.slice(-6).toUpperCase()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm border border-emerald-200">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                        <span className="text-[11px] font-black uppercase tracking-wider">Live</span>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="relative pt-2 pb-2">
                                <div className="flex justify-between relative z-10">
                                    {[
                                        { label: 'Confirmed', icon: '✔', status: ['Placed', 'Preparing', 'Ready', 'OutForDelivery', 'Delivered'] },
                                        { label: 'Preparing', icon: '✔', status: ['Preparing', 'Ready', 'OutForDelivery', 'Delivered'] },
                                        { label: 'On Way', icon: '➡', status: ['OutForDelivery', 'Delivered'] },
                                        { label: 'Delivered', icon: '⬜', status: ['Delivered'] }
                                    ].map((step, idx) => {
                                        const isActive = step.status.includes(activeOrder.orderStatus);
                                        const isCurrent = (idx === 0 && activeOrder.orderStatus === 'Placed') ||
                                            (idx === 1 && activeOrder.orderStatus === 'Preparing') ||
                                            (idx === 2 && activeOrder.orderStatus === 'OutForDelivery') ||
                                            (idx === 3 && activeOrder.orderStatus === 'Delivered');

                                        return (
                                            <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 ${isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-gray-100 text-gray-400'
                                                    } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}>
                                                    {step.icon}
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'text-gray-900' : 'text-gray-300'}`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Progress Line */}
                                <div className="absolute top-6 left-0 right-0 h-[2px] bg-gray-100 -z-0 mx-8">
                                    <motion.div
                                        initial={{ width: '0%' }}
                                        animate={{
                                            width: activeOrder.orderStatus === 'Placed' ? '12.5%' :
                                                activeOrder.orderStatus === 'Preparing' ? '37.5%' :
                                                    activeOrder.orderStatus === 'Ready' ? '50%' :
                                                        activeOrder.orderStatus === 'OutForDelivery' ? '75%' :
                                                            activeOrder.orderStatus === 'Delivered' ? '100%' : '0%'
                                        }}
                                        className="h-full bg-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Footer Info: ETA & Partner */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🕒</span>
                                        <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">
                                            Estimated delivery: <span className="text-gray-900">35 minutes</span>
                                        </span>
                                    </div>
                                    {activeOrder.deliveryPartner && (
                                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                            <img
                                                src={activeOrder.deliveryPartner.avatar || "https://ui-avatars.com/api/?name=" + activeOrder.deliveryPartner.fullname}
                                                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                                alt="Partner"
                                            />
                                            <p className="text-[10px] font-bold text-gray-600">
                                                Your delivery partner <span className="text-gray-900 font-black">{activeOrder.deliveryPartner.fullname.split(' ')[0]}</span> is {
                                                    activeOrder.orderStatus === 'OutForDelivery' ? 'on the way' : 'assigned'
                                                }.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => navigate(`/track/${activeOrder._id}`)}
                                    className="w-full md:w-auto bg-gray-900 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    Track Life
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Festival Mode Toggle */}
            <FestivalModeToggle />
        </div>
    );
};

export default Home;
