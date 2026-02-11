import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'true');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 md:left-8 md:right-auto md:max-w-md bg-white border border-gray-100 shadow-2xl rounded-2xl p-6 z-[9999]"
                >
                    <div className="flex items-start gap-4">
                        <div className="bg-orange-100 p-2 rounded-lg">
                            <span className="text-2xl">🍪</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Cookie Consent</h3>
                            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                We use cookies to enhance your experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies. Read our <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link> for details.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAccept}
                                    className="bg-primary hover:bg-orange-600 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors duration-200"
                                >
                                    Accept All
                                </button>
                                <Link
                                    to="/privacy"
                                    className="text-gray-500 hover:text-gray-700 px-4 py-2 text-sm font-medium transition-colors"
                                >
                                    Learn More
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
