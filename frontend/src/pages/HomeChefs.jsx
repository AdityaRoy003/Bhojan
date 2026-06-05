import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import api from '../utils/api';

const HomeChefs = () => {
    const navigate = useNavigate();
    const { city } = useSelector((state) => state.location);
    const { isAuthenticated } = useSelector((state) => state.user);

    const [chefs, setChefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilters, setSelectedFilters] = useState({
        rating4: false,
        fssaiVerified: false,
        openNow: false,
    });

    const fetchHomeChefs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('shopType', 'Home Chef');
            if (city) {
                params.append('city', city);
            }
            
            const { data } = await api.get(`/shop/all?${params.toString()}`);
            if (data.success) {
                setChefs(data.shops);
            }
        } catch (error) {
            console.error("Failed to fetch home chefs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHomeChefs();
    }, [city]);

    // Handle filter toggles
    const toggleFilter = (filterKey) => {
        setSelectedFilters(prev => ({
            ...prev,
            [filterKey]: !prev[filterKey]
        }));
    };

    // Filter chefs based on search and selected filter criteria
    const filteredChefs = chefs.filter(chef => {
        // Search query check
        const matchesSearch = chef.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (chef.story && chef.story.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (chef.specialTags && chef.specialTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

        if (!matchesSearch) return false;

        // Rating filter
        if (selectedFilters.rating4 && chef.rating && chef.rating < 4.0) return false;

        // FSSAI Verified
        if (selectedFilters.fssaiVerified && chef.fssaiRegistrationType === 'None') return false;

        // Open now filter
        if (selectedFilters.openNow && chef.settings && !chef.settings.isOpen) return false;

        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32 transition-colors duration-300 relative overflow-x-hidden">
            {/* Decorative Background Gradients */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            <div className="absolute top-1/3 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            {/* Header / Hero Section */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 dark:from-emerald-950 dark:to-teal-950 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 shadow-lg relative overflow-hidden">
                {/* Decorative particles */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05),transparent_40%)]"></div>
                
                <div className="max-w-7xl mx-auto">
                    {/* Back Button */}
                    <motion.button
                        whileHover={{ x: -4 }}
                        onClick={() => navigate('/home')}
                        className="flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm font-black uppercase tracking-wider transition-all"
                    >
                        <span>←</span> Back to Explore
                    </motion.button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div>
                            <span className="bg-emerald-500/30 text-emerald-200 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider mb-4 inline-block backdrop-blur-sm border border-emerald-500/20">
                                🥘 Ghar Ka Khana
                            </span>
                            <h1 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight leading-tight">
                                Authentic Home Cooked Meals
                            </h1>
                            <p className="text-emerald-100/90 text-sm sm:text-base max-w-xl font-medium">
                                Discover and order fresh, hygienic meals prepared with love by home chefs in {city || 'your area'}. Each dish tells a family's story and carries the comfort of home.
                            </p>
                        </div>
                        <div className="hidden md:flex justify-end">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                                animate={{ opacity: 1, scale: 1, rotate: -2 }}
                                transition={{ duration: 0.6 }}
                                className="w-80 h-56 bg-white/10 p-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 transform hover:rotate-0 transition duration-300"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=600&auto=format"
                                    className="w-full h-full object-cover rounded-xl"
                                    alt="Home Cook"
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
                {/* Search & Filter bar Card */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 mb-10 transition-colors">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search Input */}
                        <div className="relative w-full md:max-w-md">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Search chefs, stories, or specialties..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold placeholder:text-gray-400 placeholder:font-normal transition-all"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Filter Options */}
                        <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-start md:justify-end">
                            <button
                                onClick={() => toggleFilter('rating4')}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                                    selectedFilters.rating4
                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                                }`}
                            >
                                ★ 4.0+ Rating
                            </button>
                            <button
                                onClick={() => toggleFilter('fssaiVerified')}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                                    selectedFilters.fssaiVerified
                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                                }`}
                            >
                                FSSAI Registered
                            </button>
                            <button
                                onClick={() => toggleFilter('openNow')}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                                    selectedFilters.openNow
                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                                }`}
                            >
                                Open Now
                            </button>
                        </div>
                    </div>
                </div>

                {/* Chefs List Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">Finding chefs in your neighborhood...</p>
                    </div>
                ) : filteredChefs.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors"
                    >
                        <span className="text-5xl mb-4 block">👩🏽‍🍳</span>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Home Chefs Found</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm px-4">
                            We couldn't find any home chefs matching your search criteria or selected filters in {city || 'your area'}. Try clearing filters or changing your location.
                        </p>
                        {(searchQuery || Object.values(selectedFilters).some(Boolean)) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedFilters({ rating4: false, fssaiVerified: false, openNow: false });
                                }}
                                className="mt-6 bg-emerald-500 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredChefs.map((chef, index) => (
                                <motion.div
                                    key={chef._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link to={`/shop/${chef._id}`} className="group block h-full">
                                        <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800/80 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full shadow-sm">
                                            {/* Chef Header Banner/Image */}
                                            <div className="relative h-48 overflow-hidden bg-gray-100">
                                                <img
                                                    src={chef.image || "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=600&auto=format"}
                                                    alt={chef.name}
                                                    className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>

                                                {/* Left Top Badges */}
                                                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                                    {chef.settings?.isOpen ? (
                                                        <span className="bg-green-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-md self-start">
                                                            ● Active
                                                        </span>
                                                    ) : (
                                                        <span className="bg-gray-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-md self-start">
                                                            ● Closed
                                                        </span>
                                                    )}
                                                </div>

                                                {/* FSSAI Register Badge */}
                                                {chef.fssaiRegistrationType && chef.fssaiRegistrationType !== 'None' && (
                                                    <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 border border-emerald-500/20">
                                                        🛡️ FSSAI Approved
                                                    </div>
                                                )}

                                                {/* Rating & Distance info overlay */}
                                                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                                                    <div className="flex items-center gap-1.5 bg-emerald-600 px-2.5 py-1 rounded-xl shadow-md border border-emerald-500/20 font-black text-xs">
                                                        <span>★</span>
                                                        <span>{chef.rating || '4.2'}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                                                        ₹{chef.costForTwo || '250'} For Two
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Details Section */}
                                            <div className="p-6 flex-1 flex flex-col">
                                                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 group-hover:text-emerald-500 transition-colors mb-2 line-clamp-1">
                                                    {chef.name}
                                                </h3>

                                                {/* Bio / Chef Story snippet */}
                                                {chef.story ? (
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 italic mb-4 flex-1">
                                                        "{chef.story}"
                                                    </p>
                                                ) : (
                                                    <p className="text-gray-400 dark:text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                                                        Specialized in fresh homemade meals, catering to custom spice preferences and dietary requirements.
                                                    </p>
                                                )}

                                                {/* Special Tags */}
                                                {chef.specialTags && chef.specialTags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                                        {chef.specialTags.slice(0, 3).map((tag, i) => (
                                                            <span key={i} className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/40">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="border-t border-gray-50 dark:border-gray-800/80 pt-4 flex items-center justify-between mt-auto">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                        📍 {chef.city}
                                                    </span>
                                                    <span className="text-xs font-black uppercase tracking-wider text-emerald-500 group-hover:translate-x-1.5 transition-transform flex items-center gap-1">
                                                        View Kitchen <span>→</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomeChefs;
