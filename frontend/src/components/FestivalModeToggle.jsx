import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FestivalModeToggle = ({ onThemeChange }) => {
    const [activeFestival, setActiveFestival] = useState(null);
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const animationFrameId = useRef(null);
    const festivalStateRef = useRef(null);

    const festivals = [
        {
            id: 'chhath',
            name: 'Chhath Puja',
            emoji: '🌅',
            colors: { primary: '#FF6B35', secondary: '#F7931E', bg: 'from-orange-100 to-yellow-100' },
            greeting: 'छठी मइया के जय हो! 🙏'
        },
        {
            id: 'holi',
            name: 'Holi',
            emoji: '🎨',
            colors: { primary: '#E91E63', secondary: '#9C27B0', bg: 'from-pink-100 to-purple-100' },
            greeting: 'होली के रंग में रंग जाओ! 🌈'
        },
        {
            id: 'diwali',
            name: 'Diwali',
            emoji: '🪔',
            colors: { primary: '#FF9800', secondary: '#FFC107', bg: 'from-yellow-100 to-orange-100' },
            greeting: 'दीपावली की शुभकामनाएं! ✨'
        }
    ];

    useEffect(() => {
        festivalStateRef.current = activeFestival;
        if (activeFestival) {
            // Trigger initial massive explosion
            triggerInitialExplosion(activeFestival.id);
        } else {
            particlesRef.current = [];
        }
    }, [activeFestival]);

    // Canvas particle engine loop
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Init sizes

        const canvas = canvasRef.current;
        const ctx = canvas ? canvas.getContext('2d') : null;

        const updateParticles = () => {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const currentFestival = festivalStateRef.current;

            let particles = particlesRef.current;

            // Continuous background generation
            if (currentFestival) {
                if (currentFestival.id === 'chhath' && Math.random() < 0.1) {
                    // Spawn golden puja sparkles rising up
                    particles.push({
                        type: 'chhath',
                        x: Math.random() * canvas.width,
                        y: canvas.height + 10,
                        vx: (Math.random() - 0.5) * 1.5,
                        vy: -(Math.random() * 1.5 + 1),
                        size: Math.random() * 5 + 2,
                        alpha: 1,
                        fade: Math.random() * 0.005 + 0.002,
                        hue: Math.random() * 20 + 35 // Golden hues
                    });
                } else if (currentFestival.id === 'diwali' && Math.random() < 0.02) {
                    // Random rocket launch
                    particles.push({
                        type: 'diwali_rocket',
                        x: Math.random() * canvas.width,
                        y: canvas.height,
                        vx: (Math.random() - 0.5) * 2,
                        vy: -(Math.random() * 6 + 7),
                        targetY: Math.random() * (canvas.height * 0.5) + canvas.height * 0.1,
                        size: 3,
                        color: `hsl(${Math.random() * 360}, 100%, 70%)`
                    });
                } else if (currentFestival.id === 'holi' && Math.random() < 0.08) {
                    // Ambient falling color drops
                    particles.push({
                        type: 'holi_splash',
                        x: Math.random() * canvas.width,
                        y: -20,
                        vx: (Math.random() - 0.5) * 2,
                        vy: Math.random() * 3 + 2,
                        size: Math.random() * 12 + 6,
                        color: ['#E91E63', '#9C27B0', '#00E676', '#00B0FF', '#FFEA00', '#FF9100'][Math.floor(Math.random() * 6)],
                        alpha: 1,
                        fade: Math.random() * 0.01 + 0.005
                    });
                }
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];

                if (p.type === 'holi_splash' || p.type === 'holi_explosion') {
                    p.x += p.vx;
                    p.y += p.vy;
                    if (p.type === 'holi_explosion') {
                        p.vy += 0.15; // Gravity
                        p.vx *= 0.98; // Friction
                    }
                    p.alpha -= p.fade || 0.01;

                    if (p.alpha <= 0 || p.x < 0 || p.x > canvas.width || p.y > canvas.height) {
                        particles.splice(i, 1);
                        continue;
                    }

                    ctx.save();
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                } 
                else if (p.type === 'diwali_rocket') {
                    p.x += p.vx;
                    p.y += p.vy;

                    // Spark trail
                    if (Math.random() < 0.4) {
                        particles.push({
                            type: 'diwali_spark',
                            x: p.x,
                            y: p.y,
                            vx: (Math.random() - 0.5) * 1,
                            vy: (Math.random() - 0.5) * 1 + 1,
                            size: Math.random() * 2 + 1,
                            color: '#FF9800',
                            alpha: 1,
                            fade: 0.04
                        });
                    }

                    if (p.y <= p.targetY) {
                        // Explode!
                        const numSparks = Math.floor(Math.random() * 40) + 40;
                        const baseHue = Math.random() * 360;
                        for (let k = 0; k < numSparks; k++) {
                            const angle = Math.random() * Math.PI * 2;
                            const speed = Math.random() * 4 + 1.5;
                            particles.push({
                                type: 'diwali_spark',
                                x: p.x,
                                y: p.y,
                                vx: Math.cos(angle) * speed,
                                vy: Math.sin(angle) * speed,
                                size: Math.random() * 3.5 + 1.5,
                                color: `hsl(${baseHue + (Math.random() - 0.5) * 30}, 100%, 65%)`,
                                alpha: 1,
                                fade: Math.random() * 0.015 + 0.01
                            });
                        }
                        particles.splice(i, 1);
                        continue;
                    }

                    ctx.save();
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                } 
                else if (p.type === 'diwali_spark') {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.05; // Gravity
                    p.alpha -= p.fade;

                    if (p.alpha <= 0) {
                        particles.splice(i, 1);
                        continue;
                    }

                    ctx.save();
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = p.color;
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                } 
                else if (p.type === 'chhath') {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.alpha -= p.fade;

                    if (p.alpha <= 0) {
                        particles.splice(i, 1);
                        continue;
                    }

                    ctx.save();
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.alpha})`;
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = `hsl(${p.hue}, 100%, 60%)`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            animationFrameId.current = requestAnimationFrame(updateParticles);
        };

        animationFrameId.current = requestAnimationFrame(updateParticles);

        return () => {
            cancelAnimationFrame(animationFrameId.current);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const triggerInitialExplosion = (type) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        if (type === 'holi') {
            // Massive splash of color colors
            const colors = ['#E91E63', '#9C27B0', '#00E676', '#00B0FF', '#FFEA00', '#FF9100'];
            for (let i = 0; i < 150; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8 + 3;
                particlesRef.current.push({
                    type: 'holi_explosion',
                    x: centerX + (Math.random() - 0.5) * 50,
                    y: centerY + (Math.random() - 0.5) * 50,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 18 + 7,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    alpha: 1,
                    fade: Math.random() * 0.01 + 0.008
                });
            }
        } 
        else if (type === 'diwali') {
            // Multi-rocket initial burst
            for (let i = 0; i < 5; i++) {
                particlesRef.current.push({
                    type: 'diwali_rocket',
                    x: (canvas.width * 0.2) + (Math.random() * canvas.width * 0.6),
                    y: canvas.height,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -(Math.random() * 6 + 8),
                    targetY: Math.random() * (canvas.height * 0.4) + canvas.height * 0.15,
                    size: 3,
                    color: '#FFF'
                });
            }
        } 
        else if (type === 'chhath') {
            // Soft rising solar glow explosion
            for (let i = 0; i < 80; i++) {
                particlesRef.current.push({
                    type: 'chhath',
                    x: Math.random() * canvas.width,
                    y: canvas.height * 0.8 + Math.random() * (canvas.height * 0.2),
                    vx: (Math.random() - 0.5) * 2,
                    vy: -(Math.random() * 2 + 1.5),
                    size: Math.random() * 7 + 3,
                    alpha: 1,
                    fade: Math.random() * 0.006 + 0.003,
                    hue: Math.random() * 15 + 35
                });
            }
        }
    };

    const handleToggle = (festival) => {
        const newFestival = activeFestival?.id === festival.id ? null : festival;
        setActiveFestival(newFestival);
        if (onThemeChange) onThemeChange(newFestival);

        // Apply theme to document root
        if (newFestival) {
            document.documentElement.style.setProperty('--primary-color', newFestival.colors.primary);
            document.documentElement.style.setProperty('--secondary-color', newFestival.colors.secondary);
        } else {
            document.documentElement.style.removeProperty('--primary-color');
            document.documentElement.style.removeProperty('--secondary-color');
        }
    };

    return (
        <>
            {/* Full-screen overlay canvas */}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none z-[180] w-full h-full"
            />

            <div className="fixed bottom-6 left-6 z-[190]">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl p-4 border-2 border-gray-100 dark:border-gray-800 transition-colors"
                >
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-2.5 text-center">
                        🎉 Festival Mode
                    </p>
                    <div className="flex gap-2">
                        {festivals.map((festival) => (
                            <button
                                key={festival.id}
                                onClick={() => handleToggle(festival)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all cursor-pointer ${activeFestival?.id === festival.id
                                    ? `bg-gradient-to-br ${festival.colors.bg} scale-110 shadow-lg border-2 border-primary`
                                    : 'bg-gray-100 dark:bg-gray-800 hover:scale-105'
                                    }`}
                                title={festival.name}
                            >
                                {festival.emoji}
                            </button>
                        ))}
                    </div>
                    {activeFestival && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 text-center"
                        >
                            <p className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500 uppercase tracking-tight">
                                {activeFestival.greeting}
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </>
    );
};

export default FestivalModeToggle;
