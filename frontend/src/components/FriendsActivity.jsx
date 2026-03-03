import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { Link } from 'react-router-dom';

const FriendsActivity = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const { data } = await api.get('/social/friends-activity');
                if (data.success) {
                    setActivities(data.activity);
                }
            } catch (_) { }
            finally { setLoading(false); }
        };
        fetchActivity();
    }, []);

    if (loading) return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="w-64 h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse flex-shrink-0" />
            ))}
        </div>
    );

    if (activities.length === 0) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">👥</span>
                <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Friends are eating...</h2>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pl-1 snap-x">
                {activities.map((act, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-shrink-0 w-72 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[28px] p-4 shadow-sm snap-start flex items-center gap-4 group hover:shadow-xl transition-shadow"
                    >
                        <div className="relative">
                            <Link to={`/user/${act.user?._id}`}>
                                <img src={act.user?.avatar || 'https://via.placeholder.com/100'} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" alt="" />
                            </Link>
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-1 shadow-sm">
                                <img src={act.shop?.logo || 'https://via.placeholder.com/50'} className="w-5 h-5 rounded-full object-cover" alt="" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                                <Link to={`/user/${act.user?._id}`} className="hover:text-primary transition-colors">
                                    {act.user?.fullname.split(' ')[0]}
                                </Link>
                                <span className="text-gray-400 font-medium tracking-normal ml-1">ordered from</span>
                            </p>
                            <Link to={`/shop/${act.shop?._id}`} className="text-sm font-black text-primary truncate block hover:underline">
                                {act.shop?.name}
                            </Link>
                            <p className="text-[10px] text-gray-400 mt-0.5">{new Date(act.createdAt).toLocaleDateString()}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default FriendsActivity;
