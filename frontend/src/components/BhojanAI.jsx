import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { addToCart } from '../redux/cartSlice';
import api from '../utils/api';

// ── Intent-based response engine ────────────────────────────────────────────
const INTENTS = {
    greet: ['hi', 'hello', 'hey', 'namaste'],
    track: ['track', 'order', 'where', 'status', 'delivery', 'delivered'],
    coupon: ['coupon', 'discount', 'promo', 'offer', 'code'],
    support: ['help', 'issue', 'problem', 'complaint', 'refund', 'wrong'],
    prime: ['prime', 'membership', 'subscribe'],
    quest: ['quest', 'challenge', 'badge', 'reward', 'loyalty'],
};

const getIntentResponse = (input) => {
    const l = input.toLowerCase();
    if (INTENTS.greet.some(k => l.includes(k)))
        return { text: "👋 Hey! I'm your Bhojan AI Concierge. Ask me anything — support, orders, coupons — or switch to the 🧠 Craving tab to search food by mood!", actions: [] };
    if (INTENTS.track.some(k => l.includes(k)))
        return { text: '📦 To track your order, head to your order history!', actions: [{ label: '📋 My Orders', link: '/profile?tab=orders' }] };
    if (INTENTS.coupon.some(k => l.includes(k)))
        return { text: '🎁 Apply coupons at checkout! Spin the Wheel on the home page to win free coupons too.', actions: [{ label: '🏠 Home', link: '/home' }] };
    if (INTENTS.prime.some(k => l.includes(k)))
        return { text: '💎 Bhojan Prime gives you free delivery, exclusive deals, and priority support!', actions: [{ label: '💎 Explore Prime', link: '/prime-membership' }] };
    if (INTENTS.quest.some(k => l.includes(k)))
        return { text: '🏆 Food Quests earn you badges and loyalty points. Complete them in your profile!', actions: [{ label: '🏆 My Quests', link: '/profile?tab=quests' }] };
    if (INTENTS.support.some(k => l.includes(k)))
        return { text: "😟 I'm sorry to hear that! Let me connect you with our support team.", actions: [{ label: '🎫 Get Support', link: '/profile?tab=support' }] };
    return null; // No intent match → craving search
};

const QUICK_SUPPORT = ['📦 Track Order', '🎁 Coupons', '💎 Prime Info', '❓ Get Help'];
const QUICK_CRAVINGS = ['🌶️ Spicy veg food', '🍗 Chicken under ₹200', '🍕 Pizza', '🍛 Biryani', '🔥 Trending'];

