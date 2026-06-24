import React from 'react';
import { motion } from 'framer-motion';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300"
            >
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">Terms of Service</h1>

                <div className="prose prose-orange max-w-none text-gray-600 dark:text-gray-300">
                    <section className="mb-8">
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-4">1. Acceptance of Terms</h2>
                        <p className="font-semibold text-sm leading-relaxed">By accessing and using Bhojan, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-4">2. Description of Service</h2>
                        <p className="font-semibold text-sm leading-relaxed">Bhojan is a food delivery platform connecting customers with local restaurants and cloud kitchens. We facilitate the ordering and delivery process.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-4">3. User Accounts</h2>
                        <p className="font-semibold text-sm leading-relaxed">Users are responsible for maintaining the confidentiality of their account information. You must be at least 18 years old to create an account.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-4">4. Payment and Refunds</h2>
                        <p className="font-semibold text-sm leading-relaxed">Payments are processed securely. Refund policies vary by restaurant and specific circumstances of the order cancellation or issue.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-4">5. Limitation of Liability</h2>
                        <p className="font-semibold text-sm leading-relaxed">Bhojan is not liable for the quality of food prepared by restaurants or for delays caused by external factors during delivery.</p>
                    </section>

                    <p className="text-xs mt-12 text-gray-400 dark:text-gray-500 italic text-center">Last Updated: February 6, 2026</p>
                </div>
            </motion.div>
        </div>
    );
};

export default TermsOfService;
