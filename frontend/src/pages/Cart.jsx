import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateQuantity, removeFromCart, clearCart, updateItemNote, applyCoupon, removeCoupon } from '../redux/cartSlice';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import CheckoutProgress from '../components/CheckoutProgress';
import socket, { connectSocket } from '../utils/socket';
import { toast } from 'react-toastify';

const Cart = () => {
    const { cartItems, restaurant, coupon } = useSelector((state) => state.cart);
    const { isAuthenticated, user } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    // Group Ordering State
    const [groupId, setGroupId] = useState('');
    const [groupMembers, setGroupMembers] = useState({}); // { [userId]: { userName, cartItems, total } }
    const [isGroupMode, setIsGroupMode] = useState(false);
    const [splitType, setSplitType] = useState('individual'); // 'individual', 'equal'
    const [copiedLink, setCopiedLink] = useState(false);

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const deliveryFee = subtotal > 500 ? 0 : 40;
    const gstRate = 0.05;
    const gstAmount = subtotal * gstRate;
    const discount = coupon?.discount || 0;
    const total = subtotal + deliveryFee + gstAmount - discount;

    // Start or Join a Group Ordering Session
    const startGroupSession = (id) => {
        const activeId = id || Math.random().toString(36).substring(2, 9).toUpperCase();
        setGroupId(activeId);
        setIsGroupMode(true);
        if (user?._id) {
            connectSocket(user._id);
        } else {
            socket.connect();
        }
        socket.emit('join_group', activeId);

        // Share initial cart
        socket.emit('update_group_cart', {
            groupId: activeId,
            userId: user?._id || 'guest_' + Math.random().toString(36).substring(2, 6),
            userName: user?.fullname || 'Creator (You)',
            cartItems,
            total
        });
    };

    const leaveGroupSession = () => {
        if (groupId) {
            socket.emit('leave_group', groupId);
        }
        setIsGroupMode(false);
        setGroupId('');
        setGroupMembers({});
    };

    // Auto-join from URL parameter
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const urlGroupId = queryParams.get('groupId');
        if (urlGroupId) {
            startGroupSession(urlGroupId);
        }
    }, [user?._id]);

    // Handle updates & broadcasts
    useEffect(() => {
        if (!isGroupMode || !groupId) return;

        const localUserId = user?._id || 'my_cart';
        // Broadcast local changes to group
        socket.emit('update_group_cart', {
            groupId,
            userId: localUserId,
            userName: user?.fullname || 'Me',
            cartItems,
            total
        });

        const handleGroupCartUpdated = ({ userId, userName, cartItems: remoteCartItems, total: remoteTotal }) => {
            if (userId === localUserId) return;
            setGroupMembers(prev => ({
                ...prev,
                [userId]: { userName, cartItems: remoteCartItems, total: remoteTotal }
            }));
        };

        const handleMemberJoined = () => {
            // Send cart to make sure newcomer knows about us
            socket.emit('update_group_cart', {
                groupId,
                userId: localUserId,
                userName: user?.fullname || 'Me',
                cartItems,
                total
            });
        };

        socket.on('group_cart_updated', handleGroupCartUpdated);
        socket.on('group_member_joined', handleMemberJoined);

        return () => {
            socket.off('group_cart_updated', handleGroupCartUpdated);
            socket.off('group_member_joined', handleMemberJoined);
        };
    }, [cartItems, isGroupMode, groupId, total, user?._id]);

    const groupMembersArray = Object.values(groupMembers);
    const groupCount = 1 + groupMembersArray.length;
    
    const combinedSubtotal = subtotal + groupMembersArray.reduce((acc, m) => 
        acc + m.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), 0);

    const combinedTotal = total + groupMembersArray.reduce((acc, m) => acc + m.total, 0);

    const getSplitBreakdown = () => {
        if (splitType === 'equal') {
            const share = combinedTotal / groupCount;
            const breakdown = [{ name: user?.fullname || 'Me', share, itemsCount: cartItems.length }];
            groupMembersArray.forEach(m => {
                breakdown.push({ name: m.userName, share, itemsCount: m.cartItems.length });
            });
            return breakdown;
        } else {
            const breakdown = [{ name: user?.fullname || 'Me', share: total, itemsCount: cartItems.length }];
            groupMembersArray.forEach(m => {
                breakdown.push({ name: m.userName, share: m.total, itemsCount: m.cartItems.length });
            });
            return breakdown;
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}/cart?groupId=${groupId}`;
        navigator.clipboard.writeText(link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const loyaltyPointsEarning = Math.floor(subtotal / 10);

    useEffect(() => {
        // Fetch smart suggestions from the same shop
        if (restaurant?._id) {
            const fetchSuggestions = async () => {
                try {
                    const { data } = await api.get(`/shop/${restaurant._id}`);
                    if (data.success && data.shop.items) {
                        const existingIds = cartItems.map(i => i._id);
                        const potential = data.shop.items.filter(i => !existingIds.includes(i._id)).slice(0, 4);
                        setSuggestions(potential);
                    }
                } catch (err) {
                    console.error("Failed to fetch suggestions:", err);
                }
            };
            fetchSuggestions();
        }
    }, [restaurant?._id, cartItems.length]);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            const { data } = await api.post('/payment/apply-coupon', { code: couponCode, orderTotal: subtotal });
            if (data.success) {
                dispatch(applyCoupon({ code: data.couponCode, discount: data.discount }));
                setCouponCode('');
                toast.success('Coupon applied successfully!');
            }
        } catch (err) {
            setCouponError(err.response?.data?.message || 'Invalid coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleSaveForLater = async (itemId) => {
        try {
            await api.post('/user-actions/wishlist/toggle', { foodItemId: itemId });
            dispatch(removeFromCart(itemId));
            toast.success('Moved to wishlist!');
        } catch (err) {
            toast.error('Failed to save for later');
        }
    };

    const handleCheckout = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (!['Customer', 'User', 'Admin'].includes(user?.role)) {
            toast.warning(`You are logged in as a ${user.role}. Only Customers can place orders.`);
            return;
        }

        navigate('/checkout');
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl mb-6">🛒</motion.div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Your stomach is empty!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Looks like you haven't added any delicacies yet.</p>
                <Link to="/" className="bg-primary text-white px-8 py-4 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition shadow-xl shadow-red-100 dark:shadow-none">
                    Discover Deliciousness
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-32 transition-colors duration-300">
            {/* Progress Indicator */}
            <CheckoutProgress currentStep={1} />

            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Items & Suggestions */}
                    <div className="flex-1 space-y-6">
                        {/* Restaurant Header */}
                        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-[28px] md:rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 md:gap-4 transition-all">
                            <img src={restaurant?.image} alt={restaurant?.name} className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl object-cover shadow-inner" />
                            <div>
                                <h3 className="font-black text-lg md:text-xl text-gray-900 dark:text-white">{restaurant?.name}</h3>
                                <p className="text-[9px] md:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{restaurant?.city} • {restaurant?.timing?.open} - {restaurant?.timing?.close}</p>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="space-y-4">
                            <AnimatePresence>
                                {cartItems.map((item) => (
                                    <div key={item._id} className="relative overflow-hidden rounded-[28px] md:rounded-[32px]">
                                        {/* Swipe-to-delete background */}
                                        <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6 z-0 rounded-[28px] md:rounded-[32px]">
                                            <span className="text-white font-black text-xs uppercase tracking-widest">Remove</span>
                                        </div>

                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            drag="x"
                                            dragConstraints={{ left: -100, right: 0 }}
                                            onDragEnd={(e, info) => {
                                                if (info.offset.x < -60) {
                                                    dispatch(removeFromCart(item._id));
                                                }
                                            }}
                                            className="bg-white dark:bg-gray-800 p-3 md:p-4 shadow-sm flex gap-3 md:gap-4 items-center group border border-transparent dark:border-gray-700 hover:border-primary/10 transition-all z-10 relative cursor-grab active:cursor-grabbing"
                                        >
                                            <div className="relative shrink-0 pointer-events-none">
                                                <img src={item.image} alt={item.name} className="w-20 h-20 md:w-24 md:h-24 rounded-xl md:rounded-2xl object-cover bg-gray-50" />
                                                {item.foodType && (
                                                    <span className={`absolute top-1 left-1 md:top-2 md:left-2 w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm border-2 ${item.foodType === 'Veg' ? 'border-green-600' : 'border-red-600'} flex items-center justify-center bg-white`}>
                                                        <div className={`w-1 h-1 rounded-full ${item.foodType === 'Veg' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pointer-events-none">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-black text-sm md:text-base text-gray-900 dark:text-white leading-tight truncate">{item.name}</h3>
                                                    <button onClick={() => dispatch(removeFromCart(item._id))} className="text-gray-300 dark:text-gray-600 hover:text-primary transition-colors p-1 pointer-events-auto">🗑️</button>
                                                </div>
                                                <p className="text-[9px] md:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{item.category} • ₹{item.price}</p>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 md:gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-1.5 py-0.5 md:px-2 md:py-1 transition-colors pointer-events-auto">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); dispatch(updateQuantity({ id: item._id, quantity: item.quantity - 1 })) }}
                                                            className="w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg bg-white dark:bg-gray-600 shadow-sm flex items-center justify-center text-xs md:text-sm font-bold hover:bg-primary hover:text-white transition-all"
                                                        >-</button>
                                                        <span className="font-black text-xs md:text-sm w-5 md:w-6 text-center dark:text-white">{item.quantity}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 })) }}
                                                            className="w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg bg-white dark:bg-gray-600 shadow-sm flex items-center justify-center text-xs md:text-sm font-bold hover:bg-primary hover:text-white transition-all"
                                                        >+</button>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSaveForLater(item._id) }}
                                                        className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest hover:underline pointer-events-auto"
                                                    >Save</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Group Items List */}
                        {isGroupMode && groupMembersArray.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2 ml-2">Added by friends</h3>
                                {groupMembersArray.map((member, idx) => (
                                    <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-[28px] md:rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">👤</span>
                                            <span className="font-black text-sm text-gray-900 dark:text-white">{member.userName}'s Cart</span>
                                        </div>
                                        <div className="space-y-2 border-t border-gray-50 dark:border-gray-700/50 pt-2">
                                            {member.cartItems.map((item, itemIdx) => (
                                                <div key={itemIdx} className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                                                    <span className="font-semibold">{item.name} x{item.quantity}</span>
                                                    <span className="font-bold dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                            {member.cartItems.length === 0 && (
                                                <p className="text-[10px] text-gray-400 italic">Cart is empty</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Smart Suggestions */}
                        {suggestions.length > 0 && (
                            <section>
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 ml-2">Other customers added</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {suggestions.map(item => (
                                        <div key={item._id} className="bg-white dark:bg-gray-800 p-3 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                                            <img src={item.image} alt={item.name} className="w-full h-24 rounded-2xl object-cover mb-2" />
                                            <h4 className="font-black text-[10px] text-gray-900 dark:text-white line-clamp-1">{item.name}</h4>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">₹{item.price}</span>
                                                <button
                                                    onClick={() => navigate(`/shop/${restaurant._id}`)}
                                                    className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-white"
                                                >+</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column: Checkout Info */}
                    <div className="w-full lg:w-96 space-y-6">
                        {/* Group Ordering Panel */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
                            <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                                <span>👥</span> Group Ordering
                            </h3>
                            
                            {!isGroupMode ? (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                        Order together with friends in real-time, view their selections, and choose how to split the bill.
                                    </p>
                                    <button
                                        onClick={() => startGroupSession()}
                                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                                    >
                                        Start Group Session
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600">
                                        <p className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Group ID</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="font-mono font-bold text-sm tracking-wider dark:text-white">{groupId}</span>
                                            <button
                                                onClick={copyInviteLink}
                                                className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                            >
                                                {copiedLink ? 'Copied! ✅' : 'Copy Invite'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Active Members list */}
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Active Members ({groupCount})</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-700/40 text-xs">
                                                <span className="font-bold text-gray-700 dark:text-gray-300">🙋‍♂️ You (Creator)</span>
                                                <span className="font-black dark:text-white">₹{total.toFixed(2)}</span>
                                            </div>
                                            {groupMembersArray.map((m, idx) => (
                                                <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-700/40 text-xs">
                                                    <span className="font-semibold text-gray-600 dark:text-gray-400">👤 {m.userName}</span>
                                                    <span className="font-bold dark:text-white">₹{m.total.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bill split selector */}
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Split Strategy</p>
                                        <div className="flex gap-2 bg-gray-50 dark:bg-gray-700/50 p-1 rounded-xl">
                                            <button
                                                onClick={() => setSplitType('individual')}
                                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${splitType === 'individual' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400'}`}
                                            >
                                                Pay Own
                                            </button>
                                            <button
                                                onClick={() => setSplitType('equal')}
                                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${splitType === 'equal' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400'}`}
                                            >
                                                Split Equally
                                            </button>
                                        </div>
                                    </div>

                                    {/* Visualizer Breakdown */}
                                    <div className="bg-indigo-50/30 dark:bg-indigo-950/20 p-3 rounded-2xl border border-indigo-100/50 dark:border-indigo-950/40 space-y-2">
                                        <p className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest">Individual shares</p>
                                        <div className="space-y-1.5">
                                            {getSplitBreakdown().map((b, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs">
                                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{b.name} ({b.itemsCount} items)</span>
                                                    <span className="font-black text-indigo-600 dark:text-indigo-400">₹{b.share.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={leaveGroupSession}
                                        className="w-full text-red-500 hover:text-red-600 text-[10px] font-black uppercase tracking-widest transition-all pt-1 text-center"
                                    >
                                        Leave Session
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Coupon Section */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
                            <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                                <span>🎟️</span> Apply Promo Code
                            </h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter Code"
                                    className="flex-1 bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-widest focus:ring-2 ring-primary/20 outline-none dark:text-white dark:placeholder-gray-500 transition-all"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    disabled={couponLoading || !couponCode}
                                    className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-red-100"
                                >
                                    {couponLoading ? '...' : 'Apply'}
                                </button>
                            </div>
                            {couponError && <p className="text-red-500 text-[10px] font-bold mt-2 ml-2">{couponError}</p>}
                            {coupon && (
                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="mt-4 p-3 bg-green-50 dark:bg-green-900/10 rounded-2xl flex justify-between items-center border border-green-100 dark:border-green-900/30 transition-all">
                                    <div>
                                        <p className="text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-widest">Code Applied: {coupon.code}</p>
                                        <p className="text-green-600 dark:text-green-500 text-[8px] font-bold">Saved ₹{coupon.discount.toFixed(2)}</p>
                                    </div>
                                    <button onClick={() => dispatch(removeCoupon())} className="text-green-700 dark:text-green-400 font-bold text-xs">✕</button>
                                </motion.div>
                            )}
                        </div>

                        {/* Bill Breakdown */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 transition-all">
                            <h3 className="font-black text-xl mb-4 dark:text-white">
                                {isGroupMode ? 'Combined Group Bill' : 'Total Bill'}
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm font-medium">
                                    <span>Subtotal</span>
                                    <span>₹{(isGroupMode ? combinedSubtotal : subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm font-medium">
                                    <span>Delivery Fee</span>
                                    <span className={deliveryFee === 0 ? 'text-green-600 dark:text-green-400' : ''}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
                                </div>
                                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm font-medium">
                                    <span>GST (5%)</span>
                                    <span>₹{((isGroupMode ? combinedSubtotal : subtotal) * gstRate).toFixed(2)}</span>
                                </div>
                                {coupon && (
                                    <div className="flex justify-between text-green-600 text-sm font-bold">
                                        <span>Coupon Discount</span>
                                        <span>- ₹{discount.toFixed(2)}</span>
                                    </div>
                                )}
                                {isGroupMode && (
                                    <div className="pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 flex justify-between text-gray-600 dark:text-gray-400 text-sm font-bold">
                                        <span>Your Share</span>
                                        <span className="text-primary font-black">₹{(getSplitBreakdown().find(b => b.name === 'Me' || b.name.includes('Creator'))?.share || total).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-end transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                            {isGroupMode ? 'Combined Grand Total' : 'To Pay'}
                                        </p>
                                        <p className="text-3xl font-black text-gray-900 dark:text-white">₹{(isGroupMode ? combinedTotal : total).toFixed(2)}</p>
                                    </div>
                                    <div className="bg-amber-50 dark:bg-amber-900/10 px-3 py-1 rounded-full flex items-center gap-1.5 border border-amber-100 dark:border-amber-900/30">
                                        <span className="text-sm">💎</span>
                                        <span className="text-[8px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest">Earn {loyaltyPointsEarning} Pts</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="w-full bg-primary text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-red-700 transition shadow-2xl shadow-red-200 transform active:scale-95 duration-200 group"
                            >
                                {isGroupMode ? 'Proceed with Group Order' : 'Secure Checkout'}
                                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                            </button>

                            <p className="text-[8px] text-gray-400 dark:text-gray-500 text-center font-bold uppercase tracking-widest leading-relaxed">
                                By proceeding, you agree to our <br />
                                <Link to="/terms" className="underline">Terms of Service</Link> & <Link to="/privacy" className="underline">Privacy Policy</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Checkout */}
            <div className="lg:hidden fixed bottom-[92px] left-4 right-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 z-40 shadow-2xl rounded-3xl transition-all">
                <div className="flex items-center justify-between mb-2 px-2">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            {isGroupMode ? 'Combined Total' : 'Grand Total'}
                        </p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">
                            ₹{(isGroupMode ? combinedTotal : total).toFixed(2)}
                        </p>
                    </div>
                    {coupon && <span className="text-[8px] font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full uppercase">Code Applied</span>}
                </div>
                <button
                    onClick={handleCheckout}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-100"
                >
                    {isGroupMode ? 'Proceed with Group Order' : 'Proceed to Payment →'}
                </button>
            </div>
        </div>
    );
};

export default Cart;

