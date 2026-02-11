import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const SpinTheWheel = ({ onClose, onWin }) => {
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState(null);
    const [rotation, setRotation] = useState(0);

    const prizes = [
        { label: '10% OFF', value: 10, color: 'from-red-500 to-red-600' },
        { label: 'FREE DELIVERY', value: 'free_delivery', color: 'from-blue-500 to-blue-600' },
        { label: '5% OFF', value: 5, color: 'from-green-500 to-green-600' },
        { label: '₹50 OFF', value: 50, color: 'from-yellow-500 to-yellow-600' },
        { label: '20% OFF', value: 20, color: 'from-purple-500 to-purple-600' },
        { label: 'TRY AGAIN', value: 0, color: 'from-gray-400 to-gray-500' },
        { label: '15% OFF', value: 15, color: 'from-pink-500 to-pink-600' },
        { label: '₹100 OFF', value: 100, color: 'from-indigo-500 to-indigo-600' }
    ];

    const spinWheel = async () => {
        if (spinning) return;
        setSpinning(true);

        // Random prize selection
        const winningIndex = Math.floor(Math.random() * prizes.length);
        const degreesPerSegment = 360 / prizes.length;
        const extraSpins = 5; // Number of full rotations
        const targetRotation = (extraSpins * 360) + (360 - (winningIndex * degreesPerSegment)) - (degreesPerSegment / 2);

        setRotation(targetRotation);

        setTimeout(async () => {
            setResult(prizes[winningIndex]);
            setSpinning(false);

            // Save coupon to backend
            if (prizes[winningIndex].value !== 0) {
                try {
                    const { data } = await api.post('/gamification/spin-reward', {
                        prize: prizes[winningIndex]
                    });

                    if (data.success) {
                        // Use the real coupon code from backend
                        setResult({ ...prizes[winningIndex], code: data.coupon.code });
                        if (onWin) onWin(data.coupon);
                    }
                } catch (error) {
                    console.error('Failed to save reward');
                    // Fallback to client-side display if offline, but no real coupon
                    setResult(prizes[winningIndex]);
                }
            } else {
                setResult(prizes[winningIndex]);
            }
        }, 4000);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[40px] p-8 max-w-lg w-full relative shadow-2xl"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-black text-gray-600"
                >
                    ✕
                </button>

                <h2 className="text-3xl font-black text-center mb-8 text-gray-900">
                    🎰 Spin & Win!
                </h2>

                <div className="relative w-80 h-80 mx-auto mb-8">
                    {/* Wheel */}
                    <motion.div
                        className="w-full h-full rounded-full relative overflow-hidden shadow-2xl"
                        style={{
                            rotate: rotation,
                            transition: spinning ? 'rotate 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                        }}
                    >
                        {prizes.map((prize, idx) => {
                            const angle = (360 / prizes.length) * idx;
                            return (
                                <div
                                    key={idx}
                                    className={`absolute w-1/2 h-1/2 origin-bottom-right bg-gradient-to-br ${prize.color}`}
                                    style={{
                                        transform: `rotate(${angle}deg) skewY(-${90 - 360 / prizes.length}deg)`,
                                        transformOrigin: '100% 100%'
                                    }}
                                >
                                    <div
                                        className="absolute top-4 right-4 text-white font-black text-xs uppercase tracking-wider"
                                        style={{
                                            transform: `skewY(${90 - 360 / prizes.length}deg) rotate(${360 / prizes.length / 2}deg)`
                                        }}
                                    >
                                        {prize.label}
                                    </div>
                                </div>
                            );
                        })}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white shadow-xl border-4 border-gray-200"></div>
                        </div>
                    </motion.div>

                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10">
                        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-primary drop-shadow-lg"></div>
                    </div>
                </div>

                {!result ? (
                    <button
                        onClick={spinWheel}
                        disabled={spinning}
                        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg ${spinning
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-primary to-orange-500 text-white hover:shadow-xl'
                            }`}
                    >
                        {spinning ? 'Spinning...' : 'Spin Now!'}
                    </button>
                ) : (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-center"
                    >
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200 mb-4">
                            <p className="text-sm font-black uppercase tracking-widest text-green-600 mb-2">
                                🎉 Congratulations!
                            </p>
                            <p className="text-3xl font-black text-gray-900">{result.label}</p>
                            {result.value !== 0 && (
                                <div className="mt-4">
                                    <p className="text-xs text-gray-600 font-bold mb-1">Use Code:</p>
                                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl py-2 px-4 font-mono font-black text-lg tracking-widest text-primary selection:bg-primary selection:text-white">
                                        {result.code || 'Loading...'}
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold mt-2">Added to your active coupons</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800"
                        >
                            Close
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default SpinTheWheel;
