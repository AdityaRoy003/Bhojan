import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const BillSplitModal = ({ isOpen, onClose, members = [], totalAmount = 0, partyId = 'BHOJAN' }) => {
    const [splitMode, setSplitMode] = useState('individual'); // 'individual' | 'equal'
    const [paidStatus, setPaidStatus] = useState({});
    const [selectedMemberQR, setSelectedMemberQR] = useState(null);

    if (!isOpen) return null;

    // Ensure there's at least the current user
    const safeMembers = members.length > 0 ? members : [
        { name: 'You (Host)', itemsCount: 2, subtotal: totalAmount }
    ];

    const equalShare = totalAmount / (safeMembers.length || 1);

    const togglePaid = (name) => {
        setPaidStatus(prev => {
            const next = { ...prev, [name]: !prev[name] };
            if (next[name]) toast.success(`Marked ${name}'s share as Paid! 🎉`);
            return next;
        });
    };

    const generateUPILink = (amount, name) => {
        const upiId = 'bhojan.pay@upi';
        const note = encodeURIComponent(`Bhojan Order Split - ${name} (#${partyId})`);
        return `upi://pay?pa=${upiId}&pn=Bhojan&am=${amount.toFixed(2)}&tn=${note}&cu=INR`;
    };

    const shareOnWhatsApp = (name, amount) => {
        const upiLink = generateUPILink(amount, name);
        const text = encodeURIComponent(
            `🍕 *Bhojan Group Order Bill Split*\n` +
            `Hey ${name}, here is your share for our Bhojan feast:\n\n` +
            `💰 *Amount Due:* ₹${amount.toFixed(2)}\n` +
            `Party Code: #${partyId}\n\n` +
            `👉 *Tap to pay directly via UPI (GPay/PhonePe/Paytm):*\n${upiLink}\n\n` +
            `Thanks for ordering with Bhojan!`
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
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

                {/* Modal Window */}
                <motion.div
                    initial={{ scale: 0.92, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[36px] shadow-2xl border border-gray-100 dark:border-gray-800 p-6 max-h-[90vh] overflow-y-auto no-scrollbar z-10"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-600 text-white flex items-center justify-center text-xl shadow-md">
                                ⚡
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-gray-900 dark:text-white leading-tight">
                                    Instant UPI Bill Splitter
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    GPay · PhonePe · Paytm · WhatsApp
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

                    {/* Total & Mode Selector */}
                    <div className="mt-5 bg-gradient-to-r from-orange-500 via-primary to-rose-600 rounded-3xl p-5 text-white shadow-lg shadow-orange-500/20">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-200">
                                    Total Order Bill
                                </p>
                                <h2 className="text-3xl font-black mt-0.5">₹{totalAmount.toFixed(2)}</h2>
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-2xl bg-white/20 backdrop-blur-md">
                                {safeMembers.length} {safeMembers.length === 1 ? 'Member' : 'Members'}
                            </span>
                        </div>

                        {/* Split Mode Toggle */}
                        <div className="grid grid-cols-2 gap-2 mt-4 bg-black/20 p-1 rounded-2xl">
                            <button
                                onClick={() => setSplitMode('individual')}
                                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                    splitMode === 'individual' ? 'bg-white text-orange-600 shadow-sm' : 'text-white/70 hover:text-white'
                                }`}
                            >
                                By Items Ordered
                            </button>
                            <button
                                onClick={() => setSplitMode('equal')}
                                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                    splitMode === 'equal' ? 'bg-white text-orange-600 shadow-sm' : 'text-white/70 hover:text-white'
                                }`}
                            >
                                Split Equally (₹{equalShare.toFixed(0)} each)
                            </button>
                        </div>
                    </div>

                    {/* Member Split Cards */}
                    <div className="mt-5 space-y-3">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                            Participant Shares & Payment Actions
                        </p>

                        {safeMembers.map((member, idx) => {
                            const name = member.name || member.userName || `Member ${idx + 1}`;
                            const amount = splitMode === 'equal' ? equalShare : (member.subtotal || member.share || equalShare);
                            const isPaid = paidStatus[name];
                            const upiLink = generateUPILink(amount, name);

                            return (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-3xl border transition-all ${
                                        isPaid
                                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                                            : 'bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-700/60'
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 font-black text-xs flex items-center justify-center">
                                                {name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-900 dark:text-white">{name}</p>
                                                <p className="text-[9px] text-gray-400 font-bold">
                                                    {isPaid ? '✅ Payment Settled' : '⏳ Pending Payment'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-gray-900 dark:text-white">
                                                ₹{amount.toFixed(2)}
                                            </p>
                                            <button
                                                onClick={() => togglePaid(name)}
                                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                    isPaid ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40' : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                            >
                                                {isPaid ? 'Paid' : 'Mark as Paid'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/40">
                                        <a
                                            href={upiLink}
                                            className="bg-primary hover:bg-red-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                                        >
                                            <span>⚡ Pay via UPI</span>
                                        </a>
                                        <button
                                            onClick={() => shareOnWhatsApp(name, amount)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                                        >
                                            <span>💬 WhatsApp</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer Tip */}
                    <div className="mt-5 text-center">
                        <p className="text-[10px] font-bold text-gray-400">
                            💡 UPI links open directly in Google Pay, PhonePe, and Paytm on Android & iOS.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BillSplitModal;

