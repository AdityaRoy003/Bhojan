import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../redux/cartSlice';
import { updateUserAddresses } from '../redux/userSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import CheckoutProgress from '../components/CheckoutProgress';
import { toast } from 'react-toastify';
import WeatherSurgeBanner from '../components/WeatherSurgeBanner';
import FitBhojanMacroWidget from '../components/FitBhojanMacroWidget';

const DELIVERY_PRESETS = [
    { id: 'leave_at_door', label: 'Leave at Door', icon: '🚪' },
    { id: 'dont_ring_bell', label: "Don't Ring Bell", icon: '🔕' },
    { id: 'call_at_gate', label: 'Call at Gate', icon: '📞' },
    { id: 'hand_to_security', label: 'Hand to Security', icon: '👮' },
    { id: 'contactless', label: 'Contactless Drop-off', icon: '🚫' },
];

const SCHEDULE_SLOTS = [
    '12:30 PM - 01:00 PM (Lunch)',
    '01:30 PM - 02:00 PM',
    '02:30 PM - 03:00 PM',
    '07:30 PM - 08:00 PM (Dinner)',
    '08:30 PM - 09:00 PM',
    '09:30 PM - 10:00 PM',
];

const TIP_OPTIONS = [0, 20, 30, 50, 100];

const Checkout = () => {
    const { cartItems, restaurant } = useSelector((state) => state.cart);
    const { user } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [addresses, setAddresses] = useState(user?.addresses || []);
    const [selectedAddress, setSelectedAddress] = useState(user?.addresses?.find(a => a.isDefault) || null);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({ street: '', city: '', state: '', pincode: '' });
    const [loading, setLoading] = useState(false);

    const location = useLocation();
    const isGroupOrder = location.state?.isGroupOrder || false;
    const partyId = location.state?.partyId || null;

    const [paymentMethod, setPaymentMethod] = useState(isGroupOrder ? 'Split' : 'Online');
    const [instructions, setInstructions] = useState('');
    const [deliveryPreset, setDeliveryPreset] = useState('none');

    // Scheduled Order State
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledDay, setScheduledDay] = useState('Today');
    const [scheduledTime, setScheduledTime] = useState(SCHEDULE_SLOTS[0]);

    // Tipping & Eco Options
    const [tipAmount, setTipAmount] = useState(0);
    const [customTip, setCustomTip] = useState('');
    const [showCustomTip, setShowCustomTip] = useState(false);
    const [optOutCutlery, setOptOutCutlery] = useState(false);

    const [orderSuccess, setOrderSuccess] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState(null);

    // Loyalty State
    const [redeemPoints, setRedeemPoints] = useState(false);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponMessage, setCouponMessage] = useState('');
    const [surgeFee, setSurgeFee] = useState(0);

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const deliveryFee = 30;
    const platformFee = 10;
    const taxes = subtotal * 0.05; // 5% GST

    // Points Calculation
    let discountAmount = 0;
    let pointsToUse = 0;

    const orderTotalForCoupon = subtotal + deliveryFee + platformFee + taxes + tipAmount;

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        try {
            setCouponMessage('');
            const { data } = await api.post('/payment/apply-coupon', {
                code: couponCode,
                orderTotal: subtotal,
                shopId: restaurant._id
            });

            if (data.success) {
                setCouponDiscount(data.discount);
                setCouponApplied(true);
                setCouponMessage(`Coupon ${data.couponCode} applied! You saved ₹${data.discount}`);
            }
        } catch (error) {
            setCouponDiscount(0);
            setCouponApplied(false);
            setCouponMessage(error.response?.data?.message || 'Invalid Coupon');
        }
    };

    if (redeemPoints && user?.loyaltyPoints > 0) {
        const totalAfterCoupon = orderTotalForCoupon - couponDiscount;
        const maxDiscount = Math.floor(totalAfterCoupon * 0.1);
        const maxPointsNeeded = maxDiscount * 10;

        pointsToUse = Math.min(user.loyaltyPoints, maxPointsNeeded);
        discountAmount = pointsToUse / 10;
    }

    const total = Math.max(0, (subtotal + deliveryFee + platformFee + taxes + tipAmount + surgeFee) - discountAmount - couponDiscount);

    useEffect(() => {
        if (cartItems.length === 0 && !orderSuccess) navigate('/cart');
    }, [cartItems, navigate, orderSuccess]);

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/address/add', newAddress);
            if (data.success) {
                setAddresses(data.addresses);
                dispatch(updateUserAddresses(data.addresses));
                setSelectedAddress(data.addresses[data.addresses.length - 1]);
                setShowAddAddress(false);
                setNewAddress({ street: '', city: '', state: '', pincode: '' });
            }
        } catch (error) {
            toast.error("Failed to add address");
        }
    };

    const handleSelectPreset = (id, label) => {
        if (deliveryPreset === id) {
            setDeliveryPreset('none');
        } else {
            setDeliveryPreset(id);
            if (!instructions.includes(label)) {
                setInstructions(prev => prev ? `${prev} • ${label}` : label);
            }
        }
    };

    const handleTipSelect = (val) => {
        setShowCustomTip(false);
        setTipAmount(val);
    };

    const handleCustomTipSubmit = () => {
        const parsed = parseInt(customTip);
        if (!isNaN(parsed) && parsed > 0) {
            setTipAmount(parsed);
        } else {
            setTipAmount(0);
        }
    };

    const placeOrderBackend = async (paymentDetails = {}) => {
        const orderData = {
            shopId: restaurant._id,
            items: cartItems.map(item => ({
                item: item._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                selectedVariant: item.selectedVariant || null,
                selectedAddOns: item.selectedAddOns || [],
                cookingInstructions: item.cookingInstructions || item.note || ''
            })),
            totalAmount: total,
            tipAmount,
            optOutCutlery,
            deliveryPreset,
            isScheduled,
            scheduledSlot: isScheduled ? { date: scheduledDay, time: scheduledTime } : null,
            paymentMethod,
            instructions,
            address: `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.pincode}`,
            deliveryFee,
            platformFee,
            taxAmount: taxes,
            redeemPoints,
            isGroupOrder,
            partyId,
            couponCode: couponApplied ? couponCode : null,
            couponDiscount,
            ...paymentDetails
        };

        try {
            const { data } = await api.post('/order/place', orderData);
            if (data.success) {
                setOrderSuccess(true);
                setCreatedOrderId(data.order._id);
                dispatch(clearCart());
            }
        } catch (error) {
            toast.error("Failed to place order. Please try again.");
        }
    };

    const handlePayment = async () => {
        if (!selectedAddress) {
            toast.warning("Please select a delivery address");
            return;
        }

        setLoading(true);

        if (paymentMethod === 'COD') {
            await placeOrderBackend();
            setLoading(false);
            return;
        }

        try {
            const { data: { key } } = await api.get('/payment/key');
            const { data } = await api.post('/payment/create', { amount: Math.round(total) });

            if (!data.success) {
                toast.error(`Order creation failed: ${data.message}`);
                setLoading(false);
                return;
            }

            const options = {
                key: key,
                amount: data.order.amount,
                currency: "INR",
                name: "Bhojan",
                description: `Order from ${restaurant.name}`,
                order_id: data.order.id,
                handler: async function (response) {
                    try {
                        await api.post('/payment/verify', response);
                        await placeOrderBackend({
                            paymentId: response.razorpay_payment_id,
                            orderId: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        });
                    } catch (error) {
                        toast.error("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: user?.fullname,
                    email: user?.email,
                    contact: user?.mobile
                },
                method: {
                    upi: true,
                    card: true,
                    netbanking: true,
                    wallet: true,
                    paylater: true
                },
                theme: {
                    color: "#f97316"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error(response.error.description || "Payment failed");
            });
            rzp.open();
            setLoading(false);

        } catch (error) {
            console.error("Payment Error:", error);
            toast.error("Could not initiate payment. Falling back to simulated mode.");
            // Dev simulated order placement
            await placeOrderBackend({
                paymentId: 'SIMULATED_PAY_' + Date.now(),
                orderId: 'SIMULATED_ORD_' + Date.now()
            });
            setLoading(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-gray-800 p-8 rounded-3xl max-w-md w-full text-center shadow-xl border border-gray-100 dark:border-gray-700"
                >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                        ✓
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Order Confirmed!</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        {isScheduled
                            ? `Scheduled for ${scheduledDay} at ${scheduledTime}`
                            : 'Your meal is being prepared and will be delivered shortly.'}
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(`/order-tracking/${createdOrderId}`)}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-95 transition-all"
                        >
                            Track Live Order 📍
                        </button>
                        <button
                            onClick={() => navigate('/home')}
                            className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 pt-6 transition-colors">
            <div className="max-w-7xl mx-auto px-4">
                <CheckoutProgress currentStep={3} />
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left 2 Cols: Form Sections */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. Delivery Timing (⚡ Deliver Now vs 📅 Schedule for Later) */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">1. Delivery Timing</h2>
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                                {isScheduled ? 'Scheduled' : 'Instant (30-40 min)'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div
                                onClick={() => setIsScheduled(false)}
                                className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                                    !isScheduled
                                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!isScheduled ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                                    {!isScheduled && <span className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <div>
                                    <p className="font-black text-sm text-gray-800 dark:text-white">⚡ Deliver Now</p>
                                    <p className="text-[10px] text-gray-400">Standard 30–40 mins</p>
                                </div>
                            </div>

                            <div
                                onClick={() => setIsScheduled(true)}
                                className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                                    isScheduled
                                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isScheduled ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                                    {isScheduled && <span className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <div>
                                    <p className="font-black text-sm text-gray-800 dark:text-white">📅 Schedule Later</p>
                                    <p className="text-[10px] text-gray-400">Pick day & time slot</p>
                                </div>
                            </div>
                        </div>

                        {/* Slot Picker */}
                        {isScheduled && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-600 space-y-3"
                            >
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Select Day</label>
                                    <div className="flex gap-2">
                                        {['Today', 'Tomorrow'].map(day => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => setScheduledDay(day)}
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                                    scheduledDay === day
                                                        ? 'bg-orange-500 text-white shadow-md'
                                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Select Delivery Slot</label>
                                    <select
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        {SCHEDULE_SLOTS.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* 2. Delivery Address */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">2. Delivery Address</h2>
                            <button
                                onClick={() => setShowAddAddress(true)}
                                className="text-xs font-black uppercase tracking-wider text-orange-600 hover:text-orange-700 bg-orange-50 dark:bg-orange-950/30 px-3 py-1.5 rounded-full"
                            >
                                + Add Address
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {addresses.map((addr, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedAddress(addr)}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                        selectedAddress?._id === addr._id || (selectedAddress?.street === addr.street && selectedAddress?.pincode === addr.pincode)
                                            ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                                            : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'
                                    }`}
                                >
                                    <p className="font-bold text-gray-800 dark:text-white text-sm">{addr.street}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{addr.city}, {addr.pincode}</p>
                                </div>
                            ))}
                            {addresses.length === 0 && (
                                <p className="text-xs text-gray-400 col-span-2">No address added yet. Click "+ Add Address" above.</p>
                            )}
                        </div>
                    </div>

                    {/* 3. Delivery Instructions & One-Tap Presets */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">3. Delivery Instructions</h2>
                        <p className="text-xs text-gray-400 mb-4">Select quick instructions for rider or write custom notes</p>

                        {/* One-tap preset pills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {DELIVERY_PRESETS.map((p) => {
                                const isSelected = deliveryPreset === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handleSelectPreset(p.id, p.label)}
                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border ${
                                            isSelected
                                                ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                                                : 'bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-orange-300'
                                        }`}
                                    >
                                        <span>{p.icon}</span>
                                        <span>{p.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Add notes for delivery partner (e.g., Gate code, landlord name, call upon arrival)"
                            className="w-full bg-gray-50 dark:bg-gray-700/70 border border-gray-200 dark:border-gray-600 p-4 rounded-2xl focus:ring-2 ring-orange-500/30 outline-none h-20 text-xs text-gray-800 dark:text-white placeholder-gray-400 resize-none transition-all"
                        />
                    </div>

                    {/* 4. Payment Method */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">4. Payment Method</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div
                                onClick={() => setPaymentMethod('Online')}
                                className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-4 transition-all ${
                                    paymentMethod === 'Online'
                                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'Online' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                                    {paymentMethod === 'Online' && <span className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <div>
                                    <p className="font-black text-gray-800 dark:text-white text-sm">Online Payment</p>
                                    <p className="text-[10px] text-gray-400">UPI, Cards, NetBanking, Razorpay</p>
                                </div>
                            </div>

                            <div
                                onClick={() => !isGroupOrder && setPaymentMethod('COD')}
                                className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-4 transition-all ${
                                    paymentMethod === 'COD'
                                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'
                                } ${isGroupOrder ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                                    {paymentMethod === 'COD' && <span className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <div>
                                    <p className="font-black text-gray-800 dark:text-white text-sm">Cash on Delivery</p>
                                    <p className="text-[10px] text-gray-400">Pay when order arrives</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Rider Tip & Eco Toggle */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-5 transition-all">
                        {/* Rider Tip */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                        <span>🏍️ Tip your delivery partner</span>
                                    </h3>
                                    <p className="text-[10px] text-gray-400">100% of your tip goes directly to the partner</p>
                                </div>
                                {tipAmount > 0 && (
                                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full">
                                        ₹{tipAmount} added
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 mt-3">
                                {TIP_OPTIONS.map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => handleTipSelect(val)}
                                        className={`px-4 py-2 rounded-2xl text-xs font-black transition-all border ${
                                            tipAmount === val && !showCustomTip
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                                                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-emerald-400'
                                        }`}
                                    >
                                        {val === 0 ? 'No Tip' : `₹${val}`}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setShowCustomTip(!showCustomTip)}
                                    className={`px-4 py-2 rounded-2xl text-xs font-black transition-all border ${
                                        showCustomTip
                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                                    }`}
                                >
                                    Custom
                                </button>
                            </div>

                            {showCustomTip && (
                                <div className="flex gap-2 mt-3">
                                    <input
                                        type="number"
                                        placeholder="Enter tip in ₹"
                                        value={customTip}
                                        onChange={(e) => setCustomTip(e.target.value)}
                                        className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white w-32 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCustomTipSubmit}
                                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black"
                                    >
                                        Set Tip
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Eco Cutlery Checkbox */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={optOutCutlery}
                                    onChange={(e) => setOptOutCutlery(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <div>
                                    <p className="text-xs font-black text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                                        <span>🌿</span> Don't send plastic cutlery or napkins
                                    </p>
                                    <p className="text-[10px] text-gray-400">Help us reduce disposable plastic waste and support a cleaner planet.</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right 1 Col: Bill Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm sticky top-24 border border-gray-100 dark:border-gray-700 transition-all">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b dark:border-gray-700">
                            <img src={restaurant?.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                            <div className="min-w-0">
                                <h2 className="font-black text-gray-900 dark:text-white leading-tight truncate">{restaurant?.name}</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{restaurant?.city || 'Local'}</p>
                            </div>
                        </div>

                        {/* Order Items with Customization Details */}
                        <div className="space-y-3 pb-6 border-b border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto">
                            {cartItems.map((item, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between items-start text-xs">
                                        <div className="flex gap-2 items-start">
                                            <span className={`w-3 h-3 mt-0.5 border flex items-center justify-center shrink-0 ${item.foodType === 'Veg' ? 'border-green-600' : 'border-red-600'}`}>
                                                <span className={`w-1 h-1 rounded-full ${item.foodType === 'Veg' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                            </span>
                                            <div>
                                                <span className="text-gray-800 dark:text-gray-200 font-bold">{item.name} × {item.quantity}</span>
                                                {item.selectedVariant && (
                                                    <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                                                        {item.selectedVariant.option}
                                                    </p>
                                                )}
                                                {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                                                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400">
                                                        +{item.selectedAddOns.map(a => a.name).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-gray-900 dark:text-white font-bold shrink-0">₹{item.price * item.quantity}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 🥗 FitBhojan Macro Breakdown */}
                        <div className="pt-2">
                            <FitBhojanMacroWidget items={cartItems} compact />
                        </div>

                        {/* 🌧️ Dynamic Weather / Peak Surge */}
                        <div className="pt-2">
                            <WeatherSurgeBanner onSurgeAmountChange={setSurgeFee} />
                        </div>

                        {/* Bill Breakdown */}
                        <div className="space-y-2.5 pt-2 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex justify-between">
                                <span>Item Total</span>
                                <span className="font-bold text-gray-800 dark:text-white">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery Fee</span>
                                <span className="font-bold text-gray-800 dark:text-white">₹{deliveryFee.toFixed(2)}</span>
                            </div>
                            {surgeFee > 0 && (
                                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                                    <span>Weather / Rush Surge</span>
                                    <span>+₹{surgeFee.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Platform Fee</span>
                                <span className="font-bold text-gray-800 dark:text-white">₹{platformFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>GST (5%)</span>
                                <span className="font-bold text-gray-800 dark:text-white">₹{taxes.toFixed(2)}</span>
                            </div>

                            {tipAmount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-bold">
                                    <span>Rider Tip (100% to partner)</span>
                                    <span>+₹{tipAmount.toFixed(2)}</span>
                                </div>
                            )}

                            {/* Coupon Input */}
                            <div className="py-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Coupon Code"
                                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 rounded-xl text-xs uppercase font-bold dark:text-white"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        disabled={couponApplied}
                                    />
                                    {couponApplied ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCouponApplied(false);
                                                setCouponDiscount(0);
                                                setCouponCode('');
                                                setCouponMessage('');
                                            }}
                                            className="px-3 py-1.5 bg-red-100 text-red-600 rounded-xl text-xs font-bold"
                                        >
                                            REMOVE
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleApplyCoupon}
                                            className="px-3 py-1.5 bg-gray-800 dark:bg-gray-700 text-white rounded-xl text-xs font-bold hover:bg-gray-900"
                                        >
                                            APPLY
                                        </button>
                                    )}
                                </div>
                                {couponMessage && (
                                    <p className={`text-[10px] mt-1 ${couponApplied ? 'text-green-600' : 'text-red-500'} font-bold`}>
                                        {couponMessage}
                                    </p>
                                )}
                            </div>

                            {/* Loyalty Redemption Toggle */}
                            {user?.loyaltyPoints > 0 && (
                                <div className="py-1">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={redeemPoints}
                                                onChange={() => setRedeemPoints(!redeemPoints)}
                                                className="w-4 h-4 text-orange-500 rounded dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300 font-bold text-xs">Redeem {user.loyaltyPoints} Points</span>
                                        </div>
                                        <span className="text-green-600 dark:text-green-400 font-bold text-[10px] bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                            Save ₹{discountAmount.toFixed(0)}
                                        </span>
                                    </label>
                                </div>
                            )}

                            {couponApplied && (
                                <div className="flex justify-between text-blue-600 font-bold">
                                    <span>Coupon Discount</span>
                                    <span>-₹{couponDiscount.toFixed(2)}</span>
                                </div>
                            )}

                            {redeemPoints && discountAmount > 0 && (
                                <div className="flex justify-between text-green-600 font-bold">
                                    <span>Loyalty Discount</span>
                                    <span>-₹{discountAmount.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between font-black text-base text-gray-900 dark:text-white pt-4 border-t border-dashed dark:border-gray-700">
                                <span>Total to Pay</span>
                                <span className="text-orange-500 text-lg">₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            disabled={loading || !selectedAddress}
                            onClick={handlePayment}
                            className={`w-full mt-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all ${
                                loading || !selectedAddress
                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-primary text-white hover:opacity-95 shadow-orange-500/20 active:scale-95'
                            }`}
                        >
                            {loading ? 'Processing...' : paymentMethod === 'COD' ? 'Place COD Order' : 'Proceed to Pay →'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Address Modal */}
            <AnimatePresence>
                {showAddAddress && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <motion.form
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onSubmit={handleAddAddress}
                            className="bg-white dark:bg-gray-800 p-8 rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700"
                        >
                            <h3 className="text-xl font-black mb-6 dark:text-white">Add New Address</h3>
                            <div className="space-y-4">
                                <input className="w-full border p-3 rounded-xl text-xs focus:ring-2 ring-primary/20 outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="Street / Area" required value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input className="w-full border p-3 rounded-xl text-xs focus:ring-2 ring-primary/20 outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="City" required value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} />
                                    <input className="w-full border p-3 rounded-xl text-xs focus:ring-2 ring-primary/20 outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="State" required value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} />
                                </div>
                                <input className="w-full border p-3 rounded-xl text-xs focus:ring-2 ring-primary/20 outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="Pincode" required value={newAddress.pincode} onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setShowAddAddress(false)} className="px-5 py-2 text-gray-500 font-bold text-xs">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow-md">Save Address</button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Checkout;
