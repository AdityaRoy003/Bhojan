import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const TABS = [
    { id: 'customers', label: '🍜 Top Foodies', endpoint: '/recommendations/leaderboard/customers', key: 'customers', nameKey: 'fullname', scoreKey: 'totalOrders', scoreLabel: 'Orders' },
    { id: 'restaurants', label: '🏪 Top Restaurants', endpoint: '/recommendations/leaderboard/restaurants', key: 'restaurants', nameKey: 'name', scoreKey: 'orderCount', scoreLabel: 'Orders' },
    { id: 'riders', label: '🛵 Top Riders', endpoint: '/recommendations/leaderboard/delivery', key: 'partners', nameKey: 'fullname', scoreKey: 'totalDeliveries', scoreLabel: 'Deliveries' },
];

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = [
    'from-amber-400 to-yellow-300 shadow-amber-200',
    'from-gray-300 to-gray-200 shadow-gray-200',
    'from-orange-400 to-amber-300 shadow-orange-200',
];

const Leaderboard = () => {
    const [activeTab, setActiveTab] = useState('customers');
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);

    const tab = TABS.find(t => t.id === activeTab);

    useEffect(() => {
        if (data[activeTab]) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data: res } = await api.get(tab.endpoint);
                setData(prev => ({ ...prev, [activeTab]: res[tab.key] || [] }));
            } catch (_) {
                setData(prev => ({ ...prev, [activeTab]: [] }));
            } finally { setLoading(false); }
        };
        fetchData();
    }, [activeTab]);

    const entries = data[activeTab] || [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">
            {/* Header */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 pt-16 pb-8 px-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-amber-400 text-xs font-black uppercase tracking-[0.3em] mb-2">Hall of Fame</p>
                    <h1 className="text-3xl font-black text-white mb-1">Leaderboards 🏆</h1>
                    <p className="text-gray-400 text-sm font-medium">This month's top performers</p>
                </motion.div>
            </div>

            {/* Top 3 Podium */}
            <div className="max-w-lg mx-auto px-4">
                <div className="bg-gradient-to-b from-gray-800 to-gray-900 px-4 pt-4 pb-8 flex items-end justify-center gap-4">
                    {/* 2nd Place */}
                    {entries[1] && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
                            <div className={`w-14 h-14 rounded-[20px] bg-gradient-to-br ${RANK_COLORS[1]} flex items-center justify-center text-2xl font-black text-white shadow-lg`}>
                                {entries[1][tab.nameKey]?.charAt(0)}
                            </div>
                            {tab.id === 'customers' ? (
                                <Link to={`/user/${entries[1]._id}`} className="text-white text-xs font-black mt-2 truncate w-16 text-center hover:text-amber-400">
                                    {entries[1][tab.nameKey]?.split(' ')[0]}
                                </Link>
                            ) : (
                                <p className="text-white text-xs font-black mt-2 truncate w-16 text-center">{entries[1][tab.nameKey]?.split(' ')[0]}</p>
                            )}
                            <p className="text-gray-400 text-[10px] font-bold">{entries[1][tab.scoreKey]} {tab.scoreLabel}</p>
                            <div className="bg-gray-600 mt-2 w-16 h-12 rounded-t-xl flex items-center justify-center text-xl">🥈</div>
                        </motion.div>
                    )}
                    {/* 1st Place */}
                    {entries[0] && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center -mt-4">
                            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-2xl mb-1">👑</motion.div>
                            <div className={`w-18 h-18 w-[72px] h-[72px] rounded-[24px] bg-gradient-to-br ${RANK_COLORS[0]} flex items-center justify-center text-3xl font-black text-white shadow-xl`}>
                                {entries[0][tab.nameKey]?.charAt(0)}
                            </div>
                            {tab.id === 'customers' ? (
                                <Link to={`/user/${entries[0]._id}`} className="text-white text-sm font-black mt-2 truncate w-20 text-center hover:text-amber-400">
                                    {entries[0][tab.nameKey]?.split(' ')[0]}
                                </Link>
                            ) : (
                                <p className="text-white text-sm font-black mt-2 truncate w-20 text-center">{entries[0][tab.nameKey]?.split(' ')[0]}</p>
                            )}
                            <p className="text-amber-400 text-[10px] font-bold">{entries[0][tab.scoreKey]} {tab.scoreLabel}</p>
                            <div className="bg-amber-500/80 mt-2 w-16 h-16 rounded-t-xl flex items-center justify-center text-2xl">🥇</div>
                        </motion.div>
                    )}
                    {/* 3rd Place */}
                    {entries[2] && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
                            <div className={`w-14 h-14 rounded-[20px] bg-gradient-to-br ${RANK_COLORS[2]} flex items-center justify-center text-2xl font-black text-white shadow-lg`}>
                                {entries[2][tab.nameKey]?.charAt(0)}
                            </div>
                            {tab.id === 'customers' ? (
                                <Link to={`/user/${entries[2]._id}`} className="text-white text-xs font-black mt-2 truncate w-16 text-center hover:text-amber-400">
                                    {entries[2][tab.nameKey]?.split(' ')[0]}
                                </Link>
                            ) : (
                                <p className="text-white text-xs font-black mt-2 truncate w-16 text-center">{entries[2][tab.nameKey]?.split(' ')[0]}</p>
                            )}
                            <p className="text-gray-400 text-[10px] font-bold">{entries[2][tab.scoreKey]} {tab.scoreLabel}</p>
                            <div className="bg-orange-600/60 mt-2 w-16 h-8 rounded-t-xl flex items-center justify-center text-xl">🥉</div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Tabs & List */}
            <div className="max-w-lg mx-auto px-4 pt-6">
                {/* Tab Switcher */}
                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === t.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-4xl mb-3">🏜️</p>
                        <p className="font-black text-gray-600 dark:text-gray-400">No data yet this month</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {entries.slice(3).map((entry, i) => (
                            <motion.div
                                key={entry._id || i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white dark:bg-gray-900 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-50 dark:border-gray-800"
                            >
                                <span className="text-lg font-black text-gray-400 w-6 text-center">#{i + 4}</span>
                                <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center text-lg font-black text-gray-600 dark:text-gray-300">
                                    {entry[tab.nameKey]?.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    {tab.id === 'customers' ? (
                                        <Link to={`/user/${entry._id}`} className="font-black text-gray-900 dark:text-white text-sm hover:text-primary transition-colors">
                                            {entry[tab.nameKey]}
                                        </Link>
                                    ) : (
                                        <p className="font-black text-gray-900 dark:text-white text-sm">{entry[tab.nameKey]}</p>
                                    )}
                                </div>
                                <span className="text-xs font-black text-gray-500">{entry[tab.scoreKey]} {tab.scoreLabel}</span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
