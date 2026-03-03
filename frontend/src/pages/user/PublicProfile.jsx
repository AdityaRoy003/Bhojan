import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import FollowUserButton from '../components/FollowUserButton';
import Loader from '../components/Loader';

const PublicProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get(`/auth/id/${id}`);
                if (data.success) {
                    setProfile(data.user);
                }
            } catch (error) {
                console.error("Failed to fetch profile");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return <Loader />;
    if (!profile) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <span className="text-6xl mb-4">🕵️‍♂️</span>
            <h2 className="text-2xl font-black">User not found</h2>
            <button onClick={() => navigate(-1)} className="mt-4 text-primary font-bold">← Go Back</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-900 rounded-[48px] p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-amber-400/10 to-orange-500/10" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] bg-gradient-to-tr from-amber-400 to-orange-500 p-1 shadow-2xl">
                            <div className="w-full h-full rounded-[38px] bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt={profile.fullname} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-black text-amber-500">{profile.fullname?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">{profile.fullname}</h1>
                                <FollowUserButton targetUserId={profile._id} />
                            </div>

                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-6 italic max-w-xl">
                                "Foodie exploring the best tastes in {profile.city || 'town'}. Always up for a spicy challenge! 🔥"
                            </p>

                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <div className="text-center bg-gray-50 dark:bg-gray-800 px-6 py-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Followers</p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white">{profile.followers?.length || 0}</p>
                                </div>
                                <div className="text-center bg-gray-50 dark:bg-gray-800 px-6 py-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Following</p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white">{profile.followingUsers?.length || 0}</p>
                                </div>
                                <div className="text-center bg-gray-50 dark:bg-gray-800 px-6 py-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Quests Done</p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white">12</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Achievements Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-2 bg-white dark:bg-gray-900 rounded-[40px] p-8 shadow-lg border border-gray-100 dark:border-gray-800"
                    >
                        <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
                            <span>🎖️</span> Achievement Showcase
                        </h3>
                        {profile.badges && profile.badges.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                {profile.badges.map((badge, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ y: -5 }}
                                        className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 group cursor-help relative"
                                    >
                                        <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">{badge.icon}</span>
                                        <span className="text-[8px] font-black uppercase tracking-tight text-gray-400 text-center">{badge.name}</span>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <span className="text-4xl block mb-2 opacity-50">🏆</span>
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No achievements yet</p>
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[40px] p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none"
                    >
                        <h3 className="text-xl font-black mb-4">Level 24</h3>
                        <p className="text-indigo-100 text-sm mb-6 leading-relaxed">Top 5% of foodies in this area! Keep ordering to reach Diamond status.</p>

                        <div className="space-y-4">
                            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white w-3/4 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center">450 / 600 XP to next level</p>
                        </div>
                    </motion.div>
                </div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 bg-white dark:bg-gray-900 rounded-[40px] p-8 shadow-lg border border-gray-100 dark:border-gray-800"
                >
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
                        <span>📸</span> Recent Food Stories
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-gray-50 dark:bg-gray-800 rounded-3xl overflow-hidden group cursor-pointer relative">
                                <img
                                    src={`https://images.unsplash.com/photo-${1504674900247 + i}-0877df9cc836?auto=format&fit=crop&q=80&w=400`}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-110 group-hover:scale-100"
                                    alt=""
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PublicProfile;