// ── Component ────────────────────────────────────────────────────────────────
const BhojanAI = () => {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('support'); // 'support' | 'craving'

    // Support chat state
    const [supportMessages, setSupportMessages] = useState([{
        from: 'bot',
        text: "👋 Hi! I'm your Bhojan Concierge. How can I help you today?",
        actions: [
            { label: '📦 Track Order', link: '/profile?tab=orders' },
            { label: '💎 Prime Info', link: '/prime-membership' },
        ]
    }]);
    const [supportInput, setSupportInput] = useState('');
    const [supportTyping, setSupportTyping] = useState(false);

    // Craving AI state
    const [cravingMessages, setCravingMessages] = useState([{
        role: 'ai',
        text: "🧠 Tell me what you're craving and I'll find the perfect dishes near you!"
    }]);
    const [cravingInput, setCravingInput] = useState('');
    const [cravingResults, setCravingResults] = useState([]);
    const [cravingLoading, setCravingLoading] = useState(false);

    const supportEndRef = useRef(null);
    const cravingEndRef = useRef(null);
    const inputRef = useRef(null);
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector(s => s.user);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 300);
    }, [open, tab]);

    useEffect(() => {
        supportEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [supportMessages]);

    useEffect(() => {
        cravingEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [cravingMessages, cravingResults]);

    // ── Support chat handler ─────────────────────────────────────────────────
    const sendSupport = (text) => {
        const msg = (text || supportInput).trim();
        if (!msg) return;
        setSupportMessages(prev => [...prev, { from: 'user', text: msg }]);
        setSupportInput('');
        setSupportTyping(true);
        setTimeout(() => {
            const res = getIntentResponse(msg);
            if (res) {
                setSupportMessages(prev => [...prev, { from: 'bot', ...res }]);
            } else {
                // Nudge user to craving tab
                setSupportMessages(prev => [...prev, {
                    from: 'bot',
                    text: "🍽️ Sounds like a food craving! Switch to the 🧠 Craving tab to search dishes by mood.",
                    actions: []
                }]);
            }
            setSupportTyping(false);
        }, 600);
    };

    // ── Craving AI handler ───────────────────────────────────────────────────
    const searchCraving = async (q) => {
        const userMsg = (q || cravingInput).trim();
        if (!userMsg) return;
        setCravingMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setCravingInput('');
        setCravingResults([]);
        setCravingLoading(true);
        try {
            const { data } = await api.get(`/recommendations/ai?query=${encodeURIComponent(userMsg)}`);
            if (data.success) {
                setCravingMessages(prev => [...prev, { role: 'ai', text: `🔍 ${data.summary || 'Here\'s what I found!'}` }]);
                setCravingResults(data.items || []);
                if (!data.items?.length) {
                    setCravingMessages(prev => [...prev, { role: 'ai', text: "😕 Nothing matched! Try 'veg spicy' or 'burger under 200'." }]);
                }
            }
        } catch {
            setCravingMessages(prev => [...prev, { role: 'ai', text: '⚠️ Something went wrong. Please try again.' }]);
        } finally {
            setCravingLoading(false);
        }
    };

    const handleAddToCart = (item) => {
        if (!isAuthenticated || user?.role !== 'Customer') return;
        dispatch(addToCart({ ...item }));
        setCravingMessages(prev => [...prev, { role: 'ai', text: `✅ ${item.name} added to your cart!` }]);
    };

    return (
        <>
            {/* Chat Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="concierge-panel"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] right-4 z-[195] w-[calc(100vw-2rem)] sm:w-[360px] bg-white dark:bg-gray-900 rounded-[28px] shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden"
                        style={{ maxHeight: '68vh' }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-5 py-4 flex items-center gap-3 shrink-0">
                            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl">🤖</div>
                            <div>
                                <p className="text-white font-black text-sm tracking-tight">Bhojan Concierge</p>
                                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">AI-Powered Assistant</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="ml-auto w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">✕</button>
                        </div>

                        {/* Tab Selector */}
                        <div className="flex border-b border-gray-100 dark:border-gray-800 shrink-0">
                            <button
                                onClick={() => setTab('support')}
                                className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${tab === 'support' ? 'text-primary border-primary' : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                💬 Support
                            </button>
                            <button
                                onClick={() => setTab('craving')}
                                className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${tab === 'craving' ? 'text-primary border-primary' : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                🧠 Craving AI
                            </button>
                        </div>

                        {/* Support Tab */}
                        {tab === 'support' && (
                            <>
                                {/* Quick actions */}
                                <div className="px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                                    {QUICK_SUPPORT.map(q => (
                                        <button key={q} onClick={() => sendSupport(q.replace(/^[^\s]+\s/, ''))}
                                            className="shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all whitespace-nowrap">
                                            {q}
                                        </button>
                                    ))}
                                </div>
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0">
                                    {supportMessages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className="max-w-[80%] space-y-2">
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${msg.from === 'user' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
                                                    {msg.text}
                                                </div>
                                                {msg.actions?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {msg.actions.map((a, j) => (
                                                            <Link key={j} to={a.link} onClick={() => setOpen(false)}
                                                                className="text-[11px] font-black px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full border border-orange-100 dark:border-orange-800 hover:bg-orange-100 transition-colors">
                                                                {a.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {supportTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                                                {[0, 1, 2].map(i => (
                                                    <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div ref={supportEndRef} />
                                </div>
                                {/* Input */}
                                <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2 shrink-0">
                                    <input
                                        ref={tab === 'support' ? inputRef : null}
                                        value={supportInput}
                                        onChange={e => setSupportInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && sendSupport()}
                                        placeholder="Ask about orders, coupons, support..."
                                        className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl px-4 py-2.5 text-sm font-medium focus:outline-none border border-gray-100 dark:border-gray-700 placeholder:text-gray-400"
                                    />
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendSupport()}
                                        className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-white text-sm shadow-lg shadow-red-200 dark:shadow-red-900/30">
                                        →
                                    </motion.button>
                                </div>
                            </>
                        )}

                        {/* Craving AI Tab */}
                        {tab === 'craving' && (
                            <>
                                {/* Quick suggestions */}
                                <div className="px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                                    {QUICK_CRAVINGS.map(q => (
                                        <button key={q} onClick={() => searchCraving(q.replace(/^[^\s]+\s/, ''))}
                                            className="shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-all whitespace-nowrap">
                                            {q}
                                        </button>
                                    ))}
                                </div>
                                {/* Messages + Results */}
                                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0">
                                    {cravingMessages.map((msg, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-amber-500 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
                                                {msg.text}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {cravingLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                                                {[0, 1, 2].map(i => (
                                                    <motion.span key={i} className="w-2 h-2 bg-amber-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, delay: i * 0.15, repeat: Infinity }} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {cravingResults.length > 0 && (
                                        <div className="space-y-2 mt-1">
                                            {cravingResults.map(item => (
                                                <motion.div key={item._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                                    className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-3 flex items-center gap-3">
                                                    <img src={item.image} alt={item.name} loading="lazy"
                                                        className="w-14 h-14 rounded-xl object-cover shrink-0 bg-gray-200" onError={e => { e.target.style.display = 'none'; }} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-gray-900 dark:text-white font-black text-sm truncate">{item.name}</p>
                                                        <p className="text-gray-400 text-[10px] truncate">{item.shop?.name} · {item.shop?.city}</p>
                                                        <p className="text-amber-500 font-black text-sm mt-0.5">₹{item.price}</p>
                                                    </div>
                                                    <button onClick={() => handleAddToCart(item)}
                                                        disabled={!isAuthenticated || user?.role !== 'Customer'}
                                                        className="shrink-0 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all active:scale-95">
                                                        {!isAuthenticated ? 'Login' : user?.role !== 'Customer' ? 'N/A' : '+ Add'}
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                    <div ref={cravingEndRef} />
                                </div>
                                {/* Input */}
                                <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2 shrink-0">
                                    <input
                                        ref={tab === 'craving' ? inputRef : null}
                                        value={cravingInput}
                                        onChange={e => setCravingInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && searchCraving()}
                                        placeholder="Describe your craving..."
                                        className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl px-4 py-2.5 text-sm font-medium focus:outline-none border border-gray-100 dark:border-gray-700 placeholder:text-gray-400"
                                    />
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => searchCraving()}
                                        className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white text-sm shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
                                        →
                                    </motion.button>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Single FAB */}
            <motion.button
                id="bhojan-ai-trigger"
                onClick={() => setOpen(o => !o)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-4 z-[200] w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-2xl shadow-red-400/30 flex items-center justify-center text-2xl border-2 border-white/30"
                title="Bhojan AI Concierge"
            >
                <AnimatePresence mode="wait">
                    {open
                        ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} className="font-black text-base">✕</motion.span>
                        : <motion.span key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>🤖</motion.span>
                    }
                </AnimatePresence>
                {!open && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                )}
            </motion.button>
        </>
    );
};

export default BhojanAI;
