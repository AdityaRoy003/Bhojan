import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { toast } from 'react-toastify';

const PrimeMembership = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector(state => state.user);
    const [subscriptions, setSubscriptions] = useState([]);
    const [isPrimeActive, setIsPrimeActive] = useState(false);
    const [loading, setLoading] = useState(true);

    // Tiffin customization state
    const [tiffinPref, setTiffinPref] = useState('Veg');
    const [tiffinSlot, setTiffinSlot] = useState('Lunch (12:30 PM - 01:30 PM)');

    useEffect(() => {
        fetchSubscriptions();
        checkPrimeStatus();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const { data } = await api.get('/subscription/my');
            if (data.success) setSubscriptions(data.subscriptions || []);
        } catch (error) {
            console.error("Failed to fetch subscriptions");
        } finally {
            setLoading(false);
        }
    };

    const checkPrimeStatus = async () => {
        try {
            const { data } = await api.get('/subscription/prime/check');
            if (data.success) setIsPrimeActive(data.isPrime);
        } catch (error) {
            console.error("Failed to check Prime status");
        }
    };

    const handleSubscribe = async (planType, duration, amount) => {
        if (!isAuthenticated) {
            toast.warning('Please login first to subscribe!');
            navigate('/login');
            return;
        }

        try {
            const { data: { key } } = await api.get('/payment/key');
            const { data: orderRes } = await api.post('/payment/create', {
                amount: Math.round(amount)
            });

            if (!orderRes.success) {
                toast.error(orderRes.message || 'Failed to create payment order');
                return;
            }

            const options = {
                key,
                amount: orderRes.order.amount,
                currency: orderRes.order.currency,
                name: 'Bhojan',
                description: `${planType} Subscription (${duration})`,
                order_id: orderRes.order.id,
                handler: async (response) => {
                    try {
                        const { data } = await api.post('/subscription/create', {
                            planType,
                            duration,
                            mealPlan: planType === 'Tiffin' ? {
                                frequency: duration === 'weekly' ? 'Weekly' : 'Daily',
                                mealsPerDay: 1,
                                preference: tiffinPref,
                                deliverySlot: tiffinSlot
                            } : undefined,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amountPaid: amount
                        });

                        if (data.success) {
                            toast.success('Subscription activated successfully! 🎉');
                            fetchSubscriptions();
                            checkPrimeStatus();
                        }
                    } catch (err) {
                        toast.error(err.response?.data?.message || 'Verification and activation failed');
                    }
                },
                prefill: {
                    name: user?.fullname || '',
                    email: user?.email || '',
                    contact: user?.mobile || ''
                },
                theme: { color: '#f97316' }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error(error);
            // Fallback for demo testing
            try {
                const { data } = await api.post('/subscription/create', {
                    planType,
                    duration,
                    mealPlan: planType === 'Tiffin' ? {
                        frequency: duration === 'weekly' ? 'Weekly' : 'Daily',
                        mealsPerDay: 1,
                        preference: tiffinPref,
                        deliverySlot: tiffinSlot
                    } : undefined,
                    amountPaid: amount
                });
                if (data.success) {
                    toast.success('Subscription activated (Demo Mode)! 🎉');
                    fetchSubscriptions();
                    checkPrimeStatus();
                }
            } catch (err2) {
                toast.error("Could not activate subscription");
            }
        }
    };

    const handlePause = async (id, skipTomorrow = false) => {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const { data } = await api.put(`/subscription/pause/${id}`, {
                skipDate: skipTomorrow ? dateStr : null
            });
            if (data.success) {
                toast.success(skipTomorrow ? `Paused delivery for tomorrow (${dateStr})! ⏸️` : 'Subscription paused! ⏸️');
                fetchSubscriptions();
            }
        } catch (err) {
            toast.error("Failed to pause subscription");
        }
    };

    const handleResume = async (id) => {
        try {
            const { data } = await api.put(`/subscription/resume/${id}`);
            if (data.success) {
                toast.success('Subscription resumed! ▶️');
                fetchSubscriptions();
            }
        } catch (err) {
            toast.error("Failed to resume subscription");
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this subscription?")) return;
        try {
            const { data } = await api.put(`/subscription/cancel/${id}`);
            if (data.success) {
                toast.success('Subscription cancelled');
                fetchSubscriptions();
                checkPrimeStatus();
            }
        } catch (err) {
            toast.error("Failed to cancel subscription");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-red-50/30 dark:bg-gray-950 py-12 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-3 flex items-center justify-center gap-3">
                        <span>👑</span>
                        <span>Bhojan Subscriptions</span>
                    </h1>
                    <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 font-bold max-w-xl mx-auto">
                        Prime Free Deliveries & Recurring Daily Tiffin Meal Plans
                    </p>
                </motion.div>

                {/* Active Subscriptions Management */}
                {subscriptions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 mb-10"
                    >
                        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span>📋</span> My Active Subscriptions ({subscriptions.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subscriptions.map((sub) => (
                                <div key={sub._id} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-black text-base text-gray-900 dark:text-white">
                                                {sub.planType === 'Tiffin' ? '🍱 Daily Tiffin Service' : '👑 Prime Membership'}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                Valid until: {new Date(sub.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                                            sub.status === 'Active'
                                                ? 'bg-green-100 text-green-700'
                                                : sub.status === 'Paused'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {sub.status}
                                        </span>
                                    </div>

                                    {sub.mealPlan && (
                                        <div className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <p><strong>Preference:</strong> {sub.mealPlan.preference || 'Veg'}</p>
                                            <p><strong>Slot:</strong> {sub.mealPlan.deliverySlot || 'Lunch'}</p>
                                            {sub.pausedDays?.length > 0 && (
                                                <p className="text-orange-600 font-bold mt-1">
                                                    Skipped Days: {sub.pausedDays.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {sub.status !== 'Cancelled' && (
                                        <div className="flex gap-2 pt-2">
                                            {sub.status === 'Active' ? (
                                                <>
                                                    <button
                                                        onClick={() => handlePause(sub._id, true)}
                                                        className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-black border border-amber-200 transition-colors"
                                                    >
                                                        ⏸️ Skip Tomorrow
                                                    </button>
                                                    <button
                                                        onClick={() => handlePause(sub._id, false)}
                                                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black transition-colors"
                                                    >
                                                        Pause Plan
                                                    </button>
                                                </>
                                            ) : sub.status === 'Paused' ? (
                                                <button
                                                    onClick={() => handleResume(sub._id)}
                                                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black transition-colors"
                                                >
                                                    ▶️ Resume Plan
                                                </button>
                                            ) : null}
                                            <button
                                                onClick={() => handleCancel(sub._id)}
                                                className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Pricing Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {[
                        {
                            name: 'Prime Monthly',
                            price: 199,
                            duration: 'monthly',
                            popular: false,
                            desc: 'Unlimited free deliveries for 30 days'
                        },
                        {
                            name: 'Prime Yearly',
                            price: 1999,
                            duration: 'yearly',
                            popular: true,
                            savings: 'Save ₹389 / year',
                            desc: 'Best value for frequent foodies'
                        },
                        {
                            name: 'Tiffin Meal Plan',
                            price: 2499,
                            duration: 'monthly',
                            popular: false,
                            isTiffin: true,
                            desc: 'Daily fresh home-cooked meals at your door'
                        }
                    ].map((plan, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`bg-white dark:bg-gray-800 rounded-[36px] p-8 shadow-xl border-4 relative overflow-hidden flex flex-col justify-between ${
                                plan.popular ? 'border-orange-500 scale-105' : 'border-transparent'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-5 right-5 bg-orange-500 text-white px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                                    Most Popular
                                </div>
                            )}

                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium">{plan.desc}</p>

                                <div className="mb-6">
                                    <span className="text-4xl font-black text-orange-500">₹{plan.price}</span>
                                    <span className="text-gray-400 font-bold text-sm">/{plan.duration === 'yearly' ? 'year' : 'month'}</span>
                                    {plan.savings && (
                                        <p className="text-green-600 font-black text-xs mt-1.5">{plan.savings}</p>
                                    )}
                                </div>

                                {plan.isTiffin && (
                                    <div className="mb-6 space-y-2 bg-gray-50 dark:bg-gray-700/50 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-600 text-xs">
                                        <label className="font-black text-gray-700 dark:text-gray-300 block">Dietary Preference</label>
                                        <div className="flex gap-2">
                                            {['Veg', 'Non-Veg', 'Jain'].map(p => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setTiffinPref(p)}
                                                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                                                        tiffinPref === p
                                                            ? 'bg-orange-500 text-white'
                                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <ul className="space-y-3 mb-8">
                                    {(plan.isTiffin ? [
                                        '🍱 30 days of hot, home-style lunch or dinner',
                                        '⏸️ Pause or skip any day anytime',
                                        '🥗 Clean, hygienic ingredients',
                                        '🚚 Dedicated priority delivery'
                                    ] : [
                                        '🚚 Free delivery on all restaurant orders',
                                        '⚡ Priority dispatch during peak rain & hours',
                                        '🎁 Extra 15% discount on top restaurants',
                                        '🛡️ 24/7 dedicated support'
                                    ]).map((benefit, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                                            <span className="text-orange-500">✓</span>
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={() => handleSubscribe(plan.isTiffin ? 'Tiffin' : 'Prime', plan.duration, plan.price)}
                                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-gradient-to-r from-orange-500 to-red-600 text-white hover:opacity-95 shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                            >
                                {plan.isTiffin ? 'Start Tiffin Plan' : 'Get Prime'}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PrimeMembership;
