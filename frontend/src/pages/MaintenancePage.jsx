import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 6 + Math.random() * 14,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 4,
    emoji: ['🍕', '🍔', '🌮', '🍜', '🍱', '🥗', '🍛', '🍩', '🧆', '🥘'][Math.floor(Math.random() * 10)]
}));

const MaintenancePage = ({ onBack }) => {
    const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    // Animated countdown (decorative — resets every hour)
    useEffect(() => {
        const target = Date.now() + 60 * 60 * 1000; // 1 hour from now
        const interval = setInterval(() => {
            const diff = Math.max(0, target - Date.now());
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft({ h, m, s });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const pad = (n) => String(n).padStart(2, '0');

    const handleCheckStatus = async () => {
        setCheckingStatus(true);
        setStatusMsg('');
        try {
            const res = await fetch(`/api/status?t=${Date.now()}`);
            const data = await res.json();
            if (!data.maintenanceMode) {
                setStatusMsg('✅ We\'re back! Refreshing...');
                setTimeout(() => window.location.reload(), 1200);
            } else {
                setStatusMsg('🔧 Still under maintenance. Please check back soon!');
            }
        } catch {
            setStatusMsg('⚠️ Could not reach the server. Try again.');
        } finally {
            setTimeout(() => setCheckingStatus(false), 1000);
        }
    };

    return (
        <div className="maintenance-page">
            {/* Animated food particles */}
            <div className="maintenance-particles" aria-hidden="true">
                {PARTICLES.map((p) => (
                    <motion.div
                        key={p.id}
                        className="maintenance-particle"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            fontSize: `${p.size}px`,
                        }}
                        animate={{
                            y: [0, -30, 0, 20, 0],
                            x: [0, 15, -10, 5, 0],
                            rotate: [0, 15, -10, 5, 0],
                            opacity: [0.15, 0.45, 0.2, 0.4, 0.15],
                        }}
                        transition={{
                            duration: p.duration,
                            delay: p.delay,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        {p.emoji}
                    </motion.div>
                ))}
            </div>

            {/* Glowing blobs */}
            <div className="maintenance-blob blob-1" aria-hidden="true" />
            <div className="maintenance-blob blob-2" aria-hidden="true" />
            <div className="maintenance-blob blob-3" aria-hidden="true" />

            <div className="maintenance-content">
                {/* Logo / brand */}
                <motion.div
                    className="maintenance-logo"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                >
                    <span className="maintenance-logo-icon">🍽️</span>
                    <span className="maintenance-logo-text">Bhojan</span>
                </motion.div>

                {/* Main card */}
                <motion.div
                    className="maintenance-card"
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Animated wrench icon */}
                    <motion.div
                        className="maintenance-icon-wrap"
                        animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                        🛠️
                    </motion.div>

                    <h1 className="maintenance-title">We're Cooking Something Up!</h1>
                    <p className="maintenance-subtitle">
                        Bhojan is temporarily down for scheduled maintenance.<br />
                        We're improving our platform to serve you better.
                    </p>

                    {/* Countdown timer */}
                    <div className="maintenance-timer">
                        <div className="maintenance-timer-unit">
                            <span className="maintenance-timer-digit">{pad(timeLeft.h)}</span>
                            <span className="maintenance-timer-label">Hours</span>
                        </div>
                        <span className="maintenance-timer-sep">:</span>
                        <div className="maintenance-timer-unit">
                            <span className="maintenance-timer-digit">{pad(timeLeft.m)}</span>
                            <span className="maintenance-timer-label">Minutes</span>
                        </div>
                        <span className="maintenance-timer-sep">:</span>
                        <div className="maintenance-timer-unit">
                            <span className="maintenance-timer-digit">{pad(timeLeft.s)}</span>
                            <span className="maintenance-timer-label">Seconds</span>
                        </div>
                    </div>

                    {/* Status message */}
                    <AnimatePresence>
                        {statusMsg && (
                            <motion.p
                                className="maintenance-status-msg"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                            >
                                {statusMsg}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Action button */}
                    <motion.button
                        className="maintenance-btn"
                        onClick={handleCheckStatus}
                        disabled={checkingStatus}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {checkingStatus ? (
                            <span className="maintenance-btn-spinner" />
                        ) : (
                            '🔄 Check if we\'re back'
                        )}
                    </motion.button>

                    <p className="maintenance-footer-note">
                        Our team is working hard to restore service. We apologise for the inconvenience.
                    </p>

                    {/* Admin backdoor login link */}
                    <div style={{ marginTop: 16 }}>
                        <Link
                            to="/login"
                            className="maintenance-admin-link"
                        >
                            🔐 Admin? Sign in here
                        </Link>
                    </div>
                </motion.div>

                {/* Progress bar (looping) */}
                <motion.div
                    className="maintenance-progress-track"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <motion.div
                        className="maintenance-progress-bar"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </motion.div>

                {/* Social links */}
                <motion.div
                    className="maintenance-socials"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <span>Follow our updates:</span>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="maintenance-social-link">Twitter</a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="maintenance-social-link">Instagram</a>
                </motion.div>
            </div>

            <style>{`
                .maintenance-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0f0c29 0%, #1a1040 40%, #141428 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    overflow: hidden;
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                }
                .maintenance-particles {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }
                .maintenance-particle {
                    position: absolute;
                    user-select: none;
                }
                .maintenance-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    pointer-events: none;
                }
                .blob-1 {
                    width: 420px; height: 420px;
                    background: radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%);
                    top: -100px; left: -100px;
                    animation: blobFloat 8s ease-in-out infinite;
                }
                .blob-2 {
                    width: 350px; height: 350px;
                    background: radial-gradient(circle, rgba(236,72,153,0.2), transparent 70%);
                    bottom: -80px; right: -80px;
                    animation: blobFloat 10s ease-in-out infinite reverse;
                }
                .blob-3 {
                    width: 280px; height: 280px;
                    background: radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%);
                    top: 50%; left: 60%;
                    animation: blobFloat 12s ease-in-out infinite 2s;
                }
                @keyframes blobFloat {
                    0%, 100% { transform: translate(0,0) scale(1); }
                    33%       { transform: translate(20px,-30px) scale(1.05); }
                    66%       { transform: translate(-15px,20px) scale(0.95); }
                }
                .maintenance-content {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 28px;
                    padding: 24px 16px;
                    width: 100%;
                    max-width: 560px;
                }
                .maintenance-logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .maintenance-logo-icon { font-size: 2.2rem; }
                .maintenance-logo-text {
                    font-size: 1.8rem;
                    font-weight: 800;
                    background: linear-gradient(90deg, #f97316, #ec4899, #8b5cf6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: -0.5px;
                }
                .maintenance-card {
                    background: rgba(255,255,255,0.04);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 28px;
                    padding: 44px 40px;
                    text-align: center;
                    width: 100%;
                    box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
                }
                .maintenance-icon-wrap {
                    font-size: 3.5rem;
                    margin-bottom: 20px;
                    display: inline-block;
                }
                .maintenance-title {
                    font-size: 1.85rem;
                    font-weight: 800;
                    color: #fff;
                    margin: 0 0 14px;
                    line-height: 1.2;
                }
                .maintenance-subtitle {
                    color: rgba(255,255,255,0.55);
                    font-size: 1rem;
                    line-height: 1.65;
                    margin: 0 0 32px;
                }
                .maintenance-timer {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    margin-bottom: 32px;
                }
                .maintenance-timer-unit {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                }
                .maintenance-timer-digit {
                    font-size: 2.6rem;
                    font-weight: 800;
                    color: #fff;
                    font-variant-numeric: tabular-nums;
                    background: rgba(255,255,255,0.07);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 14px;
                    padding: 10px 18px;
                    line-height: 1;
                    min-width: 72px;
                    text-align: center;
                }
                .maintenance-timer-label {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: rgba(255,255,255,0.4);
                    font-weight: 600;
                }
                .maintenance-timer-sep {
                    font-size: 2.2rem;
                    font-weight: 800;
                    color: rgba(255,255,255,0.3);
                    margin-bottom: 24px;
                }
                .maintenance-status-msg {
                    font-size: 0.92rem;
                    color: #a78bfa;
                    margin: 0 0 16px;
                    font-weight: 500;
                }
                .maintenance-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    background: linear-gradient(135deg, #f97316, #ec4899);
                    color: #fff;
                    font-size: 1rem;
                    font-weight: 700;
                    padding: 14px 36px;
                    border-radius: 50px;
                    border: none;
                    cursor: pointer;
                    transition: box-shadow 0.2s, opacity 0.2s;
                    box-shadow: 0 8px 32px rgba(249,115,22,0.35);
                    margin-bottom: 20px;
                    min-width: 200px;
                }
                .maintenance-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .maintenance-btn:hover:not(:disabled) {
                    box-shadow: 0 12px 40px rgba(249,115,22,0.5);
                }
                .maintenance-btn-spinner {
                    width: 18px; height: 18px;
                    border: 3px solid rgba(255,255,255,0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .maintenance-footer-note {
                    font-size: 0.82rem;
                    color: rgba(255,255,255,0.3);
                    margin: 0;
                }
                .maintenance-progress-track {
                    width: 100%;
                    height: 4px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 999px;
                    overflow: hidden;
                }
                .maintenance-progress-bar {
                    width: 60%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, #f97316, #ec4899, transparent);
                    border-radius: 999px;
                }
                .maintenance-socials {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    color: rgba(255,255,255,0.3);
                    font-size: 0.85rem;
                }
                .maintenance-social-link {
                    color: rgba(255,255,255,0.5);
                    text-decoration: none;
                    font-weight: 600;
                    transition: color 0.2s;
                }
                .maintenance-social-link:hover { color: #f97316; }

                .maintenance-admin-link {
                    color: rgba(255,255,255,0.4);
                    font-size: 0.78rem;
                    font-weight: 500;
                    text-decoration: none;
                    transition: color 0.2s;
                    letter-spacing: 0.02em;
                    display: inline-block;
                }
                .maintenance-admin-link:hover {
                    color: #f97316;
                    text-decoration: underline;
                }

                @media (max-width: 520px) {
                    .maintenance-card { padding: 32px 20px; }
                    .maintenance-title { font-size: 1.45rem; }
                    .maintenance-timer-digit { font-size: 2rem; min-width: 56px; padding: 8px 12px; }
                }
            `}</style>
        </div>
    );
};

export default MaintenancePage;
