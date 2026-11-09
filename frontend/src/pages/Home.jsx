import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getCachedData } from '../utils/api';
import { preloadRoute } from '../utils/routePreloader';
import RecommendationCard from '../components/RecommendationCard';
import StoryFeed from '../components/StoryFeed';
import SpinTheWheel from '../components/SpinTheWheel';
import FestivalModeToggle from '../components/FestivalModeToggle';
import ActiveOrderDrawer from '../components/ActiveOrderDrawer';
import MoodBanner from '../components/MoodBanner';
import EventBanner from '../components/EventBanner';
import BhojanAI from '../components/BhojanAI';
import PostStoryModal from '../components/PostStoryModal';
import FriendsActivity from '../components/FriendsActivity';

import { useSelector } from 'react-redux';

const categories = [
    { name: 'Biryani', emoji: '🍛', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=60&w=120&auto=format' },
    { name: 'Pizza', emoji: '🍕', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=60&w=120&auto=format' },
    { name: 'Burger', emoji: '🍔', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=60&w=120&auto=format' },
    { name: 'Snacks', emoji: '🍿', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=60&w=120&auto=format' },
    { name: 'Chinese', emoji: '🥢', image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?q=60&w=120&auto=format' },
    { name: 'South Indian', emoji: '🫓', image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=60&w=120&auto=format' },
    { name: 'Rolls', emoji: '🌯', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=60&w=120&auto=format' },
    { name: 'Dessert', emoji: '🍧', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=60&w=120&auto=format' },
    { name: 'Main Course', emoji: '🍲', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=60&w=120&auto=format' },
    { name: 'Fast Food', emoji: '🍟', image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=60&w=120&auto=format' },
    { name: 'Thali', emoji: '🍱', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=60&w=120&auto=format' },
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
    const [shops, setShops] = useState(() => {
        const cached = getCachedData('/shop/all');
        return cached?.shops || [];
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(() => {
        const cached = getCachedData('/shop/all');
        return !cached?.shops || cached.shops.length === 0;
    });
    const [selectedDietaryTags, setSelectedDietaryTags] = useState([]);
    const [personalizedRecs, setPersonalizedRecs] = useState(() => {
        const cached = getCachedData('/recommendations/personalized');
        return cached?.recommendations || [];
    });
    const [trendingItems, setTrendingItems] = useState(() => {
        const cached = getCachedData('/recommendations/trending');
        return cached?.items || [];
    });
    const [timeBasedSuggestions, setTimeBasedSuggestions] = useState(() => {
        const cached = getCachedData('/recommendations/time-based');
        return cached?.items || [];
    });
    const [mealTime, setMealTime] = useState(() => {
        const cached = getCachedData('/recommendations/time-based');
        return cached?.mealTime || '';
    });
    const { city } = useSelector((state) => state.location);
    const { isAuthenticated, user } = useSelector((state) => state.user);
    const [showSpinWheel, setShowSpinWheel] = useState(false);
    const [activeOrder, setActiveOrder] = useState(() => {
        const cached = getCachedData('/order/active');
        return cached?.order || null;
    });
    const [allShops, setAllShops] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showPostStory, setShowPostStory] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);


    // Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [filterMinPrice, setFilterMinPrice] = useState(0);
    const [filterMaxPrice, setFilterMaxPrice] = useState(1000);
    const [filterRating, setFilterRating] = useState(0);
    const [filterVeg, setFilterVeg] = useState(false);
    const [sortBy, setSortBy] = useState('relevance');
    const [activeFestival, setActiveFestival] = useState(null);

    // Prevent background scrolling when filter modal is open
    useEffect(() => {
        if (showFilters) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showFilters]);

    const activeFilterCount = (filterMinPrice > 0 ? 1 : 0) +
        (filterMaxPrice < 1000 ? 1 : 0) +
        (filterRating > 0 ? 1 : 0) +
        (filterVeg ? 1 : 0) +
        (sortBy !== 'relevance' ? 1 : 0);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            // Poll every 30 seconds to keep it fresh
            const interval = setInterval(() => {
                // Skip API calls if the tab is backgrounded
                if (document.visibilityState === 'visible') {
                    fetchActiveOrder();
                }
            }, 30000);

            // Fetch immediately when user re-focuses tab
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    fetchActiveOrder();
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                clearInterval(interval);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
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
        if (!shops.length && !getCachedData('/shop/all')) {
            setLoading(true);
        }
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

    // Client-side Filter & Sort Logic
    const filteredShops = shops.filter(shop => {
        // Price Filter
        if (shop.costForTwo && (shop.costForTwo < filterMinPrice || (filterMaxPrice < 2000 && shop.costForTwo > filterMaxPrice))) return false;
        // Rating Filter
        if (shop.rating && shop.rating < filterRating) return false;
        // Veg Filter
        if (filterVeg) {
            // Check if shop is veg or has mostly veg items
            if (shop.items && !shop.items.some(i => i.isVeg || i.foodType === 'Veg')) return false;
        }
        return true;
    }).sort((a, b) => {
        if (sortBy === 'rating_high') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'cost_low') return (a.costForTwo || 0) - (b.costForTwo || 0);
        if (sortBy === 'cost_high') return (b.costForTwo || 0) - (a.costForTwo || 0);
        return 0;
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
        if (api.clearCache) api.clearCache();
        await Promise.all([fetchShops(), fetchRecommendations()]);
        setTimeout(() => setIsRefreshing(false), 500);
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
        setSortBy('relevance');
    };

    return (
        <div
            className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32 transition-colors duration-300 relative overflow-x-hidden"
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
            <div className={`relative overflow-hidden pt-8 pb-10 md:py-20 transition-all duration-500 ${activeFestival ? `bg-gradient-to-br ${activeFestival.colors.bg}` : 'bg-white dark:bg-gray-950'}`}>
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
                                    aria-label="Filter Search"
                                >
                                    <span className={`text-lg md:text-xl transition-transform duration-500 ${showFilters ? 'rotate-180' : ''}`}>⚙️</span>
                                    {activeFilterCount > 0 && !showFilters && (
                                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm animate-pulse">
                                            {activeFilterCount}
                                        </span>
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
                        </div>
                    </motion.div>

                    {/* ── Refine Search Modal / Bottom Sheet (Teleported via Portal) ── */}
                    {typeof document !== 'undefined' && createPortal(
                        <AnimatePresence>
                            {showFilters && (
                                <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center p-0 md:p-4">
                                    {/* Mobile & Desktop Full-screen Backdrop Overlay */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="fixed inset-0 bg-black/75 backdrop-blur-md"
                                        onClick={() => setShowFilters(false)}
                                    />

                                    {/* Modal / Bottom Sheet */}
                                    <motion.div
                                        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
                                        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                                        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
                                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                        className="relative w-full md:max-w-xl bg-white dark:bg-gray-900 rounded-t-[36px] md:rounded-[36px] shadow-[0_-12px_45px_rgba(0,0,0,0.5)] md:shadow-3xl border border-gray-100 dark:border-gray-800 z-10 max-h-[88vh] flex flex-col overflow-hidden text-left"
                                    >
                                        {/* Top drag handle indicator for mobile bottom sheet */}
                                        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mt-3.5 mb-1.5 md:hidden" />

                                        {/* Modal Header */}
                                        <div className="flex justify-between items-center px-6 pt-3 pb-4 md:p-6 border-b border-gray-100 dark:border-gray-800/80">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">⚙️</span>
                                                    <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white">Refine Search</h3>
                                                    {activeFilterCount > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                                                            {activeFilterCount} Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">
                                                    Customize your food taste, budget & rating
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setShowFilters(false)}
                                                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-primary transition-all active:scale-95"
                                                aria-label="Close filters"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Scrollable Filter Content */}
                                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 overscroll-contain">
                                            {/* ── 1. Sort Options ── */}
                                            <div>
                                                <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5 block">
                                                    Sort By
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { id: 'relevance', label: '⚡ Relevance', desc: 'Default recommended' },
                                                        { id: 'rating_high', label: '⭐ Top Rated', desc: 'Highest star rating' },
                                                        { id: 'cost_low', label: '💸 Budget Friendly', desc: 'Cost: Low to High' },
                                                        { id: 'cost_high', label: '💎 Premium', desc: 'Cost: High to Low' },
                                                    ].map((sortItem) => {
                                                        const isSelected = sortBy === sortItem.id;
                                                        return (
                                                            <button
                                                                key={sortItem.id}
                                                                type="button"
                                                                onClick={() => setSortBy(sortItem.id)}
                                                                className={`p-3 rounded-2xl border text-left transition-all ${
                                                                    isSelected
                                                                        ? 'bg-primary/10 border-primary text-primary shadow-sm ring-1 ring-primary/30'
                                                                        : 'bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                                                                }`}
                                                            >
                                                                <p className="text-xs font-black">{sortItem.label}</p>
                                                                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">{sortItem.desc}</p>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* ── 2. Price Range ── */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2.5">
                                                    <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                        Price Range for Two
                                                    </label>
                                                    <span className="text-xs font-black text-primary px-2.5 py-0.5 bg-primary/10 rounded-full border border-primary/20">
                                                        ₹{filterMinPrice} - ₹{filterMaxPrice >= 2000 ? '2000+' : filterMaxPrice}
                                                    </span>
                                                </div>

                                                {/* Quick Price Presets */}
                                                <div className="flex gap-2 flex-wrap mb-4">
                                                    {[
                                                        { label: 'Any', min: 0, max: 2000 },
                                                        { label: 'Under ₹250', min: 0, max: 250 },
                                                        { label: '₹250 - ₹500', min: 250, max: 500 },
                                                        { label: '₹500 - ₹1000', min: 500, max: 1000 },
                                                        { label: '₹1000+', min: 1000, max: 2000 },
                                                    ].map((preset, idx) => {
                                                        const isMatch = filterMinPrice === preset.min && filterMaxPrice === preset.max;
                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFilterMinPrice(preset.min);
                                                                    setFilterMaxPrice(preset.max);
                                                                }}
                                                                className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all ${
                                                                    isMatch
                                                                        ? 'bg-primary text-white border-primary shadow-sm'
                                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
                                                                }`}
                                                            >
                                                                {preset.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                                                    <div>
                                                        <div className="flex justify-between text-[10px] font-black text-gray-400 mb-1">
                                                            <span>Min Cost</span>
                                                            <span className="text-gray-900 dark:text-white">₹{filterMinPrice}</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="1000"
                                                            step="50"
                                                            value={filterMinPrice}
                                                            onChange={(e) => {
                                                                const val = Number(e.target.value);
                                                                setFilterMinPrice(Math.min(val, filterMaxPrice - 50));
                                                            }}
                                                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-[10px] font-black text-gray-400 mb-1">
                                                            <span>Max Cost</span>
                                                            <span className="text-gray-900 dark:text-white">₹{filterMaxPrice}</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="200"
                                                            max="2000"
                                                            step="50"
                                                            value={filterMaxPrice}
                                                            onChange={(e) => {
                                                                const val = Number(e.target.value);
                                                                setFilterMaxPrice(Math.max(val, filterMinPrice + 50));
                                                            }}
                                                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── 3. Customer Rating ── */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2.5">
                                                    <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                        Customer Rating
                                                    </label>
                                                    {filterRating > 0 && (
                                                        <span className="text-xs font-black text-amber-500">
                                                            ★ {filterRating}+ stars
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {[
                                                        { value: 0, label: 'All' },
                                                        { value: 3.0, label: '★ 3.0+' },
                                                        { value: 3.5, label: '★ 3.5+' },
                                                        { value: 4.0, label: '★ 4.0+' },
                                                        { value: 4.5, label: '★ 4.5+' },
                                                    ].map((r) => {
                                                        const isSelected = filterRating === r.value;
                                                        return (
                                                            <button
                                                                key={r.value}
                                                                type="button"
                                                                onClick={() => setFilterRating(r.value)}
                                                                className={`py-2.5 rounded-2xl font-black text-xs flex items-center justify-center transition-all ${
                                                                    isSelected
                                                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105'
                                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                                }`}
                                                            >
                                                                {r.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* ── 4. Dietary & Preferences ── */}
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                                                    Food Preferences
                                                </label>

                                                {/* Veg Only Toggle Card */}
                                                <div
                                                    onClick={() => setFilterVeg(!filterVeg)}
                                                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                                                        filterVeg
                                                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                                                            : 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
                                                            🥬
                                                        </span>
                                                        <div>
                                                            <p className="text-xs font-black flex items-center gap-1.5">
                                                                <span>Pure Vegetarian Only</span>
                                                                {filterVeg && <span className="text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.2 rounded-md">ON</span>}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                                                                Filter restaurants offering pure veg food
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                                                            filterVeg ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
                                                        }`}
                                                    >
                                                        <motion.div
                                                            animate={{ x: filterVeg ? 20 : 0 }}
                                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                            className="w-5 h-5 bg-white rounded-full shadow-md"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Festival Mode Specials Card */}
                                                <div className="flex items-center justify-between p-4 rounded-2xl border bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-lg">
                                                            🎉
                                                        </span>
                                                        <div>
                                                            <p className="text-xs font-black text-gray-700 dark:text-gray-300">Festival Mode Specials</p>
                                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                                                                Unlock seasonal celebrations & deals
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <FestivalModeToggle onThemeChange={setActiveFestival} compact />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Modal Sticky Footer */}
                                        <div className="p-4 md:p-5 border-t border-gray-100 dark:border-gray-800/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={handleClearFilters}
                                                className="flex-1 py-3.5 px-4 rounded-2xl text-[11px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-transparent active:scale-95"
                                            >
                                                Clear All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleSearch();
                                                    setShowFilters(false);
                                                }}
                                                className="flex-[2] py-3.5 px-6 bg-gradient-to-r from-orange-600 via-primary to-rose-600 hover:opacity-95 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                <span>Apply Filters</span>
                                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                                                    {filteredShops.length} Places
                                                </span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>,
                        document.body
                    )}

                    {/* ── 3D AI Voice Assistant Banner on Mobile ── */}
                    <div className="md:hidden mt-4 max-w-2xl mx-auto px-1">
                        <motion.div
                            whileTap={{ scale: 0.97 }}
                            onClick={() => document.getElementById('bhojan-ai-trigger')?.click()}
                            className="w-full bg-gradient-to-r from-orange-500/10 via-red-500/10 to-purple-500/10 dark:from-orange-500/20 dark:to-purple-500/20 border border-orange-400/30 dark:border-orange-500/30 rounded-2xl p-2.5 px-3.5 flex items-center justify-between shadow-sm cursor-pointer card-3d"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-500 text-white flex items-center justify-center text-sm shadow-sm shrink-0">
                                    🎙️
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[9.5px] font-black uppercase tracking-widest bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                        Bhojan AI Voice Concierge
                                    </p>
                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                                        "2 Butter Chicken aur 4 Garlic Naan mangwa do"
                                    </p>
                                </div>
                            </div>
                            <span className="text-[9.5px] font-black uppercase tracking-wider text-primary bg-white dark:bg-gray-800 px-2.5 py-1 rounded-xl shadow-xs shrink-0 ml-2 border border-gray-200/50 dark:border-gray-700/50">
                                Speak ⚡
                            </span>
                        </motion.div>
                    </div>

                    {/* ── 3D MOBILE PROMOTIONAL SHOWCASE CAROUSEL ── */}
                    <div className="md:hidden mt-5">
                        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory touch-pan-x pb-2">
                            {/* Card 1: 15-Min Express */}
                            <motion.div
                                whileTap={{ scale: 0.98 }}
                                onClick={() => { setSearchQuery('Fast'); fetchShops('Fast'); }}
                                className="snap-center shrink-0 w-[84vw] sm:w-[320px] rounded-[24px] p-4 bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white relative overflow-hidden shadow-[0_12px_28px_rgba(234,88,12,0.3)] border border-white/20 card-3d cursor-pointer"
                            >
                                <div className="relative z-10">
                                    <span className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2 border border-white/20">
                                        <span>⚡</span> 15-MIN EXPRESS
                                    </span>
                                    <h3 className="text-xl font-black leading-tight text-white drop-shadow-sm">
                                        Craving Fast Food?
                                    </h3>
                                    <p className="text-[11px] font-semibold text-orange-100 mt-0.5 line-clamp-1">
                                        Lightning fast delivery to your door
                                    </p>
                                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white text-orange-600 px-3 py-1 rounded-xl w-fit shadow-md">
                                        <span>Order Now</span>
                                        <span>➔</span>
                                    </div>
                                </div>
                                <div className="absolute -right-2 -bottom-3 text-7xl opacity-90 drop-shadow-lg transform rotate-6 pointer-events-none">
                                    🛵
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                            </motion.div>

                            {/* Card 2: Prime VIP */}
                            <motion.div
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/prime-membership')}
                                className="snap-center shrink-0 w-[84vw] sm:w-[320px] rounded-[24px] p-4 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 relative overflow-hidden shadow-[0_12px_28px_rgba(245,158,11,0.3)] border border-white/40 card-3d cursor-pointer"
                            >
                                <div className="relative z-10">
                                    <span className="inline-flex items-center gap-1 bg-black/20 text-slate-900 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2">
                                        <span>👑</span> PRIME CLUB VIP
                                    </span>
                                    <h3 className="text-xl font-black leading-tight text-slate-950">
                                        Free Delivery Always
                                    </h3>
                                    <p className="text-[11px] font-bold text-slate-800 mt-0.5 line-clamp-1">
                                        Plus extra 15% OFF on every order
                                    </p>
                                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-3 py-1 rounded-xl w-fit shadow-md">
                                        <span>Explore Prime</span>
                                        <span>➔</span>
                                    </div>
                                </div>
                                <div className="absolute -right-1 -bottom-2 text-7xl opacity-90 drop-shadow-lg transform -rotate-12 pointer-events-none">
                                    👑
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full blur-2xl pointer-events-none" />
                            </motion.div>

                            {/* Card 3: Home Chefs */}
                            <motion.div
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/home-chefs')}
                                className="snap-center shrink-0 w-[84vw] sm:w-[320px] rounded-[24px] p-4 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white relative overflow-hidden shadow-[0_12px_28px_rgba(13,148,136,0.3)] border border-white/20 card-3d cursor-pointer"
                            >
                                <div className="relative z-10">
                                    <span className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2 border border-white/20">
                                        <span>🥘</span> GHAR KA KHANA
                                    </span>
                                    <h3 className="text-xl font-black leading-tight text-white drop-shadow-sm">
                                        Authentic Home Chefs
                                    </h3>
                                    <p className="text-[11px] font-semibold text-teal-100 mt-0.5 line-clamp-1">
                                        Pure hygienic home-cooked regional thalis
                                    </p>
                                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white text-teal-700 px-3 py-1 rounded-xl w-fit shadow-md">
                                        <span>View Chefs</span>
                                        <span>➔</span>
                                    </div>
                                </div>
                                <div className="absolute -right-2 -bottom-3 text-7xl opacity-90 drop-shadow-lg transform rotate-3 pointer-events-none">
                                    🍱
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                            </motion.div>

                            {/* Card 4: Flat 50% OFF */}
                            <motion.div
                                whileTap={{ scale: 0.98 }}
                                onClick={() => { setSearchQuery('Pizza'); fetchShops('Pizza'); }}
                                className="snap-center shrink-0 w-[84vw] sm:w-[320px] rounded-[24px] p-4 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 text-white relative overflow-hidden shadow-[0_12px_28px_rgba(99,102,241,0.3)] border border-white/20 card-3d cursor-pointer"
                            >
                                <div className="relative z-10">
                                    <span className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2 border border-white/20">
                                        <span>🔥</span> LIMITED OFFER
                                    </span>
                                    <h3 className="text-xl font-black leading-tight text-white drop-shadow-sm">
                                        Flat 50% OFF Feast
                                    </h3>
                                    <p className="text-[11px] font-semibold text-purple-100 mt-0.5 line-clamp-1">
                                        Use code BHOJAN50 on first 3 orders
                                    </p>
                                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white text-indigo-700 px-3 py-1 rounded-xl w-fit shadow-md">
                                        <span>Claim Offer</span>
                                        <span>➔</span>
                                    </div>
                                </div>
                                <div className="absolute -right-2 -bottom-2 text-7xl opacity-90 drop-shadow-lg transform -rotate-6 pointer-events-none">
                                    🍕
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                            </motion.div>
                        </div>
                    </div>
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

            {/* ── STICKY SWIGGY-STYLE CATEGORY CHIPS BAR ── */}
            <div className="sticky top-[56px] md:top-[64px] z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex overflow-x-auto no-scrollbar px-3 py-2 gap-2 touch-pan-x">
                    {categories.map((cat, idx) => (
                        <motion.button
                            key={idx}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                                const newCat = selectedCategory === cat.name ? null : cat.name;
                                setSelectedCategory(newCat);
                                setSearchQuery(newCat || '');
                                fetchShops(newCat || '');
                            }}
                            className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 pt-2 pb-1.5 rounded-2xl transition-all duration-200 border-b-2 ${
                                selectedCategory === cat.name
                                    ? 'border-primary bg-primary/5'
                                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                                selectedCategory === cat.name
                                    ? 'border-primary scale-105 shadow-md shadow-primary/20'
                                    : 'border-gray-100 dark:border-gray-800'
                            }`}>
                                <img src={cat.image} alt={cat.name} loading="lazy" className="w-full h-full object-cover" />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${
                                selectedCategory === cat.name
                                    ? 'text-primary'
                                    : 'text-gray-500 dark:text-gray-400'
                            }`}>
                                {cat.name}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Mood Banner */}
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
                            whileHover={{ scale: 1.15, y: -6 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 12 }}
                            className="flex-shrink-0 cursor-pointer text-center snap-start"
                            onClick={() => {
                                setSearchQuery(cat.name);
                                fetchShops(cat.name);
                            }}
                        >
                            <div className="relative w-20 h-20 md:w-36 md:h-36 mb-3">
                                {/* Glow ring background */}
                                <motion.div 
                                    className="absolute -inset-1.5 bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur-md opacity-0 z-0"
                                    whileHover={{ opacity: 0.65 }}
                                    transition={{ duration: 0.2 }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-full -z-1" />
                                <img src={cat.image} alt={cat.name} loading="lazy" className="relative w-full h-full object-cover rounded-full shadow-sm border-2 border-white dark:border-gray-800 z-10" />
                            </div>
                            <span className="text-[10px] md:text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors block">{cat.name}</span>
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
                            <img src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=60&w=250&auto=format" loading="lazy" className="w-full h-full object-cover rounded-lg" alt="Local Vendor" />
                            <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
                                <p className="font-bold text-gray-800 dark:text-gray-100 text-xs">Bhalla Da Dhaba</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Since 1985</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ghar ka Khana (Home Chefs) Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-gradient-to-r from-emerald-100 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer hover:shadow-xl"
                     onClick={() => navigate('/home-chefs')}
                >
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-emerald-600 font-bold text-sm">🥘 Ghar ka Khana</span>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Authentic Home Cooked Meals</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Freshly prepared by verified local home chefs in your neighborhood.</p>
                    </div>
                    <div className="mt-4 md:mt-0 bg-emerald-500 text-white px-5 py-2 rounded-full font-bold text-sm shadow-md">
                        Explore Home Chefs →
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
                                    className="card-3d flex flex-col bg-white dark:bg-gray-900 rounded-[26px] p-3 md:p-0 shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-gray-100/90 dark:border-gray-800/80 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    {/* Image Container with 3D depth */}
                                    <div className="relative w-full h-44 sm:h-48 md:h-52 overflow-hidden rounded-[20px] md:rounded-none">
                                        <img
                                            src={shop.image || "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=60&w=350&auto=format"}
                                            alt={shop.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                                        {/* 3D Floating Rating Badge on Image */}
                                        <div className="absolute top-2.5 right-2.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-md border border-white/30 dark:border-gray-800 flex items-center gap-1">
                                            <span className="text-xs font-black text-gray-900 dark:text-white">{shop.rating || '4.2'}</span>
                                            <span className="text-xs text-amber-500">★</span>
                                        </div>

                                        {/* 3D Delivery Time & Tag Badges on Image */}
                                        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                                            <div className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-md border border-white/20 flex items-center gap-1">
                                                <span>⚡</span> {shop.deliveryTime || '25-30'} MINS
                                            </div>
                                            {shop.shopType === 'Home Chef' ? (
                                                <div className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-xl shadow-md">
                                                    Home Cooked
                                                </div>
                                            ) : (
                                                <div className="bg-primary/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-xl shadow-md">
                                                    Flat 20% OFF
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content Container */}
                                    <div className="p-3 md:p-6 flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-base md:text-xl font-black text-gray-900 dark:text-gray-100 line-clamp-1 tracking-tight group-hover:text-primary transition-colors">
                                                {shop.name}
                                            </h3>
                                        </div>

                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 line-clamp-1 mb-2.5">
                                            {shop.description || "North Indian, Continental, Chinese, Fast Food"}
                                        </p>

                                        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-800/80 text-[11px] font-black uppercase tracking-wider">
                                            <span className="text-gray-500 dark:text-gray-400">₹{shop.costForTwo || 250} FOR TWO</span>
                                            <span className="text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                Explore Menu ➔
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Gamification - Inline Spin & Win + Loyalty card (replaces floating buttons) */}
            {
                isAuthenticated && user?.role === 'Customer' && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
                        <div className="grid grid-cols-2 gap-3">
                            {/* Spin & Win Card */}
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setShowSpinWheel(true)}
                                className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[20px] p-4 text-left shadow-lg shadow-purple-200 dark:shadow-purple-900/20 flex flex-col justify-between min-h-[96px]"
                            >
                                <div className="absolute -top-3 -right-3 text-5xl opacity-20 pointer-events-none">🎰</div>
                                <p className="text-white/70 text-[9px] font-black uppercase tracking-widest">Spin & Win</p>
                                <div>
                                    <p className="text-white font-black text-sm leading-tight">Free coupons await!</p>
                                    <p className="text-indigo-200 text-[10px] font-bold mt-0.5">Tap to spin 🎡</p>
                                </div>
                            </motion.button>

                            {/* Loyalty Rewards Card */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 rounded-[20px] p-4 shadow-lg shadow-amber-200 dark:shadow-amber-900/20 flex flex-col justify-between min-h-[96px]">
                                <div className="absolute -top-3 -right-3 text-5xl opacity-20 pointer-events-none">🎁</div>
                                <p className="text-white/70 text-[9px] font-black uppercase tracking-widest">Loyalty Rewards</p>
                                <div>
                                    <p className="text-white font-black text-sm leading-tight">2 orders to Free Delivery!</p>
                                    <div className="mt-2 h-1.5 bg-white/30 rounded-full overflow-hidden">
                                        <div className="h-full bg-white w-[70%] rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {showSpinWheel && <SpinTheWheel onClose={() => setShowSpinWheel(false)} />}
                    </div>
                )
            }

            {/* Refined Mobile Tracking Drawer */}
            <ActiveOrderDrawer order={activeOrder} />

            {/* AI Concierge - unified single FAB */}
            <BhojanAI />

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
