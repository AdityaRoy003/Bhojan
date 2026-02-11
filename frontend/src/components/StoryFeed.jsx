import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const StoryFeed = () => {
    const [stories, setStories] = useState([]);
    const [activeStoryIdx, setActiveStoryIdx] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const { data } = await api.get('/social/stories');
                if (data.success) setStories(data.stories);
            } catch (error) {
                console.error("Stories fetch failed");
            } finally {
                setLoading(false);
            }
        };
        fetchStories();
    }, []);

    if (loading && stories.length === 0) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {stories.map((story, idx) => (
                    <motion.div
                        key={story._id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex-shrink-0 cursor-pointer group"
                        onClick={() => setActiveStoryIdx(idx)}
                    >
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-orange-500 via-primary to-yellow-500 group-hover:rotate-180 transition-transform duration-700">
                                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-100">
                                    <img src={story.mediaUrl} className="w-full h-full object-cover" alt="" />
                                </div>
                            </div>
                            {story.isRegional && (
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-orange-200">
                                    <span className="text-[10px]">🎨</span>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] font-black text-center mt-2 text-gray-700 truncate w-20 uppercase tracking-tighter">
                            {story.shop?.name || story.user?.fullname}
                        </p>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {activeStoryIdx !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
                    >
                        <div className="relative w-full max-w-lg h-full max-h-[90vh] md:rounded-[40px] overflow-hidden bg-gray-900 shadow-2xl">
                            <button
                                onClick={() => setActiveStoryIdx(null)}
                                className="absolute top-6 right-6 z-[110] text-white bg-black/40 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center font-bold"
                            >✕</button>

                            <motion.div
                                key={stories[activeStoryIdx]._id}
                                initial={{ x: 300, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -300, opacity: 0 }}
                                className="relative w-full h-full"
                            >
                                <img src={stories[activeStoryIdx].mediaUrl} className="w-full h-full object-cover" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>

                                <div className="absolute top-8 left-6 flex items-center gap-3">
                                    <img src={stories[activeStoryIdx].shop?.logo || stories[activeStoryIdx].user?.avatar} className="w-10 h-10 rounded-full border-2 border-white" alt="" />
                                    <div>
                                        <p className="text-white font-black text-sm shadow-sm">{stories[activeStoryIdx].shop?.name || stories[activeStoryIdx].user?.fullname}</p>
                                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                                            {new Date(stories[activeStoryIdx].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="absolute bottom-12 left-6 right-6">
                                    <p className="text-white font-bold text-lg mb-4 drop-shadow-md">{stories[activeStoryIdx].caption}</p>
                                    <div className="flex gap-4">
                                        <button className="flex-1 bg-white/20 backdrop-blur-md text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/30 transition">
                                            ❤️ {stories[activeStoryIdx].likes?.length || 0}
                                        </button>
                                        <button className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-900/40">
                                            Order Now 🍱
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            <div className="absolute top-4 left-4 right-4 flex gap-1 z-[110]">
                                {stories.map((_, i) => (
                                    <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: i < activeStoryIdx ? '100%' : '0%' }}
                                            animate={{ width: i === activeStoryIdx ? '100%' : i < activeStoryIdx ? '100%' : '0%' }}
                                            transition={{ duration: 5, ease: 'linear' }}
                                            onAnimationComplete={() => {
                                                if (i === activeStoryIdx && activeStoryIdx < stories.length - 1) {
                                                    setActiveStoryIdx(activeStoryIdx + 1);
                                                } else if (i === stories.length - 1 && activeStoryIdx === stories.length - 1) {
                                                    setActiveStoryIdx(null);
                                                }
                                            }}
                                            className="h-full bg-white"
                                        ></motion.div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {activeStoryIdx > 0 && (
                            <button onClick={() => setActiveStoryIdx(activeStoryIdx - 1)} className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white text-3xl font-black transition">❮</button>
                        )}
                        {activeStoryIdx < stories.length - 1 && (
                            <button onClick={() => setActiveStoryIdx(activeStoryIdx + 1)} className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white text-3xl font-black transition">❯</button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StoryFeed;
