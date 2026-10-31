import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { addToCart } from '../redux/cartSlice';
import api from '../utils/api';
import { toast } from 'react-toastify';

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
        return { text: "👋 Hey! I'm your Bhojan AI Concierge. Speak or type anything — support, order tracking, coupons — or try Voice Ordering in Hinglish or English!", actions: [] };
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
    return null;
};

const QUICK_SUPPORT = ['📦 Track Order', '🎁 Coupons', '💎 Prime Info', '❓ Get Help'];
const QUICK_CRAVINGS = ['🌶️ Spicy veg food', '🍗 Chicken under ₹200', '🍕 Pizza', '🍛 Biryani', '🔥 Trending'];

const BhojanAI = () => {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('voice'); // 'voice' | 'craving' | 'support'

    // Voice Order state
    const [isListening, setIsListening] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [voiceLang, setVoiceLang] = useState('en-IN'); // 'en-IN' | 'hi-IN'
    const [voiceMatchedItems, setVoiceMatchedItems] = useState([]);
    const [voiceReply, setVoiceReply] = useState("🎙️ Tap the mic and say: '2 plate Biryani aur 1 Coke add karo' or '1 Veg Pizza'");
    const [voiceLoading, setVoiceLoading] = useState(false);

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

    // ── Web Speech API Handler ──────────────────────────────────────────────
    const startVoiceRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.warning("Voice recognition not supported in this browser. Try Chrome/Edge!");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = voiceLang;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setVoiceReply("👂 Listening... Speak your food order!");
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            setVoiceTranscript(transcript);
            setIsListening(false);
            processVoiceTranscript(transcript);
        };

        recognition.onerror = (err) => {
            setIsListening(false);
            console.error("Speech recognition error:", err);
            setVoiceReply("⚠️ Couldn't hear clearly. Please tap the mic and try again!");
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        try {
            recognition.start();
        } catch (e) {
            setIsListening(false);
        }
    };

    const processVoiceTranscript = async (text) => {
        setVoiceLoading(true);
        setVoiceMatchedItems([]);
        try {
            const { data } = await api.post('/recommendations/voice-order', { transcript: text });
            if (data.success) {
                setVoiceReply(data.speechReply || 'Here is what I found for you:');
                setVoiceMatchedItems(data.matchedItems || []);
            }
        } catch (error) {
            setVoiceReply("😕 Couldn't process voice order. Please try saying item names clearly.");
        } finally {
            setVoiceLoading(false);
        }
    };

    const handleAddAllVoiceItems = () => {
        if (!isAuthenticated || user?.role !== 'Customer') {
            toast.warning("Please login as Customer to add items to cart!");
            return;
        }
        if (voiceMatchedItems.length === 0) return;

        voiceMatchedItems.forEach(({ item, quantity, restaurant }) => {
            dispatch(addToCart({
                ...item,
                quantity: quantity || 1,
                shop: restaurant || item.shop
            }));
        });
        toast.success(`Added ${voiceMatchedItems.length} items to your cart! 🛒`);
        setVoiceMatchedItems([]);
        setVoiceReply("✅ Added to cart! Open cart or view more recommendations.");
    };

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
                setSupportMessages(prev => [...prev, {
                    from: 'bot',
                    text: "🍽️ Sounds like a food craving or order! Try the 🎤 Voice or 🧠 Craving tab.",
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
        toast.success(`✅ ${item.name} added to cart!`);
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
                        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] right-4 z-[195] w-[calc(100vw-2rem)] sm:w-[380px] bg-white dark:bg-gray-900 rounded-[28px] shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden"
                        style={{ maxHeight: '72vh' }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-5 py-4 flex items-center gap-3 shrink-0">
                            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">🤖</div>
                            <div>
                                <p className="text-white font-black text-sm tracking-tight">Bhojan AI Concierge</p>
                                <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Voice & Food AI Assistant</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="ml-auto w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">✕</button>
                        </div>

                        {/* Tab Selector */}
                        <div className="flex border-b border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-gray-850">
                            <button
                                onClick={() => setTab('voice')}
                                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-1 ${tab === 'voice' ? 'text-primary border-primary bg-white dark:bg-gray-900' : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                <span>🎙️</span> Voice Order
                            </button>
                            <button
                                onClick={() => setTab('craving')}
                                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-1 ${tab === 'craving' ? 'text-primary border-primary bg-white dark:bg-gray-900' : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                <span>🧠</span> Craving AI
                            </button>
                            <button
                                onClick={() => setTab('support')}
                                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-1 ${tab === 'support' ? 'text-primary border-primary bg-white dark:bg-gray-900' : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                <span>💬</span> Help
                            </button>
                        </div>

                        {/* Tab 1: Voice Order */}
                        {tab === 'voice' && (
                            <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-between min-h-0 space-y-4">
                                {/* Language Toggle */}
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                                    <button
                                        onClick={() => setVoiceLang('en-IN')}
                                        className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all ${voiceLang === 'en-IN' ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-sm' : 'text-gray-400'}`}
                                    >
                                        English (IN)
                                    </button>
                                    <button
                                        onClick={() => setVoiceLang('hi-IN')}
                                        className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all ${voiceLang === 'hi-IN' ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-sm' : 'text-gray-400'}`}
                                    >
                                        Hinglish / हिन्दी
                                    </button>
                                </div>

                                {/* Assistant Speech Bubble */}
                                <div className="w-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 p-4 rounded-2xl text-center">
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-relaxed">
                                        {voiceReply}
                                    </p>
                                    {voiceTranscript && (
                                        <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-2 font-mono italic">
                                            "{voiceTranscript}"
                                        </p>
                                    )}
                                </div>

                                {/* Big Animated Microphone Button */}
                                <div className="relative py-2 flex flex-col items-center">
                                    {isListening && (
                                        <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping scale-150" />
                                    )}
                                    <motion.button
                                        whileTap={{ scale: 0.92 }}
                                        onClick={startVoiceRecognition}
                                        disabled={voiceLoading}
                                        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-2xl transition-all z-10 ${
                                            isListening
                                                ? 'bg-red-600 text-white animate-pulse shadow-red-500/50'
                                                : 'bg-gradient-to-tr from-orange-500 to-red-500 text-white shadow-orange-500/30 hover:scale-105'
                                        }`}
                                    >
                                        {voiceLoading ? '⏳' : isListening ? '⏹️' : '🎙️'}
                                    </motion.button>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-3">
                                        {isListening ? 'Listening...' : 'Tap to Speak Order'}
                                    </p>
                                </div>

                                {/* Matched Dishes Result */}
                                {voiceMatchedItems.length > 0 && (
                                    <div className="w-full space-y-2 max-h-48 overflow-y-auto">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                Matched Items ({voiceMatchedItems.length})
                                            </span>
                                            <button
                                                onClick={handleAddAllVoiceItems}
                                                className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full hover:bg-emerald-100"
                                            >
                                                🛒 Add All to Cart
                                            </button>
                                        </div>
                                        {voiceMatchedItems.map(({ item, quantity, restaurant }, idx) => (
                                            <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-xs text-gray-800 dark:text-gray-100 truncate">{item.name}</p>
                                                        <p className="text-[10px] text-gray-400 truncate">{restaurant?.name || 'Local'} • ₹{item.price}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-orange-500">×{quantity}</span>
                                                    <button
                                                        onClick={() => handleAddToCart({ ...item, quantity, shop: restaurant })}
                                                        className="px-2.5 py-1 bg-orange-500 text-white rounded-lg text-[10px] font-black uppercase"
                                                    >
                                                        + Add
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab 2: Support Tab */}
                        {tab === 'support' && (
                            <>
                                <div className="px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                                    {QUICK_SUPPORT.map(q => (
                                        <button key={q} onClick={() => sendSupport(q.replace(/^[^\s]+\s/, ''))}
                                            className="shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all whitespace-nowrap">
                                            {q}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0">
                                    {supportMessages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className="max-w-[80%] space-y-2">
                                                <div className={`px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed ${msg.from === 'user' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
                                                    {msg.text}
                                                </div>
                                                {msg.actions?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {msg.actions.map((a, j) => (
                                                            <Link key={j} to={a.link} onClick={() => setOpen(false)}
                                                                className="text-[10px] font-black px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full border border-orange-100 dark:border-orange-800 hover:bg-orange-100 transition-colors">
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
                                            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-2xl flex gap-1 items-center">
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={supportEndRef} />
                                </div>
                                <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2 shrink-0">
                                    <input
                                        ref={tab === 'support' ? inputRef : null}
                                        value={supportInput}
                                        onChange={e => setSupportInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && sendSupport()}
                                        placeholder="Ask a question..."
                                        className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-none border border-gray-100 dark:border-gray-700 placeholder:text-gray-400"
                                    />
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendSupport()}
                                        className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white text-xs shadow-md">
                                        ➔
                                    </motion.button>
                                </div>
                            </>
                        )}

                        {/* Tab 3: Craving AI Tab */}
                        {tab === 'craving' && (
                            <>
                                <div className="px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                                    {QUICK_CRAVINGS.map(q => (
                                        <button key={q} onClick={() => searchCraving(q)}
                                            className="shrink-0 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-700/50 hover:bg-amber-100 transition-all whitespace-nowrap">
                                            {q}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0">
                                    {cravingMessages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    {cravingResults.length > 0 && (
                                        <div className="space-y-2 mt-2">
                                            {cravingResults.map(item => (
                                                <div key={item._id} className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 flex gap-3 items-center shadow-sm">
                                                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{item.name}</p>
                                                        <p className="text-[10px] text-gray-400 truncate">{item.category} • ₹{item.price}</p>
                                                    </div>
                                                    <button onClick={() => handleAddToCart(item)}
                                                        className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all">
                                                        + Add
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div ref={cravingEndRef} />
                                </div>
                                <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2 shrink-0">
                                    <input
                                        ref={tab === 'craving' ? inputRef : null}
                                        value={cravingInput}
                                        onChange={e => setCravingInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && searchCraving()}
                                        placeholder="Describe your craving..."
                                        className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-none border border-gray-100 dark:border-gray-700 placeholder:text-gray-400"
                                    />
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => searchCraving()}
                                        className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white text-xs shadow-md">
                                        ➔
                                    </motion.button>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Single FAB Trigger */}
            <motion.button
                id="bhojan-ai-trigger"
                onClick={() => setOpen(o => !o)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-4 z-[200] w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-2xl shadow-orange-500/30 flex items-center justify-center text-2xl border-2 border-white/30"
                title="Bhojan AI Concierge & Voice Ordering"
            >
                <AnimatePresence mode="wait">
                    {open
                        ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} className="font-black text-base">✕</motion.span>
                        : <motion.span key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>🎙️</motion.span>
                    }
                </AnimatePresence>
                {!open && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                )}
            </motion.button>
        </>
    );
};

export default BhojanAI;
