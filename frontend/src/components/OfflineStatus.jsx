import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineStatus = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    exit={{ y: -100 }}
                    className="fixed top-0 left-0 right-0 z-[9999] bg-primary text-white py-2 px-4 shadow-lg flex items-center justify-center gap-3"
                >
                    <span className="text-xl">📡</span>
                    <p className="font-black text-[10px] uppercase tracking-widest">
                        You are currently offline. Browsing cached menus.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[8px] font-black transition-all"
                    >
                        RETRY
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OfflineStatus;
