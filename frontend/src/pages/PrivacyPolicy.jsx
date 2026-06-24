import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300"
            >
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">Privacy Policy</h1>

                <div className="prose prose-orange max-w-none text-gray-600 dark:text-gray-300">
                    <section className="mb-8">
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-4">1. Information We Collect</h2>
                        <p className="font-semibold text-sm leading-relaxed">We collect information you provide directly to us, such as your name, email, phone number, and delivery address. We also collect location data to facilitate delivery tracking.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-4">2. How We Use Information</h2>
                        <p className="font-semibold text-sm leading-relaxed">We use your information to process orders, provide customer support, personalize your experience, and send important updates about our service.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-4">3. Data Sharing</h2>
                        <p className="font-semibold text-sm leading-relaxed">We share necessary information with restaurants and delivery partners to fulfill your orders. We do not sell your personal data to third parties.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-4">4. Your Rights (GDPR)</h2>
                        <p className="font-semibold text-sm leading-relaxed">Under GDPR, you have the right to access, correct, or delete your personal data. You can exercise these rights through your profile settings or by contacting support.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-4">5. Cookies</h2>
                        <p className="font-semibold text-sm leading-relaxed">We use cookies to enhance your browsing experience and analyze platform traffic. You can manage cookie preferences through your browser settings.</p>
                    </section>

                    <p className="text-xs mt-12 text-gray-400 dark:text-gray-500 italic text-center">Last Updated: February 6, 2026</p>
                </div>
            </motion.div>
        </div>
    );
};

export default PrivacyPolicy;
