import React from 'react';
import { motion } from 'framer-motion';

const RecommendationCard = ({ item, reason }) => {
    const getDietaryBadgeColor = (tag) => {
        const colors = {
            'Vegan': 'bg-green-100 text-green-700 border-green-200',
            'Gluten-Free': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'Jain': 'bg-orange-100 text-orange-700 border-orange-200',
            'Keto': 'bg-purple-100 text-purple-700 border-purple-200',
            'Dairy-Free': 'bg-blue-100 text-blue-700 border-blue-200',
            'Nut-Free': 'bg-pink-100 text-pink-700 border-pink-200',
            'Halal': 'bg-teal-100 text-teal-700 border-teal-200',
            'Organic': 'bg-lime-100 text-lime-700 border-lime-200'
        };
        return colors[tag] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const getSpiceIcon = (level) => {
        const icons = {
            'Mild': '🌱',
            'Medium': '🌶️',
            'Spicy': '🔥'
        };
        return icons[level] || '🌶️';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all duration-300"
        >
            <div className="relative h-40 overflow-hidden">
                <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                />
                {reason && (
                    <div className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-bold">
                        {reason}
                    </div>
                )}
                {item.isPopular && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                        ⭐ Popular
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{item.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{item.shop?.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-sm">{item.foodType === 'Veg' ? '🟢' : '🔴'}</span>
                        <span className="text-sm">{getSpiceIcon(item.spiceLevel)}</span>
                    </div>
                </div>

                {item.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                )}

                {/* Dietary Tags */}
                {item.dietaryTags && item.dietaryTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {item.dietaryTags.slice(0, 3).map((tag, idx) => (
                            <span
                                key={idx}
                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${getDietaryBadgeColor(tag)}`}
                            >
                                {tag}
                            </span>
                        ))}
                        {item.dietaryTags.length > 3 && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border bg-gray-50 text-gray-600">
                                +{item.dietaryTags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-gray-900 dark:text-white">₹{item.price}</span>
                        {item.rating > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                                <span className="text-yellow-500">★</span>
                                <span className="font-bold">{item.rating.toFixed(1)}</span>
                                <span className="text-gray-400">({item.ratingCount})</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default RecommendationCard;
