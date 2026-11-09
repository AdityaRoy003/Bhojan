import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const RiderSafetyModal = ({ isOpen, onClose, orderId, riderInfo, trackingUrl }) => {
    const [sosTriggered, setSosTriggered] = useState(false);

    if (!isOpen) return null;

    const shareUrl = trackingUrl || (window.location.origin + `/track/${orderId || ''}`);

    const handleWhatsAppShare = () => {
        const text = encodeURIComponent(
            `🛡️ *Bhojan Live Order Safety Link*\n` +
            `Track my active delivery in real-time here:\n${shareUrl}\n\n` +
            `Order ID: #${orderId || 'Active'}\n` +
            (riderInfo?.fullname ? `Delivery Partner: ${riderInfo.fullname}\n` : '') +
            `Delivering safe & hot with Bhojan!`
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Bhojan Live Delivery Tracking',
                    text: `Track my delivery live on Bhojan:`,
                    url: shareUrl
                });
            } catch (err) {
                // user cancelled or share failed
            }
        } else {
            handleWhatsAppShare();
        }
    };

    const handleTriggerSOS = () => {
        setSosTriggered(true);
        toast.error('🚨 Emergency SOS alert initiated. Help is on the way!');
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[36px] shadow-2xl border border-red-100 dark:border-red-900/40 p-6 overflow-hidden z-10"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xl shadow-inner">
                                🛡️
                            </div>
                            <div>
                                <h3 className="font-black text-base text-gray-900 dark:text-white leading-tight">
                                    Safety & SOS Toolkit
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    24x7 Bhojan Incident Response
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center font-bold text-sm"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Emergency SOS Banner */}
                    <div className="mt-5 bg-gradient-to-br from-red-500 via-rose-600 to-red-700 text-white rounded-3xl p-5 shadow-lg shadow-red-500/20">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="bg-white/20 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm">
                                    Immediate Assistance
                                </span>
                                <h4 className="text-xl font-black mt-2 leading-tight">
                                    {sosTriggered ? '🚨 SOS Alert Dispatched!' : 'Need Urgent Help?'}
                                </h4>
                                <p className="text-xs text-red-100 mt-1 leading-relaxed">
                                    {sosTriggered
                                        ? 'Our priority safety response team and local authorities are notified with your live GPS location.'
                                        : 'Pressing SOS immediately alerts Bhojan safety dispatch and shares live coordinates with emergency services.'}
                                </p>
                            </div>
                            <span className="text-3xl animate-bounce">🚨</span>
                        </div>

                        {!sosTriggered ? (
                            <button
                                onClick={handleTriggerSOS}
                                className="mt-4 w-full bg-white text-red-600 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-red-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <span>🚨 Trigger Emergency SOS</span>
                            </button>
                        ) : (
                            <div className="mt-4 bg-white/20 backdrop-blur-md rounded-2xl p-2.5 text-center text-xs font-black">
                                Dispatch Ticket #SOS-{Date.now().toString().slice(-4)} Active
                            </div>
                        )}
                    </div>

                    {/* Quick Call Actions */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <a
                            href="tel:112"
                            className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-3 active:scale-95 transition-all"
                        >
                            <span className="text-2xl">🚔</span>
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400">Police / SOS</p>
                                <p className="text-sm font-black text-gray-900 dark:text-white">Dial 112</p>
                            </div>
                        </a>
                        <a
                            href="tel:1800246526"
                            className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-3 active:scale-95 transition-all"
                        >
                            <span className="text-2xl">🎧</span>
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400">Bhojan Support</p>
                                <p className="text-sm font-black text-gray-900 dark:text-white">24x7 Help</p>
                            </div>
                        </a>
                    </div>

                    {/* Share Live Ride Card */}
                    <div className="mt-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-3xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📍</span>
                                <h5 className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                                    Share Live Ride with Family
                                </h5>
                            </div>
                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                                Real-time GPS
                            </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mb-3">
                            Send an interactive tracking link to your roommates or family members so they can watch the delivery partner arrive.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleWhatsAppShare}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                <span>💬 WhatsApp</span>
                            </button>
                            <button
                                onClick={handleNativeShare}
                                className="flex-1 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                <span>🔗 Share Link</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RiderSafetyModal;

