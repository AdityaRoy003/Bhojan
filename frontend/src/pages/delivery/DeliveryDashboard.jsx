import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import socket, { connectSocket, disconnectSocket, joinTrackingRoom, emitRiderLocation } from '../../utils/socket';
import LiveTrackingMap from '../../components/LiveTrackingMap';

const DeliveryDashboard = () => {
    const { user } = useSelector(state => state.user);
    const [isOnline, setIsOnline] = useState(false);
    const [availableOrders, setAvailableOrders] = useState([]);
    const [myDeliveries, setMyDeliveries] = useState([]);
    const [activeTab, setActiveTab] = useState('find'); // find | active | earnings | profile
    const [stats, setStats] = useState({ balance: 0, totalEarnings: 0, todaysEarnings: 0, completedDeliveries: 0, rating: 5 });
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState(null);
    const [newOrderAlert, setNewOrderAlert] = useState(null);
    const [weather, setWeather] = useState({ temp: 32, condition: 'Sunny', warning: null });
    const [hotZones, setHotZones] = useState([]);
    const [milestoneCelebration, setMilestoneCelebration] = useState(null);

    // New State for Extra Features
    const [language, setLanguage] = useState(user?.deliverySpecs?.language || 'English');
    const [profileStrength, setProfileStrength] = useState(0);
    const [kycData, setKycData] = useState(user?.deliverySpecs?.kyc || { aadhaar: '', pan: '', dl: '', status: 'Not Started' });
    const [vehicleData, setVehicleData] = useState(user?.deliverySpecs?.vehicle || { model: '', number: '', vehicleType: 'Bike', mileage: 0 });
    const [wellness, setWellness] = useState(user?.deliverySpecs?.health || { dailySteps: 0, waterIntake: 0 });

    const translations = {
        English: {
            title: "Delivery Hub",
            find: "Find",
            active: "Active",
            earnings: "Earnings",
            stats: "Stats",
            kyc: "KYC & Verification",
            vehicle: "My Vehicle",
            wellness: "Health & Wellness",
            planner: "Smart Shift Planner",
            online: "Accepting Orders",
            offline: "Offline"
        },
        Bhojpuri: {
            title: "डिलिवरी हब",
            find: "खोजल जाए",
            active: "सक्रिय",
            earnings: "कमाई",
            stats: "आँकड़ा",
            kyc: "पहचान पत्र वेरिफिकेशन",
            vehicle: "हमर गाड़ी",
            wellness: "स्वास्थ अउर सेहत",
            planner: "स्मार्ट शिफ्ट प्लानर",
            online: "आर्डर लेबे खातिर तैयार",
            offline: "ऑफलाइन"
        },
        Maithili: {
            title: "डिलिवरी हब",
            find: "खोजल जाए",
            active: "सक्रिय",
            earnings: "कमाई",
            stats: "आँकड़ा",
            kyc: "पहचान पत्र सत्यापन",
            vehicle: "हमर गाड़ी",
            wellness: "स्वास्थ्य एवं कल्याण",
            planner: "स्मार्ट शिफ्ट योजना",
            online: "आर्डर लेबा लेल तैयार",
            offline: "ऑफलाइन"
        }
    };

    const t = translations[language];

    const calculateProfileStrength = () => {
        let score = 0;
        if (user?.fullname) score += 20;
        if (kycData.aadhaar) score += 20;
        if (kycData.pan) score += 20;
        if (kycData.dl) score += 20;
        if (vehicleData.model) score += 20;
        setProfileStrength(score);
    };

    useEffect(() => {
        calculateProfileStrength();
    }, [kycData, vehicleData, user]);

    const checkMilestones = (newBalance) => {
        if (newBalance >= 500 && stats.balance < 500) {
            setMilestoneCelebration("₹500 Milestone reached! You're on fire! 🔥");
            setTimeout(() => setMilestoneCelebration(null), 5000);
        }
    };

    const fetchWeather = async (coords) => {
        const isSpicyWeather = coords.lat > 20;
        if (isSpicyWeather) {
            setWeather({ temp: 38, condition: 'Extreme Heat', warning: 'Stay hydrated! Take 5 min breaks every hour.' });
        } else {
            setWeather({ temp: 24, condition: 'Pleasant', warning: null });
        }
    };

    const fetchData = async () => {
        try {
            const availRes = await api.get('/order/delivery/available');
            if (availRes.data.success) {
                setAvailableOrders(availRes.data.orders);
                const zoneCounts = availRes.data.orders.reduce((acc, o) => {
                    const zone = o.shop?.city || 'Central';
                    acc[zone] = (acc[zone] || 0) + 1;
                    return acc;
                }, {});
                setHotZones(Object.entries(zoneCounts).sort((a, b) => b[1] - a[1]).slice(0, 3));
            }

            const myRes = await api.get('/order/delivery/my');
            if (myRes.data.success) {
                setMyDeliveries(myRes.data.orders);

                const statsRes = await api.get('/delivery/stats');
                if (statsRes.data.success) {
                    setStats(statsRes.data.stats);
                    checkMilestones(statsRes.data.stats.balance);
                }
            }
        } catch (error) {
            console.error("Failed to fetch delivery data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?._id) {
            connectSocket(user._id);
            socket.on('delivery_alert', (data) => {
                setNewOrderAlert(data);
                fetchData();
                setTimeout(() => setNewOrderAlert(null), 10000);
            });
        }
        return () => {
            socket.off('delivery_alert');
        };
    }, [user]);

    useEffect(() => {
        if (!isOnline) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, heading, speed } = pos.coords;
                setLocation({ lat: latitude, lng: longitude, heading: heading || 0, speed: speed || 0 });

                // Get active OutForDelivery orders
                const activeOrderIds = myDeliveries
                    .filter(o => o.orderStatus === 'OutForDelivery')
                    .map(o => o._id);

                // Emit location update to socket for each active order (customers tracking)
                activeOrderIds.forEach(orderId => {
                    joinTrackingRoom(orderId);
                    emitRiderLocation({ orderId, latitude, longitude, heading: heading || 0, speed: speed || 0 });
                    // Also persist to DB via tracking endpoint
                    api.put(`/tracking/${orderId}/location`, { latitude, longitude, heading: heading || 0, speed: speed || 0 })
                        .catch(err => console.error('Location persist failed:', err));
                });

                fetchWeather({ lat: latitude, lng: longitude });
            },
            (err) => console.error('GPS error:', err),
            { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [isOnline, myDeliveries]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    const toggleOnline = async () => {
        try {
            const { data } = await api.put('/delivery/toggle-online');
            if (data.success) setIsOnline(data.isOnline);
        } catch (error) {
            alert("Failed to toggle status");
        }
    };

    const handleUpdateProfile = async (field, value) => {
        try {
            const payload = {};
            if (['aadhaar', 'pan', 'dl'].includes(field)) payload.kyc = { [field]: value };
            else if (['model', 'number', 'vehicleType', 'mileage'].includes(field)) payload.vehicle = { [field]: value };
            else if (field === 'language') {
                payload.language = value;
                setLanguage(value);
            }

            const { data } = await api.put('/delivery/profile', payload);
            if (data.success) {
                if (payload.kyc) setKycData(prev => ({ ...prev, ...payload.kyc }));
                if (payload.vehicle) setVehicleData(prev => ({ ...prev, ...payload.vehicle }));
            }
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const handleUpdateWellness = async (field, value) => {
        try {
            const newValue = wellness[field] + value;
            const { data } = await api.put('/delivery/wellness', { [field]: newValue });
            if (data.success) setWellness(prev => ({ ...prev, [field]: newValue }));
        } catch (error) {
            console.error("Wellness update failed", error);
        }
    };

    const handleAcceptOrder = async (orderId) => {
        try {
            await api.put(`/order/${orderId}/accept`);
            fetchData();
            setActiveTab('active');
        } catch (error) {
            alert(error.response?.data?.message || "Failed to accept order");
        }
    };

    const handleCompleteDelivery = async (orderId) => {
        try {
            await api.put(`/delivery/complete/${orderId}`);
            fetchData();
            alert("Delivery successful! Commission added to balance.");
        } catch (error) {
            alert("Failed to complete delivery");
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/order/${orderId}/status`, { status: newStatus });
            fetchData();
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8 font-inter relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-200/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full"></div>

            <div className="max-w-4xl mx-auto relative z-10">

                <AnimatePresence>
                    {newOrderAlert && (
                        <motion.div
                            initial={{ opacity: 0, y: -100, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
                        >
                            <div className="bg-amber-500/90 backdrop-blur-xl text-white p-5 rounded-3xl shadow-[0_20px_50px_rgba(245,158,11,0.3)] flex items-center justify-between border border-white/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl animate-bounce">🥡</div>
                                    <div>
                                        <p className="font-black text-sm uppercase tracking-tighter">New Pickup Ready! 🔥</p>
                                        <p className="text-xs font-bold opacity-90">{newOrderAlert.shopName} is waiting</p>
                                    </div>
                                </div>
                                <button onClick={() => { setActiveTab('find'); setNewOrderAlert(null); }} className="bg-white text-amber-600 px-4 py-2 rounded-xl font-black text-xs shadow-lg hover:scale-105 transition-transform">VIEW ⚡</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white/70 backdrop-blur-md p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40"
                >
                    <div className="text-center md:text-left mb-6 md:mb-0">
                        <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{t.title} <span className="text-amber-500">🚚</span></h1>
                        </div>
                        <p className="text-gray-500 font-semibold text-sm flex items-center gap-2 justify-center md:justify-start">
                            {user?.fullname}
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="text-amber-500 flex items-center gap-0.5">⭐ {stats.rating}</span>
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="bg-amber-500 text-white px-6 py-3 rounded-2xl shadow-[0_10px_20px_rgba(245,158,11,0.2)] text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Wallet Balance</p>
                            <p className="text-2xl font-black">₹{stats.balance.toFixed(0)}</p>
                        </div>
                        <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm px-4 py-3 rounded-2xl border border-gray-100">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                                {isOnline ? t.online : t.offline}
                            </span>
                            <button onClick={toggleOnline} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${isOnline ? 'bg-green-500' : 'bg-gray-200'}`}>
                                <motion.span
                                    animate={{ x: isOnline ? 24 : 4 }}
                                    className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm"
                                />
                            </button>
                        </div>
                    </div>
                </motion.header>

                <div className="flex space-x-2 mb-8 bg-white/50 backdrop-blur-sm p-2 rounded-3xl shadow-sm border border-white/40 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'find', icon: '🔍', label: t.find },
                        { id: 'active', icon: '📦', label: `${t.active}` },
                        { id: 'earnings', icon: '💰', label: t.earnings },
                        { id: 'profile', icon: '👤', label: t.stats }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-[90px] flex flex-col justify-center items-center py-4 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all duration-500 relative ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-amber-500 rounded-2xl shadow-lg shadow-amber-200"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="text-xl mb-1 relative z-10">{tab.icon}</span>
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {activeTab === 'find' && (
                            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                                <motion.div variants={itemVariants} className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-black text-xl flex items-center gap-2">
                                                <span className="bg-amber-500 p-2 rounded-xl text-lg">🗺️</span> {t.planner}
                                            </h3>
                                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-green-500/20 animate-pulse">Live</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                            <div className="bg-white/5 p-5 rounded-3xl border border-white/10 backdrop-blur-xl group-hover:bg-white/10 transition-colors">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2 tracking-widest">Top Hotzone</p>
                                                <p className="text-2xl font-black text-amber-400">{hotZones[0]?.[0] || 'Mithila Market'}</p>
                                                <div className="flex items-center gap-1 mt-2">
                                                    <span className="text-green-400 text-xs">↑</span>
                                                    <span className="text-[10px] text-gray-400 font-bold">Orders spiking now</span>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 p-5 rounded-3xl border border-white/10 backdrop-blur-xl group-hover:bg-white/10 transition-colors">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2 tracking-widest">Best Time</p>
                                                <p className="text-2xl font-black text-blue-400">07:00 PM</p>
                                                <div className="flex items-center gap-1 mt-2">
                                                    <span className="text-blue-400 text-xs text-[10px]">⏰</span>
                                                    <span className="text-[10px] text-gray-400 font-bold">Predicted dinner rush</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-amber-500/10 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold text-amber-200/80 border border-amber-500/10">
                                            <span className="text-xl">💡</span>
                                            "High demand expected near Chhath Puja ghats today! Stay ready."
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[120px] -mr-40 -mt-20 group-hover:bg-amber-500/20 transition-all duration-700"></div>
                                </motion.div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <h2 className="text-xl font-black text-gray-900 tracking-tight text-uppercase">Pickups Nearby</h2>
                                        <span className="text-xs font-bold text-gray-400">{availableOrders.filter(o => o.orderStatus === 'Ready').length} Available</span>
                                    </div>

                                    <AnimatePresence mode="popLayout">
                                        {availableOrders.filter(o => o.orderStatus === 'Ready').length === 0 ? (
                                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-20 bg-white rounded-[40px] shadow-sm border border-gray-100">
                                                <div className="text-6xl mb-4 grayscale opacity-20">🥡</div>
                                                <h3 className="text-xl font-bold text-gray-400 tracking-tight">No hungry customers yet!</h3>
                                                <p className="text-gray-300 text-sm mt-1">Orders appear here as soon as they're ready.</p>
                                            </motion.div>
                                        ) : (
                                            availableOrders.filter(o => o.orderStatus === 'Ready').map(order => (
                                                <motion.div
                                                    layout
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    exit={{ scale: 0.9, opacity: 0 }}
                                                    key={order._id}
                                                    className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all group relative overflow-hidden"
                                                >
                                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 relative z-10">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-4 mb-4">
                                                                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">🏪</div>
                                                                <div>
                                                                    <h3 className="font-black text-xl text-gray-900 group-hover:text-amber-600 transition-colors tracking-tight">{order.shop?.name}</h3>
                                                                    <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                                                                        <span className="text-amber-500">📍</span> {order.shop?.city}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {order.items.slice(0, 3).map((item, i) => (
                                                                    <span key={i} className="bg-gray-50 text-[10px] font-black text-gray-500 px-3 py-1.5 rounded-xl border border-gray-100">
                                                                        {item.quantity}× {item.name}
                                                                    </span>
                                                                ))}
                                                                {order.items.length > 3 && <span className="bg-gray-50 text-[10px] font-black text-gray-400 px-3 py-1.5 rounded-xl">+{order.items.length - 3} more</span>}
                                                            </div>
                                                        </div>
                                                        <div className="w-full md:w-auto flex flex-row md:flex-col justify-between items-center md:items-end gap-4 min-w-[120px]">
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Commission</p>
                                                                <span className="text-3xl font-black text-green-600 tracking-tight">₹{(order.totalAmount * 0.1).toFixed(0)}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleAcceptOrder(order._id)}
                                                                className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-amber-500 transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95"
                                                            >
                                                                Accept ⚡
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'active' && (
                            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                                <div className="flex justify-between items-center px-2">
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight text-uppercase">Active Deliveries</h2>
                                    <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black">{myDeliveries.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').length} Ongoing</div>
                                </div>

                                {myDeliveries.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').map(order => (
                                    <motion.div variants={itemVariants} key={order._id} className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 relative overflow-hidden group">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center text-3xl shadow-xl shadow-slate-200">📦</div>
                                                <div>
                                                    <h3 className="font-black text-xl text-gray-900 leading-none mb-1 tracking-tight">#{order._id.slice(-6)}</h3>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                                        <p className="text-xs font-black text-amber-600 uppercase tracking-widest">{order.orderStatus}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto justify-end">
                                                <a href={`tel:${order.user?.mobile}`} className="flex-1 sm:flex-none h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">📞</a>
                                                <button onClick={() => alert("SOS Triggered! Location shared.")} className="flex-1 sm:flex-none h-12 w-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm">🆘</button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                            <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100 group-hover:bg-amber-50/50 transition-colors">
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">From Restaurant</p>
                                                <p className="text-sm font-black text-gray-800 tracking-tight">{order.shop?.name}</p>
                                                <p className="text-xs font-bold text-gray-500 mt-1">{order.shop?.address}</p>
                                            </div>
                                            <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100 group-hover:bg-indigo-50/50 transition-colors">
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">To Customer</p>
                                                <p className="text-sm font-black text-gray-800 tracking-tight">{order.user?.fullname}</p>
                                                <p className="text-xs font-bold text-gray-500 mt-1">{order.deliveryAddress}</p>
                                            </div>
                                        </div>

                                        {/* Navigation Map — shown when OutForDelivery */}
                                        {order.orderStatus === 'OutForDelivery' && (
                                            <div className="mb-6 rounded-[28px] overflow-hidden border border-gray-100 shadow-inner relative" style={{ height: '260px' }}>
                                                <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
                                                    <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                                        Navigation
                                                    </div>
                                                    {location?.speed > 0 && (
                                                        <div className="bg-amber-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black">
                                                            {(location.speed * 3.6).toFixed(0)} km/h
                                                        </div>
                                                    )}
                                                </div>
                                                <LiveTrackingMap
                                                    mode="rider"
                                                    riderPosition={location ? [location.lat, location.lng] : null}
                                                    restaurantCoords={order.restaurantCoords?.lat ? order.restaurantCoords : null}
                                                    deliveryCoords={order.deliveryCoords?.lat ? order.deliveryCoords : null}
                                                    riderHeading={location?.heading || 0}
                                                    riderName="You"
                                                    shopName={order.shop?.name}
                                                    deliveryAddress={order.deliveryAddress}
                                                    liveMode={isOnline}
                                                    height="100%"
                                                />
                                            </div>
                                        )}

                                        {/* Directions strip */}
                                        {order.orderStatus === 'OutForDelivery' && location && (
                                            <div className="mb-6 bg-slate-900 rounded-[24px] p-4 flex items-center gap-4 text-white">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                                    <span className="text-2xl" style={{ transform: `rotate(${location.heading || 0}deg)`, display: 'inline-block' }}>↑</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-black uppercase tracking-widest text-amber-400">En Route</p>
                                                    <p className="text-sm font-bold text-gray-300 truncate">{order.deliveryAddress}</p>
                                                </div>
                                                <a
                                                    href={order.deliveryCoords?.lat
                                                        ? `https://maps.google.com/?q=${order.deliveryCoords.lat},${order.deliveryCoords.lng}`
                                                        : `https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                                                >
                                                    <span>🗺️</span> Open Maps
                                                </a>
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            {(order.orderStatus === 'Preparing' || order.orderStatus === 'Ready') ? (
                                                <button onClick={() => handleUpdateStatus(order._id, 'OutForDelivery')} className="flex-1 bg-gray-900 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-amber-600 transition-all active:scale-95">Pick Up Order ⚡</button>
                                            ) : order.orderStatus === 'OutForDelivery' ? (
                                                <button onClick={() => handleCompleteDelivery(order._id)} className="flex-1 bg-green-600 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-green-700 transition-all active:scale-95">Complete Delivery ✅</button>
                                            ) : null}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {activeTab === 'earnings' && (
                            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                                <h2 className="text-xl font-black text-gray-900 tracking-tight text-uppercase px-2">Performance</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <motion.div variants={itemVariants} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-between group">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">📈</div>
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black">+12% vs expected</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Today's Profit</p>
                                            <p className="text-5xl font-black text-gray-900 tracking-tighter">₹{stats.todaysEarnings}</p>
                                        </div>
                                    </motion.div>
                                    <motion.div variants={itemVariants} className="bg-indigo-600 p-8 rounded-[40px] shadow-2xl text-white relative overflow-hidden group">
                                        <div className="relative z-10 h-full flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-8">
                                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🏦</div>
                                                <div className="h-6 w-12 bg-green-400 rounded-full flex items-center p-1 cursor-pointer">
                                                    <div className="h-4 w-4 bg-white rounded-full ml-auto shadow-sm"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black opacity-60 uppercase tracking-widest mb-1">Savings Jar</p>
                                                <p className="text-5xl font-black tracking-tighter">₹{(stats.totalEarnings * 0.1).toFixed(0)}</p>
                                                <p className="text-[10px] font-bold mt-2 opacity-80">10% of every delivery auto-saved</p>
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -mr-32 -mt-32"></div>
                                    </motion.div>
                                </div>
                                <motion.div variants={itemVariants} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                                    <h3 className="font-black text-gray-900 mb-6 uppercase tracking-widest text-xs">Recent History</h3>
                                    <div className="space-y-4">
                                        {myDeliveries.filter(o => o.orderStatus === 'Delivered').slice(0, 4).map(o => (
                                            <div key={o._id} className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg">💰</div>
                                                    <div>
                                                        <p className="font-black text-sm text-gray-800 tracking-tight">Delivery Reward</p>
                                                        <p className="text-[10px] font-bold text-gray-400">{new Date(o.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • #{o._id.slice(-4)}</p>
                                                    </div>
                                                </div>
                                                <span className="font-black text-green-600">+₹{(o.totalAmount * 0.1).toFixed(0)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        {activeTab === 'profile' && (
                            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                                <div className="bg-white p-10 rounded-[48px] shadow-sm border border-gray-100 flex flex-col items-center">
                                    <div className="relative group mb-6">
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[40px] shadow-2xl shadow-orange-200 flex items-center justify-center border-4 border-white overflow-hidden"
                                        >
                                            <span className="text-5xl font-black text-white">{user?.fullname?.charAt(0)}</span>
                                        </motion.div>
                                        <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white h-8 w-8 rounded-full shadow-lg"></div>
                                    </div>
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter mb-1">{user?.fullname}</h3>
                                    <p className="text-gray-400 font-bold mb-8 uppercase tracking-widest text-[10px]">Prime Delivery Partner</p>

                                    <div className="w-full max-w-sm">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile Completion</span>
                                            <span className="text-sm font-black text-amber-600">{profileStrength}%</span>
                                        </div>
                                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-50 p-1">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${profileStrength}%` }}
                                                className="h-full bg-amber-500 rounded-full shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <motion.div variants={itemVariants} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 group">
                                        <h4 className="font-black text-xs text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                            <span className="w-8 h-8 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-sm group-hover:scale-110 transition-transform">🧘</span> {t.wellness}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-blue-50 p-6 rounded-[32px] text-center border border-blue-100/50 hover:bg-blue-100/50 transition-colors">
                                                <p className="text-[9px] font-black text-blue-400 uppercase mb-3">Hydration</p>
                                                <div className="flex items-center justify-center gap-3">
                                                    <span className="text-3xl font-black text-blue-700 leading-none">{wellness.waterIntake}</span>
                                                    <button onClick={() => handleUpdateWellness('waterIntake', 1)} className="w-8 h-8 bg-blue-600 text-white rounded-xl font-black text-lg shadow-lg shadow-blue-200 active:scale-90 transition-transform">+</button>
                                                </div>
                                                <p className="text-[9px] font-bold text-blue-300 mt-2 uppercase">Glasses</p>
                                            </div>
                                            <div className="bg-green-50 p-6 rounded-[32px] text-center border border-green-100/50 hover:bg-green-100/50 transition-colors">
                                                <p className="text-[9px] font-black text-green-400 uppercase mb-3">Activity</p>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-2xl font-black text-green-700 leading-none">{wellness.dailySteps}</span>
                                                    <button onClick={() => handleUpdateWellness('dailySteps', 100)} className="mt-2 text-[8px] font-black text-green-700 bg-white px-2 py-1 rounded-lg border border-green-100">+100</button>
                                                </div>
                                                <p className="text-[9px] font-bold text-green-300 mt-2 uppercase">Steps</p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 group">
                                        <h4 className="font-black text-xs text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                            <span className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center text-sm group-hover:scale-110 transition-transform">🌐</span> Language
                                        </h4>
                                        <div className="flex flex-col gap-2">
                                            {['English', 'Bhojpuri', 'Maithili'].map(lang => (
                                                <button
                                                    key={lang}
                                                    onClick={() => handleUpdateProfile('language', lang)}
                                                    className={`w-full py-3.5 px-6 rounded-2xl text-[10px] font-black transition-all border flex items-center justify-between group/btn ${language === lang ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-white hover:border-indigo-100 hover:text-indigo-400'}`}
                                                >
                                                    {lang}
                                                    {language === lang && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>✨</motion.span>}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                </div>

                                <motion.div variants={itemVariants} className="bg-slate-900 p-8 rounded-[40px] shadow-2xl group flex flex-col sm:flex-row items-center gap-6 border border-white/5">
                                    <div className="h-20 w-20 bg-amber-500 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-amber-500/20 group-hover:rotate-12 transition-transform duration-500">🤝</div>
                                    <div className="text-center sm:text-left flex-1">
                                        <h4 className="text-white font-black text-xl tracking-tight mb-1">Invite a Buddy</h4>
                                        <p className="text-gray-400 text-xs font-bold leading-none mb-4 tracking-tight">Earn ₹200 for every rider you refer to Bhojan!</p>
                                        <div className="flex bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
                                            <code className="flex-1 font-mono text-sm text-amber-400 flex items-center px-4 font-black">{user?.referralCode || 'RIDER_X'}</code>
                                            <button onClick={() => alert("Copied!")} className="bg-white text-slate-900 px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-amber-500 hover:text-white transition-colors">Copy</button>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DeliveryDashboard;
