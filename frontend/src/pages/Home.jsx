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

const SVG_SHOP_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%231f2937'/><stop offset='100%25' stop-color='%23111827'/></linearGradient></defs><rect width='800' height='400' fill='url(%23g)'/><circle cx='400' cy='180' r='60' fill='%23374151'/><text x='50%25' y='49%25' font-size='56' text-anchor='middle' dominant-baseline='central' fill='%23f97316'>🍲</text><text x='50%25' y='72%25' font-size='22' font-family='sans-serif' font-weight='900' text-anchor='middle' fill='%23f3f4f6'>Bhojan Kitchen</text></svg>";

const RestaurantShimmerSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col bg-white dark:bg-gray-900 rounded-[26px] p-3 md:p-0 shadow-sm border border-gray-100/90 dark:border-gray-800/80 overflow-hidden">
                <div className="relative w-full h-44 sm:h-48 md:h-52 bg-gray-200 dark:bg-gray-800 rounded-[20px] md:rounded-none">
                    <div className="absolute top-2.5 right-2.5 w-12 h-6 bg-white/40 dark:bg-gray-700/60 rounded-xl" />
                    <div className="absolute bottom-2.5 left-2.5 w-24 h-6 bg-white/40 dark:bg-gray-700/60 rounded-xl" />
                </div>
                <div className="p-3 md:p-6 space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4" />
                    <div className="h-3.5 bg-gray-150 dark:bg-gray-800/60 rounded-md w-full" />
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800/80">
                        <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                        <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-20" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

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

