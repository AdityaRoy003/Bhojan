import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WeatherSurgeBanner = ({ onSurgeAmountChange }) => {
    // Detect peak dinner/lunch hours or default active for demonstration
    const [isSurgeActive, setIsSurgeActive] = useState(true);
    const [surgeType, setSurgeType] = useState('weather'); // 'weather' | 'dinner_rush'

    useEffect(() => {
        const hour = new Date().getHours();
        const isPeakTime = (hour >= 19 && hour <= 23) || (hour >= 12 && hour <= 15);
        if (isPeakTime) {
            setSurgeType('dinner_rush');
        } else {
            setSurgeType('weather');
        }
        onSurgeAmountChange?.(isSurgeActive ? 20 : 0);
    }, [isSurgeActive, onSurgeAmountChange]);

    if (!isSurgeActive) return null;

    const surgeFee = 20;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-blue-500/10 border border-amber-300/40 dark:border-amber-700/40 rounded-3xl p-3.5 sm:p-4 mb-4 flex items-center justify-between gap-3 shadow-xs"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg flex-shrink-0 animate-pulse">
                        {surgeType === 'weather' ? '🌧️' : '🔥'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                                {surgeType === 'weather' ? 'Rain & Weather Surge' : 'Peak Dinner Rush'}
                            </h4>
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500 text-white">
                                +₹{surgeFee} Partner Tip
                            </span>
                        </div>
                        <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium leading-tight mt-0.5">
                            100% of this surge fee goes directly to your delivery partner for braving rush traffic and wet conditions.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsSurgeActive(false)}
                    className="text-gray-400 hover:text-gray-600 text-xs font-bold px-1.5 py-1"
                    title="Dismiss"
                >
                    ✕
                </button>
            </motion.div>
        </AnimatePresence>
    );
};

export default WeatherSurgeBanner;

