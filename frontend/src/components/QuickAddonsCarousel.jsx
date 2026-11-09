import React from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const QUICK_ADDONS = [
    {
        _id: 'addon_gulab_jamun',
        name: 'Gulab Jamun (2 Pcs)',
        price: 60,
        emoji: '🍯',
        category: 'Dessert',
        foodType: 'Veg',
        description: 'Warm, soft khoya dumplings in aromatic saffron syrup.'
    },
    {
        _id: 'addon_cold_drink',
        name: 'Chilled Coke Can (300ml)',
        price: 40,
        emoji: '🥤',
        category: 'Beverage',
        foodType: 'Veg',
        description: 'Ice-cold carbonated beverage.'
    },
    {
        _id: 'addon_lassi',
        name: 'Punjabi Sweet Lassi',
        price: 55,
        emoji: '🥛',
        category: 'Beverage',
        foodType: 'Veg',
        description: 'Creamy, thick curd lassi with malai top.'
    },
    {
        _id: 'addon_brownie',
        name: 'Choco Walnut Brownie',
        price: 85,
        emoji: '🍫',
        category: 'Dessert',
        foodType: 'Veg',
        description: 'Rich dark chocolate fudge brownie with toasted walnuts.'
    },
    {
        _id: 'addon_ice_cream',
        name: 'Vanilla Sundae Scoop',
        price: 50,
        emoji: '🍨',
        category: 'Dessert',
        foodType: 'Veg',
        description: 'Silky smooth vanilla ice cream with fudge drizzle.'
    }
];

const QuickAddonsCarousel = ({ restaurant }) => {
    const dispatch = useDispatch();

    const handleAdd = (addon) => {
        dispatch(addToCart({
            ...addon,
            restaurant: restaurant || { _id: 'bhojan_addon', name: 'Bhojan Add-ons' }
        }));
        toast.success(`Added ${addon.name} to cart! 😋`);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-[36px] p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <span className="text-xl">🍦</span>
                    <div>
                        <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                            Complete Your Meal
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold">
                            Popular desserts & chilled sips loved by foodies
                        </p>
                    </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-800/40">
                    Quick Add
                </span>
            </div>

            {/* Horizontal Scroll Carousel */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-2 px-2">
                {QUICK_ADDONS.map((addon) => (
                    <motion.div
                        key={addon._id}
                        whileHover={{ y: -3 }}
                        className="flex-shrink-0 w-44 bg-gray-50 dark:bg-gray-750/50 hover:bg-orange-50/40 dark:hover:bg-gray-700/50 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/60 transition-all flex flex-col justify-between"
                    >
                        <div className="flex items-start justify-between">
                            <span className="text-3xl p-1 bg-white dark:bg-gray-800 rounded-xl shadow-xs">
                                {addon.emoji}
                            </span>
                            <span className="text-xs font-black text-gray-900 dark:text-white">
                                ₹{addon.price}
                            </span>
                        </div>
                        <div className="mt-2.5">
                            <p className="font-black text-xs text-gray-900 dark:text-white line-clamp-1 leading-snug">
                                {addon.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium line-clamp-1 mt-0.5">
                                {addon.description}
                            </p>
                        </div>
                        <button
                            onClick={() => handleAdd(addon)}
                            className="mt-3 w-full bg-white dark:bg-gray-800 hover:bg-primary hover:text-white text-primary border border-primary/30 dark:border-primary/40 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                            <span>+ ADD</span>
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default QuickAddonsCarousel;
