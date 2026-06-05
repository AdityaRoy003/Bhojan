import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../utils/api';
import { setUser, setError } from '../redux/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Toggle between Phone OTP Login (default) and traditional Password Login
    const [usePasswordLogin, setUsePasswordLogin] = useState(false);

    // Email/Password login states
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);

    // Mobile login states
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [devOtp, setDevOtp] = useState('');
    const [timer, setTimer] = useState(0);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    // Two-Factor Authentication states
    const [twoFactorRequired, setTwoFactorRequired] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [twoFactorUserId, setTwoFactorUserId] = useState('');
    const [verifying2fa, setVerifying2fa] = useState(false);

    // Timer countdown logic for sending OTP
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

    // Handle email login inputs
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Submit Email/Password Login
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setEmailLoading(true);
        try {
            const { data } = await api.post('/auth/signin', formData);
            if (data.twoFactorRequired) {
                setTwoFactorUserId(data.userId);
                setTwoFactorRequired(true);
                toast.info('Two-Factor Verification required. Code sent to your registered email.');
            } else if (data.success) {
                dispatch(setUser(data.user));
                toast.success('Logged in successfully!');
                navigate('/');
            }
        } catch (error) {
            console.error(error);
            dispatch(setError(error.response?.data?.message || 'Login failed'));
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setEmailLoading(false);
        }
    };

    // Send Mobile OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!mobile || mobile.length < 10) {
            toast.error("Please enter a valid 10-digit mobile number");
            return;
        }
        setSendingOtp(true);
        try {
            const { data } = await api.post('/auth/phone/send-otp', { mobile });
            toast.success(data.message || "OTP sent successfully!");
            setOtpSent(true);
            setTimer(60);
            if (data.otp) {
                setDevOtp(data.otp);
                setOtp(data.otp); // prefill in dev mode
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setSendingOtp(false);
        }
    };

    // Verify Mobile OTP & Login
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp || otp.length < 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }
        setVerifyingOtp(true);
        try {
            const { data } = await api.post('/auth/phone/verify-otp', { mobile, otp });
            if (data.twoFactorRequired) {
                setTwoFactorUserId(data.userId);
                setTwoFactorRequired(true);
                toast.info('Two-Factor Verification required. Code sent to your registered email.');
            } else if (data.success) {
                dispatch(setUser(data.user));
                toast.success("Logged in successfully!");
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setVerifyingOtp(false);
        }
    };

    // Verify 2FA code / Backup Code
    const handleVerify2fa = async (e) => {
        e.preventDefault();
        if (!twoFactorCode) {
            toast.error("Please enter verification code or backup code");
            return;
        }
        setVerifying2fa(true);
        try {
            const { data } = await api.post('/auth/2fa/verify', { userId: twoFactorUserId, code: twoFactorCode });
            if (data.success) {
                dispatch(setUser(data.user));
                toast.success("Verification successful! Welcome back.");
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid or expired 2FA code");
        } finally {
            setVerifying2fa(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-colors duration-300">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-[32px] shadow-2xl relative z-10 border border-gray-100 dark:border-gray-800"
            >
                {/* Header (Swiggy Style Minimalist) */}
                <div className="text-left mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                {twoFactorRequired ? 'Security' : 'Login'}
                            </h2>
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
                                {twoFactorRequired ? 'Two-Factor Check' : <>or <Link to="/signup" className="text-primary hover:underline">create an account</Link></>}
                            </p>
                        </div>
                        <span className="text-4xl">{twoFactorRequired ? '🔒' : '🥣'}</span>
                    </div>
                    <div className="w-10 h-1 bg-primary mt-4 rounded-full"></div>
                </div>

                <AnimatePresence mode="wait">
                    {twoFactorRequired ? (
                        /* 2FA Form */
                        <motion.form
                            key="2fa-login"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                            onSubmit={handleVerify2fa}
                        >
                            <div className="text-left space-y-4">
                                <div className="bg-indigo-50 dark:bg-indigo-950/20 border-l-4 border-indigo-500 p-4 rounded-2xl text-indigo-800 dark:text-indigo-250 text-xs">
                                    <span className="font-bold">Two-Factor Authentication:</span>
                                    <p className="mt-0.5">Please check your email. We've sent a 6-digit code to authorize this session.</p>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="twoFactorCode" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Verification Code / Backup Code</label>
                                    <input
                                        id="twoFactorCode"
                                        name="twoFactorCode"
                                        type="text"
                                        required
                                        autoFocus
                                        className="block w-full px-4 py-3.5 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent rounded-2xl sm:text-sm text-center font-black tracking-[0.2em]"
                                        placeholder="6-digit code or 8-char backup"
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value)}
                                    />
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                type="submit"
                                disabled={verifying2fa || !twoFactorCode}
                                className={`w-full flex justify-center py-3.5 px-4 text-xs font-black uppercase tracking-widest rounded-2xl text-white transition-all shadow-lg ${
                                    verifying2fa || !twoFactorCode
                                        ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed shadow-none'
                                        : 'bg-primary hover:bg-red-600 shadow-red-500/10 hover:shadow-red-500/20'
                                }`}
                            >
                                {verifying2fa ? 'Verifying...' : 'Verify & Log In'}
                            </motion.button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTwoFactorRequired(false);
                                        setTwoFactorCode('');
                                        setTwoFactorUserId('');
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary transition-colors"
                                >
                                    Cancel and go back
                                </button>
                            </div>
                        </motion.form>
                    ) : !usePasswordLogin ? (
                        /* Mobile OTP Login View (Swiggy Default) */
                        <motion.div
                            key="mobile-login"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-6"
                        >
                            {!otpSent ? (
                                /* Step 1: Input Mobile */
                                <form onSubmit={handleSendOtp} className="space-y-6">
                                    <div className="text-left space-y-2">
                                        <label htmlFor="mobile" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Phone Number</label>
                                        <div className="relative flex rounded-2xl shadow-sm bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800/80 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                                            <div className="flex items-center justify-center pl-4 pr-2 border-r border-gray-200 dark:border-gray-800 text-sm font-black text-gray-500">
                                                +91
                                            </div>
                                            <input
                                                id="mobile"
                                                name="mobile"
                                                type="tel"
                                                maxLength="10"
                                                required
                                                className="block w-full px-4 py-3.5 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none sm:text-sm"
                                                placeholder="Enter 10-digit mobile number"
                                                value={mobile}
                                                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                                            />
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        type="submit"
                                        disabled={sendingOtp || mobile.length < 10}
                                        className={`w-full flex justify-center py-3.5 px-4 text-xs font-black uppercase tracking-widest rounded-2xl text-white transition-all shadow-lg ${
                                            sendingOtp || mobile.length < 10
                                                ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed shadow-none'
                                                : 'bg-primary hover:bg-red-600 shadow-red-500/10 hover:shadow-red-500/20'
                                        }`}
                                    >
                                        {sendingOtp ? 'Sending OTP...' : 'Login'}
                                    </motion.button>
                                </form>
                            ) : (
                                /* Step 2: Input OTP */
                                <form onSubmit={handleVerifyOtp} className="space-y-6">
                                    {/* Dev Notice */}
                                    {devOtp && (
                                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 p-4 rounded-2xl text-yellow-800 dark:text-yellow-250 text-xs text-left">
                                            <span className="font-bold">🔧 Dev Mode Notice:</span>
                                            <p className="mt-0.5">
                                                OTP: <strong className="bg-yellow-250 dark:bg-yellow-900/60 px-1.5 py-0.5 rounded text-sm font-black select-all">{devOtp}</strong> (Autofilled)
                                            </p>
                                        </div>
                                    )}

                                    <div className="text-left space-y-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                                OTP sent to +91 {mobile}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOtpSent(false);
                                                    setDevOtp('');
                                                    setOtp('');
                                                }}
                                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                            >
                                                Edit Number
                                            </button>
                                        </div>
                                        <input
                                            id="otp"
                                            name="otp"
                                            type="text"
                                            maxLength="6"
                                            required
                                            autoFocus
                                            className="block w-full px-4 py-3.5 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent rounded-2xl sm:text-sm tracking-[0.4em] text-center font-black"
                                            placeholder="Enter 6-digit OTP"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        />
                                        <div className="flex justify-end pt-1">
                                            <button
                                                type="button"
                                                disabled={timer > 0 || sendingOtp}
                                                onClick={handleSendOtp}
                                                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                                                    timer > 0 || sendingOtp
                                                        ? 'text-gray-400 cursor-not-allowed'
                                                        : 'text-primary hover:text-red-700'
                                                }`}
                                            >
                                                {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
                                            </button>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        type="submit"
                                        disabled={verifyingOtp || otp.length < 6}
                                        className={`w-full flex justify-center py-3.5 px-4 text-xs font-black uppercase tracking-widest rounded-2xl text-white transition-all shadow-lg ${
                                            verifyingOtp || otp.length < 6
                                                ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed shadow-none'
                                                : 'bg-primary hover:bg-red-600 shadow-red-500/10 hover:shadow-red-500/20'
                                        }`}
                                    >
                                        {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                                    </motion.button>
                                </form>
                            )}
                        </motion.div>
                    ) : (
                        /* Traditional Email & Password Login View */
                        <motion.form
                            key="email-login"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="space-y-6"
                            onSubmit={handleEmailSubmit}
                        >
                            <div className="space-y-4 text-left">
                                <div>
                                    <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Email Address</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="mt-1 block w-full px-4 py-3.5 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent rounded-2xl sm:text-sm"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Password</label>
                                        <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Forgot?</Link>
                                    </div>
                                    <div className="relative mt-1">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            className="block w-full px-4 py-3.5 pr-12 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent rounded-2xl sm:text-sm"
                                            placeholder="Enter password"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                        >
                                            {showPassword ? '👁️' : '🕶️'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                type="submit"
                                disabled={emailLoading}
                                className={`w-full flex justify-center py-3.5 px-4 text-xs font-black uppercase tracking-widest rounded-2xl text-white transition-all shadow-lg ${
                                    emailLoading
                                        ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed shadow-none'
                                        : 'bg-primary hover:bg-red-600 shadow-red-500/10 hover:shadow-red-500/20'
                                }`}
                            >
                                {emailLoading ? 'Signing In...' : 'Sign In'}
                            </motion.button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Footer Selection Links */}
                {!twoFactorRequired && (
                    <div className="mt-8 text-center space-y-4">
                        {!usePasswordLogin ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setUsePasswordLogin(true);
                                    setOtpSent(false);
                                    setDevOtp('');
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary dark:text-gray-400 transition-colors"
                            >
                                Or login with Email & Password
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setUsePasswordLogin(false)}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary dark:text-gray-400 transition-colors"
                            >
                                Or login with Mobile OTP
                            </button>
                        )}

                        <div className="w-full border-t border-gray-100 dark:border-gray-800 my-2"></div>
                        <Link to="/" className="inline-flex items-center space-x-1.5 text-[10px] font-black text-gray-400 hover:text-gray-650 dark:hover:text-gray-300 uppercase tracking-widest transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                            <span>Back to Home Feed</span>
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Login;
