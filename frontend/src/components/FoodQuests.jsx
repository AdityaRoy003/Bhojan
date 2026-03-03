import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const CONFETTI_COLORS = ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#3b82f6'];

const FoodQuests = () => {
    const [quests, setQuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claimedId, setClaimedId] = useState(null);
    const [confetti, setConfetti] = useState([]);

    useEffect(() => {
        const fetchQuests = async () => {
            try {
                const { data } = await api.get('/quests/my');
                if (data.success) setQuests(data.quests);
            } catch (_) { }
            finally { setLoading(false); }
        };
        fetchQuests();
    }, []);

    const triggerConfetti = () => {
        const pieces = Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            delay: Math.random() * 0.5,
        }));
        setConfetti(pieces);
        setTimeout(() => setConfetti([]), 2000);
    };

    const handleClaim = async (quest) => {
        try {
            const { data } = await api.post(`/quests/claim/${quest._id}`);
            if (data.success) {
                setClaimedId(quest._id);
                triggerConfetti();
                setQuests(prev => prev.map(q => q._id === quest._id ? { ...q, rewarded: true } : q));
            }
        } catch (_) { }
    };

    if (loading) return (
        <div className="p-8 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading quests...
        </div>
    );

    if (quests.length === 0) return (
        <div className="p-8 text-center">
            <p className="text-4xl mb-3">🏆</p>
            <p className="font-black text-gray-700 dark:text-gray-300 text-lg">No Active Quests</p>
            <p className="text-sm text-gray-400 mt-1">Check back soon for new challenges!</p>
        </div>
    );

    return (
        <div className="relative p-6 space-y-4">
            {/* Confetti */}
            <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
                {confetti.map(p => (
                    <motion.div
                        key={p.id}
                        initial={{ x: `${p.x}vw`, y: '-5vh', rotate: 0, opacity: 1 }}
                        animate={{ y: '110vh', rotate: 720, opacity: 0 }}
                        transition={{ duration: 2, delay: p.delay, ease: 'easeIn' }}
                        className="absolute w-3 h-3 rounded-sm"
                        style={{ backgroundColor: p.color }}
                    />
                ))}
            </div>

            <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">🏆 Food Quests</h2>
                <p className="text-xs text-gray-400 font-medium mt-1">Complete challenges to earn badges and loyalty points</p>
            </div>

            {quests.map((quest, i) => {
                const pct = Math.min(100, Math.round((quest.progress / quest.targetValue) * 100));
                return (
                    <motion.div
                        key={quest._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-5 shadow-sm"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
                                    {quest.icon || '🏆'}
                                </div>
                                <div>
                                    <p className="font-black text-gray-900 dark:text-white text-sm">{quest.title}</p>
                                    <p className="text-[11px] text-gray-400 font-medium">{quest.description}</p>
                                </div>
                            </div>
                            {quest.completed && !quest.rewarded && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleClaim(quest)}
                                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl shadow-lg shadow-amber-200 dark:shadow-amber-900/30"
                                >
                                    Claim!
                                </motion.button>
                            )}
                            {quest.rewarded && (
                                <span className="text-[10px] font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-1.5 rounded-full">✅ Done</span>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black text-gray-400">
                                <span>{quest.progress} / {quest.targetValue}</span>
                                <span>{pct}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${quest.completed ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                                />
                            </div>
                        </div>

                        {/* Reward Info */}
                        <div className="flex gap-2 mt-3">
                            {quest.rewardPoints > 0 && (
                                <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg">+{quest.rewardPoints} pts</span>
                            )}
                            {quest.rewardBadge && (
                                <span className="text-[10px] font-black text-purple-600 bg-purple-50 dark:bg-purple-950/30 px-2 py-1 rounded-lg">🏅 {quest.rewardBadge}</span>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default FoodQuests;
