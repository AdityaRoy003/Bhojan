import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useSelector } from 'react-redux';

const VirtualBrandManager = () => {
    const { user } = useSelector(state => state.user);
    const [virtualBrands, setVirtualBrands] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        logo: '',
        cuisineType: ''
    });

    useEffect(() => {
        if (user?.shop) {
            fetchVirtualBrands();
        }
    }, [user]);

    const fetchVirtualBrands = async () => {
        try {
            const { data } = await api.get(`/cloud-kitchen/virtual-brands/${user.shop}`);
            if (data.success) setVirtualBrands(data.virtualBrands);
        } catch (error) {
            console.error('Failed to fetch virtual brands');
        }
    };

    const handleCreateBrand = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/cloud-kitchen/virtual-brand', {
                ...formData,
                parentKitchenId: user.shop
            });
            if (data.success) {
                alert('Virtual brand created successfully!');
                setShowCreateModal(false);
                fetchVirtualBrands();
                setFormData({ name: '', description: '', logo: '', cuisineType: '' });
            }
        } catch (error) {
            alert('Failed to create virtual brand');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-black text-gray-900 flex items-center gap-3"
                    >
                        🏪 Virtual Brand Manager
                    </motion.h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-primary to-orange-500 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition"
                    >
                        + Create Brand
                    </button>
                </div>

                {/* Info Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-[32px] mb-8 border-2 border-indigo-200"
                >
                    <h3 className="font-black text-lg text-gray-900 mb-2">💡 What are Virtual Brands?</h3>
                    <p className="text-sm text-gray-700 font-bold">
                        Run multiple restaurant brands from a single kitchen! Perfect for testing new cuisines, targeting different audiences,
                        or maximizing your kitchen's potential without additional overhead.
                    </p>
                </motion.div>

                {/* Virtual Brands Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {virtualBrands.map((brand, idx) => (
                        <motion.div
                            key={brand._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-[32px] p-6 shadow-xl hover:shadow-2xl transition"
                        >
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-orange-500 mb-4 flex items-center justify-center text-white text-3xl font-black">
                                {brand.logo || '🍽️'}
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">{brand.name}</h3>
                            <p className="text-sm text-gray-600 font-bold mb-4">{brand.description}</p>
                            <div className="flex items-center gap-2">
                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-black">
                                    {brand.cuisineType}
                                </span>
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black">
                                    ✓ Active
                                </span>
                            </div>
                        </motion.div>
                    ))}

                    {virtualBrands.length === 0 && (
                        <div className="col-span-3 text-center py-12 bg-white rounded-[32px] shadow-sm">
                            <p className="text-gray-500 font-bold">No virtual brands yet. Create your first one!</p>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-[40px] p-8 max-w-lg w-full shadow-2xl"
                        >
                            <h2 className="text-2xl font-black text-gray-900 mb-6">Create Virtual Brand</h2>
                            <form onSubmit={handleCreateBrand} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-black text-gray-700 mb-2">Brand Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-primary focus:outline-none font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-black text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-primary focus:outline-none font-bold"
                                        rows="3"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-black text-gray-700 mb-2">Cuisine Type</label>
                                    <input
                                        type="text"
                                        value={formData.cuisineType}
                                        onChange={(e) => setFormData({ ...formData, cuisineType: e.target.value })}
                                        placeholder="e.g., Italian, Chinese, Desserts"
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-primary focus:outline-none font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-black text-gray-700 mb-2">Logo Emoji</label>
                                    <input
                                        type="text"
                                        value={formData.logo}
                                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                        placeholder="🍕"
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-primary focus:outline-none font-bold text-3xl text-center"
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-primary to-orange-500 text-white py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VirtualBrandManager;
