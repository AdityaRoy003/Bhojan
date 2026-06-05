import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/password/forgot', { email });
            toast.success(data.message || 'OTP sent successfully!');
            // Redirect to Reset Password page and pass email + devOtp (if present)
            setTimeout(() => {
                navigate('/reset-password', { state: { email, devOtp: data.otp } });
            }, 1000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-950 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="max-w-md w-full space-y-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/40 dark:border-gray-800/50"
            >
                <div className="flex flex-col items-center">
                    {/* Key/Lock SVG Header Icon with pulsing background */}
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 text-primary mb-4">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20 animate-ping"></span>
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-.99.43-1.563A6 6 0 1121.75 8.25z"></path>
                        </svg>
                    </div>

                    <h2 className="text-center text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Forgot Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400 px-4">
                        Enter your email address and we'll send you an OTP to reset your password.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label htmlFor="email-address" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Email Address
                        </label>
                        <div className="relative rounded-2xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"></path>
                                </svg>
                            </div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-2xl text-white transition-all duration-150 ${
                                loading 
                                ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed' 
                                : 'bg-primary hover:bg-red-600 shadow-lg shadow-red-500/20 hover:shadow-red-500/30'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                        >
                            {loading ? (
                                <span className="flex items-center space-x-2">
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Sending OTP...</span>
                                </span>
                            ) : (
                                'Send OTP'
                            )}
                        </motion.button>
                    </div>

                    <div className="flex flex-col items-center space-y-3 pt-2">
                        <Link to="/reset-password" className="text-sm font-semibold text-primary hover:text-red-600 transition-colors">
                            Enter OTP & Reset Password
                        </Link>
                        <div className="w-full border-t border-gray-100 dark:border-gray-800 my-2"></div>
                        <Link to="/login" className="flex items-center space-x-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"></path>
                            </svg>
                            <span>Back to Login</span>
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
