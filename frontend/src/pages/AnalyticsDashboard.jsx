import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useSelector } from 'react-redux';

const AnalyticsDashboard = () => {
    const { user } = useSelector(state => state.user);
    const [insights, setInsights] = useState(null);
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            if (user?.role === 'Customer') {
                const { data } = await api.get('/analytics/customer-insights');
                if (data.success) setInsights(data.insights);
            } else if (user?.role === 'Owner') {
                // Fetch shop first to ensure we have the ID
                const shopRes = await api.get('/shop/my/shop');
                if (shopRes.data.success && shopRes.data.shop) {
                    const shopId = shopRes.data.shop._id;
                    const { data } = await api.get(`/analytics/predictive-sales/${shopId}`);
                    if (data.success) setPredictions(data.predictions);
                }
            }
        } catch (error) {
            console.error('Analytics fetch failed', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading analytics...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-black text-gray-900 mb-8 flex items-center gap-3"
                >
                    📊 Analytics Dashboard
                </motion.h1>

                {user?.role === 'Customer' && insights && (
                    <div className="space-y-6">
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Spent', value: `₹${insights.totalSpent.toFixed(0)}`, icon: '💰', color: 'from-green-500 to-emerald-600' },
                                { label: 'Total Orders', value: insights.totalOrders, icon: '🛍️', color: 'from-blue-500 to-indigo-600' },
                                { label: 'Avg Order Value', value: `₹${insights.avgOrderValue.toFixed(0)}`, icon: '📈', color: 'from-purple-500 to-pink-600' },
                                { label: 'Loyalty Points', value: insights.loyaltyPoints, icon: '⭐', color: 'from-yellow-500 to-orange-600' }
                            ].map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`bg-gradient-to-br ${stat.color} p-6 rounded-[32px] shadow-xl text-white`}
                                >
                                    <div className="text-4xl mb-2">{stat.icon}</div>
                                    <p className="text-sm font-black uppercase tracking-widest opacity-90">{stat.label}</p>
                                    <p className="text-3xl font-black mt-2">{stat.value}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Favorite Cuisines */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[40px] p-8 shadow-xl"
                        >
                            <h2 className="text-2xl font-black text-gray-900 mb-6">🍽️ Your Favorite Cuisines</h2>
                            <div className="space-y-4">
                                {insights.favoriteCuisines.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-black">
                                                #{idx + 1}
                                            </div>
                                            <span className="font-black text-gray-900">{item.cuisine}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-gray-100 px-4 py-2 rounded-full">
                                                <span className="font-black text-gray-700">{item.orders} orders</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Monthly Spending Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[40px] p-8 shadow-xl"
                        >
                            <h2 className="text-2xl font-black text-gray-900 mb-6">💳 Monthly Spending</h2>
                            <div className="space-y-3">
                                {insights.monthlySpending.map((item, idx) => {
                                    const maxAmount = Math.max(...insights.monthlySpending.map(m => m.amount));
                                    const percentage = (item.amount / maxAmount) * 100;
                                    return (
                                        <div key={idx}>
                                            <div className="flex justify-between mb-1">
                                                <span className="font-black text-sm text-gray-700">{item.month}</span>
                                                <span className="font-black text-sm text-primary">₹{item.amount.toFixed(0)}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                                                    className="bg-gradient-to-r from-primary to-orange-500 h-full rounded-full"
                                                ></motion.div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Calorie Tracker */}
                        {insights.totalCalories > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-red-50 to-orange-50 rounded-[40px] p-8 shadow-xl border-2 border-orange-200"
                            >
                                <h2 className="text-2xl font-black text-gray-900 mb-4">🔥 Total Calories Consumed</h2>
                                <p className="text-5xl font-black text-orange-600">{insights.totalCalories.toLocaleString()}</p>
                                <p className="text-sm text-gray-600 font-bold mt-2">Across all your orders</p>
                            </motion.div>
                        )}
                    </div>
                )}

                {user?.role === 'Owner' && predictions.length > 0 && (
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[40px] p-8 shadow-xl"
                        >
                            <h2 className="text-2xl font-black text-gray-900 mb-6">🔮 7-Day Sales Forecast</h2>
                            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                                {predictions.map((pred, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded-2xl text-center ${pred.confidence === 'High'
                                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'
                                            : 'bg-gray-50 border-2 border-gray-200'
                                            }`}
                                    >
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-600 mb-1">{pred.day}</p>
                                        <p className="text-2xl font-black text-gray-900">{pred.predictedOrders}</p>
                                        <p className="text-[10px] font-bold text-gray-500 mt-1">{pred.confidence}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
