import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence, useInView, useMotionValue, useSpring } from 'framer-motion';
import { useSelector } from 'react-redux';

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
    { label: 'Happy Customers', value: 50000, suffix: '+', icon: '😊' },
    { label: 'Restaurant Partners', value: 1200, suffix: '+', icon: '🏪' },
    { label: 'Cities Covered', value: 48, suffix: '', icon: '🗺️' },
    { label: 'Orders Delivered', value: 500000, suffix: '+', icon: '🛵' },
];

const foodEmojis = ['🍕', '🍔', '🌮', '🍜', '🍣', '🥘', '🍛', '🥗', '🍱', '🧆'];

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
        <div className="bg-gray-950 text-white overflow-x-hidden" onMouseMove={handleMouseMove}>

            {/* ========== HERO SECTION ========== */}
            <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">

                {/* Animated Gradient Background */}
                <motion.div
                    style={{ scale: bgScale }}
                    className="absolute inset-0 z-0"
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
                    <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.3, 0.15] }}
                        transition={{ duration: 12, repeat: Infinity }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl"
                    />
                </motion.div>

                {/* Grid Pattern */}
                <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

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
                            <span className="text-xs font-black text-gray-300 uppercase tracking-[0.3em]">Now delivering in 48 cities</span>
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tighter mb-6"
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
                        className="text-lg md:text-xl text-gray-400 font-medium max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        From street-side dhabas to gourmet restaurants — explore the best food your neighborhood has to offer, delivered fresh to your doorstep.
                    </motion.p>

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
                                className="relative group bg-gradient-to-r from-amber-500 to-red-500 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-2xl shadow-amber-500/30 overflow-hidden"
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
                        <Link to="/login">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.15em] hover:bg-white/20 transition-colors"
                            >
                                I Already Have an Account
                            </motion.button>
                        </Link>
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

                {/* Floating 3D Phone Mockup */}
                <motion.div
                    style={{
                        x: mousePos.x * -15,
                        y: mousePos.y * -15,
                    }}
                    initial={{ opacity: 0, x: 200 }}
                    animate={{ opacity: 0.15, x: 0 }}
                    transition={{ delay: 0.5, duration: 1.2 }}
                    className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[400px] hidden xl:block z-10"
                >
                    <div className="w-[280px] h-[560px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-[50px] border-4 border-gray-700 shadow-2xl flex items-center justify-center text-9xl">
                        🥣
                    </div>
                </motion.div>
            </section>

            {/* ========== STATS SECTION ========== */}
            <section className="relative py-24 bg-gradient-to-b from-gray-950 to-gray-900">
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
                                <p className="text-3xl md:text-5xl font-black text-white mb-1">
                                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                                </p>
                                <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== FEATURES SECTION ========== */}
            <section className="relative py-32 bg-gray-900 overflow-hidden">
                {/* BG Decoration */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)]" />

                <div className="max-w-6xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <p className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] mb-4">Why Bhojan?</p>
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
                                className="group relative bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-3xl p-8 overflow-hidden cursor-default hover:border-gray-600 transition-all duration-300"
                            >
                                {/* Glow BG */}
                                <motion.div
                                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`}
                                />

                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-xl ${feature.glow} mb-6 text-3xl`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-black text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-400 font-medium leading-relaxed">{feature.description}</p>

                                {/* Corner Arrow */}
                                <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white text-sm font-black`}>→</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== HOW IT WORKS SECTION ========== */}
            <section className="py-32 bg-gray-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.08)_0%,transparent_60%)]" />
                <div className="max-w-6xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <p className="text-xs font-black text-purple-400 uppercase tracking-[0.3em] mb-4">Simple as 1-2-3</p>
                        <h2 className="text-4xl md:text-6xl font-black text-white">
                            From craving to{' '}
                            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent italic">
                                plate.
                            </span>
                        </h2>
                    </motion.div>

                    <div className="relative">
                        {/* Connector Line */}
                        <div className="hidden md:block absolute top-16 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent z-0" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                            {[
                                { step: '01', icon: '🔍', title: 'Find Your Craving', desc: 'Browse hundreds of restaurants nearby or search for your favorite dish.' },
                                { step: '02', icon: '🛒', title: 'Place Your Order', desc: 'Add items to cart, apply coupons, and checkout in under 60 seconds.' },
                                { step: '03', icon: '🚴', title: 'Delivered to You', desc: 'Track your rider live and get hot, fresh food at your door.' },
                            ].map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.2, duration: 0.8 }}
                                    className="text-center group"
                                >
                                    <div className="relative inline-block mb-6">
                                        <div className="w-32 h-32 rounded-3xl bg-gray-800 border border-gray-700 flex items-center justify-center text-5xl group-hover:border-gray-600 group-hover:bg-gray-750 transition-all duration-300 mx-auto">
                                            {step.icon}
                                        </div>
                                        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                                            {step.step}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-white mb-3">{step.title}</h3>
                                    <p className="text-gray-500 font-medium leading-relaxed text-sm">{step.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== TESTIMONIALS SECTION ========== */}
            <section className="py-32 bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.05)_0%,transparent_60%)]" />
                <div className="max-w-6xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em] mb-4">Loved by Thousands</p>
                        <h2 className="text-4xl md:text-6xl font-black text-white">
                            Real people,{' '}
                            <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent italic">
                                real food.
                            </span>
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 50, rotateX: 10 }}
                                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ y: -6 }}
                                className="bg-gray-800/50 border border-gray-700/50 rounded-3xl p-8 hover:border-gray-600 transition-all duration-300 flex flex-col gap-6"
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

            {/* ========== FINAL CTA SECTION ========== */}
            <section className="relative py-40 bg-gray-950 overflow-hidden">
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-amber-500/20 to-red-500/20 rounded-full blur-3xl"
                />

                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl mb-6"
                    >
                        🥣
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-white leading-tight mb-6"
                    >
                        Hungry?{' '}
                        <span className="bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent italic">
                            Let's fix that.
                        </span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 text-lg font-medium mb-12 max-w-xl mx-auto"
                    >
                        Join over 50,000 happy customers ordering from the best restaurants in their city.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link to="/signup">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="bg-gradient-to-r from-amber-500 to-red-500 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-2xl shadow-red-500/30"
                            >
                                Get Started — It's Free 🎉
                            </motion.button>
                        </Link>
                        <Link to="/login">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="bg-white/10 text-white border border-white/20 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.15em] hover:bg-white/15 transition-colors"
                            >
                                Sign In
                            </motion.button>
                        </Link>
                    </motion.div>

                    {/* Social Proof Mini */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        className="mt-12 flex items-center justify-center gap-3"
                    >
                        <div className="flex -space-x-2">
                            {['A', 'P', 'K', 'R', 'S'].map((l, i) => (
                                <div key={i} className={`w-9 h-9 rounded-full border-2 border-gray-950 flex items-center justify-center text-xs font-black text-white ${['bg-amber-500', 'bg-red-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500'][i]}`}>
                                    {l}
                                </div>
                            ))}
                        </div>
                        <p className="text-gray-500 text-sm font-medium">
                            <span className="text-white font-black">50,000+</span> customers already ordered today
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ========== FOOTER STRIP ========== */}
            <div className="bg-gray-900 border-t border-gray-800 py-8">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xl font-black text-white">
                        <span>🥣</span> Bhojan
                    </div>
                    <div className="flex items-center gap-6 text-xs text-gray-500 font-medium">
                        <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link to="/login" className="hover:text-white transition-colors">Login</Link>
                        <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
                    </div>
                    <p className="text-xs text-gray-600">© 2026 Bhojan. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Landing;
