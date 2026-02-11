import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../utils/api';
import { setUser, setError } from '../redux/userSlice';
import { motion } from 'framer-motion';

const Signup = () => {
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        password: '',
        mobile: '',
        role: 'Customer'
    });
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/signup', formData);
            if (data.success) {
                dispatch(setUser(data.user));
                navigate('/');
            }
        } catch (error) {
            console.error(error);
            dispatch(setError(error.response?.data?.message || 'Signup failed'));
            alert(error.response?.data?.message || 'Signup failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1543353071-87ddb03fe793?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full space-y-8 bg-white/95 p-8 rounded-2xl shadow-2xl relative z-10"
            >
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">Join Bhojan</h2>
                    <p className="mt-2 text-sm text-gray-600">Create account to start ordering</p>
                </div>
                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <motion.div whileFocus={{ scale: 1.02 }}>
                            <input
                                name="fullname"
                                type="text"
                                required
                                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Full Name"
                                value={formData.fullname}
                                onChange={handleChange}
                            />
                        </motion.div>
                        <motion.div whileFocus={{ scale: 1.02 }}>
                            <input
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </motion.div>
                        <motion.div whileFocus={{ scale: 1.02 }}>
                            <input
                                name="mobile"
                                type="text"
                                required
                                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Mobile Number"
                                value={formData.mobile}
                                onChange={handleChange}
                            />
                        </motion.div>
                        <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors z-20"
                            >
                                {showPassword ? '👁️' : '🕶️'}
                            </button>
                        </motion.div>
                        <div className="mt-2 text-left">
                            <label className="text-gray-700 text-sm font-bold mb-2 ml-1" htmlFor="role">
                                I am a:
                            </label>
                            <select
                                name="role"
                                className="appearance-none w-full bg-gray-50 border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="Customer">Customer</option>
                                <option value="Owner">Restaurant Owner</option>
                                <option value="Delivery">Delivery Partner</option>
                            </select>
                        </div>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-full text-white bg-primary hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg transition-all">
                            Create Account
                        </button>
                    </motion.div>
                </form>
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account? <Link to="/login" className="font-bold text-primary hover:text-red-500 transition-colors">Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
