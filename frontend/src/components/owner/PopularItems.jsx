import React from 'react';
import { motion } from 'framer-motion';

const PopularItems = ({ items }) => {
    if (!items || items.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center py-12">
                <div className="text-6xl mb-4">🍽️</div>
                <p className="text-gray-500 font-medium">No sales data yet</p>
            </div>
        );
    }

    const maxCount = Math.max(...items.map(item => item.count));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">🔥 Top Sellers</h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">
                    Top {items.length}
                </span>
            </div>

            <div className="space-y-4">
                {items.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative"
                    >
                        <div className="flex items-center gap-4 mb-2">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-sm">
                                #{index + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Sold: <span className="font-bold text-gray-900">{item.count}</span></p>
                                        <p className="text-xs text-indigo-600 font-bold">₹{item.revenue.toLocaleString()}</p>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.count / maxCount) * 100}%` }}
                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                <div>
                    <p className="text-xs text-gray-500 font-medium">Total Items Sold</p>
                    <p className="text-xl font-black text-gray-900">
                        {items.reduce((sum, item) => sum + item.count, 0)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium">Total Revenue</p>
                    <p className="text-xl font-black text-indigo-600">
                        ₹{items.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default PopularItems;
