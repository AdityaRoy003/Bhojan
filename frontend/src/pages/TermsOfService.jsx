import React from 'react';
import { motion } from 'framer-motion';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm"
            >
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

                <div className="prose prose-orange max-w-none text-gray-600">
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
                        <p>By accessing and using Bhojan, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Description of Service</h2>
                        <p>Bhojan is a food delivery platform connecting customers with local restaurants and cloud kitchens. We facilitate the ordering and delivery process.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">3. User Accounts</h2>
                        <p>Users are responsible for maintaining the confidentiality of their account information. You must be at least 18 years old to create an account.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Payment and Refunds</h2>
                        <p>Payments are processed securely. Refund policies vary by restaurant and specific circumstances of the order cancellation or issue.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Limitation of Liability</h2>
                        <p>Bhojan is not liable for the quality of food prepared by restaurants or for delays caused by external factors during delivery.</p>
                    </section>

                    <p className="text-sm mt-12 text-gray-400 italic text-center text-center">Last Updated: February 6, 2026</p>
                </div>
            </motion.div>
        </div>
    );
};

export default TermsOfService;
