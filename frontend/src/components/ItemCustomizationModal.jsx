import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Default mock variants/addons if dish has none yet in DB, ensuring every item can be customized
const DEFAULT_VARIANTS = [
    { name: 'Regular Portion', price: 0, isDefault: true },
    { name: 'Medium (+20%)', price: 50, isDefault: false },
    { name: 'Large (+50%)', price: 110, isDefault: false },
];

const DEFAULT_ADDONS = [
    { name: 'Extra Cheese', price: 40 },
    { name: 'Chef Special Dip / Chutney', price: 25 },
    { name: 'Spicy Masala Sprinkles', price: 15 },
    { name: 'Crispy Fryums / Papad', price: 20 },
];

const ItemCustomizationModal = ({ item, isOpen, onClose, onAddToCart }) => {
    if (!isOpen || !item) return null;

    // Use dish variants or fallback defaults
    const variantOptions = item.variants && item.variants.length > 0 && item.variants[0].options?.length > 0
        ? item.variants[0].options
        : DEFAULT_VARIANTS;

    const addOnOptions = item.addOns && item.addOns.length > 0
        ? item.addOns
        : DEFAULT_ADDONS;

    const [selectedVariant, setSelectedVariant] = useState(
        variantOptions.find(v => v.isDefault) || variantOptions[0]
    );
    const [selectedAddOns, setSelectedAddOns] = useState([]);
    const [cookingInstructions, setCookingInstructions] = useState('');
    const [quantity, setQuantity] = useState(1);

    const toggleAddOn = (addon) => {
        if (selectedAddOns.some(a => a.name === addon.name)) {
            setSelectedAddOns(selectedAddOns.filter(a => a.name !== addon.name));
        } else {
            setSelectedAddOns([...selectedAddOns, addon]);
        }
    };

    const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const unitPrice = (Number(item.price) || 0) + (Number(selectedVariant?.price) || 0) + addOnsTotal;
    const finalTotal = unitPrice * quantity;

    const handleConfirm = () => {
        onAddToCart({
            ...item,
            price: unitPrice, // customized per-item price
            basePrice: item.price,
            selectedVariant: {
                name: item.variants?.[0]?.name || 'Portion',
                option: selectedVariant?.name || 'Regular',
                price: Number(selectedVariant?.price) || 0
            },
            selectedAddOns,
            cookingInstructions,
            quantity
        });
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black backdrop-blur-sm cursor-pointer"
                />

                {/* Bottom Sheet / Modal */}
                <motion.div
                    initial={{ y: '100%', opacity: 0.5 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-start gap-4">
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-sm border border-gray-100 dark:border-gray-800"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center bg-white ${item.foodType === 'Veg' ? 'border-green-600' : 'border-red-600'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${item.foodType === 'Veg' ? 'bg-green-600' : 'bg-red-600'}`} />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">
                                    Customise Your Meal
                                </span>
                            </div>
                            <h3 className="font-black text-lg text-gray-900 dark:text-white truncate">{item.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{item.description || 'Prepared fresh on order.'}</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-1">Base Price: ₹{item.price}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors font-bold text-sm shrink-0"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* 1. Size / Portion (Required single-select) */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
                                    1. Choose Portion / Size <span className="text-red-500">*</span>
                                </h4>
                                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full uppercase">Required</span>
                            </div>
                            <div className="space-y-2">
                                {variantOptions.map((v, i) => {
                                    const isSelected = selectedVariant?.name === v.name;
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedVariant(v)}
                                            className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-sm'
                                                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                                    {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{v.name}</span>
                                            </div>
                                            <span className="text-sm font-black text-gray-900 dark:text-white">
                                                {v.price > 0 ? `+₹${v.price}` : 'Base'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Add-ons (Multi-select optional) */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
                                    2. Add-ons & Extra Goodies
                                </h4>
                                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold px-2 py-0.5 rounded-full uppercase">Optional</span>
                            </div>
                            <div className="space-y-2">
                                {addOnOptions.map((a, i) => {
                                    const isSelected = selectedAddOns.some(item => item.name === a.name);
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => toggleAddOn(a)}
                                            className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                                                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                                    {isSelected && <span className="text-xs leading-none">✓</span>}
                                                </div>
                                                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{a.name}</span>
                                            </div>
                                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                +₹{a.price}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Cooking Instructions */}
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 mb-2">
                                3. Special Cooking Instructions
                            </h4>
                            <textarea
                                value={cookingInstructions}
                                onChange={(e) => setCookingInstructions(e.target.value)}
                                placeholder="e.g. Less spicy, no onion/garlic, well done, extra crispy..."
                                rows={2}
                                maxLength={200}
                                className="w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl p-3.5 text-xs text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Footer with Quantity Counter & Add Button */}
                    <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center gap-4">
                        {/* Quantity Counter */}
                        <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-1 shadow-sm shrink-0">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                -
                            </button>
                            <span className="w-8 text-center font-black text-sm text-gray-900 dark:text-white">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                            >
                                +
                            </button>
                        </div>

                        {/* Confirm Add Button */}
                        <button
                            onClick={handleConfirm}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:opacity-95 transition-all flex items-center justify-between px-5 active:scale-95"
                        >
                            <span>Add Item</span>
                            <span className="text-base font-black">₹{finalTotal}</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ItemCustomizationModal;

