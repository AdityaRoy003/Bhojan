import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../utils/api';
import socket, { connectSocket } from '../utils/socket';
import BillSplitModal from '../components/BillSplitModal';
import { toast } from 'react-toastify';

const GroupCartScreen = () => {
    const { partyId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useSelector((state) => state.user);
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const s = connectSocket();
        if (s) {
            s.emit('join_group', partyId);
            s.on('group_cart_updated', (data) => {
                fetchCartData();
            });
        }

        fetchCartData();

        return () => {
            if (s) {
                s.emit('leave_group', partyId);
                s.off('group_cart_updated');
            }
        };
    }, [partyId]);

    const fetchCartData = async () => {
        try {
            const { data } = await api.post(`/cart/group/${partyId}/join`);
            if (data?.success) {
                setCart(data.cart);
            }
        } catch (error) {
            console.error('Group cart error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLockCart = async () => {
        try {
            const { data } = await api.put(`/cart/group/${partyId}/lock`);
            if (data?.success) {
                setCart(data.cart);
                navigate('/checkout', { state: { isGroupOrder: true, partyId } });
            }
        } catch (error) {
            toast.error('Failed to lock cart');
        }
    };

    const copyInviteLink = () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success('Party invite link copied!');
        setTimeout(() => setCopied(false), 2500);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-[36px] shadow-sm text-center">
                    <span className="text-4xl animate-bounce inline-block mb-3">🛒</span>
                    <p className="font-black text-sm uppercase tracking-widest text-gray-500">Loading Group Cart...</p>
                </div>
            </div>
        );
    }

    if (!cart) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-[36px] shadow-sm text-center max-w-sm">
                    <span className="text-4xl inline-block mb-3">⚠️</span>
                    <h3 className="font-black text-lg text-gray-900 dark:text-white">Party Not Found</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-5">This group cart session might have ended or expired.</p>
                    <button
                        onClick={() => navigate('/home')}
                        className="w-full bg-primary text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const isHost = cart.hostId === user?._id;
    const items = cart.items || [];
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Group items by participant
    const participantBreakdown = (cart.participants || []).map((p, idx) => {
        const userItems = items.filter(i => i.addedBy === p.user || i.addedBy === p.userName);
        const subtotal = userItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
        return {
            name: p.userName || (p.user === cart.hostId ? 'Host 👑' : `Friend #${idx + 1}`),
            subtotal: subtotal || (totalAmount / (cart.participants.length || 1)),
            itemsCount: userItems.length || 1
        };
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8 pb-28">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* 3D Glassmorphic Header */}
                <div className="bg-gradient-to-r from-orange-500 via-primary to-rose-600 rounded-[36px] p-6 sm:p-8 text-white shadow-xl shadow-orange-500/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="bg-white/20 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md">
                                Real-Time Group Cart
                            </span>
                            <h1 className="text-2xl sm:text-4xl font-black mt-2 leading-tight">
                                Friends Food Session 🍕
                            </h1>
                            <p className="text-xs text-orange-100 font-semibold mt-1">
                                Party Code: <span className="font-mono font-black text-white">{partyId}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={copyInviteLink}
                                className="bg-white text-orange-600 hover:bg-orange-50 px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                            >
                                <span>{copied ? '✅ Copied' : '🔗 Invite Friends'}</span>
                            </button>
                            <button
                                onClick={() => setShowSplitModal(true)}
                                className="bg-black/30 hover:bg-black/40 text-white px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider backdrop-blur-md shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                            >
                                <span>⚡ Split Bill</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Active Participants */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-[36px] shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                Participants ({cart.participants?.length || 0})
                            </h3>
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                                Live Syncing ●
                            </span>
                        </div>

                        <div className="space-y-3">
                            {(cart.participants || []).map((p, idx) => (
                                <div
                                    key={idx}
                                    className="p-3.5 bg-gray-50 dark:bg-gray-750/50 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 font-black text-xs flex items-center justify-center">
                                            {p.userName?.[0] || '👤'}
                                        </div>
                                        <div>
                                            <p className="font-black text-xs text-gray-900 dark:text-white">
                                                {p.userName || 'Guest'} {p.user === cart.hostId && '👑'}
                                            </p>
                                            <p className="text-[10px] font-bold text-gray-400">
                                                {p.user === cart.hostId ? 'Session Host' : 'Collaborator'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                        Ready
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shared Items Bucket */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-[36px] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                    Shared Bucket ({items.length})
                                </h3>
                                <p className="font-black text-sm text-primary">₹{totalAmount.toFixed(2)}</p>
                            </div>

                            {items.length === 0 ? (
                                <div className="text-center py-8">
                                    <span className="text-4xl block mb-2 opacity-50">🍱</span>
                                    <p className="text-xs text-gray-400 font-bold">Bucket is currently empty.</p>
                                    <button
                                        onClick={() => navigate('/home')}
                                        className="mt-3 text-[10px] font-black uppercase tracking-wider text-primary hover:underline"
                                    >
                                        Browse Restaurants →
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar pr-1">
                                    {items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-750/40 rounded-2xl border border-gray-100 dark:border-gray-700/50"
                                        >
                                            <div>
                                                <p className="font-black text-xs text-gray-900 dark:text-white">
                                                    {item.name} × {item.quantity}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold">
                                                    Added by {item.addedBy || 'Friend'}
                                                </p>
                                            </div>
                                            <span className="font-black text-xs text-gray-900 dark:text-white">
                                                ₹{item.price * item.quantity}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Host Controls */}
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                            {isHost ? (
                                <button
                                    onClick={handleLockCart}
                                    disabled={items.length === 0}
                                    className="w-full bg-gradient-to-r from-orange-500 to-rose-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>🔒 Lock Cart & Proceed to Checkout</span>
                                </button>
                            ) : (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-2xl text-center text-xs font-bold border border-amber-200 dark:border-amber-900/30">
                                    ⏳ Waiting for the session host to finalize & lock the order
                                </div>
                            )}

                            <button
                                onClick={() => setShowSplitModal(true)}
                                className="w-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-indigo-200 dark:border-indigo-900/40 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                            >
                                <span>⚡ Split Bill via UPI & WhatsApp</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ⚡ UPI Bill Splitter Modal */}
            <BillSplitModal
                isOpen={showSplitModal}
                onClose={() => setShowSplitModal(false)}
                members={participantBreakdown}
                totalAmount={totalAmount}
                partyId={partyId}
            />
        </div>
    );
};

export default GroupCartScreen;
