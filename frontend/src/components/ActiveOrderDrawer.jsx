import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ActiveOrderDrawer = ({ order }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(35); // Initial ETA
    const navigate = useNavigate();

    useEffect(() => {
        if (!order) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => (prev > 1 ? prev - 1 : 1));
        }, 60000); // Decrement every minute
        return () => clearInterval(interval);
    }, [order]);

    if (!order) return null;

    const steps = [
        { label: 'Confirmed', icon: '✅', status: ['Placed', 'Preparing', 'Ready', 'OutForDelivery', 'Delivered'] },
        { label: 'Preparing', icon: '🍳', status: ['Preparing', 'Ready', 'OutForDelivery', 'Delivered'] },
        { label: 'On Way', icon: '🚚', status: ['OutForDelivery', 'Delivered'] },
        { label: 'Delivered', icon: '📦', status: ['Delivered'] }
    ];

    const currentStepIndex = steps.findIndex(step =>
        (step.label === 'Confirmed' && order.orderStatus === 'Placed') ||
        (step.label === 'Preparing' && order.orderStatus === 'Preparing') ||
        (step.label === 'On Way' && order.orderStatus === 'OutForDelivery') ||
        (step.label === 'Delivered' && order.orderStatus === 'Delivered')
    );

    // Fallback if index not found exactly
    const activeIndex = currentStepIndex !== -1 ? currentStepIndex :
        order.orderStatus === 'Ready' ? 1 : 0;

    return (
        <>
            {/* Sticky Compact Card */}
            {!isOpen && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-[100px] left-4 right-4 z-[90] md:hidden bg-white dark:bg-gray-900 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-800 p-4 transition-all active:scale-[0.98] cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-xl shadow-inner border border-emerald-100/50 dark:border-emerald-800/50">
                                {order.orderStatus === 'OutForDelivery' ? '🛵' : '👨‍🍳'}
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                    {order.orderStatus === 'Placed' ? 'Confirmed' : order.orderStatus}
                                </h4>
                                <h3 className="font-black text-gray-900 dark:text-white text-sm line-clamp-1">{order.shop?.name}</h3>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{timeLeft} mins</span>
                            </div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Track Order →</p>
                        </div>
                    </div>
                    {/* Tiny Progress Bar */}
                    <div className="mt-3 w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
                            className="h-full bg-emerald-500"
                        />
                    </div>
                </motion.div>
            )}

            {/* Slide-up Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] md:hidden"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 z-[120] rounded-t-[40px] shadow-2xl md:hidden overflow-hidden"
                        >
                            <div className="px-6 pt-4 pb-12">
                                {/* Pull Handle */}
                                <div className="flex justify-center mb-6">
                                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                                </div>

                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Live Tracking</h4>
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">{order.shop?.name}</h2>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Order #{order._id.slice(-6).toUpperCase()}</p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-2xl flex flex-col items-center border border-emerald-100 dark:border-emerald-800">
                                        <span className="text-xl font-black text-emerald-600">{timeLeft}</span>
                                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">MINS</span>
                                    </div>
                                </div>

                                {/* Horizontal Stepper */}
                                <div className="relative mb-10 px-2">
                                    <div className="flex justify-between relative z-10">
                                        {steps.map((step, idx) => {
                                            const isDone = idx <= activeIndex;
                                            const isCurrent = idx === activeIndex;

                                            return (
                                                <div key={idx} className="flex flex-col items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 ${isDone ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                                        } ${isCurrent ? 'ring-4 ring-emerald-100 dark:ring-emerald-900/50 scale-110' : ''}`}>
                                                        {isDone ? step.icon : '○'}
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isDone ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-700'}`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Line */}
                                    <div className="absolute top-6 left-6 right-6 h-[2px] bg-gray-100 dark:bg-gray-800 -z-0">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                                            className="h-full bg-emerald-500"
                                        />
                                    </div>
                                </div>

                                {/* Delivery Partner */}
                                {order.deliveryPartner && (
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-4 flex items-center gap-4 border border-gray-100 dark:border-gray-800 mb-8">
                                        <div className="relative">
                                            <img
                                                src={order.deliveryPartner.avatar || "https://ui-avatars.com/api/?name=" + order.deliveryPartner.fullname}
                                                className="w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                                                alt="Partner"
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900"></div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Delivery Partner</p>
                                            <h4 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{order.deliveryPartner.fullname}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">★ 4.9</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">2.5k Deliveries</span>
                                            </div>
                                        </div>
                                        <button className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-red-100 dark:shadow-none hover:scale-105 transition-transform active:scale-95">
                                            📞
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest"
                                    >
                                        Minimize
                                    </button>
                                    <button
                                        onClick={() => navigate(`/track/${order._id}`)}
                                        className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-100 dark:shadow-none flex items-center justify-center gap-2"
                                    >
                                        Live Activity Page 🛵
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default ActiveOrderDrawer;
