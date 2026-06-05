import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence, useInView } from 'framer-motion';
import { useSelector } from 'react-redux';
import ThreeDIntroSplash from '../components/ThreeDIntroSplash';
import ThreeDHeroScene from '../components/ThreeDHeroScene';

// --- Data ---
const features = [
    {
        icon: '⚡',
        title: 'Lightning Fast',
        description: 'Meals delivered in under 30 minutes, guaranteed. No excuses, just food.',
        gradient: 'from-amber-400 to-orange-500',
        glow: 'shadow-amber-200',
    },
    {
        icon: '🗺️',
        title: 'Hyperlocal',
        description: 'Discover hidden gems and family-run kitchens right in your neighborhood.',
        gradient: 'from-emerald-400 to-teal-500',
        glow: 'shadow-emerald-200',
    },
    {
        icon: '🛡️',
        title: 'Safe & Trusted',
        description: 'Every restaurant is FSSAI verified. 100% hygienic, 100% authentic.',
        gradient: 'from-blue-400 to-indigo-500',
        glow: 'shadow-blue-200',
    },
    {
        icon: '💎',
        title: 'Prime Benefits',
        description: 'Exclusive discounts, free deliveries, and priority support with Prime.',
        gradient: 'from-purple-400 to-pink-500',
        glow: 'shadow-purple-200',
    },
];

const testimonials = [
    {
        name: 'Priya Sharma',
        location: 'Mumbai',
        avatar: 'P',
        rating: 5,
        text: 'Bhojan changed how I eat! The hyperlocal restaurants are incredible. Found a hidden biryani place 2 mins from home!',
        gradient: 'from-amber-400 to-orange-500',
    },
    {
        name: 'Arjun Mehta',
        location: 'Bangalore',
        avatar: 'A',
        rating: 5,
        text: 'Prime membership pays for itself. Free delivery on everything plus exclusive restaurant deals. Absolutely love it.',
        gradient: 'from-indigo-400 to-purple-500',
    },
    {
        name: 'Kavya Reddy',
        location: 'Hyderabad',
        avatar: 'K',
        rating: 5,
        text: 'The 30-min guarantee is real! My food always arrives hot and on time. Best food delivery app, period.',
        gradient: 'from-emerald-400 to-teal-500',
    },
];

const stats = [
    { label: 'Partner Restaurants', value: 500, suffix: '+', icon: '🏪' },
    { label: 'Orders Delivered', value: 10000, suffix: '+', icon: '🛵' },
    { label: 'Cities Covered', value: 48, suffix: '+', icon: '🗺️' },
    { label: 'Happy Customers', value: 50000, suffix: '+', icon: '😊' },
];

const foodEmojis = ['🍕', '🍔', '🌮', '🍜', '🍣', '🥘', '🍛', '🥗', '🍱', '🧆'];

// Dynamic Landing Offer Banners
const landingOffers = [
    { text: 'Late Night Cravings? 🌃 Get Flat ₹100 OFF on snacks from 11 PM to 3 AM!', bg: 'from-purple-900/40 to-indigo-900/40', border: 'border-indigo-500/30' },
    { text: 'Lunch Specials! 🍛 Combos starting at just ₹120. Order between 12 PM - 3 PM.', bg: 'from-amber-900/40 to-orange-900/40', border: 'border-orange-500/30' },
    { text: 'Weekend Feasts! 🥳 Free Delivery on orders above ₹299 this Saturday & Sunday.', bg: 'from-emerald-900/40 to-teal-900/40', border: 'border-emerald-500/30' }
];

// Instagram Story Slides Data
const storySlides = [
    {
        logo: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=100&auto=format',
        shopName: 'Biryani Darbar 🍛',
        mediaUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400&auto=format',
        caption: 'Steam rising from our fresh clay-pot Lucknowi Biryani! Freshly prepared, delivered hot.',
        likes: '1,452 likes'
    },
    {
        logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format',
        shopName: 'Pizza Crave 🍕',
        mediaUrl: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=400&auto=format',
        caption: 'The ultimate cheese pull you deserve today! Double mozzarella with fresh basil topping.',
        likes: '2,987 likes'
    },
    {
        logo: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=100&auto=format',
        shopName: 'Sweet Tooth 🍰',
        mediaUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=400&auto=format',
        caption: 'Hot glazed donuts dipped in dark Belgian chocolate. Treat yourself, you earned it!',
        likes: '942 likes'
    }
];

