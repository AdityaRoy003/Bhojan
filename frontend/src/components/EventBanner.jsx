import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const EventBanner = () => {
    const [events, setEvents] = useState([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [showShops, setShowShops] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data } = await api.get('/events/active');
                if (data.success) setEvents(data.events);
            } catch (_) { }
        };
        fetchEvents();
    }, []);

    useEffect(() => {
        if (events.length <= 1) return;
        const timer = setInterval(() => setActiveIdx(i => (i + 1) % events.length), 5000);
        return () => clearInterval(timer);
    }, [events.length]);

    if (events.length === 0) return null;

    const event = events[activeIdx];

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative rounded-[28px] overflow-hidden cursor-pointer group"
                    onClick={() => setShowShops(true)}
                >
                    {/* Background */}
                    {event.bannerImage ? (
                        <img src={event.bannerImage} alt={event.title} className="w-full h-40 md:h-52 object-cover" />
                    ) : (
                        <div className="w-full h-40 md:h-52 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-between">
                        <div className="flex items-center gap-2">
                            <span className="bg-white/20 backdrop-blur text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/30">
                                🎪 Local Event
                            </span>
                            {event.festivalTag && (
                                <span className="bg-amber-500/90 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                                    {event.festivalTag}
                                </span>
                            )}
                        </div>

                        <div>
                            <motion.h3
                                initial={{ x: -20 }}
                                animate={{ x: 0 }}
                                className="text-white font-black text-xl md:text-3xl leading-tight mb-1"
                            >
                                {event.title}
                            </motion.h3>
                            {event.description && (
                                <p className="text-white/75 text-xs md:text-sm font-medium line-clamp-2 mb-3">{event.description}</p>
                            )}
                            <div className="flex items-center gap-3">
                                {event.location && (
                                    <span className="text-white/80 text-xs font-bold flex items-center gap-1">
                                        📍 {event.location}
                                    </span>
                                )}
                                {event.featuredShops?.length > 0 && (
                                    <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full border border-white/20 group-hover:bg-white/30 transition-colors">
                                        {event.featuredShops.length} Featured Restaurants →
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pagination Dots */}
                    {events.length > 1 && (
                        <div className="absolute bottom-3 right-5 flex gap-1.5">
                            {events.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIdx ? 'bg-white w-4' : 'bg-white/40'}`}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Featured Shops Modal */}
            <AnimatePresence>
                {showShops && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
                        onClick={() => setShowShops(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-t-[40px] md:rounded-[32px] w-full max-w-md p-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white">{event.title}</h3>
                                    <p className="text-xs text-gray-400 font-medium">{event.featuredShops?.length || 0} featured restaurants</p>
                                </div>
                                <button onClick={() => setShowShops(false)} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors font-bold">✕</button>
                            </div>
                            <div className="space-y-3">
                                {event.featuredShops?.map(shop => (
                                    <Link key={shop._id} to={`/shop/${shop._id}`} onClick={() => setShowShops(false)}>
                                        <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-50 dark:border-gray-800">
                                            <img src={shop.image} alt={shop.name} className="w-12 h-12 rounded-xl object-cover" />
                                            <div>
                                                <p className="font-black text-gray-900 dark:text-white text-sm">{shop.name}</p>
                                                <p className="text-xs text-amber-500 font-bold">★ {shop.rating || '4.2'} · {shop.city}</p>
                                            </div>
                                            <span className="ml-auto text-gray-400">→</span>
                                        </div>
                                    </Link>
                                ))}
                                {(!event.featuredShops || event.featuredShops.length === 0) && (
                                    <p className="text-center text-gray-400 text-sm py-4">Featured shops coming soon!</p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EventBanner;
