import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DishPreviewModal = ({ dish, onClose, onAddToCart }) => {
    if (!dish) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl relative"
                onClick={e => e.stopPropagation()}
                style={{ perspective: '1000px' }}
            >
                <div className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto">
                    {/* Visual Section - Parallax style */}
                    <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden group">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                            className="w-full h-full"
                        >
                            <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                        </motion.div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-white/10" />

                        {/* Interactive "3D" elements */}
                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="absolute top-8 left-8 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-white"
                        >
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ingredients</p>
                            <div className="flex gap-2 mt-2">
                                {dish.isVeg ? '🍀 Veg' : '🍗 Non-Veg'} · {dish.dietaryTags?.slice(0, 2).join(' · ')}
                            </div>
                        </motion.div>

                        <button onClick={onClose} className="absolute top-6 right-6 md:hidden w-10 h-10 bg-black/40 text-white rounded-full flex items-center justify-center font-bold">✕</button>
                    </div>

                    {/* Info Section */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                        <button onClick={onClose} className="hidden md:flex absolute top-8 right-8 w-10 h-10 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-red-500 rounded-full items-center justify-center transition-colors font-bold">✕</button>

                        <div className="mb-8">
                            <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-full">
                                Signature Dish
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mt-4 mb-2">{dish.name}</h2>
                            <p className="text-2xl font-black text-primary">₹{dish.price}</p>
                        </div>

                        <div className="space-y-6 mb-10">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Description</label>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{dish.description || 'No description available for this item.'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calories</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">~450 kcal</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prep Time</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">15-20 min</p>
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { onAddToCart?.(dish); onClose(); }}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-red-200 dark:shadow-red-900/40 flex items-center justify-center gap-3"
                        >
                            <span>🛒 Add to Cart</span>
                            <span className="w-px h-4 bg-white/30" />
                            <span>₹{dish.price}</span>
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default DishPreviewModal;
