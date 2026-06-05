import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const INTENTS = {
    greet: ['hi', 'hello', 'hey', 'namaste'],
    track: ['track', 'order', 'where', 'status', 'delivery'],
    recommend: ['suggest', 'recommend', 'what should', 'hungry', 'eat'],
    coupon: ['coupon', 'discount', 'promo', 'offer', 'code'],
    support: ['help', 'issue', 'problem', 'complaint', 'refund', 'wrong'],
    prime: ['prime', 'membership', 'subscribe'],
    quest: ['quest', 'challenge', 'badge', 'reward'],
};

const getResponse = (input, isAuthenticated) => {
    const lower = input.toLowerCase();
    if (INTENTS.greet.some(k => lower.includes(k))) {
        return { text: `👋 Hey there! I'm Bhojan Bot. I can help you track orders, find food, apply coupons, and more. What do you need?`, actions: [] };
    }
    if (INTENTS.track.some(k => lower.includes(k))) {
        return {
            text: `📦 To track your order, head to your order history page!`,
            actions: [{ label: '📋 My Orders', link: '/profile?tab=orders' }]
        };
    }
    if (INTENTS.recommend.some(k => lower.includes(k))) {
        const hour = new Date().getHours();
        const meal = hour < 11 ? 'a hearty breakfast 🍳' : hour < 15 ? 'some lunch 🍛' : hour < 18 ? 'a snack ☕' : 'dinner 🌙';
        return {
            text: `🍽️ Sounds like you're in the mood for ${meal}! Browse what's trending near you.`,
            actions: [{ label: '🔍 Browse Restaurants', link: '/home' }]
        };
    }
    if (INTENTS.coupon.some(k => lower.includes(k))) {
        return {
            text: `🎁 You can apply coupons at checkout! You can also spin the Spin-the-Wheel on the home page to win discounts.`,
            actions: [{ label: '🏠 Go to Home', link: '/home' }]
        };
    }
    if (INTENTS.prime.some(k => lower.includes(k))) {
        return {
            text: `💎 Bhojan Prime gives you free delivery, exclusive discounts, and priority support! Want to know more?`,
            actions: [{ label: '💎 Learn About Prime', link: '/prime-membership' }]
        };
    }
    if (INTENTS.quest.some(k => lower.includes(k))) {
        return {
            text: `🏆 Food Quests are challenges that earn you badges and loyalty points! Complete them in your profile.`,
            actions: isAuthenticated ? [{ label: '🏆 My Quests', link: '/profile?tab=quests' }] : []
        };
    }
    if (INTENTS.support.some(k => lower.includes(k))) {
        return {
            text: `😟 I'm sorry to hear that! Let me connect you with our support team. You can raise a ticket from your profile.`,
            actions: isAuthenticated ? [{ label: '🎫 Raise a Ticket', link: '/profile?tab=support' }] : [{ label: '📞 Contact Support', link: '/profile' }]
        };
    }
    return {
        text: `🤔 I'm not sure I understand. Try asking about: tracking your order, recommendations, coupons, Prime membership, or support!`,
        actions: []
    };
};

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            from: 'bot', text: '👋 Hi! I\'m your Bhojan food concierge. How can I help you today?', actions: [
                { label: '📦 Track Order', link: '/profile?tab=orders' },
                { label: '🍕 Suggest Food', link: '/home' },
            ]
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const bottomRef = useRef(null);
    const { isAuthenticated } = useSelector(state => state.user);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        if (!input.trim()) return;
        const userMsg = { from: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        setTimeout(() => {
            const response = getResponse(input, isAuthenticated);
            setMessages(prev => [...prev, { from: 'bot', ...response }]);
            setIsTyping(false);
        }, 800);
    };

    return (
        <div className="fixed bottom-[130px] right-4 z-[150] md:bottom-10 md:right-8">
            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="mb-4 w-[calc(100vw-2rem)] sm:w-80 bg-white dark:bg-gray-900 rounded-[28px] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col"
                        style={{ height: '440px', maxHeight: '60vh' }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl">🤖</div>
                            <div>
                                <p className="text-white font-black text-sm">Bhojan Bot</p>
                                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">AI Food Concierge</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="ml-auto text-white/80 hover:text-white text-lg transition-colors">✕</button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] space-y-2`}>
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${msg.from === 'user'
                                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-br-sm'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                                            }`}>
                                            {msg.text}
                                        </div>
                                        {msg.actions && msg.actions.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {msg.actions.map((a, j) => (
                                                    <Link key={j} to={a.link} onClick={() => setIsOpen(false)}
                                                        className="text-[11px] font-black px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full border border-orange-100 dark:border-orange-800 hover:bg-orange-100 transition-colors"
                                                    >
                                                        {a.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                                                className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                placeholder="Ask me anything..."
                                className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl px-4 py-2.5 text-sm font-medium focus:outline-none border border-gray-100 dark:border-gray-700 placeholder:text-gray-400"
                            />
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={sendMessage}
                                className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-white text-sm shadow-lg shadow-red-200 dark:shadow-red-900/30"
                            >
                                →
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-11 h-11 md:w-14 md:h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-full md:rounded-[22px] shadow-2xl shadow-red-300 dark:shadow-red-900/40 flex items-center justify-center text-xl md:text-2xl relative"
            >
                <AnimatePresence mode="wait">
                    {isOpen
                        ? <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} className="text-white font-black text-lg">✕</motion.span>
                        : <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>🤖</motion.span>
                    }
                </AnimatePresence>
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                )}
            </motion.button>
        </div>
    );
};

export default ChatbotWidget;
