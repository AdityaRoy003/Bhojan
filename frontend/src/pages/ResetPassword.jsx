import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Retrieve passed state from Forgot Password page
    const stateEmail = location.state?.email || '';
    const stateDevOtp = location.state?.devOtp || '';

    const [email, setEmail] = useState(stateEmail);
    const [otp, setOtp] = useState(stateDevOtp);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    // UX States
    const [isEmailReadOnly, setIsEmailReadOnly] = useState(!!stateEmail);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [timer, setTimer] = useState(60);

    // Resend countdown timer logic
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (interval) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Prefill OTP if it is passed in the router state (development mode)
    useEffect(() => {
        if (stateDevOtp) {
            setOtp(stateDevOtp);
        }
    }, [stateDevOtp]);

    // Resend OTP handler
    const handleResendOtp = async () => {
        if (!email) {
            toast.error("Please enter your email first");
            return;
        }
        setResending(true);
        try {
            const { data } = await api.post('/auth/password/forgot', { email });
            toast.success(data.message || 'OTP resent successfully!');
            if (data.otp) {
                setOtp(data.otp);
            }
            setTimer(60);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

    // Calculate Password Strength
    const getPasswordStrength = (pwd) => {
        if (!pwd) return { label: '', color: 'bg-gray-200 dark:bg-gray-800', width: '0%', textColor: 'text-gray-400' };
        if (pwd.length < 6) return { label: 'Too short (min 6)', color: 'bg-red-500', width: '25%', textColor: 'text-red-500' };

        const hasNumbers = /\d/.test(pwd);
        const hasUpper = /[A-Z]/.test(pwd);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

        if (hasNumbers && hasUpper && hasSpecial && pwd.length >= 8) {
            return { label: 'Strong password', color: 'bg-green-500', width: '100%', textColor: 'text-green-500' };
        }
        if ((hasNumbers || hasUpper || hasSpecial) && pwd.length >= 6) {
            return { label: 'Medium security', color: 'bg-yellow-500', width: '65%', textColor: 'text-yellow-500' };
        }
        return { label: 'Weak', color: 'bg-red-400', width: '40%', textColor: 'text-red-400' };
    };

    const strength = getPasswordStrength(newPassword);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error("Email is required");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.put('/auth/password/reset', { 
                email, 
                otp, 
                newPassword, 
                confirmPassword 
            });
            toast.success("Password reset successful! Redirecting to login...");
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-950 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="max-w-md w-full space-y-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/40 dark:border-gray-800/50"
            >
                <div className="flex flex-col items-center">
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 text-primary mb-4">
                        <svg className="w-8 h-8 text-primary animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"></path>
                        </svg>
                    </div>

                    <h2 className="text-center text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
                        Verify your security OTP and choose a strong new password.
                    </p>
                </div>

                {/* Development Mode Notice Card */}
                {stateDevOtp && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-yellow-50 dark:bg-yellow-950/30 border-l-4 border-yellow-500 p-4 rounded-2xl text-yellow-800 dark:text-yellow-200 text-xs flex flex-col space-y-1.5"
                    >
                        <div className="flex items-center space-x-1.5 font-bold">
                            <span>🔧 Dev Mode Notice</span>
                        </div>
                        <p>
                            Since email services are unconfigured, we auto-filled the OTP sent by the server: <strong className="bg-yellow-200 dark:bg-yellow-900/60 px-1.5 py-0.5 rounded text-sm font-extrabold select-all">{stateDevOtp}</strong>
                        </p>
                    </motion.div>
                )}

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    {/* Email Selection Card / Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Account Email
                        </label>
                        {isEmailReadOnly ? (
                            <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl">
                                <div className="flex items-center space-x-2.5">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"></path>
                                    </svg>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{email}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsEmailReadOnly(false)}
                                    className="text-xs font-semibold text-primary hover:text-red-600 transition-colors bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-xl"
                                >
                                    Change
                                </button>
                            </div>
                        ) : (
                            <div className="relative rounded-2xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"></path>
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {/* OTP Section with Resend countdown */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label htmlFor="otp" className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Enter OTP
                            </label>
                            <button
                                type="button"
                                disabled={timer > 0 || resending}
                                onClick={handleResendOtp}
                                className={`text-xs font-semibold transition-all ${
                                    timer > 0 || resending
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-primary hover:text-red-600'
                                }`}
                            >
                                {resending ? 'Resending...' : timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
                            </button>
                        </div>
                        <div className="relative rounded-2xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-.99.43-1.563A6 6 0 1121.75 8.25z"></path>
                                </svg>
                            </div>
                            <input
                                id="otp"
                                name="otp"
                                type="text"
                                required
                                className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm tracking-wider"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                        <label htmlFor="new-password" className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            New Password
                        </label>
                        <div className="relative rounded-2xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"></path>
                                </svg>
                            </div>
                            <input
                                id="new-password"
                                name="newPassword"
                                type={showNewPassword ? 'text' : 'password'}
                                required
                                className="block w-full pl-12 pr-12 py-3 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            {/* Toggle visibility */}
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showNewPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {newPassword && (
                            <div className="space-y-1 pt-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-gray-500">Password Strength:</span>
                                    <span className={`font-bold ${strength.textColor}`}>{strength.label}</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-300 ${strength.color}`} 
                                        style={{ width: strength.width }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                        <label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Confirm Password
                        </label>
                        <div className="relative rounded-2xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"></path>
                                </svg>
                            </div>
                            <input
                                id="confirm-password"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                className="block w-full pl-12 pr-12 py-3 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            {/* Toggle visibility */}
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showConfirmPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                )}
                            </button>
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
                                    <span>Resetting Password...</span>
                                </span>
                            ) : (
                                'Reset Password'
                            )}
                        </motion.button>
                    </div>

                    <div className="text-center pt-2">
                        <Link to="/login" className="flex items-center justify-center space-x-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors">
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

export default ResetPassword;