// AI Recommendations Mockups
const aiVibes = {
    'Cheat Day 🍔': [
        { name: 'Spicy Chicken Biryani', match: 99, tag: 'Best Seller', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=200&auto=format' },
        { name: 'Double Cheese Burger', match: 96, tag: 'Extra Cheese', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&auto=format' },
    ],
    'Health Freak 🥗': [
        { name: 'Avocado Quinoa Salad', match: 98, tag: 'High Protein', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=200&auto=format' },
        { name: 'Multi-grain Veg Poha', match: 94, tag: 'Low Calorie', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=200&auto=format' }
    ],
    'Tea Time ☕': [
        { name: 'Adrak Chai & Samosa Combo', match: 99, tag: 'Monsoon Vibe', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=200&auto=format' },
        { name: 'Paneer Pakora (6 pcs)', match: 95, tag: 'Hot & Crispy', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=200&auto=format' }
    ],
    'Late Night 🍕': [
        { name: 'Midnight Cheese Maggi', match: 99, tag: 'Classic Late Night', image: 'https://images.unsplash.com/photo-1612966608967-312ba599102e?q=80&w=200&auto=format' },
        { name: 'Egg Chicken Roll', match: 97, tag: 'Spicy Wrap', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=200&auto=format' }
    ]
};

// --- Helper Components ---
const FloatingEmoji = ({ emoji, delay, x, y, size = 'text-4xl' }) => (
    <motion.div
        className={`absolute ${size} select-none pointer-events-none z-10`}
        style={{ left: x, top: y }}
        initial={{ opacity: 0, scale: 0, rotate: -20 }}
        animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.8],
            y: [0, -30, -60, -90],
            rotate: [0, 10, -10, 5],
        }}
        transition={{
            duration: 4,
            delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 3 + 2,
            ease: 'easeInOut',
        }}
    >
        {emoji}
    </motion.div>
);

const AnimatedCounter = ({ value, suffix }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        const duration = 2000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [inView, value]);

    return (
        <span ref={ref}>
            {count.toLocaleString('en-IN')}{suffix}
        </span>
    );
};

// --- Main Component ---
const Landing = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector(state => state.user);
    const { scrollY } = useScroll();
    const heroRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [introComplete, setIntroComplete] = useState(() => {
        return sessionStorage.getItem('bhojanIntroSeen') === 'true';
    });

    // Dynamic offer banner timer
    const [offerIndex, setOfferIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setOfferIndex(prev => (prev + 1) % landingOffers.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Instagram Story simulator state
    const [activeStoryIdx, setActiveStoryIdx] = useState(0);
    const [storyProgress, setStoryProgress] = useState(0);
    useEffect(() => {
        setStoryProgress(0);
        const progressInterval = setInterval(() => {
            setStoryProgress(prev => {
                if (prev >= 100) {
                    setActiveStoryIdx(current => (current + 1) % storySlides.length);
                    return 0;
                }
                return prev + 1.25; // Speed of progress bar
            });
        }, 50);
        return () => clearInterval(progressInterval);
    }, [activeStoryIdx]);

    // AI recommendation vibe state
    const [selectedVibe, setSelectedVibe] = useState('Cheat Day 🍔');

    // Spin the wheel states for Guest Users
    const [showSpinModal, setShowSpinModal] = useState(false);
    const [spinning, setSpinning] = useState(false);
    const [spinRotation, setSpinRotation] = useState(0);
    const [spinResult, setSpinResult] = useState(null);

    const prizes = [
        { label: '15% OFF', code: 'BHOJAN15', color: 'bg-red-500' },
        { label: 'FREE DESSERT', code: 'SWEETBHOJAN', color: 'bg-indigo-500' },
        { label: '10% OFF', code: 'BHOJAN10', color: 'bg-green-500' },
        { label: 'FREE DELIVERY', code: 'FREEDEL', color: 'bg-yellow-500' },
        { label: '20% OFF', code: 'SUPERBHOJAN', color: 'bg-purple-500' },
        { label: '₹100 OFF', code: 'BHOJAN100', color: 'bg-teal-500' },
        { label: '5% OFF', code: 'BHOJAN5', color: 'bg-pink-500' },
        { label: 'TRY AGAIN', code: null, color: 'bg-gray-500' }
    ];

    const handleSpin = () => {
        if (spinning) return;
        setSpinning(true);
        setSpinResult(null);

        const winningIndex = Math.floor(Math.random() * prizes.length);
        const degreesPerSegment = 360 / prizes.length;
        const extraSpins = 6;
        const targetRotation = (extraSpins * 360) + (360 - (winningIndex * degreesPerSegment)) - (degreesPerSegment / 2);

        setSpinRotation(targetRotation);

        setTimeout(() => {
            setSpinResult(prizes[winningIndex]);
            setSpinning(false);
            if (prizes[winningIndex].code) {
                // Store coupon temporarily in localstorage
                localStorage.setItem('landing_coupon', prizes[winningIndex].code);
            }
        }, 4000);
    };

    // Redirect authenticated users
    useEffect(() => {
        if (isAuthenticated) {
            const isShoppingMode = localStorage.getItem('isShoppingMode') === 'true';
            if (user?.role === 'Admin' && !isShoppingMode) {
                navigate('/profile');
            } else if (user?.role === 'Owner' && !isShoppingMode) {
                navigate('/owner/dashboard');
            } else if (user?.role === 'Delivery' && !isShoppingMode) {
                navigate('/delivery/dashboard');
            } else {
                navigate('/home');
            }
        }
    }, [isAuthenticated, user, navigate]);

    // Mouse tracking for parallax
    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        setMousePos({
            x: (clientX / innerWidth - 0.5) * 2,
            y: (clientY / innerHeight - 0.5) * 2,
        });
    };

    // Scroll transforms
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
    const heroY = useTransform(scrollY, [0, 400], [0, -80]);
    const bgScale = useTransform(scrollY, [0, 500], [1, 1.1]);

    return (
        <>
            <AnimatePresence>
                {!introComplete && (
                    <ThreeDIntroSplash onComplete={() => setIntroComplete(true)} />
                )}
            </AnimatePresence>
            <div className="bg-gray-950 text-white overflow-x-hidden min-h-screen" onMouseMove={handleMouseMove}>

            {/* ========== HERO SECTION ========== */}
            <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">

                {/* Animated Gradient Background */}
                <motion.div
                    style={{ scale: bgScale }}
                    className="absolute inset-0 z-0 pointer-events-none"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/20 rounded-full blur-3xl"
                    />
                </motion.div>

                {/* Grid Pattern */}
                <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

                {/* Parallax Floating Food Illustration Cards */}
                <motion.div 
                    style={{ x: mousePos.x * 25, y: mousePos.y * 25 }}
                    className="absolute top-24 left-[10%] hidden md:flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl z-10 pointer-events-none"
                >
                    <span className="text-3xl">🍕</span>
                    <div>
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none font-sans">Cheesy Pizza</p>
                        <p className="text-[8px] text-gray-400 font-bold mt-0.5">Cooked to Perfection</p>
                    </div>
                </motion.div>

                <motion.div 
                    style={{ x: mousePos.x * -20, y: mousePos.y * -20 }}
                    className="absolute bottom-32 left-[15%] hidden md:flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl z-10 pointer-events-none"
                >
                    <span className="text-3xl">🍔</span>
                    <div>
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none font-sans">Juicy Burger</p>
                        <p className="text-[8px] text-gray-400 font-bold mt-0.5">Flame Grilled</p>
                    </div>
                </motion.div>

                <motion.div 
                    style={{ x: mousePos.x * 35, y: mousePos.y * -35 }}
                    className="absolute top-36 right-[12%] hidden md:flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl z-10 pointer-events-none"
                >
                    <span className="text-3xl">🍛</span>
                    <div>
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none font-sans">Royal Thali</p>
                        <p className="text-[8px] text-gray-400 font-bold mt-0.5">Mithila Specials</p>
                    </div>
                </motion.div>

                {/* Delivery Scooter Animation */}
                <motion.div
                    className="absolute bottom-16 left-0 bg-white/5 backdrop-blur-lg border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl z-10 pointer-events-none"
                    animate={{ x: ['-25%', '125%'], y: [0, -3, 0, -3, 0] }}
                    transition={{ x: { duration: 20, repeat: Infinity, ease: 'linear' }, y: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } }}
                >
                    <span className="text-3xl">🛵</span>
                    <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">Rider Arjun</p>
                        <p className="text-[10px] text-white font-black mt-1">Delivering Joy 🚀</p>
                    </div>
                </motion.div>

                {/* Floating Food Emojis */}
                {foodEmojis.map((emoji, i) => (
                    <FloatingEmoji
                        key={i}
                        emoji={emoji}
                        delay={i * 0.8}
                        x={`${5 + Math.random() * 90}%`}
                        y={`${5 + Math.random() * 80}%`}
                        size={i % 3 === 0 ? 'text-5xl' : 'text-3xl'}
                    />
                ))}

                {/* Hero Content */}
                <motion.div
                    style={{ opacity: heroOpacity, y: heroY }}
                    className="relative z-20 text-center max-w-6xl mx-auto px-6"
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="flex justify-center mb-8"
                    >
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5 shadow-2xl">
                            <span className="animate-pulse w-2 h-2 bg-green-400 rounded-full" />
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.25em]">Now delivering in 48 cities</span>
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tighter mb-6 font-sans"
                    >
                        <span className="text-white">Taste.</span>
                        <br />
                        <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent italic">
                            Delivered.
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        className="text-base md:text-lg text-gray-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        From street-side dhabas to gourmet restaurants — explore the best food your neighborhood has to offer, delivered fresh to your doorstep.
                    </motion.p>

                    {/* Dynamic Contextual Banner offer */}
                    <div className="max-w-xl mx-auto mb-10 h-16 relative overflow-hidden flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={offerIndex}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className={`px-5 py-2.5 bg-gradient-to-r ${landingOffers[offerIndex].bg} border ${landingOffers[offerIndex].border} rounded-2xl flex items-center gap-2.5 shadow-xl`}
                            >
                                <span className="text-base">📢</span>
                                <p className="text-xs md:text-sm font-black tracking-tight text-white">{landingOffers[offerIndex].text}</p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Link to="/signup">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="relative group bg-gradient-to-r from-amber-500 to-red-500 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-2xl shadow-amber-500/30 overflow-hidden cursor-pointer"
                            >
                                <span className="relative z-10">Order Now — It's Free 🚀</span>
                                <motion.div
                                    className="absolute inset-0 bg-white/20"
                                    initial={{ x: '-100%' }}
                                    whileHover={{ x: '100%' }}
                                    transition={{ duration: 0.5 }}
                                />
                            </motion.button>
                        </Link>
                        <button
                            onClick={() => setShowSpinModal(true)}
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/25 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-colors cursor-pointer"
                        >
                            🎰 Spin The Wheel For Coupons
                        </button>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                    >
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Scroll to explore</span>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-6 h-10 border-2 border-gray-700 rounded-full flex items-start justify-center p-1.5"
                        >
                            <div className="w-1.5 h-3 bg-amber-500 rounded-full" />
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* Interactive 3D Hero Scene */}
                <motion.div
                    style={{
                        x: mousePos.x * -25,
                        y: mousePos.y * -25,
                    }}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[550px] h-[550px] hidden xl:block z-20 pointer-events-none"
                >
                    <ThreeDHeroScene />
                </motion.div>
            </section>

            {/* ========== STATS SECTION ========== */}
            <section className="relative py-24 bg-gradient-to-b from-gray-950 to-gray-900 border-y border-gray-900/60">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.7 }}
                                className="text-center group"
                            >
                                <div className="text-4xl mb-3">{stat.icon}</div>
                                <p className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-1 font-sans">
                                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                                </p>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== INSTAGRAM STORY PREVIEW & AI RECOMMENDATION GRID ========== */}
            <section className="py-32 bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.03)_0%,transparent_70%)] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        
                        {/* Food Story Feed Carousel (Instagram Style) */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col items-center lg:items-start"
                        >
                            <span className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] mb-4">Inside the community</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                                Social Food Stories
                            </h2>
                            <p className="text-gray-400 text-sm md:text-base mb-10 max-w-md leading-relaxed text-center lg:text-left">
                                Discover what others are ordering in real-time. Peek into vertical food stories shared directly from top-rated kitchen tables.
                            </p>

                            {/* Phone Frame Mockup */}
                            <div className="relative w-80 h-[560px] bg-black rounded-[48px] p-3 shadow-2xl border-4 border-gray-800 ring-12 ring-gray-900/60 overflow-hidden">
                                {/* Story progress line indicator */}
                                <div className="absolute top-4 left-4 right-4 flex gap-1 z-30">
                                    {storySlides.map((_, idx) => (
                                        <div key={idx} className="h-1 bg-white/20 rounded-full flex-1 overflow-hidden">
                                            <div 
                                                className="h-full bg-white transition-all ease-linear"
                                                style={{ width: idx === activeStoryIdx ? `${storyProgress}%` : idx < activeStoryIdx ? '100%' : '0%' }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Story header */}
                                <div className="absolute top-8 left-6 right-6 flex items-center justify-between z-30">
                                    <div className="flex items-center gap-3">
                                        <img src={storySlides[activeStoryIdx].logo} className="w-8 h-8 rounded-full border border-white/50 object-cover" alt="" />
                                        <div>
                                            <p className="text-xs font-black text-white leading-none shadow-sm">{storySlides[activeStoryIdx].shopName}</p>
                                            <p className="text-[8px] text-white/70 font-bold uppercase tracking-wider mt-0.5">Stories · Sponsored</p>
                                        </div>
                                    </div>
                                    <span className="text-white text-lg cursor-pointer">•••</span>
                                </div>

                                {/* Active Image */}
                                <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-gray-950">
                                    <img src={storySlides[activeStoryIdx].mediaUrl} className="w-full h-full object-cover z-0" alt="Food Story" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 z-10" />
                                </div>

                                {/* Bottom info block */}
                                <div className="absolute bottom-6 left-6 right-6 z-30">
                                    <p className="text-xs text-white font-bold mb-1 leading-snug drop-shadow-md">
                                        {storySlides[activeStoryIdx].caption}
                                    </p>
                                    <p className="text-[10px] text-red-400 font-black uppercase mb-4">{storySlides[activeStoryIdx].likes}</p>
                                    
                                    <Link to="/signup" className="block">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20"
                                        >
                                            Order This Dish 🍱
                                        </motion.button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>

                        {/* AI Recommendations Vibe Interactive Preview */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="bg-gray-800/40 backdrop-blur-md border border-gray-850 p-8 md:p-10 rounded-[36px]"
                        >
                            <span className="text-xs font-black text-red-500 uppercase tracking-[0.3em] mb-4 block">Smart Recommendation Preview</span>
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                                AI Smart Plate
                            </h2>
                            <p className="text-gray-400 text-sm leading-relaxed mb-8">
                                Bhojan curates dishes matching your current mood, weather conditions, and ordering trends. Tap a food mood vibe to check what the AI curates for you.
                            </p>

                            {/* Vibe Selection Pills */}
                            <div className="flex flex-wrap gap-2 mb-8">
                                {Object.keys(aiVibes).map(vibe => (
                                    <button
                                        key={vibe}
                                        onClick={() => setSelectedVibe(vibe)}
                                        className={`px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${selectedVibe === vibe
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-transparent text-white shadow-lg'
                                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                                    >
                                        {vibe}
                                    </button>
                                ))}
                            </div>

                            {/* Recommended Dish Cards */}
                            <div className="space-y-4">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedVibe}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-4"
                                    >
                                        {aiVibes[selectedVibe].map((dish, dIdx) => (
                                            <div 
                                                key={dIdx} 
                                                className="flex items-center gap-4 bg-gray-900/60 border border-gray-800/80 p-4 rounded-2xl shadow-sm hover:border-gray-700/80 transition-colors"
                                            >
                                                <img src={dish.image} alt={dish.name} className="w-16 h-16 rounded-xl object-cover" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="bg-red-950 text-red-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                                                            {dish.tag}
                                                        </span>
                                                        <span className="text-[10px] text-green-400 font-bold">★ {dish.match}% Match</span>
                                                    </div>
                                                    <p className="font-black text-white text-sm md:text-base truncate">{dish.name}</p>
                                                </div>
                                                <Link to="/signup">
                                                    <motion.button 
                                                        whileTap={{ scale: 0.95 }}
                                                        className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-white whitespace-nowrap"
                                                    >
                                                        Get Now
                                                    </motion.button>
                                                </Link>
                                            </div>
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* ========== FEATURES SECTION ========== */}
            <section className="relative py-32 bg-gray-950 overflow-hidden border-t border-gray-900/60">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.03)_0%,transparent_70%)] pointer-events-none" />

                <div className="max-w-6xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4">Why Bhojan?</p>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                            Food delivery,{' '}
                            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent italic">
                                reinvented.
                            </span>
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ y: -6, scale: 1.01 }}
                                className="group relative bg-gray-900/40 backdrop-blur border border-gray-800/80 rounded-3xl p-8 overflow-hidden cursor-default hover:border-gray-700 transition-all duration-300"
                            >
                                <motion.div
                                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 rounded-3xl`}
                                />

                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-xl ${feature.glow} mb-6 text-3xl`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-black text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-400 font-medium leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== TESTIMONIALS SECTION (ENHANCED SCROLL TRIGGER) ========== */}
            <section className="py-32 bg-gray-900 border-t border-gray-950">
                <div className="max-w-6xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4 font-sans">Loved by Thousands</p>
                        <h2 className="text-4xl md:text-5xl font-black text-white">
                            Real people,{' '}
                            <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent italic">
                                real food.
                            </span>
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: false, amount: 0.15 }}
                                transition={{ delay: i * 0.15, duration: 0.8 }}
                                whileHover={{ y: -6 }}
                                className="bg-gray-800/30 border border-gray-800/80 rounded-3xl p-8 hover:border-gray-700 transition-all duration-300 flex flex-col gap-6"
                            >
                                <div className="flex gap-1">
                                    {[...Array(t.rating)].map((_, j) => (
                                        <span key={j} className="text-amber-400 text-sm">★</span>
                                    ))}
                                </div>
                                <p className="text-gray-300 font-medium leading-relaxed italic flex-1">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="font-black text-white text-sm">{t.name}</p>
                                        <p className="text-xs text-gray-500 font-medium">{t.location}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== APP DOWNLOAD SECTION (STORE BADGES) ========== */}
            <section className="py-24 bg-gradient-to-b from-gray-900 to-gray-950 border-t border-gray-800/40">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4 block">Bhojan on the go</span>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                        Download Bhojan App
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base mb-12 max-w-lg mx-auto leading-relaxed">
                        Track deliveries in real-time, get lightning-fast chat recommendations, and receive push notifications on your lunch cravings.
                    </p>

                    {/* App Store / Google Play Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        {/* App Store Button */}
                        <a href="https://apple.com" target="_blank" rel="noopener noreferrer">
                            <motion.button 
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-3 bg-black hover:bg-gray-900 border border-gray-800/80 px-6 py-3 rounded-2xl text-left w-52 transition-colors cursor-pointer"
                            >
                                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,22C14.32,22.05 13.89,21.24 12.37,21.24C10.84,21.24 10.37,21.97 9.1,22C7.81,22.05 6.8,20.72 5.96,19.5C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.1,16.67C20.08,16.74 19.67,18.11 18.71,19.5M15.97,4.17C16.63,3.37 17.07,2.28 16.95,1C16,1.04 14.9,1.6 14.24,2.38C13.68,3.04 13.19,4.14 13.34,5.39C14.39,5.47 15.4,4.88 15.97,4.17Z"/>
                                </svg>
                                <div>
                                    <p className="text-[9px] uppercase text-gray-500 font-bold">Download on the</p>
                                    <p className="text-sm font-black text-white">App Store</p>
                                </div>
                            </motion.button>
                        </a>

                        {/* Google Play Button */}
                        <a href="https://play.google.com" target="_blank" rel="noopener noreferrer">
                            <motion.button 
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-3 bg-black hover:bg-gray-900 border border-gray-800/80 px-6 py-3 rounded-2xl text-left w-52 transition-colors cursor-pointer"
                            >
                                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                                    <path d="M3.25 1.63L13.11 11.49L3.25 21.36C3.09 20.94 3 20.26 3 19.34V3.66C3 2.74 3.09 2.06 3.25 1.63Z" fill="#EA4335" />
                                    <path d="M17.15 7.45L13.11 11.49L17.15 15.53L20.5 13.63C21.46 13.08 21.46 11.9 20.5 11.36L17.15 7.45Z" fill="#FBBC05" />
                                    <path d="M3.25 1.63L17.15 7.45L13.11 11.49L3.25 1.63Z" fill="#4285F4" />
                                    <path d="M3.25 21.36L13.11 11.49L17.15 15.53L3.25 21.36Z" fill="#34A853" />
                                </svg>
                                <div>
                                    <p className="text-[9px] uppercase text-gray-500 font-bold">Get it on</p>
                                    <p className="text-sm font-black text-white">Google Play</p>
                                </div>
                            </motion.button>
                        </a>
                    </div>
                </div>
            </section>

            {/* ========== EXPANDED FOOTER SECTION ========== */}
            <footer className="bg-gray-950 border-t border-gray-900 py-16">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        
                        {/* Bhojan Brand Col */}
                        <div>
                            <div className="flex items-center gap-2 text-2xl font-black text-white mb-6">
                                <span>🥣</span> Bhojan
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6">
                                Mithilanchal's #1 Food Delivery Platform. Connecting local authentic flavors with priority delivery speeds.
                            </p>
                            <p className="text-gray-600 text-xs">© 2026 Bhojan. All rights reserved.</p>
                        </div>

                        {/* Company Link Col */}
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Company</h4>
                            <ul className="space-y-3.5 text-sm font-medium text-gray-500">
                                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers & Internships</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Bhojan Newsroom</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Partner With Us</a></li>
                            </ul>
                        </div>

                        {/* Support Link Col */}
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Support & Help</h4>
                            <ul className="space-y-3.5 text-sm font-medium text-gray-500">
                                <li><a href="#" className="hover:text-white transition-colors">F.A.Q & Help Centers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Support Ticket Desk</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Track Refund Status</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact Corporate</a></li>
                            </ul>
                        </div>

                        {/* Legal Link Col */}
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Legal policies</h4>
                            <ul className="space-y-3.5 text-sm font-medium text-gray-500">
                                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                                <li><a href="#" className="hover:text-white transition-colors">Safety Protocols</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Anti-Spam Guidelines</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-900 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-600">
                        <p>Made with 💖 in Darbhanga, Bihar, India</p>
                        <div className="flex gap-6">
                            <span className="hover:text-white cursor-pointer transition-colors font-bold uppercase tracking-wider">Facebook</span>
                            <span className="hover:text-white cursor-pointer transition-colors font-bold uppercase tracking-wider">Instagram</span>
                            <span className="hover:text-white cursor-pointer transition-colors font-bold uppercase tracking-wider">Twitter</span>
                        </div>
                    </div>
                </div>
            </footer>

            </div>

            {/* ========== SPIN THE WHEEL MODAL FOR GUESTS ========== */}
            <AnimatePresence>
                {showSpinModal && (
                    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="bg-gray-900 border border-gray-800 rounded-[40px] p-8 max-w-md w-full relative shadow-2xl"
                        >
                            <button
                                onClick={() => { if (!spinning) setShowSpinModal(false); }}
                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center font-black text-gray-400 hover:text-white cursor-pointer"
                            >
                                ✕
                            </button>

                            <h2 className="text-2xl md:text-3xl font-black text-center mb-2 text-white">
                                🎰 Spin & Win!
                            </h2>
                            <p className="text-gray-400 text-xs text-center mb-8 font-medium">Win exclusive coupons of up to 20% off before you join!</p>

                            <div className="relative w-72 h-72 mx-auto mb-8">
                                {/* Wheel Canvas/Div */}
                                <motion.div
                                    className="w-full h-full rounded-full relative overflow-hidden shadow-2xl border-4 border-gray-800"
                                    style={{
                                        rotate: spinRotation,
                                        transition: spinning ? 'rotate 4s cubic-bezier(0.15, 0.65, 0.1, 1)' : 'none'
                                    }}
                                >
                                    {prizes.map((prize, idx) => {
                                        const angle = (360 / prizes.length) * idx;
                                        return (
                                            <div
                                                key={idx}
                                                className={`absolute w-1/2 h-1/2 origin-bottom-right ${prize.color}`}
                                                style={{
                                                    transform: `rotate(${angle}deg) skewY(-${90 - 360 / prizes.length}deg)`,
                                                    transformOrigin: '100% 100%'
                                                }}
                                            >
                                                <div
                                                    className="absolute top-3 right-3 text-white font-black text-[9px] uppercase tracking-wider"
                                                    style={{
                                                        transform: `skewY(${90 - 360 / prizes.length}deg) rotate(${360 / prizes.length / 2}deg)`
                                                    }}
                                                >
                                                    {prize.label.split(' ')[0]}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-14 h-14 rounded-full bg-gray-950 shadow-xl border-4 border-gray-800 flex items-center justify-center">
                                            <span className="text-sm">🥣</span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Pointer */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10">
                                    <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-500 drop-shadow-lg"></div>
                                </div>
                            </div>

                            {!spinResult ? (
                                <div className="text-center">
                                    <button
                                        onClick={handleSpin}
                                        disabled={spinning}
                                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg cursor-pointer ${spinning
                                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-amber-500 to-red-500 text-white hover:shadow-xl hover:shadow-amber-500/10'
                                            }`}
                                    >
                                        {spinning ? 'Spinning...' : 'Spin Now!'}
                                    </button>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center"
                                >
                                    <div className="bg-gradient-to-r from-gray-850 to-gray-800 p-5 rounded-2xl border border-gray-800 mb-6">
                                        {spinResult.code ? (
                                            <>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-1">
                                                    🎉 You Won!
                                                </p>
                                                <p className="text-2xl font-black text-white mb-3">{spinResult.label}</p>
                                                <div className="bg-black/40 border border-dashed border-gray-700 rounded-xl py-2.5 px-4 font-mono font-black text-base tracking-widest text-amber-500">
                                                    {spinResult.code}
                                                </div>
                                                <p className="text-[9px] text-gray-500 font-bold mt-2.5">Click register below to auto-apply this code!</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Better luck next time!</p>
                                                <p className="text-lg font-black text-white">Oops, Try Again!</p>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setShowSpinModal(false); setSpinResult(null); }}
                                            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer"
                                        >
                                            Close
                                        </button>
                                        {spinResult.code && (
                                            <Link to={`/signup?coupon=${spinResult.code}`} className="flex-[1.5]">
                                                <button className="w-full bg-gradient-to-r from-amber-500 to-red-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 cursor-pointer">
                                                    Sign Up & Claim 🎁
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Landing;
