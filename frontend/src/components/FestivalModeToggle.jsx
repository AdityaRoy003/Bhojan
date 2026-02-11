import React, { useState } from 'react';
import { motion } from 'framer-motion';

const FestivalModeToggle = ({ onThemeChange }) => {
    const [activeFestival, setActiveFestival] = useState(null);

    const festivals = [
        {
            id: 'chhath',
            name: 'Chhath Puja',
            emoji: '🌅',
            colors: { primary: '#FF6B35', secondary: '#F7931E', bg: 'from-orange-100 to-yellow-100' },
            greeting: 'छठी मइया के जय हो! 🙏'
        },
        {
            id: 'holi',
            name: 'Holi',
            emoji: '🎨',
            colors: { primary: '#E91E63', secondary: '#9C27B0', bg: 'from-pink-100 to-purple-100' },
            greeting: 'होली के रंग में रंग जाओ! 🌈'
        },
        {
            id: 'diwali',
            name: 'Diwali',
            emoji: '🪔',
            colors: { primary: '#FF9800', secondary: '#FFC107', bg: 'from-yellow-100 to-orange-100' },
            greeting: 'दीपावली की शुभकामनाएं! ✨'
        }
    ];

    const handleToggle = (festival) => {
        const newFestival = activeFestival?.id === festival.id ? null : festival;
        setActiveFestival(newFestival);
        if (onThemeChange) onThemeChange(newFestival);

        // Apply theme to document root
        if (newFestival) {
            document.documentElement.style.setProperty('--primary-color', newFestival.colors.primary);
            document.documentElement.style.setProperty('--secondary-color', newFestival.colors.secondary);
        } else {
            document.documentElement.style.removeProperty('--primary-color');
            document.documentElement.style.removeProperty('--secondary-color');
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-[60]">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-[32px] shadow-2xl p-4 border-2 border-gray-100"
            >
                <p className="text-xs font-black uppercase tracking-widest text-gray-600 mb-3 text-center">
                    🎉 Festival Mode
                </p>
                <div className="flex gap-2">
                    {festivals.map((festival) => (
                        <button
                            key={festival.id}
                            onClick={() => handleToggle(festival)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${activeFestival?.id === festival.id
                                ? `bg-gradient-to-br ${festival.colors.bg} scale-110 shadow-lg`
                                : 'bg-gray-100 hover:scale-105'
                                }`}
                            title={festival.name}
                        >
                            {festival.emoji}
                        </button>
                    ))}
                </div>
                {activeFestival && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-3 p-3 rounded-2xl bg-gradient-to-br ${activeFestival.colors.bg} text-center`}
                    >
                        <p className="text-sm font-black text-gray-800">{activeFestival.greeting}</p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default FestivalModeToggle;
