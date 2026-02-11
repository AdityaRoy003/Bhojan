import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm"
            >
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

                <div className="prose prose-orange max-w-none text-gray-600">
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Information We Collect</h2>
                        <p>We collect information you provide directly to us, such as your name, email, phone number, and delivery address. We also collect location data to facilitate delivery tracking.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">2. How We Use Information</h2>
                        <p>We use your information to process orders, provide customer support, personalize your experience, and send important updates about our service.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Data Sharing</h2>
                        <p>We share necessary information with restaurants and delivery partners to fulfill your orders. We do not sell your personal data to third parties.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Your Rights (GDPR)</h2>
                        <p>Under GDPR, you have the right to access, correct, or delete your personal data. You can exercise these rights through your profile settings or by contacting support.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Cookies</h2>
                        <p>We use cookies to enhance your browsing experience and analyze platform traffic. You can manage cookie preferences through your browser settings.</p>
                    </section>

                    <p className="text-sm mt-12 text-gray-400 italic text-center">Last Updated: February 6, 2026</p>
                </div>
            </motion.div>
        </div>
    );
};

export default PrivacyPolicy;
