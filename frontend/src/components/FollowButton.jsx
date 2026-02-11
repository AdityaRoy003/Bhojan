import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../utils/api';

const FollowButton = ({ shopId, followersCount, onUpdate }) => {
    const { user, isAuthenticated } = useSelector(state => state.user);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user?.followingShops) {
            setIsFollowing(user.followingShops.includes(shopId));
        }
    }, [user, shopId, isAuthenticated]);

    const handleFollow = async () => {
        if (!isAuthenticated) return alert('Please login to follow restaurants!');
        setLoading(true);
        try {
            const { data } = await api.put(`/social/follow/${shopId}`);
            if (data.success) {
                setIsFollowing(data.isFollowing);
                if (onUpdate) onUpdate(data.isFollowing);
            }
        } catch (error) {
            console.error("Follow action failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleFollow}
            disabled={loading}
            className={`px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${isFollowing
                    ? 'bg-gray-100 text-gray-500 shadow-none'
                    : 'bg-indigo-600 text-white shadow-indigo-100'
                } hover:scale-105 active:scale-95`}
        >
            {loading ? '...' : isFollowing ? '✓ Following' : '+ Follow'}
        </button>
    );
};

export default FollowButton;
