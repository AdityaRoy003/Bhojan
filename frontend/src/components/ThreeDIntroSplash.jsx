import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ThreeDIntroSplash = ({ onComplete }) => {
    const canvasRef = useRef(null);
    const [showText, setShowText] = useState(false);
    const [fadeTextOut, setFadeTextOut] = useState(false);
    const isExplodingRef = useRef(false);

    useEffect(() => {
        // Check if intro has been seen in this session
        const hasSeenIntro = sessionStorage.getItem('bhojanIntroSeen');
        if (hasSeenIntro === 'true') {
            onComplete();
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        // Particle configuration
        const particleCount = 280;
        const particles = [];
        const colorPalette = [
            'rgba(245, 158, 11, ',  // Amber-500
            'rgba(249, 115, 22, ',  // Orange-500
            'rgba(239, 68, 68, ',   // Red-500
            'rgba(168, 85, 247, ',  // Purple-500
        ];

        // Initialize particles in a vortex spiral structure
        const centerX = width / 2;
        const centerY = height / 2;

        for (let i = 0; i < particleCount; i++) {
            const angle = i * 0.15;
            const maxRadius = Math.min(width, height) * 0.45;
            const radius = Math.pow(i / particleCount, 0.6) * maxRadius + 5;
            
            particles.push({
                angle: angle,
                radius: radius,
                speed: (0.005 + Math.random() * 0.01) * (1.8 - radius / maxRadius), // Faster near center
                size: Math.random() * 2.5 + 1.2,
                colorBase: colorPalette[Math.floor(Math.random() * colorPalette.length)],
                opacity: Math.random() * 0.4 + 0.5,
                pulseSpeed: 0.02 + Math.random() * 0.03,
                pulseOffset: Math.random() * Math.PI,
                
                // Exploding velocities
                vx: 0,
                vy: 0,
                scattered: false
            });
        }

        let elapsed = 0;
        let lastTime = performance.now();

        // Trigger text appearance shortly
        const textTimeout = setTimeout(() => setShowText(true), 600);

        // Scatter explosion trigger
        const scatterTimeout = setTimeout(() => {
            isExplodingRef.current = true;
            setFadeTextOut(true);
        }, 2200);

        // Final completion timeout
        const completeTimeout = setTimeout(() => {
            sessionStorage.setItem('bhojanIntroSeen', 'true');
            onComplete();
        }, 3000);

        const renderLoop = (timestamp) => {
            const dt = (timestamp - lastTime) / 1000;
            lastTime = timestamp;
            elapsed += dt;

            // Clear screen with a slight trail fade effect for visual tracking
            ctx.fillStyle = 'rgba(3, 7, 18, 0.12)';
            ctx.fillRect(0, 0, width, height);

            const cX = canvas.width / 2;
            const cY = canvas.height / 2;

            for (let i = 0; i < particleCount; i++) {
                const p = particles[i];

                if (!isExplodingRef.current) {
                    // 1. Vortex Spiral Motion
                    p.angle += p.speed * (1 + elapsed * 0.8);
                    
                    // Add gentle radial pulsation
                    const radiusOffset = Math.sin(elapsed * 2 + p.angle * 2) * 5;
                    const x = cX + Math.cos(p.angle) * (p.radius + radiusOffset);
                    const y = cY + Math.sin(p.angle) * (p.radius + radiusOffset);

                    // Pulsing opacity
                    const currentOpacity = p.opacity * (0.7 + Math.sin(elapsed * p.pulseSpeed * 10 + p.pulseOffset) * 0.3);

                    // Render particle with shadow blur glow
                    ctx.beginPath();
                    ctx.arc(x, y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `${p.colorBase}${currentOpacity})`;
                    ctx.fill();
                } else {
                    // 2. Exploding scatter physics
                    if (!p.scattered) {
                        const angle = Math.atan2(
                            Math.sin(p.angle),
                            Math.cos(p.angle)
                        );
                        // Add randomized scatter speed
                        const scatterForce = (Math.random() * 450 + 200);
                        p.vx = Math.cos(angle) * scatterForce;
                        p.vy = Math.sin(angle) * scatterForce;
                        p.scattered = true;
                    }

                    // Move particles outward
                    p.radius += Math.sqrt(p.vx * p.vx + p.vy * p.vy) * dt;
                    const x = cX + Math.cos(p.angle) * p.radius;
                    const y = cY + Math.sin(p.angle) * p.radius;

                    // Fade size and opacity
                    p.size *= 0.98;
                    p.opacity *= 0.95;

                    if (p.opacity > 0.01) {
                        ctx.beginPath();
                        ctx.arc(x, y, p.size, 0, Math.PI * 2);
                        ctx.fillStyle = `${p.colorBase}${p.opacity})`;
                        ctx.fill();
                    }
                }
            }

            animationId = requestAnimationFrame(renderLoop);
        };

        animationId = requestAnimationFrame(renderLoop);

        // Handle window resize dynamically
        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        // Cleanup resources
        return () => {
            clearTimeout(textTimeout);
            clearTimeout(scatterTimeout);
            clearTimeout(completeTimeout);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
        };
    }, [onComplete]);

    const handleSkip = () => {
        isExplodingRef.current = true;
        setFadeTextOut(true);
        sessionStorage.setItem('bhojanIntroSeen', 'true');
        setTimeout(onComplete, 450);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-gray-950 overflow-hidden select-none">
            {/* 2D Canvas element */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

            {/* Cinematic Branding Text Overlay */}
            <AnimatePresence>
                {showText && !fadeTextOut && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.15, filter: 'blur(10px)', y: -10 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-10"
                    >
                        <h1 className="text-7xl sm:text-9xl font-black tracking-[0.3em] text-white drop-shadow-[0_0_20px_rgba(245,158,11,0.25)] select-none pl-[0.3em]">
                            BHOJAN
                        </h1>
                        <p className="text-sm sm:text-lg font-black tracking-[0.6em] text-amber-500 uppercase mt-4 select-none pl-[0.6em]">
                            Taste. Delivered.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skip Button */}
            <button
                onClick={handleSkip}
                className="absolute bottom-10 right-10 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em] transition-all z-20 cursor-pointer shadow-lg active:scale-95"
            >
                Skip Intro ⚡
            </button>
        </div>
    );
};

export default ThreeDIntroSplash;
