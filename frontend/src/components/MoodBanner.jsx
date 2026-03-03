import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const WEATHER_ICONS = { thunderstorm: '⛈️', drizzle: '🌦️', rain: '🌧️', snow: '❄️', clear: '☀️', clouds: '☁️', mist: '🌫️' };

const getTimeContext = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 9) return { emoji: '🌅', mood: 'morning', text: 'Start your morning right', sub: 'Fresh breakfast picks near you', bg: 'from-amber-400 to-orange-400', items: ['Poha', 'Idli', 'Paratha'] };
    if (h >= 9 && h < 12) return { emoji: '☕', mood: 'brunch', text: 'Brunch time!', sub: 'Perfect midday bites', bg: 'from-yellow-400 to-amber-500', items: ['Sandwich', 'Chai & Snacks', 'Dosa'] };
    if (h >= 12 && h < 15) return { emoji: '🍛', mood: 'lunch', text: 'Lunchtime is here', sub: 'Fill up with something hearty', bg: 'from-red-400 to-orange-500', items: ['Thali', 'Biryani', 'Dal Rice'] };
    if (h >= 15 && h < 18) return { emoji: '🧃', mood: 'snack', text: 'Evening snack cravings?', sub: 'Light bites to power you through', bg: 'from-emerald-400 to-teal-500', items: ['Pakora', 'Samosa', 'Cold Coffee'] };
    if (h >= 18 && h < 22) return { emoji: '🌙', mood: 'dinner', text: 'Dinner time!', sub: 'Treat yourself tonight', bg: 'from-indigo-500 to-purple-600', items: ['Butter Chicken', 'Pizza', 'Noodles'] };
    return { emoji: '🌃', mood: 'late', text: 'Late night cravings?', sub: 'We deliver even at midnight', bg: 'from-gray-700 to-gray-900', items: ['Maggi', 'Frankie', 'Burger'] };
};

const MoodBanner = ({ onSearch }) => {
    const [context, setContext] = useState(null);
    const [weather, setWeather] = useState(null);
    const { city } = useSelector(state => state.location);
    const { isAuthenticated } = useSelector(state => state.user);

    useEffect(() => {
        setContext(getTimeContext());
        // Attempt weather fetch (silently fail if API key missing)
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

    if (!context) return null;

    const getWeatherMessage = () => {
        if (!weather) return null;
        if (weather.condition === 'rain' || weather.condition === 'drizzle') return { msg: `🌧️ Rainy ${weather.temp}°C in ${city || 'your city'} — perfect for hot comfort food!`, tag: 'Pakora' };
        if (weather.condition === 'thunderstorm') return { msg: `⛈️ Stay in! Hot food delivered to your door.`, tag: 'Soup' };
        if (weather.condition === 'clear' && weather.temp > 32) return { msg: `🥵 It's ${weather.temp}°C outside! Cool down with chilled drinks or ice cream.`, tag: 'Ice Cream' };
        if (weather.condition === 'snow') return { msg: `❄️ Cold day! Perfect for hot chai and snacks.`, tag: 'Chai' };
        return null;
    };

    const weatherMsg = getWeatherMessage();

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-2">
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

            {/* Time-Based Mood Cards */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1"
            >
                {/* Headline Chip */}
                <div className={`flex-shrink-0 flex items-center gap-2 bg-gradient-to-r ${context.bg} text-white px-4 py-2.5 rounded-2xl shadow-lg`}>
                    <span className="text-xl">{context.emoji}</span>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest leading-none">{context.text}</p>
                        <p className="text-[10px] text-white/80 font-medium mt-0.5">{context.sub}</p>
                    </div>
                </div>

                {/* Quick Suggestion Pills */}
                {context.items.map((item, i) => (
                    <motion.button
                        key={i}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSearch && onSearch(item)}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex-shrink-0 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                        {item} →
                    </motion.button>
                ))}
            </motion.div>
        </div>
    );
};

export default MoodBanner;
