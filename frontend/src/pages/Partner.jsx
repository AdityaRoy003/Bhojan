import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Partner = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto space-y-16">
                
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-950/40 text-primary dark:text-orange-400 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest"
                    >
                        <span>🤝</span> Partner Program
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight"
                    >
                        Grow Your Dreams with <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Bhojan</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium"
                    >
                        Choose how you want to join our ecosystem. Whether you cook premium delicacies or speed through delivery runs, we have the tools for you to earn big.
                    </motion.p>
                </div>

                {/* Partner Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    
                    {/* Merchant / Restaurant Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="relative group bg-white dark:bg-gray-900 rounded-[36px] p-8 sm:p-10 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl hover:border-orange-500/20 transition-all duration-300 flex flex-col justify-between"
                    >
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-3xl flex items-center justify-center text-3xl shadow-sm">
                                    🏪
                                </div>
                                <span className="text-[10px] font-black text-orange-500 bg-orange-50 dark:bg-orange-950/30 px-3 py-1 rounded-full uppercase tracking-wider">
                                    Merchant Partner
                                </span>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Restaurant Partner</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                    List your restaurant, cloud kitchen, or home bakery on Bhojan and tap into Mithilanchal's vast customer base. Take advantage of automated order workflows and virtual brand expansion tools.
                                </p>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-4">
                                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Key Partner Perks:</h3>
                                <ul className="space-y-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                    <li className="flex items-start gap-2.5">
                                        <span className="text-green-500">✓</span>
                                        <span>Wide Visibility across Darbhanga & surrounding areas</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="text-green-500">✓</span>
                                        <span>Intuitive Merchant Portal to update menus instantly</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="text-green-500">✓</span>
                                        <span>Virtual Brands Engine to launch multiple brands from one kitchen</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="text-green-500">✓</span>
                                        <span>Detailed analytics on popular dishes and revenue projections</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-10">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/signup?role=Owner')}
                                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-black py-4 px-6 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-orange-100 dark:shadow-none transition-all duration-300"
                            >
                                Register Your Restaurant 🚀
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Delivery Partner Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="relative group bg-white dark:bg-gray-900 rounded-[36px] p-8 sm:p-10 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl hover:border-emerald-500/20 transition-all duration-300 flex flex-col justify-between"
                    >
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center text-3xl shadow-sm">
                                    🏍️
                                </div>
                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full uppercase tracking-wider">
                                    Fleet Partner
                                </span>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Delivery Partner</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                    Deliver delicious hot meals and local delights on a flexible schedule. Enjoy highly competitive base payouts, immediate tips integration, and wellness milestones designed for riders.
                                </p>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-4">
                                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Key Partner Perks:</h3>
                                <ul className="space-y-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                    <li className="flex items-start gap-2.5">
                                        <span className="text-green-500">✓</span>
                                        <span>Work anytime on a flexible shift-based model</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="text-green-500">✓</span>
                                        <span>Daily payouts directly linked to your bank account</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="text-green-500">✓</span>
                                        <span>Comprehensive medical & accident insurance coverage</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="text-green-500">✓</span>
                                        <span>Health, step count, and hydration reminders in rider app</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-10">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/signup?role=Delivery')}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black py-4 px-6 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-emerald-100 dark:shadow-none transition-all duration-300"
                            >
                                Join Delivery Fleet 🛵
                            </motion.button>
                        </div>
                    </motion.div>

                </div>

                {/* General Trust Section */}
                <div className="bg-gray-100 dark:bg-gray-900 rounded-[32px] p-8 text-center max-w-4xl mx-auto space-y-4">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Why partner with Bhojan?</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Bhojan is dedicated to preserving the rich culture and culinary traditions of Mithila. When you partner with us, you are joining a mission-driven team that supports local chefs, respects delivery riders, and feeds thousands of happy foodies daily.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default Partner;
