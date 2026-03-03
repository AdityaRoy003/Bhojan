import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import RecommendationCard from '../components/RecommendationCard';
import StoryFeed from '../components/StoryFeed';
import SpinTheWheel from '../components/SpinTheWheel';
import FestivalModeToggle from '../components/FestivalModeToggle';
import ActiveOrderDrawer from '../components/ActiveOrderDrawer';
import MoodBanner from '../components/MoodBanner';
import EventBanner from '../components/EventBanner';
import ChatbotWidget from '../components/ChatbotWidget';
import PostStoryModal from '../components/PostStoryModal';
import FriendsActivity from '../components/FriendsActivity';

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
    const [allShops, setAllShops] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showPostStory, setShowPostStory] = useState(false);

    // Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [filterMinPrice, setFilterMinPrice] = useState(0);
    const [filterMaxPrice, setFilterMaxPrice] = useState(1000);
    const [filterRating, setFilterRating] = useState(0);
    const [filterVeg, setFilterVeg] = useState(false);
    const [activeFestival, setActiveFestival] = useState(null);

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
                if (!query && !selectedDietaryTags.length && !city) {
                    setAllShops(data.shops); // Store initial full list
                }
            }
        } catch (error) {
            console.error("Failed to fetch shops");
        } finally {
            setLoading(false);
        }
    };

    // Suggestion Logic
    useEffect(() => {
        if (searchQuery.length > 1) {
            const matches = allShops.filter(shop =>
                shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                shop.city.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSuggestions(matches.slice(0, 5));
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [searchQuery, allShops]);

    // Client-side Filter Logic
    const filteredShops = shops.filter(shop => {
        // Price Filter
        if (shop.costForTwo && (shop.costForTwo < filterMinPrice || shop.costForTwo > filterMaxPrice)) return false;
        // Rating Filter
        if (shop.rating && shop.rating < filterRating) return false;
        // Veg Filter
        if (filterVeg) {
            // Check if shop is veg or has mostly veg items (simplified check)
            // Assuming we check populated items if available, or just skip if no data
            if (shop.items && !shop.items.some(i => i.isVeg || i.foodType === 'Veg')) return false;
        }
        return true;
    });

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

    const handleVoiceSearch = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice search is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setSearchQuery(transcript);
            fetchShops(transcript);
        };
        recognition.onerror = () => setIsListening(false);

        recognition.start();
    };

    const handlePullToRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchShops(), fetchRecommendations()]);
        setTimeout(() => setIsRefreshing(false), 1000);
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

    const handleClearFilters = () => {
        setFilterMinPrice(0);
        setFilterMaxPrice(1000);
        setFilterRating(0);
        setFilterVeg(false);
    };

    return (
        <div
            className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32 transition-colors duration-300 relative"
            onTouchStart={(e) => {
                if (window.scrollY === 0) {
                    const startY = e.touches[0].pageY;
                    const handleTouchMove = (moveEvent) => {
                        const currentY = moveEvent.touches[0].pageY;
                        if (currentY - startY > 150) {
                            handlePullToRefresh();
                            document.removeEventListener('touchmove', handleTouchMove);
                        }
                    };
                    document.addEventListener('touchmove', handleTouchMove, { once: true });
                }
            }}
        >
            {/* Refresh Indicator */}
            <AnimatePresence>
                {isRefreshing && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 20, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-white dark:bg-gray-800 px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 border border-primary/20"
                    >
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-black uppercase tracking-widest text-primary">Refreshing...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section - Compact & Modern */}
            <div className={`relative pt-8 pb-10 md:py-20 transition-all duration-500 ${activeFestival ? `bg-gradient-to-br ${activeFestival.colors.bg}` : 'bg-white dark:bg-gray-950'}`}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto px-4 md:px-8 relative z-10"
                >
                    <div className="text-center mb-8">
                        <h1 className="text-xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight">
                            {activeFestival ? `${activeFestival.name} Specials ${activeFestival.emoji}` : (
                                <>
                                    Premium Taste <br className="md:hidden" />
                                    <span className="text-primary italic">Delivered.</span>
                                </>
                            )}
                        </h1>
                        <p className="text-[10px] md:text-lg font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-2">
                            {activeFestival ? activeFestival.greeting : 'Top rated restaurants in your neighborhood'}
                        </p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex justify-center relative z-50 px-4"
                    >
                        <div className="flex w-full max-w-2xl bg-gray-100 dark:bg-gray-900 rounded-[24px] border border-gray-200 dark:border-gray-800 p-1 transition-all group focus-within:ring-4 focus-within:ring-primary/10">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Search for 'Biryani' or 'Pizza'..."
                                    className="w-full pl-11 pr-4 py-3 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none text-sm md:text-base font-bold placeholder:text-gray-400 placeholder:font-normal"
                                />
                                <div className="hidden md:block">
                                    <button
                                        onClick={handleVoiceSearch}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${isListening ? 'bg-primary text-white scale-110 animate-pulse' : 'text-gray-400 hover:text-primary'}`}
                                    >
                                        <span className="text-xl">{isListening ? '🛑' : '🎙️'}</span>
                                    </button>
                                </div>

                                {/* Suggestions Dropdown */}
                                <AnimatePresence>
                                    {showSuggestions && suggestions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-0 right-0 mt-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-[28px] shadow-2xl overflow-hidden z-[60] border border-white/30 dark:border-gray-800"
                                        >
                                            {suggestions.map((shop) => (
                                                <div
                                                    key={shop._id}
                                                    onClick={() => {
                                                        setSearchQuery(shop.name);
                                                        fetchShops(shop.name);
                                                        setShowSuggestions(false);
                                                    }}
                                                    className="px-5 py-4 hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer border-b border-gray-50 dark:border-gray-800 last:border-0 flex justify-between items-center transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                                                            <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-gray-900 dark:text-gray-100 text-sm">{shop.name}</p>
                                                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">{shop.city}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                                                        <span className="text-xs font-black text-amber-500">★ {shop.rating || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex items-center gap-1 md:gap-1.5 pr-1">
                                <button
                                    onClick={handleVoiceSearch}
                                    className={`md:hidden p-2.5 rounded-full transition-all flex items-center justify-center ${isListening ? 'bg-primary text-white animate-pulse' : 'text-gray-400'}`}
                                    title="Voice Search"
                                >
                                    <span className="text-lg">{isListening ? '🛑' : '🎙️'}</span>
                                </button>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`p-2.5 md:p-3 rounded-full transition-all flex items-center justify-center relative ${showFilters ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600'}`}
                                    title="Advanced Filters"
                                >
                                    <span className={`text-lg md:text-xl transition-transform duration-500 ${showFilters ? 'rotate-180' : ''}`}>⚙️</span>
                                    {(filterMinPrice > 0 || filterMaxPrice < 1000 || filterRating > 0 || filterVeg) && !showFilters && (
                                        <span className="absolute top-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-primary rounded-full border-2 border-white dark:border-gray-800"></span>
                                    )}
                                </button>

                                <button
                                    onClick={handleSearch}
                                    className="bg-primary hover:bg-primary/90 text-white px-4 md:px-10 py-3 md:py-3.5 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 flex items-center justify-center"
                                >
                                    <span className="md:hidden text-lg">🔍</span>
                                    <span className="hidden md:inline">Search</span>
                                </button>
                            </div>

                            {/* Filter Modal/Popover */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                        className="absolute top-full mt-6 right-0 md:left-auto w-full md:w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-[32px] shadow-3xl p-8 z-[60] text-left border border-white/40 dark:border-gray-800 transition-all shadow-primary/5"
                                    >
                                        <div className="flex justify-between items-center mb-8">
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 dark:text-white">Refine Search</h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Customize your results</p>
                                            </div>
                                            <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-primary transition-colors">✕</button>
                                        </div>

                                        <div className="space-y-8">
                                            <div>
                                                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">Price Range (₹{filterMinPrice} - ₹{filterMaxPrice})</label>
                                                <div className="flex gap-4">
                                                    <input
                                                        type="range" min="0" max="500" value={filterMinPrice}
                                                        onChange={(e) => setFilterMinPrice(Number(e.target.value))}
                                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                                    />
                                                    <input
                                                        type="range" min="500" max="2000" value={filterMaxPrice}
                                                        onChange={(e) => setFilterMaxPrice(Number(e.target.value))}
                                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">Min Rating ({filterRating}+)</label>
                                                <div className="flex justify-between">
                                                    {[0, 3, 3.5, 4, 4.5].map(r => (
                                                        <motion.button
                                                            whileHover={{ scale: 1.1, translateY: -2 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            key={r}
                                                            onClick={() => setFilterRating(r)}
                                                            className={`w-12 h-12 rounded-2xl font-black flex items-center justify-center transition-all ${filterRating === r ? 'bg-primary text-white shadow-xl shadow-primary/30 dark:shadow-none scale-110 z-10' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                                        >
                                                            {r === 0 ? 'All' : r}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-3xl border border-gray-100 dark:border-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">🥬</span>
                                                    <span className="text-sm font-black text-gray-700 dark:text-gray-300">Vegetarian Only</span>
                                                </div>
                                                <button
                                                    onClick={() => setFilterVeg(!filterVeg)}
                                                    className={`w-14 h-8 rounded-full transition-all duration-300 flex items-center px-1 group ${filterVeg ? 'bg-green-500 shadow-lg shadow-green-200 dark:shadow-none' : 'bg-gray-300 dark:bg-gray-700'}`}
                                                >
                                                    <motion.span
                                                        animate={{ x: filterVeg ? 24 : 0 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        className="w-6 h-6 bg-white rounded-full shadow-md"
                                                    ></motion.span>
                                                </button>
                                            </div>

                                            <div className="pt-6 flex gap-3 border-t border-gray-100 dark:border-gray-800">
                                                <button
                                                    onClick={handleClearFilters}
                                                    className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-gray-100 dark:border-gray-800"
                                                >
                                                    Clear All
                                                </button>
                                                <button
                                                    onClick={() => { handleSearch(); setShowFilters(false); }}
                                                    className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all"
                                                >
                                                    Apply Filters
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
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

            {/* Mood Banner - Time & Weather Contextual Suggestions */}
            <MoodBanner onSearch={(term) => { setSearchQuery(term); fetchShops(term); }} />

            {/* Stories Section */}
            <div className="relative">
                <StoryFeed />
                {isAuthenticated && (
                    <button
                        onClick={() => setShowPostStory(true)}
                        className="absolute top-4 right-4 md:right-8 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-10 hover:scale-105 transition-transform"
                    >
                        📸 Post Story
                    </button>
                )}
            </div>

            {/* Event Banner - Local Events & Festival Tie-ins */}
            <EventBanner />

            {/* Friends ordering activity */}
            <FriendsActivity />

            {/* Inspiration Grid (Swiggy Style) */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 mb-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">What's on your mind?</h2>
                    <div className="hidden md:flex gap-2">
                        <button onClick={() => document.getElementById('cat-slider').scrollBy({ left: -300, behavior: 'smooth' })} className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-800 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl transition">
                            <span className="text-xs">←</span>
                        </button>
                        <button onClick={() => document.getElementById('cat-slider').scrollBy({ left: 300, behavior: 'smooth' })} className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-800 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl transition">
                            <span className="text-xs">→</span>
                        </button>
                    </div>
                </div>
                <div id="cat-slider" className="flex gap-6 md:gap-10 overflow-x-auto no-scrollbar pb-6 pl-1 touch-pan-x snap-x">
                    {categories.map((cat, idx) => (
                        <motion.div
                            key={idx}
                            whileTap={{ scale: 0.9 }}
                            className="flex-shrink-0 cursor-pointer text-center group snap-start"
                            onClick={() => {
                                setSearchQuery(cat.name);
                                fetchShops(cat.name);
                            }}
                        >
                            <div className="relative w-20 h-20 md:w-36 md:h-36 mb-3 transition-transform duration-300 group-hover:scale-105">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-full -z-1" />
                                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-full shadow-sm group-hover:shadow-xl transition-all border-2 border-white dark:border-gray-800" />
                            </div>
                            <span className="text-[10px] md:text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest group-hover:text-primary transition-colors">{cat.name}</span>
                        </motion.div>
                    ))}
                </div>
                <div className="border-b border-gray-50 dark:border-gray-900 mt-4 md:hidden"></div>
            </div>

            {/* Dietary Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">🥗 Dietary Preferences</h3>
                <div className="flex flex-wrap gap-3">
                    {dietaryOptions.map((option, idx) => (
                        <motion.button
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleDietaryTag(option.name)}
                            className={`px-4 py-2 rounded-full font-bold text-sm border-2 transition-all duration-300 ${selectedDietaryTags.includes(option.name)
                                ? option.color + ' shadow-md dark:shadow-none'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <span className="mr-1">{option.icon}</span>
                            {option.name}
                        </motion.button>
                    ))}
                    {selectedDietaryTags.length > 0 && (
                        <button
                            onClick={() => setSelectedDietaryTags([])}
                            className="px-4 py-2 rounded-full font-bold text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        >
                            Clear All ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Personalized Recommendations */}
            {
                isAuthenticated && personalizedRecs.length > 0 && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <span>✨</span> For You
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {personalizedRecs.slice(0, 4).map((item) => (
                                <RecommendationCard key={item._id} item={item} reason="Based on your orders" />
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Time-Based Suggestions */}
            {
                timeBasedSuggestions.length > 0 && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <span>🕐</span> Perfect for {mealTime}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {timeBasedSuggestions.slice(0, 4).map((item) => (
                                <RecommendationCard key={item._id} item={item} reason={mealTime} />
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Trending Items */}
            {
                trendingItems.length > 0 && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <span>🔥</span> Trending Now
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {trendingItems.slice(0, 4).map((item) => (
                                <RecommendationCard key={item._id} item={item} reason="Popular in your area" />
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Support Local Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-gradient-to-r from-orange-100 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between border border-orange-200 dark:border-orange-800 transition-all">
                    <div className="mb-6 md:mb-0 md:pr-8">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Hyperlocal</span>
                            <span className="text-orange-600 font-bold text-sm">❤️ Support Small Businesses</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Taste the Authentic Local Flavors</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Discover hidden gems and family-run eateries in your neighborhood. Every order makes a difference!</p>
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
                        <div className="w-64 h-48 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-xl transform rotate-3 hover:rotate-0 transition duration-300">
                            <img src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=400&auto=format" className="w-full h-full object-cover rounded-lg" alt="Local Vendor" />
                            <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
                                <p className="font-bold text-gray-800 dark:text-gray-100 text-xs">Bhalla Da Dhaba</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Since 1985</p>
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
                    className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-6"
                >
                    {searchQuery ? `Search Results for "${searchQuery}"` : city ? `Restaurants in ${city}` : "Popular Restaurants"}
                </motion.h2>

                {loading ? (
                    <div className="text-center py-10 dark:text-gray-400">Loading restaurants...</div>
                ) : filteredShops.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">No restaurants match your filters.</p>
                        <button onClick={() => { setFilterMinPrice(0); setFilterMaxPrice(1000); setFilterRating(0); setFilterVeg(false); }} className="mt-4 text-primary font-bold underline">Clear Filters</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                        {filteredShops.map((shop, index) => (
                            <Link to={`/shop/${shop._id}`} key={shop._id} className="group">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex md:flex-col gap-4 md:gap-0 bg-white dark:bg-gray-950 md:rounded-[24px] md:shadow-sm md:border border-gray-100 dark:border-gray-800/50 md:overflow-hidden md:hover:shadow-2xl md:hover:-translate-y-1 transition-all duration-300"
                                >
                                    {/* Image Container */}
                                    <div className="relative w-28 h-28 shrink-0 md:w-full md:h-52 overflow-hidden rounded-2xl md:rounded-none">
                                        <img
                                            src={shop.image || "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format"}
                                            alt={shop.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity" />

                                        {/* Offer Badge Overlay (Modern Style) */}
                                        <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-white/20 dark:border-gray-800">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Flat ₹100 OFF</span>
                                        </div>
                                    </div>

                                    {/* Content Container */}
                                    <div className="flex-1 py-1 md:p-6 flex flex-col justify-center md:justify-start">
                                        <div className="flex justify-between items-start mb-1 md:mb-2">
                                            <h3 className="text-base md:text-xl font-black text-gray-900 dark:text-gray-100 line-clamp-1 tracking-tight group-hover:text-primary transition-colors">
                                                {shop.name}
                                            </h3>
                                            <div className="flex items-center gap-1 bg-emerald-600 text-white px-1.5 py-0.5 rounded-md shadow-sm">
                                                <span className="text-[10px] md:text-xs font-black">{shop.rating || '4.2'}</span>
                                                <span className="text-[8px]">★</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5 md:mb-3">
                                            <p className="text-[11px] md:text-sm font-bold text-gray-400 dark:text-gray-500 line-clamp-1">
                                                {shop.description || "North Indian, Continental, Chinese"}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 text-[10px] md:text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pt-1 md:pt-4 border-t border-gray-50 dark:border-gray-900 md:border-t-0">
                                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500">
                                                <span>🚲</span>
                                                <span>{shop.deliveryTime || '25-30'} MINS</span>
                                            </div>
                                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                                            <div className="flex items-center gap-1">
                                                <span>₹{shop.costForTwo || 250} FOR TWO</span>
                                            </div>
                                        </div>

                                        {/* Mobile Tags (Visible only on mobile) */}
                                        <div className="flex md:hidden gap-2 mt-3 overflow-x-auto no-scrollbar">
                                            {shop.isLocal && (
                                                <span className="bg-orange-50 dark:bg-orange-950/30 text-orange-600 border border-orange-100 dark:border-orange-900/50 px-2 py-0.5 rounded-md text-[9px] font-black uppercase">Local Gem</span>
                                            )}
                                            <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 border border-blue-100 dark:border-blue-900/50 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight">Free Delivery</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Gamification - Loyalty Progress */}
            {
                isAuthenticated && user?.role === 'Customer' && (
                    <div className="fixed bottom-48 right-6 z-[50] group md:bottom-50 md:right-8">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-64 transform translate-y-32 group-hover:translate-y-0 transition-transform duration-300 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">🎁 Loyalty Rewards</h4>
                            <p className="text-sm font-bold text-gray-800 dark:text-white mb-3">You're just <span className="text-primary font-black">2 orders</span> away from a Free Delivery!</p>
                            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 w-[70%] rounded-full shadow-sm"></div>
                            </div>
                        </div>
                        <button
                            className="absolute bottom-0 right-0 w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform animate-bounce group-hover:animate-none"
                        >
                            🎁
                        </button>
                    </div>
                )
            }

            {/* Gamification - Spin the Wheel (Button moved combined with Loyalty or kept separate) */}
            {
                isAuthenticated && user?.role === 'Customer' && (
                    <>
                        <button
                            onClick={() => setShowSpinWheel(true)}
                            className="fixed bottom-28 right-6 z-[60] md:bottom-30 md:right-8 bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform"
                            title="Spin & Win"
                        >
                            <span className="text-2xl">🎰</span>
                        </button>
                        {showSpinWheel && (
                            <SpinTheWheel onClose={() => setShowSpinWheel(false)} />
                        )}
                    </>
                )
            }

            {/* Refined Mobile Tracking Drawer */}
            <ActiveOrderDrawer order={activeOrder} />

            {/* Festival Mode Toggle */}
            <FestivalModeToggle onThemeChange={setActiveFestival} />

            {/* AI Chatbot Concierge */}
            <ChatbotWidget />

            {/* Post Story Modal */}
            <AnimatePresence>
                {showPostStory && (
                    <PostStoryModal
                        onClose={() => setShowPostStory(false)}
                        onPosted={() => setShowPostStory(false)}
                    />
                )}
            </AnimatePresence>
        </div >
    );
};

export default Home;
