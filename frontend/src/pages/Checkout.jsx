import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../redux/cartSlice';
import { updateUserAddresses } from '../redux/userSlice';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import CheckoutProgress from '../components/CheckoutProgress';

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

    const [paymentMethod, setPaymentMethod] = useState('Online'); // 'Online' or 'COD'
    const [instructions, setInstructions] = useState('');
    const [orderSuccess, setOrderSuccess] = useState(false);

    // Loyalty State
    const [redeemPoints, setRedeemPoints] = useState(false);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponMessage, setCouponMessage] = useState('');

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const deliveryFee = 30;
    const platformFee = 10;
    const taxes = subtotal * 0.05; // 5% GST

    // Points Calculation
    let discountAmount = 0;
    let pointsToUse = 0;

    const orderTotalForCoupon = subtotal + deliveryFee + platformFee + taxes;

    const handleApplyCoupon = async () => {
        try {
            setCouponMessage('');
            const { data } = await api.post('/payment/apply-coupon', {
                code: couponCode,
                orderTotal: subtotal // Discount usually on subtotal, checking requirement... let's do total for simplicity or matching backend logic
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
        // Max discount 10% (after coupon if any? Let's keep them independent for now or apply coupon first)
        // Complexity: If coupon reduces total, points limit might change. 
        // Let's apply coupon discount to total first.

        const totalAfterCoupon = orderTotalForCoupon - couponDiscount;
        const maxDiscount = Math.floor(totalAfterCoupon * 0.1);
        // Points needed (10 pts = ₹1)
        const maxPointsNeeded = maxDiscount * 10;

        pointsToUse = Math.min(user.loyaltyPoints, maxPointsNeeded);
        discountAmount = pointsToUse / 10;
    }

    const total = (subtotal + deliveryFee + platformFee + taxes) - discountAmount - couponDiscount;

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
            alert("Failed to add address");
        }
    };

    const placeOrderBackend = async (paymentDetails = {}) => {
        const orderData = {
            shopId: restaurant._id,
            items: cartItems.map(item => ({
                item: item._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            totalAmount: total,
            paymentMethod,
            instructions,
            address: `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.pincode}`,
            deliveryFee,
            platformFee,
            taxAmount: taxes,
            redeemPoints, // Flag to backend
            couponCode: couponApplied ? couponCode : null,
            couponDiscount,
            ...paymentDetails
        };

        try {
            const { data } = await api.post('/order/place', orderData);
            if (data.success) {
                setOrderSuccess(true);
                dispatch(clearCart());
            }
        } catch (error) {
            alert("Failed to place order. Please try again.");
        }
    };

    const handlePayment = async () => {
        if (!selectedAddress) {
            alert("Please select a delivery address");
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
                alert(`Order creation failed: ${data.message}`);
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
                            orderId: response.razorpay_order_id
                        });
                    } catch (error) {
                        alert("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: user?.fullname,
                    email: user?.email,
                    contact: user?.mobile
                },
                theme: { color: "#e63946" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Payment initialization error:", error);
            const msg = error.response?.data?.message || "Failed to initialize payment modal. Please check your internet or payment keys.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
                    <p className="text-gray-600 mb-8 text-lg">Your delicious meal is being prepared.</p>
                    <button
                        onClick={() => navigate('/profile')}
                        className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 transition"
                    >
                        Track My Order
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12">
            <CheckoutProgress currentStep={2} />
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Address & Payment */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Address Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">1. Delivery Address</h2>
                            <button
                                onClick={() => setShowAddAddress(true)}
                                className="text-primary font-bold text-sm hover:underline"
                            >
                                + Add New Address
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {addresses.map((addr) => (
                                <div
                                    key={addr._id}
                                    onClick={() => setSelectedAddress(addr)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress?._id === addr._id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="text-xl">🏠</span>
                                        {addr.isDefault && <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded uppercase font-bold text-gray-600">Default</span>}
                                    </div>
                                    <p className="mt-2 text-sm text-gray-700 font-medium">{addr.street}</p>
                                    <p className="text-xs text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                                </div>
                            ))}
                        </div>

                        {addresses.length === 0 && (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500 text-sm">No addresses found. Add one to continue.</p>
                            </div>
                        )}
                    </div>

                    {/* Payment Method Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">2. Payment Method</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                onClick={() => setPaymentMethod('Online')}
                                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all ${paymentMethod === 'Online' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'Online' ? 'border-primary' : 'border-gray-300'}`}>
                                    {paymentMethod === 'Online' && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">Online Payment</p>
                                    <p className="text-xs text-gray-500">Razorpay / UPI / Cards</p>
                                </div>
                            </div>
                            <div
                                onClick={() => setPaymentMethod('COD')}
                                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all ${paymentMethod === 'COD' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-primary' : 'border-gray-300'}`}>
                                    {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">Cash on Delivery</p>
                                    <p className="text-xs text-gray-500">Pay when order arrives</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Instructions Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">3. Delivery Instructions</h2>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Add notes for delivery partner (e.g., Gate code, landlord name, call upon arrival)"
                            className="w-full border border-gray-200 p-4 rounded-xl focus:ring-2 ring-primary/20 outline-none h-24 text-sm"
                        ></textarea>
                    </div>
                </div>

                {/* Right: Bill Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm sticky top-24">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b">
                            <img src={restaurant?.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                            <div>
                                <h2 className="font-bold text-gray-900 leading-tight">{restaurant?.name}</h2>
                                <p className="text-xs text-gray-500">{restaurant?.city}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pb-6 border-b border-gray-100">
                            {cartItems.map(item => (
                                <div key={item._id} className="flex justify-between items-center text-sm">
                                    <div className="flex gap-2 items-center">
                                        <span className={`w-3 h-3 border flex items-center justify-center ${item.foodType === 'Veg' ? 'border-green-600' : 'border-red-600'}`}>
                                            <span className={`w-1 h-1 rounded-full ${item.foodType === 'Veg' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                        </span>
                                        <span className="text-gray-700 font-medium">{item.name} x {item.quantity}</span>
                                    </div>
                                    <span className="text-gray-800">₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 pt-6 text-sm text-gray-500">
                            <div className="flex justify-between">
                                <span>Item Total</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery Fee</span>
                                <span>₹{deliveryFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Platform Fee</span>
                                <span>₹{platformFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>GST (5%)</span>
                                <span>₹{taxes.toFixed(2)}</span>
                            </div>

                            {/* Loyalty Redemption Toggle */}
                            {user?.loyaltyPoints > 0 && (
                                <div className="py-2">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={redeemPoints}
                                                onChange={() => setRedeemPoints(!redeemPoints)}
                                                className="w-4 h-4 text-primary rounded focus:ring-primary"
                                            />
                                            <span className="text-gray-700 font-bold group-hover:text-primary transition">Redeem {user.loyaltyPoints} Points</span>
                                        </div>
                                        <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-full">Save ₹{(Math.min(user.loyaltyPoints, Math.floor((subtotal + deliveryFee + platformFee + taxes) * 0.1) * 10) / 10).toFixed(0)}</span>
                                    </label>
                                </div>
                            )}

                            {couponApplied && (
                                <div className="flex justify-between text-blue-600 font-bold">
                                    <span>Coupon Discount</span>
                                    <span>- ₹{couponDiscount.toFixed(2)}</span>
                                </div>
                            )}

                            {redeemPoints && discountAmount > 0 && (
                                <div className="flex justify-between text-green-600 font-bold">
                                    <span>Loyalty Discount</span>
                                    <span>- ₹{discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg text-gray-900 pt-4 border-t border-dashed">
                                <span>Total to Pay</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="mt-6 bg-red-50 p-4 rounded-xl">
                            <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">Safety Policy</p>
                            <p className="text-[10px] text-red-700 leading-tight">By placing this order, you agree to follow safety protocols. No-contact delivery is enabled by default.</p>
                        </div>

                        <button
                            disabled={loading || !selectedAddress}
                            onClick={handlePayment}
                            className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition shadow-lg transform active:scale-95 ${loading || !selectedAddress ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary text-white hover:bg-red-700'}`}
                        >
                            {loading ? 'Processing...' : paymentMethod === 'COD' ? 'Place COD Order' : 'Proceed to Pay'}
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
                            className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl"
                        >
                            <h3 className="text-2xl font-bold mb-6">Add New Address</h3>
                            <div className="space-y-4">
                                <input className="w-full border p-3 rounded-xl focus:ring-2 ring-primary/20 outline-none" placeholder="Street / Area" required value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input className="w-full border p-3 rounded-xl focus:ring-2 ring-primary/20 outline-none" placeholder="City" required value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} />
                                    <input className="w-full border p-3 rounded-xl focus:ring-2 ring-primary/20 outline-none" placeholder="State" required value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} />
                                </div>
                                <input className="w-full border p-3 rounded-xl focus:ring-2 ring-primary/20 outline-none" placeholder="Pincode" required value={newAddress.pincode} onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setShowAddAddress(false)} className="px-6 py-2 text-gray-500 font-bold">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-md">Save Address</button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Checkout;