const categoryDishes = {
    'Biryani': [
        { name: 'Hyderabadi Chicken Dum Biryani', price: 289, rating: 4.8, isVeg: false, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=60&w=250&auto=format', time: '25 mins' },
        { name: 'Royal Paneer Tikka Biryani', price: 239, rating: 4.6, isVeg: true, image: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?q=60&w=250&auto=format', time: '20 mins' },
        { name: 'Lucknowi Nawabi Biryani', price: 319, rating: 4.9, isVeg: false, image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=60&w=250&auto=format', time: '30 mins' },
    ],
    'Pizza': [
        { name: 'Farmhouse Loaded Veg Pizza', price: 299, rating: 4.7, isVeg: true, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=60&w=250&auto=format', time: '20 mins' },
        { name: 'Peri Peri BBQ Chicken Pizza', price: 349, rating: 4.8, isVeg: false, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=60&w=250&auto=format', time: '25 mins' },
        { name: 'Classic Cheese Margherita', price: 249, rating: 4.6, isVeg: true, image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?q=60&w=250&auto=format', time: '15 mins' },
    ],
    'Burger': [
        { name: 'Crispy Zinger Chicken Burger', price: 179, rating: 4.7, isVeg: false, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=60&w=250&auto=format', time: '15 mins' },
        { name: 'Double Cheese Herb Veggie Burger', price: 149, rating: 4.5, isVeg: true, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=60&w=250&auto=format', time: '15 mins' },
        { name: 'Smoky BBQ Bacon Burger', price: 219, rating: 4.8, isVeg: false, image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=60&w=250&auto=format', time: '20 mins' },
    ],
    'Snacks': [
        { name: 'Crispy Punjabi Samosas (2 pcs)', price: 49, rating: 4.9, isVeg: true, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=60&w=250&auto=format', time: '10 mins' },
        { name: 'Piping Hot Onion & Methi Pakoras', price: 79, rating: 4.8, isVeg: true, image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=60&w=250&auto=format', time: '12 mins' },
        { name: 'Peri Peri Masala French Fries', price: 99, rating: 4.5, isVeg: true, image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?q=60&w=250&auto=format', time: '15 mins' },
    ],
    'Chinese': [
        { name: 'Veg Hakka Noodles with Chili Paneer', price: 189, rating: 4.6, isVeg: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=60&w=250&auto=format', time: '20 mins' },
        { name: 'Crispy Chilli Chicken Dry', price: 249, rating: 4.8, isVeg: false, image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?q=60&w=250&auto=format', time: '20 mins' },
        { name: 'Steamed Darjeeling Momos (6 pcs)', price: 129, rating: 4.7, isVeg: true, image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=60&w=250&auto=format', time: '15 mins' },
    ],
    'South Indian': [
        { name: 'Ghee Roast Masala Dosa', price: 159, rating: 4.8, isVeg: true, image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=60&w=250&auto=format', time: '15 mins' },
        { name: 'Crispy Medu Vada Sambar', price: 119, rating: 4.7, isVeg: true, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=60&w=250&auto=format', time: '15 mins' },
    ],
    'Dessert': [
        { name: 'Hot Gulab Jamun with Rabri', price: 99, rating: 4.9, isVeg: true, image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?q=60&w=250&auto=format', time: '10 mins' },
        { name: 'Death by Chocolate Sundae', price: 189, rating: 4.8, isVeg: true, image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=60&w=250&auto=format', time: '10 mins' },
    ],
    'Thali': [
        { name: 'Royal Maharaja Special Thali', price: 299, rating: 4.9, isVeg: true, image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=60&w=250&auto=format', time: '25 mins' },
    ]
};

const getGreeting = (fullname) => {
    const hour = new Date().getHours();
    const firstName = fullname ? fullname.split(' ')[0] : 'Foodie';
    if (hour >= 5 && hour < 12) {
        return {
            title: `Good Morning, ${firstName} ☀️`,
            subtitle: 'What are you craving for breakfast today?',
            weatherTag: '☀️ Morning Fresh'
        };
    } else if (hour >= 12 && hour < 17) {
        return {
            title: `Good Afternoon, ${firstName} 🍛`,
            subtitle: 'Craving a delicious, piping hot lunch?',
            weatherTag: '🍱 Lunch Specials'
        };
    } else if (hour >= 17 && hour < 22) {
        return {
            title: `Good Evening, ${firstName} 👋`,
            subtitle: 'Craving something delicious tonight?',
            weatherTag: '🌙 Evening Delights'
        };
    } else {
        return {
            title: `Late Night Cravings, ${firstName}? 🌙`,
            subtitle: 'Hot snacks and midnight bites delivered to you',
            weatherTag: '🌌 Late Night Feasts'
        };
    }
};

const getWeatherSuggestion = (city) => {
    const cityName = city || 'Delhi';
    const hour = new Date().getHours();
    if (hour >= 17 || hour < 5) {
        return {
            emoji: '🌧',
            headline: `Rainy Day in ${cityName}`,
            subtext: 'Pakora + Chai is trending nearby',
            query: 'Pakora Chai'
        };
    } else if (hour >= 12 && hour < 17) {
        return {
            emoji: '☀️',
            headline: `Sunny Afternoon in ${cityName}`,
            subtext: 'Chilled Lassi & Biryani is trending nearby',
            query: 'Biryani Lassi'
        };
    } else {
        return {
            emoji: '🌤️',
            headline: `Pleasant Morning in ${cityName}`,
            subtext: 'Hot Poha + Filter Chai is trending nearby',
            query: 'Chai Snacks'
        };
    }
};

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

    const greetingData = getGreeting(user?.fullname);
    const weatherSuggestion = getWeatherSuggestion(city);

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

    // Suggestion Logic (Matches shop name, city, or menu dishes)
    useEffect(() => {
        if (searchQuery.length > 1) {
            const q = searchQuery.toLowerCase();
            const matches = allShops.filter(shop =>
                shop.name?.toLowerCase().includes(q) ||
                shop.city?.toLowerCase().includes(q) ||
                (shop.items && shop.items.some(i => i.name?.toLowerCase().includes(q)))
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
        setShowSuggestions(false);
        const trimmed = searchQuery.trim();
        if (trimmed) {
            fetchShops(trimmed);
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

            {/* Hero Section - Visual, Engaging & Startup Inspired */}
            <div className={`relative overflow-hidden pt-6 pb-8 md:py-16 transition-all duration-500 ${activeFestival ? `bg-gradient-to-br ${activeFestival.colors.bg}` : 'bg-white dark:bg-gray-950'}`}>
                {/* Floating Food Badges & Steam Animation Visuals (Point 3) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Floating Pizza Slice */}
                    <motion.div
                        animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
                        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute top-6 left-3 md:left-14 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-orange-200/40 dark:border-gray-800 hidden sm:flex items-center gap-2"
                    >
                        <span className="text-2xl">🍕</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">Crispy Pizza</span>
                    </motion.div>

                    {/* Floating Burger */}
                    <motion.div
                        animate={{ y: [0, 12, 0], rotate: [0, -5, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                        className="absolute top-8 right-3 md:right-14 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-orange-200/40 dark:border-gray-800 hidden sm:flex items-center gap-2"
                    >
                        <span className="text-2xl">🍔</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">Smash Burger</span>
                    </motion.div>

                    {/* Animated Delivery Scooter Passing in Background */}
                    <motion.div
                        animate={{ x: ['-20%', '120%'] }}
                        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                        className="absolute bottom-2 left-0 opacity-15 dark:opacity-10 text-3xl hidden md:block"
                    >
                        🛵💨
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto px-4 md:px-8 relative z-10"
                >
                    {/* Floating Dynamic Greeting & Food Bowl Graphic (Point 7 & Point 3) */}
                    <div className="text-center mb-6 relative">
                        {/* Steaming Food Bowl Graphic with Steam Animation */}
                        <div className="relative inline-flex items-center justify-center mb-2.5">
                            <div className="absolute -top-4 flex gap-1.5 opacity-80 pointer-events-none">
                                <motion.span
                                    animate={{ y: [0, -8, -16], opacity: [0, 0.9, 0], scaleX: [1, 1.4, 0.8] }}
                                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-1 h-3.5 bg-orange-400/80 rounded-full blur-[0.5px]"
                                />
                                <motion.span
                                    animate={{ y: [0, -12, -20], opacity: [0, 1, 0], scaleX: [1, 1.5, 0.8] }}
                                    transition={{ duration: 2.2, delay: 0.4, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-1 h-4.5 bg-amber-400/80 rounded-full blur-[0.5px]"
                                />
                                <motion.span
                                    animate={{ y: [0, -9, -17], opacity: [0, 0.8, 0], scaleX: [1, 1.3, 0.8] }}
                                    transition={{ duration: 1.9, delay: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-1 h-3.5 bg-orange-400/80 rounded-full blur-[0.5px]"
                                />
                            </div>
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-orange-500/20 via-amber-500/20 to-rose-500/20 border border-orange-500/30 flex items-center justify-center text-3xl sm:text-4xl shadow-inner">
                                🍲
                            </div>
                        </div>

                        {/* Floating Dynamic Greeting Header */}
                        <div>
                            <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                                {activeFestival ? (
                                    `${activeFestival.name} Specials ${activeFestival.emoji}`
                                ) : (
                                    <>
                                        <span>{greetingData.title}</span>
                                        <span className="block text-primary mt-1 text-base sm:text-2xl md:text-3xl font-extrabold italic">
                                            {greetingData.subtitle}
                                        </span>
                                    </>
                                )}
                            </h1>
                            <p className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1.5">
                                {activeFestival ? activeFestival.greeting : `Delivering hot & fresh in ${city || 'your neighborhood'}`}
                            </p>
                        </div>
                    </div>

                    {/* Streamlined Search Bar: Search + Mic + Search Button (Point 2) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 }}
                        className="flex flex-col items-center relative z-50 px-2 max-w-2xl mx-auto"
                    >
                        <div className="flex items-center w-full bg-white dark:bg-gray-900 rounded-[24px] border border-gray-200 dark:border-gray-800 p-1.5 transition-all group focus-within:ring-4 focus-within:ring-primary/10 shadow-sm">
                            <div className="relative flex-1 flex items-center min-w-0">
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary active:scale-95 transition-all p-1.5 rounded-full cursor-pointer z-10"
                                    title="Search restaurants & dishes"
                                    aria-label="Search"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                    placeholder="Search for 'Biryani', 'Pizza', 'Burger'..."
                                    className="w-full pl-11 pr-12 md:pr-14 py-2.5 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none text-sm md:text-base font-bold placeholder:text-gray-400 placeholder:font-normal"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            fetchShops();
                                        }}
                                        className="absolute right-3 md:right-11 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center text-xs font-black transition-all cursor-pointer z-10"
                                        title="Clear search"
                                    >
                                        ✕
                                    </button>
                                )}
                                <div className="hidden md:block">
                                    <button
                                        type="button"
                                        onClick={handleVoiceSearch}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${isListening ? 'bg-primary text-white scale-110 animate-pulse' : 'text-gray-400 hover:text-primary'} cursor-pointer z-10`}
                                        title="Voice Search"
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

                            {/* Streamlined Search Icons: Voice Mic + Search Button */}
                            <div className="flex items-center gap-1 md:gap-1.5 pr-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleVoiceSearch}
                                    className={`md:hidden p-2 rounded-full transition-all flex items-center justify-center ${isListening ? 'bg-primary text-white animate-pulse' : 'text-gray-400'}`}
                                    title="Voice Search"
                                >
                                    <span className="text-lg">{isListening ? '🛑' : '🎙️'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    className="bg-primary hover:bg-primary/90 text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-primary/20 hover:shadow-primary/30 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                                >
                                    <span className="text-sm">🔍</span>
                                    <span>Search</span>
                                </button>
                            </div>
                        </div>

                        {/* Quick Filter Pill Chip & Food Preferences Row */}
                        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowFilters(true)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm ${
                                    activeFilterCount > 0
                                        ? 'bg-primary text-white shadow-primary/25'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-primary'
                                }`}
                            >
                                <span>⚡ Filter & Sort</span>
                                {activeFilterCount > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-white text-primary text-[9px] font-black flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </motion.button>
                            <button
                                onClick={() => {
                                    const nextVeg = !filterVeg;
                                    setFilterVeg(nextVeg);
                                    if (nextVeg) fetchShops('Pure Veg');
                                    else fetchShops();
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
                                    filterVeg
                                        ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                                }`}
                            >
                                🥬 Pure Veg {filterVeg ? '✓' : ''}
                            </button>
                            <button
                                onClick={() => {
                                    setFilterRating(filterRating === 4.0 ? 0 : 4.0);
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
                                    filterRating === 4.0
                                        ? 'bg-amber-500 text-white shadow-amber-500/20'
                                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'
                                }`}
                            >
                                ★ 4.0+ {filterRating === 4.0 ? '✓' : ''}
                            </button>
                        </div>

                        {/* Weather-Aware Suggestions Widget (Point 7) */}
                        <motion.div
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setSearchQuery(weatherSuggestion.query);
                                fetchShops(weatherSuggestion.query);
                            }}
                            className="w-full mt-3.5 cursor-pointer"
                        >
                            <div className="bg-gradient-to-r from-blue-500/10 via-amber-500/10 to-orange-500/10 dark:from-blue-900/30 dark:via-amber-900/20 dark:to-orange-900/30 border border-blue-400/30 dark:border-blue-500/30 rounded-2xl p-2.5 px-3.5 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-2xl shrink-0 animate-pulse">{weatherSuggestion.emoji}</span>
                                    <div className="min-w-0">
                                        <p className="text-[9.5px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                            <span>{weatherSuggestion.headline}</span>
                                            <span className="bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full">TRENDING</span>
                                        </p>
                                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate mt-0.5">
                                            {weatherSuggestion.subtext}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[9.5px] font-black uppercase tracking-wider bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-xl shadow-xs border border-blue-100 dark:border-blue-900 shrink-0 ml-2">
                                    Try Now ⚡
                                </span>
                            </div>
                        </motion.div>
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

                    {/* ── DEDICATED YOUR ACTIVE ORDER SECTION (Point 1 & Point 7) ── */}
                    {activeOrder && (
                        <div className="mt-6 px-1">
                            <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                        Your Active Order
                                    </h3>
                                </div>
                                <Link
                                    to="/profile?tab=orders"
                                    className="text-[11px] font-black text-primary uppercase tracking-wider hover:underline flex items-center gap-1"
                                >
                                    Track Live ➔
                                </Link>
                            </div>

                            <motion.div
                                whileTap={{ scale: 0.99 }}
                                onClick={() => navigate('/profile?tab=orders')}
                                className="bg-white dark:bg-gray-900 rounded-[26px] p-4 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-[0_8px_25px_rgba(16,185,129,0.12)] cursor-pointer relative overflow-hidden group hover:border-emerald-500 transition-all text-left"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                                            {activeOrder.orderStatus === 'OutForDelivery' ? '🛵' : '👨‍🍳'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                                    {activeOrder.orderStatus === 'Placed' ? 'Confirmed' : activeOrder.orderStatus === 'OutForDelivery' ? 'Out For Delivery' : activeOrder.orderStatus}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400">#{activeOrder._id?.slice(-6).toUpperCase()}</span>
                                            </div>
                                            <h4 className="font-black text-base text-gray-900 dark:text-white truncate mt-1">
                                                {activeOrder.shop?.name || 'BR 07 Dhaba'}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 inline-block">
                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                {activeOrder.orderStatus === 'OutForDelivery' ? '25 mins' : '35 mins'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-primary flex items-center justify-end gap-1 mt-1 group-hover:translate-x-1 transition-transform">
                                            Track →
                                        </p>
                                    </div>
                                </div>

                                {/* Dynamic Delivery Widget (Point 7) */}
                                <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-gray-800/80">
                                    <div className="flex items-center justify-between text-xs font-black text-gray-700 dark:text-gray-200 mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <span className="text-base animate-bounce">🚴</span>
                                            <span>
                                                {activeOrder.deliveryPartner?.fullname 
                                                    ? `${activeOrder.deliveryPartner.fullname.split(' ')[0]} is 1.2 km away` 
                                                    : 'Rahul is 1.2 km away'}
                                            </span>
                                        </span>
                                        <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                                            {activeOrder.orderStatus === 'Delivered' ? '100%' : activeOrder.orderStatus === 'OutForDelivery' ? '60%' : activeOrder.orderStatus === 'Ready' ? '40%' : '20%'}
                                        </span>
                                    </div>
                                    {/* Visual Progress Bar */}
                                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
                                        <motion.div
                                            initial={{ width: '15%' }}
                                            animate={{
                                                width: activeOrder.orderStatus === 'Delivered' ? '100%' : activeOrder.orderStatus === 'OutForDelivery' ? '60%' : activeOrder.orderStatus === 'Ready' ? '40%' : '20%'
                                            }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
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

            {/* ── INTERACTIVE FOOD CATEGORY EXPANSION TRAY (Point 7) ── */}
            <AnimatePresence>
                {selectedCategory && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 240 }}
                        className="overflow-hidden bg-white/95 dark:bg-gray-900/95 border-b border-primary/20 shadow-md backdrop-blur-md"
                    >
                        <div className="max-w-7xl mx-auto px-4 py-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">✨</span>
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                        Top Dishes in {selectedCategory}
                                    </h4>
                                </div>
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className="text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <span>Close</span> ✕
                                </button>
                            </div>

                            <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x touch-pan-x pb-2">
                                {(categoryDishes[selectedCategory] || [
                                    { name: `Special ${selectedCategory} Platter`, price: 199, rating: 4.6, isVeg: true, image: categories.find(c => c.name === selectedCategory)?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=60&w=250&auto=format', time: '20 mins' },
                                    { name: `Signature ${selectedCategory} Feast`, price: 249, rating: 4.8, isVeg: false, image: categories.find(c => c.name === selectedCategory)?.image || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=60&w=250&auto=format', time: '25 mins' }
                                ]).map((dish, dIdx) => (
                                    <motion.div
                                        key={dIdx}
                                        whileHover={{ y: -4, scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => {
                                            setSearchQuery(dish.name);
                                            fetchShops(dish.name);
                                        }}
                                        className="snap-start shrink-0 w-48 bg-gray-50 dark:bg-gray-800 rounded-2xl p-2.5 border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer group"
                                    >
                                        <div className="relative h-28 w-full rounded-xl overflow-hidden mb-2">
                                            <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            <div className="absolute top-1.5 left-1.5 bg-white/90 dark:bg-black/80 px-1.5 py-0.5 rounded-md text-[9px] font-black flex items-center gap-1">
                                                <span className={dish.isVeg ? 'text-emerald-500' : 'text-red-500'}>●</span>
                                                <span>{dish.isVeg ? 'VEG' : 'NON-VEG'}</span>
                                            </div>
                                            <div className="absolute bottom-1.5 right-1.5 bg-black/75 text-white px-1.5 py-0.5 rounded-md text-[9px] font-black">
                                                ★ {dish.rating}
                                            </div>
                                        </div>
                                        <h5 className="font-black text-xs text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                            {dish.name}
                                        </h5>
                                        <div className="flex items-center justify-between mt-1 text-[11px] font-black">
                                            <span className="text-gray-900 dark:text-gray-100">₹{dish.price}</span>
                                            <span className="text-primary text-[10px] uppercase tracking-wider font-black">Order ➔</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── TOP RATED NEARBY (Visible within 1 scroll) (Point 6) ── */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🔥</span>
                            <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                Top Rated Nearby
                            </h2>
                        </div>
                        <p className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">
                            Highest rated food spots near you • Fast delivery
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            document.getElementById('all-restaurants-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-[11px] font-black uppercase tracking-wider text-primary hover:underline shrink-0"
                    >
                        See All ({shops.length}) ➔
                    </button>
                </div>

                <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto no-scrollbar snap-x touch-pan-x pb-2">
                    {(filteredShops.length > 0 ? filteredShops : shops).slice(0, 6).map((shop) => (
                        <Link
                            key={shop._id}
                            to={`/shop/${shop._id}`}
                            className="snap-start shrink-0 w-[260px] sm:w-[280px] md:w-auto card-3d flex flex-col bg-white dark:bg-gray-900 rounded-[24px] shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden group transition-all"
                        >
                            <div className="relative h-36 w-full overflow-hidden">
                                <img
                                    src={shop.image || "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=60&w=350&auto=format"}
                                    alt={shop.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                {/* Rating badge */}
                                <div className="absolute top-2.5 right-2.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-2 py-0.5 rounded-xl shadow-md flex items-center gap-1 text-xs font-black">
                                    <span className="text-gray-900 dark:text-white">{shop.rating || '4.5'}</span>
                                    <span className="text-amber-500">★</span>
                                </div>
                                {/* Delivery Time */}
                                <div className="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-xl flex items-center gap-1">
                                    <span>⚡</span> {shop.deliveryTime || '25-30'} mins
                                </div>
                            </div>

                            <div className="p-3.5 flex flex-col justify-between flex-1">
                                <div>
                                    <h3 className="font-black text-sm md:text-base text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                        {shop.name}
                                    </h3>
                                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                        {shop.description || 'Biryani, North Indian, Fast Food'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-gray-100 dark:border-gray-800 text-[10px] font-black uppercase tracking-wider">
                                    <span className="text-gray-500 dark:text-gray-400">₹{shop.costForTwo || 250} FOR TWO</span>
                                    <span className="text-primary font-black flex items-center gap-0.5">
                                        Order ➔
                                    </span>
                                </div>
                            </div>
                        </Link>
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
            <div id="all-restaurants-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-6"
                >
                    {searchQuery ? `Search Results for "${searchQuery}"` : city ? `Restaurants in ${city}` : "Popular Restaurants"}
                </motion.h2>

                {loading ? (
                    <RestaurantShimmerSkeleton />
                ) : filteredShops.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-white dark:bg-gray-800/80 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/80">
                        <span className="text-4xl block mb-2">🍽️</span>
                        <h4 className="text-base font-black text-gray-800 dark:text-white mb-1">No restaurants match your filters</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium">Try popular cuisines or reset active filters</p>
                        <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto mb-4">
                            {['Biryani', 'Pizza', 'Burger', 'Chinese', 'Thali'].map(item => (
                                <button
                                    key={item}
                                    onClick={() => {
                                        setFilterMinPrice(0);
                                        setFilterMaxPrice(2000);
                                        setFilterRating(0);
                                        setFilterVeg(false);
                                        setSelectedDietaryTags([]);
                                        setSearchQuery(item);
                                        fetchShops(item);
                                    }}
                                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-primary hover:text-white transition-all cursor-pointer"
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setFilterMinPrice(0);
                                setFilterMaxPrice(2000);
                                setFilterRating(0);
                                setFilterVeg(false);
                                setSelectedDietaryTags([]);
                                setSearchQuery('');
                                fetchShops();
                            }}
                            className="text-xs font-black text-primary hover:underline uppercase tracking-wider cursor-pointer"
                        >
                            Reset All Filters
                        </button>
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
                                    <div className="relative w-full h-44 sm:h-48 md:h-52 overflow-hidden rounded-[20px] md:rounded-none bg-gray-100 dark:bg-gray-800">
                                        <img
                                            src={shop.image || "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=60&w=350&auto=format"}
                                            alt={shop.name}
                                            loading="lazy"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = SVG_SHOP_FALLBACK;
                                            }}
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
