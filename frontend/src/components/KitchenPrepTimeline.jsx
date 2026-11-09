import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const PREP_STEPS = [
    { id: 1, title: 'KOT Accepted', desc: 'Order verified by Chef & kitchen ticket printed', icon: '📝' },
    { id: 2, title: 'Prep & Seasoning', desc: 'Fresh ingredients & spices assembled', icon: '🥗' },
    { id: 3, title: 'Cooking on Flame', desc: 'Simmering, baking, or sizzling to perfection', icon: '🍳' },
    { id: 4, title: 'Quality Pack & Seal', desc: 'Hot-packed with safety tamper seal applied', icon: '📦' }
];

const CULINARY_TIPS = [
    '✨ Chefs tip: Our dishes are freshly prepared per order — zero pre-cooked gravies!',
    '🌿 Packed with eco-friendly breathable thermal containers to maintain crispness.',
    '🔥 Temperature sealed at 65°C to preserve authentic aromas and spice depth.',
    '⭐ Tamper-evident seal ensures untouched delivery from tandoor to table.'
];

const KitchenPrepTimeline = ({ orderStatus = 'Preparing' }) => {
    const [currentStep, setCurrentStep] = useState(2);
    const [tipIndex, setTipIndex] = useState(0);

    // Dynamic progression simulation when status is Preparing
    useEffect(() => {
        if (orderStatus === 'Placed') {
            setCurrentStep(1);
        } else if (orderStatus === 'Preparing') {
            setCurrentStep(3);
        } else if (['Ready', 'OutForDelivery', 'Delivered'].includes(orderStatus)) {
            setCurrentStep(4);
        }
    }, [orderStatus]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex(prev => (prev + 1) % CULINARY_TIPS.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-[32px] p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-gray-900 dark:text-white">
                        Live Kitchen Prep Pipeline
                    </h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50">
                    Step {currentStep} of 4
                </span>
            </div>

            {/* Stepper Pipeline */}
            <div className="relative my-6">
                {/* Background Connecting Bar */}
                <div className="absolute top-1/2 left-4 right-4 h-1.5 -translate-y-1/2 bg-gray-100 dark:bg-gray-700 rounded-full z-0" />
                {/* Active Progress Bar */}
                <motion.div
                    className="absolute top-1/2 left-4 h-1.5 -translate-y-1/2 bg-gradient-to-r from-amber-500 via-orange-500 to-primary rounded-full z-0"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentStep - 1) / 3) * 92}%` }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                />

                <div className="relative z-10 flex justify-between items-center">
                    {PREP_STEPS.map((step) => {
                        const isDone = step.id < currentStep;
                        const isCurrent = step.id === currentStep;

                        return (
                            <div key={step.id} className="flex flex-col items-center">
                                <motion.div
                                    whileHover={{ scale: 1.15 }}
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-lg sm:text-xl shadow-md border-2 transition-all ${
                                        isCurrent
                                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-white dark:border-gray-900 scale-110 shadow-orange-300 dark:shadow-none'
                                            : isDone
                                            ? 'bg-emerald-500 text-white border-emerald-400'
                                            : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'
                                    }`}
                                >
                                    {isDone ? '✓' : step.icon}
                                </motion.div>
                                <p className={`mt-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-center max-w-[70px] ${
                                    isCurrent ? 'text-orange-600 dark:text-orange-400 font-black' : isDone ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'
                                }`}>
                                    {step.title}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Current Step Description Card */}
            <div className="bg-amber-50/60 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-100/60 dark:border-amber-900/30 flex items-start gap-3">
                <span className="text-xl">👨‍🍳</span>
                <div className="flex-1">
                    <p className="text-xs font-black text-amber-900 dark:text-amber-200">
                        {PREP_STEPS[currentStep - 1]?.title}
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                        {PREP_STEPS[currentStep - 1]?.desc}
                    </p>
                </div>
            </div>

            {/* Live Rotating Culinary Insight */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <span className="text-xs">💡</span>
                <motion.p
                    key={tipIndex}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-gray-500 dark:text-gray-400 font-bold italic"
                >
                    {CULINARY_TIPS[tipIndex]}
                </motion.p>
            </div>
        </div>
    );
};

export default KitchenPrepTimeline;

