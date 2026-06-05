import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../utils/api';
import SpinTheWheel from '../components/SpinTheWheel';
import { updateUser } from '../redux/userSlice';

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
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector(state => state.user);
    const [viewMode, setViewMode] = useState('leaderboard'); // 'leaderboard' | 'quests'
    const [activeTab, setActiveTab] = useState('customers');
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    
    // Quests state
    const [quests, setQuests] = useState([]);
    const [questsLoading, setQuestsLoading] = useState(false);
    const [showSpinWheel, setShowSpinWheel] = useState(false);
    const [claimLoadingId, setClaimLoadingId] = useState(null);

    const tab = TABS.find(t => t.id === activeTab);

    // Fetch Leaderboard Data
    useEffect(() => {
        if (viewMode !== 'leaderboard') return;
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
    }, [activeTab, viewMode]);

    // Fetch Quests Data
    useEffect(() => {
        if (viewMode !== 'quests' || !isAuthenticated) return;
        const fetchQuests = async () => {
            setQuestsLoading(true);
            try {
                const { data: res } = await api.get('/quests/my');
                setQuests(res.quests || []);
            } catch (err) {
                console.error('Error fetching quests:', err);
            } finally {
                setQuestsLoading(false);
            }
        };
        fetchQuests();
    }, [viewMode, isAuthenticated]);

    const handleClaimReward = async (questId, points) => {
        setClaimLoadingId(questId);
        try {
            const { data: res } = await api.post(`/quests/claim/${questId}`);
            if (res.success) {
                // Update local quest state so it shows as rewarded
                setQuests(prev => prev.map(q => q._id === questId ? { ...q, rewarded: true } : q));
                // Update user points in Redux
                if (user) {
                    dispatch(updateUser({
                        loyaltyPoints: (user.loyaltyPoints || 0) + points
                    }));
                }
                alert(res.message || `🎉 Claimed ${points} points!`);
            }
        } catch (err) {
            console.error('Error claiming quest reward:', err);
            alert(err.response?.data?.message || 'Failed to claim reward');
        } finally {
            setClaimLoadingId(null);
        }
    };

    const entries = data[activeTab] || [];

    // Check if user has spun today
    const canSpin = (() => {
        if (!user?.gamification?.lastSpinDate) return true;
        const lastSpin = new Date(user.gamification.lastSpinDate).setHours(0, 0, 0, 0);
        const today = new Date().setHours(0, 0, 0, 0);
        return lastSpin !== today;
    })();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">
            {/* Header */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 pt-16 pb-8 px-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-amber-400 text-xs font-black uppercase tracking-[0.3em] mb-2">Bhojan Club</p>
                    <h1 className="text-3xl font-black text-white mb-1">
                        {viewMode === 'leaderboard' ? 'Leaderboards 🏆' : 'Daily Quests 🎯'}
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">
                        {viewMode === 'leaderboard' ? "This month's top performers" : "Complete challenges & win exciting rewards"}
                    </p>
                </motion.div>
            </div>

            {/* View Mode Switcher */}
            <div className="max-w-lg mx-auto px-4 mt-6">
                <div className="flex bg-gray-200 dark:bg-gray-800/80 p-1.5 rounded-2xl mb-6 shadow-inner">
                    <button
                        onClick={() => setViewMode('leaderboard')}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                            viewMode === 'leaderboard'
                                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-md scale-[1.02]'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        🏆 Leaderboard
                    </button>
                    <button
                        onClick={() => setViewMode('quests')}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                            viewMode === 'quests'
                                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-md scale-[1.02]'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        🎯 Quests & Spin
                    </button>
                </div>
            </div>

            {viewMode === 'leaderboard' ? (
                <>
                    {/* Top 3 Podium */}
                    <div className="max-w-lg mx-auto px-4">
                        <div className="bg-gradient-to-b from-gray-800 to-gray-900 px-4 pt-4 pb-8 flex items-end justify-center gap-4 rounded-3xl overflow-hidden shadow-xl border border-gray-700/30">
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
                </>
            ) : (
                <div className="max-w-lg mx-auto px-4">
                    {/* User Loyalty Dashboard */}
                    {isAuthenticated ? (
                        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-[32px] p-6 text-white shadow-xl mb-6 relative overflow-hidden">
                            <div className="absolute right-0 bottom-0 opacity-10 translate-y-1/4 translate-x-1/4 scale-150 select-none">
                                <span className="text-[120px]">🪙</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner font-black">
                                    {user?.fullname?.charAt(0) || '👤'}
                                </div>
                                <div>
                                    <p className="text-white/85 text-xs font-black uppercase tracking-wider">My Rewards Dashboard</p>
                                    <h2 className="text-xl font-black">{user?.fullname || 'Guest'}</h2>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
                                <div>
                                    <p className="text-white/70 text-[10px] font-black uppercase tracking-wider">Loyalty Points</p>
                                    <p className="text-xl font-black flex items-center gap-1.5 mt-1">
                                        🪙 {user?.loyaltyPoints || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-white/70 text-[10px] font-black uppercase tracking-wider">Badges Earned</p>
                                    <p className="text-xl font-black mt-1">
                                        🏆 {user?.badges?.length || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
                            <p className="text-5xl mb-4">🔒</p>
                            <h3 className="font-black text-gray-950 dark:text-white text-lg">Login to Start Quests</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto px-4">
                                Join the Bhojan Club to participate in daily quests, level up, spin the wheel, and earn discount coupons!
                            </p>
                            <Link
                                to="/login"
                                className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/95 hover:to-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                            >
                                Login / Sign Up
                            </Link>
                        </div>
                    )}

                    {/* Daily Spin Wheel Card */}
                    {isAuthenticated && (
                        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-[32px] p-6 text-white shadow-xl mb-6 relative overflow-hidden border border-indigo-500/20">
                            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-indigo-500/20 rounded-full blur-2xl"></div>
                            <div className="absolute -left-6 -top-6 w-28 h-28 bg-purple-500/20 rounded-full blur-2xl"></div>
                            
                            <div className="flex flex-col md:flex-row items-center gap-4 justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <span className="text-4xl animate-bounce">🎰</span>
                                    <div>
                                        <h3 className="text-base font-black tracking-wide">Daily Spin to Win</h3>
                                        <p className="text-indigo-200 text-xs mt-0.5">Win up to ₹100 Off or Free Delivery every single day!</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSpinWheel(true)}
                                    className={`w-full md:w-auto px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md ${
                                        canSpin
                                            ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 hover:scale-105 hover:shadow-lg active:scale-95'
                                            : 'bg-white/10 text-white/50 cursor-not-allowed'
                                    }`}
                                >
                                    {canSpin ? 'Spin Now! 🚀' : 'Spun Today ✓'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Active Quests */}
                    {isAuthenticated && (
                        <>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-black text-gray-900 dark:text-white text-base">🎯 Active Challenges</h3>
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">{quests.length} Available</span>
                            </div>

                            {questsLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : quests.length === 0 ? (
                                <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800">
                                    <p className="text-4xl mb-3">🏜️</p>
                                    <p className="font-black text-gray-600 dark:text-gray-400 text-sm">No active quests at the moment</p>
                                    <p className="text-xs text-gray-400 mt-1">Check back later for new challenges!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {quests.map((quest, i) => {
                                        const isDone = quest.completed;
                                        const isClaimed = quest.rewarded;
                                        const progressPct = Math.min(100, (quest.progress / quest.targetValue) * 100);

                                        return (
                                            <motion.div
                                                key={quest._id || i}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex items-start gap-4 transition-all hover:shadow-md"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center text-2xl flex-shrink-0">
                                                    {quest.icon || '🏆'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h4 className="font-black text-sm text-gray-900 dark:text-white truncate">
                                                            {quest.title}
                                                        </h4>
                                                        <div className="flex-shrink-0">
                                                            {isClaimed ? (
                                                                <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                                    Claimed
                                                                </span>
                                                            ) : isDone ? (
                                                                <button
                                                                    onClick={() => handleClaimReward(quest._id, quest.rewardPoints)}
                                                                    disabled={claimLoadingId === quest._id}
                                                                    className="px-3 py-1 bg-gradient-to-r from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition-all hover:scale-105 active:scale-95"
                                                                >
                                                                    {claimLoadingId === quest._id ? 'Claiming...' : 'Claim 🎁'}
                                                                </button>
                                                            ) : (
                                                                <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {quest.description}
                                                    </p>
                                                    
                                                    {/* Progress Bar */}
                                                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full mt-4 overflow-hidden">
                                                        <div
                                                            className={`h-full bg-gradient-to-r transition-all duration-500 rounded-full ${
                                                                isDone ? 'from-emerald-400 to-teal-500' : 'from-amber-400 to-orange-500'
                                                            }`}
                                                            style={{ width: `${progressPct}%` }}
                                                        />
                                                    </div>

                                                    {/* Progress Info */}
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                            {quest.conditionType === 'spend_amount' 
                                                                ? `₹${quest.progress} / ₹${quest.targetValue}`
                                                                : quest.conditionType === 'cuisine_variety'
                                                                ? `${quest.progress} / ${quest.targetValue} cuisines`
                                                                : quest.conditionType === 'order_count'
                                                                ? `${quest.progress} / ${quest.targetValue} orders`
                                                                : `${quest.progress} / ${quest.targetValue}`
                                                        }
                                                        </span>
                                                        <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                                                            +{quest.rewardPoints} XP
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Spin The Wheel Modal */}
            <AnimatePresence>
                {showSpinWheel && (
                    <SpinTheWheel onClose={() => setShowSpinWheel(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Leaderboard;
