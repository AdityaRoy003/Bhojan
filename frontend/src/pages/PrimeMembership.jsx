import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import api from '../utils/api';

const PrimeMembership = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector(state => state.user);
    const [subscriptions, setSubscriptions] = useState([]);
    const [isPrimeActive, setIsPrimeActive] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubscriptions();
        checkPrimeStatus();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const { data } = await api.get('/subscription/my');
            if (data.success) setSubscriptions(data.subscriptions);
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
            alert('Please login first to subscribe!');
            navigate('/login');
            return;
        }

        try {
            // 1️⃣ Get public key from backend
            const { data: { key } } = await api.get('/payment/key');

            // 2️⃣ Create a payment order on backend
            const { data: orderRes } = await api.post('/payment/create', {
                amount: Math.round(amount)
            });

            if (!orderRes.success) {
                alert(orderRes.message || 'Failed to create payment order');
                return;
            }

            // 3️⃣ Open Razorpay Checkout modal
            const options = {
                key,
                amount: orderRes.order.amount,
                currency: orderRes.order.currency,
                name: 'Bhojan Prime',
                description: `${planType} Subscription (${duration})`,
                order_id: orderRes.order.id,
                handler: async (response) => {
                    try {
                        // 4️⃣ Verify and activate subscription on backend
                        const { data } = await api.post('/subscription/create', {
                            planType,
                            duration,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amountPaid: amount
                        });

                        if (data.success) {
                            alert('Subscription activated successfully! 🎉');
                            fetchSubscriptions();
                            checkPrimeStatus();
                        }
                    } catch (err) {
                        console.error('Subscription activation failed:', err);
                        alert(err.response?.data?.message || 'Verification and activation failed');
                    }
                },
                prefill: {
                    name: user?.fullname || '',
                    email: user?.email || '',
                    contact: ''
                },
                theme: { color: '#4f46e5' }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Payment initialization failed');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl font-black text-gray-900 mb-4 flex items-center justify-center gap-3">
                        <span className="text-6xl">👑</span>
                        Bhojan Prime
                    </h1>
                    <p className="text-xl text-gray-600 font-bold">Unlock unlimited benefits and exclusive perks</p>
                </motion.div>

                {/* Prime Status Banner */}
                {isPrimeActive && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-[40px] shadow-2xl mb-12"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-black mb-2">You're a Prime Member! 🎉</h2>
                                <p className="text-indigo-100 font-bold">Enjoy free delivery and exclusive deals</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black uppercase tracking-widest text-indigo-200">Expires</p>
                                <p className="text-2xl font-black">{new Date(user?.primeExpiry).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Pricing Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {[
                        { name: 'Prime Monthly', price: 199, duration: 'monthly', popular: false },
                        { name: 'Prime Yearly', price: 1999, duration: 'yearly', popular: true, savings: '₹389' },
                        { name: 'Tiffin Service', price: 2999, duration: 'monthly', popular: false }
                    ].map((plan, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`bg-white rounded-[40px] p-8 shadow-xl border-4 relative overflow-hidden ${plan.popular ? 'border-indigo-600 scale-105' : 'border-transparent'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-6 right-6 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                                    Most Popular
                                </div>
                            )}
                            <h3 className="text-2xl font-black text-gray-900 mb-2">{plan.name}</h3>
                            <div className="mb-6">
                                <span className="text-5xl font-black text-indigo-600">₹{plan.price}</span>
                                <span className="text-gray-500 font-bold">/{plan.duration === 'yearly' ? 'year' : 'month'}</span>
                                {plan.savings && (
                                    <p className="text-green-600 font-black text-sm mt-2">Save {plan.savings}!</p>
                                )}
                            </div>
                            <ul className="space-y-3 mb-8">
                                {plan.name.includes('Tiffin') ? [
                                    '🍱 Daily home-cooked meals',
                                    '🚚 Doorstep delivery',
                                    '🥗 Customizable menu',
                                    '💚 Healthy & hygienic'
                                ] : [
                                    '🚚 Free delivery on all orders',
                                    '⚡ Priority support',
                                    '🎁 Exclusive deals & offers',
                                    '🎯 Early access to new restaurants'
                                ].map((benefit, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handleSubscribe(plan.name.includes('Tiffin') ? 'Tiffin' : 'Prime', plan.duration, plan.price)}
                                disabled={isPrimeActive && !plan.name.includes('Tiffin')}
                                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg ${isPrimeActive && !plan.name.includes('Tiffin')
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                                    }`}
                            >
                                {isPrimeActive && !plan.name.includes('Tiffin') ? 'Already Subscribed' : 'Subscribe Now'}
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: '🚀', title: 'Lightning Fast', desc: 'Priority delivery on all orders' },
                        { icon: '💰', title: 'Save More', desc: 'Exclusive discounts up to 30%' },
                        { icon: '🎯', title: 'Early Access', desc: 'Be first to try new restaurants' },
                        { icon: '🛡️', title: 'Premium Support', desc: '24/7 dedicated assistance' }
                    ].map((benefit, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + idx * 0.1 }}
                            className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 text-center"
                        >
                            <div className="text-5xl mb-4">{benefit.icon}</div>
                            <h4 className="font-black text-lg text-gray-900 mb-2">{benefit.title}</h4>
                            <p className="text-sm text-gray-600 font-bold">{benefit.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PrimeMembership;
