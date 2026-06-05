import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';

const WEATHER_ICONS = { thunderstorm: '⛈️', drizzle: '🌦️', rain: '🌧️', snow: '❄️', clear: '☀️', clouds: '☁️', mist: '🌫️' };

const CONTEXTS = [
    { emoji: '🌅', mood: 'morning', text: 'Breakfast Club 🌅', sub: 'Start your morning right with fresh breakfast picks', bg: 'from-amber-400 to-orange-500', items: ['Poha', 'Idli', 'Paratha'] },
    { emoji: '☕', mood: 'brunch', text: 'Brunch Specials ☕', sub: 'Perfect midday bites to keep you going', bg: 'from-yellow-400 to-amber-500', items: ['Sandwich', 'Chai & Snacks', 'Dosa'] },
    { emoji: '🍛', mood: 'lunch', text: 'Lunch Specials 🍛', sub: 'Fill up with something hearty and delicious', bg: 'from-red-400 to-orange-500', items: ['Thali', 'Biryani', 'Dal Rice'] },
    { emoji: '🧃', mood: 'snack', text: 'Evening Snack Cravings 🧃', sub: 'Light bites & refreshers to power you through', bg: 'from-emerald-400 to-teal-500', items: ['Pakora', 'Samosa', 'Cold Coffee'] },
    { emoji: '🌙', mood: 'dinner', text: 'Dinner Feasts 🌙', sub: 'Treat yourself to the best meals tonight', bg: 'from-indigo-500 to-purple-600', items: ['Butter Chicken', 'Pizza', 'Noodles'] },
    { emoji: '🌃', mood: 'late', text: 'Late Night Cravings 🌃', sub: 'Hungry at midnight? We deliver 24/7', bg: 'from-slate-750 to-slate-900', items: ['Maggi', 'Frankie', 'Burger'] },
    { emoji: '🥳', mood: 'weekend', text: 'Weekend Mega Deals 🥳', sub: 'Flat 50% OFF on top-rated neighborhood joints', bg: 'from-pink-500 to-rose-600', items: ['Pizza Large', 'Waffles', 'Biryani Combo'] }
];

const getTimeContext = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 9) return 'morning';
    if (h >= 9 && h < 12) return 'brunch';
    if (h >= 12 && h < 15) return 'lunch';
    if (h >= 15 && h < 18) return 'snack';
    if (h >= 18 && h < 22) return 'dinner';
    return 'late';
};

const MoodBanner = ({ onSearch }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [weather, setWeather] = useState(null);
    const { city } = useSelector(state => state.location);

    // Initialize with current time mood
    useEffect(() => {
        const currentMood = getTimeContext();
        const initialIdx = CONTEXTS.findIndex(c => c.mood === currentMood);
        if (initialIdx !== -1) {
            setActiveIndex(initialIdx);
        }
    }, []);

    // Set rotation timer
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % CONTEXTS.length);
        }, 6000); // Cycles every 6 seconds
        return () => clearInterval(interval);
    }, []);

    // Weather API
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const apiKey = import.meta.env.VITE_OPENWEATHER_KEY;
                if (!apiKey || !city) return;
                const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
                if (!res.ok) return;
                const data = await res.json();
                const condition = data.weather[0].main.toLowerCase();
                const temp = Math.round(data.main.temp);
                setWeather({ condition, temp, icon: WEATHER_ICONS[condition] || '🌤️' });
            } catch (_) { }
        };
        fetchWeather();
    }, [city]);

    const getWeatherMessage = () => {
        if (!weather) return null;
        if (weather.condition === 'rain' || weather.condition === 'drizzle') return { msg: `🌧️ Rainy ${weather.temp}°C in ${city || 'your city'} — perfect for hot comfort food!`, tag: 'Pakora' };
        if (weather.condition === 'thunderstorm') return { msg: `⛈️ Stay in! Hot food delivered to your door.`, tag: 'Soup' };
        if (weather.condition === 'clear' && weather.temp > 32) return { msg: `🥵 It's ${weather.temp}°C outside! Cool down with chilled drinks or ice cream.`, tag: 'Ice Cream' };
        if (weather.condition === 'snow') return { msg: `❄️ Cold day! Perfect for hot chai and snacks.`, tag: 'Chai' };
        return null;
    };

    const weatherMsg = getWeatherMessage();
    const activeContext = CONTEXTS[activeIndex];

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-4">
            {/* Weather Override Banner */}
            {weatherMsg && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200 dark:border-blue-800 rounded-2xl px-4 py-3 flex items-center justify-between"
                >
                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300">{weatherMsg.msg}</p>
                    <button
                        onClick={() => onSearch && onSearch(weatherMsg.tag)}
                        className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-full whitespace-nowrap ml-3 hover:bg-blue-200 transition-colors"
                    >
                        Order {weatherMsg.tag}
                    </button>
                </motion.div>
            )}

            {/* Rotating Mood Banner */}
            <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 md:p-6 transition-colors shadow-sm">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${activeContext.bg} flex items-center justify-center text-white text-3xl shadow-lg shadow-orange-500/10`}>
                                {activeContext.emoji}
                            </div>
                            <div>
                                <h3 className="text-base md:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                    {activeContext.text}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {activeContext.sub}
                                </p>
                            </div>
                        </div>

                        {/* Recommendation Pills */}
                        <div className="flex flex-wrap items-center gap-2">
                            {activeContext.items.map((item, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onSearch && onSearch(item)}
                                    className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-250/60 dark:border-gray-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:border-red-500 hover:text-red-500 dark:hover:text-red-400 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                                >
                                    {item} →
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Offer Indicator Dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                    {CONTEXTS.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex ? 'bg-red-500 w-4' : 'bg-gray-300 dark:bg-gray-700 w-1.5'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MoodBanner;
