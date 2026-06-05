import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import api from '../utils/api';

const QUICK_QUERIES = [
    '🌶️ Spicy veg food',
    '🍗 Chicken under ₹200',
    '🍕 Pizza',
    '🥗 Healthy salad',
    '🍛 Biryani',
    '🍔 Burger',
];

const BhojanAI = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Hi! I'm Bhojan AI 🤖\nTell me what you're craving and I'll find the perfect dishes for you!" }
    ]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const chatEndRef = useRef(null);
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector(s => s.user);
    const cart = useSelector(s => s.cart);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 300);
    }, [open]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, results]);

    const search = async (q) => {
        if (!q.trim()) return;
        const userMsg = q.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setQuery('');
        setResults([]);
        setLoading(true);

        try {
            const { data } = await api.get(`/recommendations/ai?query=${encodeURIComponent(userMsg)}`);
            if (data.success) {
                setMessages(prev => [...prev, { role: 'ai', text: `🔍 ${data.summary}` }]);
                setResults(data.items || []);
                if (!data.items?.length) {
                    setMessages(prev => [...prev, { role: 'ai', text: "😕 Nothing matched! Try different keywords like 'veg spicy' or 'burger under 200'." }]);
                }
            }
        } catch {
            setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Something went wrong. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (item) => {
        if (!isAuthenticated || user?.role !== 'Customer') return;
        dispatch(addToCart({ ...item }));
        setMessages(prev => [...prev, { role: 'ai', text: `✅ **${item.name}** added to your cart!` }]);
    };

    return (
        <>
            {/* Floating bubble */}
            <motion.button
                id="bhojan-ai-trigger"
                onClick={() => setOpen(o => !o)}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-24 right-5 z-[200] w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-2xl flex items-center justify-center text-2xl border-2 border-white/30"
                title="Bhojan AI – Find food by craving"
            >
                {open ? '✕' : '🤖'}
                {!open && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                )}
            </motion.button>

            {/* Drawer */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, x: 80, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 80, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="fixed bottom-44 right-4 z-[199] w-[360px] max-w-[95vw] bg-gray-950 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        style={{ maxHeight: '70vh' }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-4 flex items-center gap-3 flex-shrink-0">
                            <span className="text-2xl">🤖</span>
                            <div>
                                <p className="text-white font-black text-sm uppercase tracking-widest">Bhojan AI</p>
                                <p className="text-white/70 text-[10px] font-bold">Describe your craving</p>
                            </div>
                            <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        </div>

                        {/* Chat area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-medium leading-relaxed whitespace-pre-line ${
                                        msg.role === 'user'
                                            ? 'bg-amber-500 text-white rounded-br-sm'
                                            : 'bg-gray-800 text-gray-200 rounded-bl-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                                        {[0,1,2].map(i => (
                                            <span key={i} className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Results cards */}
                            {results.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    {results.map(item => (
                                        <motion.div
                                            key={item._id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-gray-900 border border-gray-700 rounded-2xl p-3 flex items-center gap-3"
                                        >
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-gray-800"
                                                onError={e => { e.target.style.display = 'none'; }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-black text-sm truncate">{item.name}</p>
                                                <p className="text-gray-400 text-[10px] truncate">{item.shop?.name} · {item.shop?.city}</p>
                                                <p className="text-amber-400 font-black text-sm mt-0.5">₹{item.price}</p>
                                            </div>
                                            <button
                                                onClick={() => handleAddToCart(item)}
                                                disabled={!isAuthenticated || user?.role !== 'Customer'}
                                                className="flex-shrink-0 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all active:scale-95"
                                            >
                                                {!isAuthenticated ? 'Login' : user?.role !== 'Customer' ? 'N/A' : '+ Add'}
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Quick suggestions */}
                        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
                            {QUICK_QUERIES.map(q => (
                                <button
                                    key={q}
                                    onClick={() => search(q)}
                                    className="flex-shrink-0 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-bold px-3 py-1.5 rounded-full border border-gray-700 transition-all whitespace-nowrap"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="px-4 pb-4 flex-shrink-0">
                            <form
                                onSubmit={e => { e.preventDefault(); search(query); }}
                                className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-2"
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="e.g. vegan spicy food under ₹150…"
                                    className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !query.trim()}
                                    className="w-8 h-8 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 rounded-xl flex items-center justify-center text-white transition-all active:scale-90 flex-shrink-0"
                                >
                                    {loading ? (
                                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <span className="text-sm">↑</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default BhojanAI;
