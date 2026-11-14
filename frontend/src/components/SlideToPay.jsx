import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

/**
 * SlideToPay - CRED / Uber Eats style interactive swipe-to-pay component
 * Provides tactile drag gestures, visual track fill, haptic vibration,
 * and lock-in completion animation.
 */
const SlideToPay = ({
    onConfirm,
    loading = false,
    disabled = false,
    amount = 0,
    label = 'Slide to Pay',
    successText = 'Payment Initiated'
}) => {
    const containerRef = useRef(null);
    const [sliderWidth, setSliderWidth] = useState(0);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const x = useMotionValue(0);

    const handleWidth = 56; // Width of the draggable handle button
    const maxDrag = Math.max(0, sliderWidth - handleWidth - 8);

    // Calculate background track fill opacity and width based on drag position
    const fillWidth = useTransform(x, [0, maxDrag], [handleWidth, sliderWidth]);
    const textOpacity = useTransform(x, [0, maxDrag * 0.6], [1, 0.15]);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setSliderWidth(containerRef.current.offsetWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const triggerHaptic = (ms = 15) => {
        if (typeof window !== 'undefined' && window.navigator?.vibrate) {
            try { window.navigator.vibrate(ms); } catch (_) {}
        }
    };

    const handleDragEnd = (_, info) => {
        if (disabled || loading || isConfirmed) return;

        // If dragged past 75% of the track or flung with high velocity
        if (x.get() >= maxDrag * 0.75 || info.velocity.x > 450) {
            setIsConfirmed(true);
            triggerHaptic([30, 50, 30]);
            x.set(maxDrag);
            if (onConfirm) onConfirm();
        } else {
            // Spring back to start
            x.set(0);
            triggerHaptic(10);
        }
    };

    // If externally resetting or loading failed, reset slider
    useEffect(() => {
        if (!loading && !disabled) {
            // If action failed, allow sliding again
            const timer = setTimeout(() => {
                if (isConfirmed && !loading) {
                    setIsConfirmed(false);
                    x.set(0);
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [loading, disabled, isConfirmed, x]);

    return (
        <div className="w-full select-none">
            <div
                ref={containerRef}
                className={`relative h-15 rounded-2xl overflow-hidden p-1 flex items-center transition-all ${
                    disabled
                        ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                        : isConfirmed || loading
                            ? 'bg-emerald-600 shadow-lg shadow-emerald-500/25 border border-emerald-500'
                            : 'bg-gradient-to-r from-orange-500/10 via-primary/10 to-orange-500/10 dark:from-gray-800 dark:to-gray-800/80 border-2 border-primary/30 shadow-md'
                }`}
            >
                {/* Dynamic Drag Progress Fill Track */}
                <motion.div
                    style={{ width: fillWidth }}
                    className={`absolute inset-y-1 left-1 rounded-xl transition-colors ${
                        isConfirmed || loading
                            ? 'bg-emerald-600'
                            : 'bg-gradient-to-r from-orange-500 via-primary to-orange-600'
                    }`}
                />

                {/* Center Instructional Label */}
                <motion.div
                    style={{ opacity: textOpacity }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none px-12"
                >
                    <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 flex items-center gap-2 drop-shadow-xs">
                        {disabled ? (
                            <span>Select Delivery Address First</span>
                        ) : loading || isConfirmed ? (
                            <span className="text-white flex items-center gap-2">
                                <span className="inline-block animate-spin">⏳</span> {successText}...
                            </span>
                        ) : (
                            <>
                                <span>{label}</span>
                                {amount > 0 && <span className="text-primary font-black">• ₹{Math.round(amount)}</span>}
                                <span className="text-primary animate-pulse text-base hidden sm:inline">➔</span>
                            </>
                        )}
                    </span>
                </motion.div>

                {/* Draggable Thumb Handle */}
                {!disabled && !loading && (
                    <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: maxDrag }}
                        dragElastic={0.08}
                        dragMomentum={false}
                        onDragStart={() => triggerHaptic(10)}
                        onDragEnd={handleDragEnd}
                        style={{ x }}
                        className={`absolute left-1 z-10 w-13 h-13 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing text-white shadow-lg active:scale-95 transition-transform ${
                            isConfirmed
                                ? 'bg-white text-emerald-600'
                                : 'bg-gradient-to-tr from-primary to-orange-500 shadow-orange-500/40 ring-2 ring-white/40'
                        }`}
                    >
                        {isConfirmed ? (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xl font-black"
                            >
                                ✓
                            </motion.span>
                        ) : (
                            <span className="text-lg font-black tracking-tighter">➔➔</span>
                        )}
                    </motion.div>
                )}

                {/* Fallback Tap action for accessibility / assistive tools */}
                <button
                    type="button"
                    onClick={() => {
                        if (!disabled && !loading) {
                            setIsConfirmed(true);
                            triggerHaptic(25);
                            if (onConfirm) onConfirm();
                        }
                    }}
                    disabled={disabled || loading}
                    className="sr-only"
                    aria-label={`${label} ₹${amount}`}
                >
                    {label}
                </button>
            </div>
            <p className="text-[10px] text-center font-bold text-gray-400 dark:text-gray-500 mt-2">
                🔒 Safe & 256-bit SSL encrypted • Instant payment confirmation
            </p>
        </div>
    );
};

export default SlideToPay;

