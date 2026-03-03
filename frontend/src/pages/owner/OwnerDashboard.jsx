import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import analytics components
import RevenueChart from '../../components/owner/RevenueChart';
import OrderDistribution from '../../components/owner/OrderDistribution';
import PopularItems from '../../components/owner/PopularItems';
import PeakHours from '../../components/owner/PeakHours';

const OrdersList = ({ shopId }) => {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await api.get('/order/shop');
                if (data.success) setOrders(data.orders);
            } catch (err) { console.error(err); }
        };
        fetchOrders();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/order/${id}/status`, { status });
            setOrders(orders.map(o => o._id === id ? { ...o, orderStatus: status } : o));
            toast.success(`Order status updated to ${status}!`);
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(o => o.orderStatus === filter);

    if (orders.length === 0) return <p className="text-gray-500 dark:text-gray-500 italic">No active orders.</p>;

    return (
        <div>
            {/* Filter buttons */}
            <div className="flex gap-2 mb-4 flex-wrap">
                {['all', 'Placed', 'Preparing', 'OutForDelivery', 'Delivered'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filter === status
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        {status === 'all' ? 'All' : status}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filteredOrders.map(order => (
                    <div key={order._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Order #{order._id.slice(-6)}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{order.user?.fullname}</p>
                            </div>
                            <select
                                value={order.orderStatus}
                                onChange={(e) => updateStatus(order._id, e.target.value)}
                                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm rounded-lg p-1.5 focus:ring-primary focus:border-primary dark:text-white"
                            >
                                <option value="Placed">Placed</option>
                                <option value="Preparing">Preparing</option>
                                <option value="OutForDelivery">Out For Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                            {order.items.map((i, idx) => (
                                <div key={idx} className="flex justify-between font-medium">
                                    <span>{i.quantity} x {i.name}</span>
                                    <span>₹{(i.price * i.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs">
                            <div>
                                <p className="text-gray-400 font-bold uppercase tracking-tighter text-[9px]">Payment</p>
                                <p className="font-bold flex items-center gap-1">
                                    {order.paymentMethod === 'COD' ? '💵' : '💳'} {order.paymentMethod}
                                    {order.isPaid && <span className="text-[9px] bg-green-100 text-green-600 px-1 rounded">Paid</span>}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter text-[9px]">Total</p>
                                <p className="font-bold text-gray-900 dark:text-white">₹{order.totalAmount.toFixed(2)}</p>
                            </div>
                        </div>

                        {order.instructions && (
                            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-[11px] border border-blue-100 dark:border-blue-900/30 italic text-blue-800 dark:text-blue-300">
                                " {order.instructions} "
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const OwnerDashboard = () => {
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    // Forms State
    const [showCreateShop, setShowCreateShop] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);

    // Shop Form Data
    const [shopData, setShopData] = useState({
        name: '', city: '', state: '', address: '', image: '', description: ''
    });

    // Item Form Data
    const [itemData, setItemData] = useState({
        name: '', image: '', category: 'Snacks', price: '', foodType: 'Veg', description: ''
    });

    const [editingItem, setEditingItem] = useState(null);
    const [editingShop, setEditingShop] = useState(false);

    // Promotions & Finances State
    const [showPromotions, setShowPromotions] = useState(false);
    const [showFinances, setShowFinances] = useState(false);
    const [coupons, setCoupons] = useState([]);
    const [finances, setFinances] = useState(null);
    const [promoData, setPromoData] = useState({
        code: '', discountType: 'Percentage', value: '', minOrderValue: '', maxDiscount: '', validUntil: ''
    });

    const fetchMyShop = async () => {
        try {
            const { data } = await api.get('/shop/my/shop');
            if (data.success && data.shop) {
                setShop(data.shop);
                if (data.shop._id) {
                    const itemsRes = await api.get(`/shop/${data.shop._id}/items`);
                    setItems(itemsRes.data.items);

                    // Fetch analytics
                    const analyticsRes = await api.get(`/shop/analytics/${data.shop._id}`);
                    if (analyticsRes.data.success) {
                        setAnalytics(analyticsRes.data.analytics);
                    }

                    fetchCoupons();
                    fetchFinances();
                }
            }
        } catch (error) {
            console.log("No shop found");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyShop();
    }, []);

    const handleCreateShop = async (e) => {
        e.preventDefault();
        try {
            if (editingShop) {
                await api.put(`/shop/${shop._id}`, shopData);
                setEditingShop(false);
                toast.success('Shop updated successfully!');
            } else {
                await api.post('/shop/create', shopData);
                setShowCreateShop(false);
                toast.success('Shop created successfully!');
            }
            fetchMyShop();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await api.put(`/shop/item/${editingItem._id}`, itemData);
                setEditingItem(null);
                setShowAddItem(false);
                toast.success('Item updated successfully!');
            } else {
                await api.post('/shop/item/add', { ...itemData, shopId: shop._id });
                setShowAddItem(false);
                toast.success('Item added successfully!');
            }
            setItemData({ name: '', image: '', category: 'Snacks', price: '', foodType: 'Veg', description: '' });
            fetchMyShop();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/shop/item/${id}`);
            toast.success('Item deleted successfully!');
            fetchMyShop();
        } catch (error) {
            toast.error('Failed to delete item');
        }
    };

    const toggleShopStatus = async () => {
        try {
            const newStatus = !shop.settings?.isOpen;
            await api.put(`/shop/settings/${shop._id}`, {
                settings: { ...shop.settings, isOpen: newStatus }
            });
            setShop({ ...shop, settings: { ...shop.settings, isOpen: newStatus } });
            toast.success(`Shop ${newStatus ? 'opened' : 'closed'} successfully!`);
        } catch (error) {
            toast.error('Failed to update shop status');
        }
    };

    // Promotions Handlers
    const fetchCoupons = async () => {
        try {
            const { data } = await api.get('/shop/coupon/all');
            if (data.success) setCoupons(data.coupons);
        } catch (error) { console.error("Failed to fetch coupons"); }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        try {
            await api.post('/shop/coupon/create', promoData);
            toast.success('Coupon created!');
            setPromoData({ code: '', discountType: 'Percentage', value: '', minOrderValue: '', maxDiscount: '', validUntil: '' });
            fetchCoupons();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create coupon');
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (!window.confirm("Delete this coupon?")) return;
        try {
            await api.delete(`/shop/coupon/${id}`);
            toast.success('Coupon deleted');
            fetchCoupons();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    // Finances Handler
    const fetchFinances = async () => {
        try {
            const { data } = await api.get('/shop/finances/overview');
            if (data.success) setFinances(data.finances);
        } catch (error) { console.error("Failed to fetch finances"); }
    };

    if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-300">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border-b-4 border-indigo-600 transition-all">
                    <div className="text-center md:text-left mb-6 md:mb-0">
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Business Portal 📈</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Managing: {shop?.name || 'New Restaurant'}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        {shop && (
                            <>
                                <button onClick={() => setShowPromotions(true)} className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-2xl font-bold hover:bg-amber-200 transition text-sm">
                                    🎟️ Promotions
                                </button>
                                <button onClick={() => setShowFinances(true)} className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-2xl font-bold hover:bg-green-200 transition text-sm">
                                    💰 Finances
                                </button>
                                <button
                                    onClick={toggleShopStatus}
                                    className={`px-6 py-3 rounded-2xl font-bold shadow-lg transition w-full sm:w-auto flex items-center justify-center gap-2 ${shop.settings?.isOpen
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                        }`}
                                >
                                    {shop.settings?.isOpen ? '🟢 Shop Open' : '🔴 Shop Closed'}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingItem(null);
                                        setItemData({ name: '', image: '', category: 'Snacks', price: '', foodType: 'Veg', description: '' });
                                        setShowAddItem(true);
                                    }}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition w-full sm:w-auto flex items-center justify-center gap-2"
                                >
                                    <span className="text-xl">+</span> Add Menu Item
                                </button>
                            </>
                        )}
                    </div>
                </header>

                {/* Analytics Dashboard */}
                {shop && analytics && (
                    <div className="mb-8">
                        {/* Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white"
                            >
                                <p className="text-sm font-bold opacity-90 mb-1">Total Revenue</p>
                                <p className="text-3xl font-black">₹{analytics.totalRevenue.toFixed(2)}</p>
                                <p className="text-xs opacity-75 mt-2">Today: ₹{analytics.todayRevenue.toFixed(2)}</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-white"
                            >
                                <p className="text-sm font-bold opacity-90 mb-1">Total Orders</p>
                                <p className="text-3xl font-black">{analytics.totalOrders}</p>
                                <p className="text-xs opacity-75 mt-2">Today: {analytics.todayOrders} | Week: {analytics.weekOrders}</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-2xl shadow-lg text-white"
                            >
                                <p className="text-sm font-bold opacity-90 mb-1">Avg Order Value</p>
                                <p className="text-3xl font-black">₹{analytics.avgOrderValue.toFixed(2)}</p>
                                <p className="text-xs opacity-75 mt-2">Pending: {analytics.pendingOrders} orders</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-gradient-to-br from-pink-500 to-rose-600 p-6 rounded-2xl shadow-lg text-white"
                            >
                                <p className="text-sm font-bold opacity-90 mb-1">Customers</p>
                                <p className="text-3xl font-black">{analytics.uniqueCustomers}</p>
                                <p className="text-xs opacity-75 mt-2">Retention: {analytics.customerRetentionRate}%</p>
                            </motion.div>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <RevenueChart data={analytics.revenueByDay} />
                            <OrderDistribution distribution={analytics.orderDistribution} />
                            <PopularItems items={analytics.popularItems} />
                            <PeakHours hourlyOrders={analytics.hourlyOrders} peakHour={analytics.peakHour} />
                        </div>
                    </div>
                )}

                {(editingShop || (!shop && showCreateShop)) && (
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleCreateShop}
                        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md max-w-2xl mx-auto space-y-4 mb-8 border border-gray-100 dark:border-gray-700 transition-all"
                    >
                        <h2 className="text-xl font-bold mb-4 dark:text-white">{editingShop ? 'Edit Restaurant' : 'Restaurant Details'}</h2>
                        <input className="w-full border dark:border-gray-700 p-2 rounded dark:bg-gray-700 dark:text-white" placeholder="Restaurant Name" required value={shopData.name} onChange={e => setShopData({ ...shopData, name: e.target.value })} />
                        <input className="w-full border dark:border-gray-700 p-2 rounded dark:bg-gray-700 dark:text-white" placeholder="Image URL (e.g. from Unsplash)" required value={shopData.image} onChange={e => setShopData({ ...shopData, image: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                            <input className="border dark:border-gray-700 p-2 rounded dark:bg-gray-700 dark:text-white" placeholder="City" required value={shopData.city} onChange={e => setShopData({ ...shopData, city: e.target.value })} />
                            <input className="border dark:border-gray-700 p-2 rounded dark:bg-gray-700 dark:text-white" placeholder="State" required value={shopData.state} onChange={e => setShopData({ ...shopData, state: e.target.value })} />
                        </div>
                        <textarea className="w-full border dark:border-gray-700 p-2 rounded dark:bg-gray-700 dark:text-white" placeholder="Full Address" required value={shopData.address} onChange={e => setShopData({ ...shopData, address: e.target.value })} />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => { setShowCreateShop(false); setEditingShop(false); }} className="px-4 py-2 border rounded">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded">{editingShop ? 'Update Shop' : 'Create Shop'}</button>
                        </div>
                    </motion.form>
                )}

                {!shop && !showCreateShop && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 p-12 rounded-2xl shadow-sm text-center border border-gray-200 dark:border-gray-700 transition-all"
                    >
                        <div className="text-6xl mb-4">🏬</div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">You haven't set up your restaurant yet</h2>
                        <button
                            onClick={() => setShowCreateShop(true)}
                            className="bg-primary text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-red-700 transition shadow-lg transform hover:scale-105 active:scale-95 duration-200"
                        >
                            Create Restaurant
                        </button>
                    </motion.div>
                )}

                {shop && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Shop Info Card */}
                        <motion.div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm overflow-hidden h-fit relative border border-gray-100 dark:border-gray-700 group transition-all">
                            <button
                                onClick={() => {
                                    setShopData(shop);
                                    setEditingShop(true);
                                }}
                                className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur p-2.5 rounded-2xl shadow-xl hover:bg-indigo-600 hover:text-white transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                            <div className="relative h-56 overflow-hidden">
                                <img src={shop.image} alt={shop.name} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-4 left-4">
                                    <span className="text-xs font-black text-white bg-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Restaurant Live</span>
                                </div>
                            </div>
                            <div className="p-8">
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{shop.name}</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 flex items-center gap-2">
                                    <span className="text-indigo-500">📍</span> {shop.address}, {shop.city}
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-gray-700">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold">User</div>)}
                                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">+12</div>
                                    </div>
                                    <Link to={`/shop/${shop._id}`} className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1">
                                        Public View <span>↗</span>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>

                        {/* Menu Items List */}
                        <motion.div className="lg:col-span-2 space-y-8">
                            {/* Orders Section */}
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden transition-all">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-16 -mt-16 opacity-50"></div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <span className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">🛒</span> Active Orders
                                </h3>
                                <OrdersList shopId={shop._id} />
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Menu Items ({items.length})</h3>

                                {/* Add Item Form */}
                                <AnimatePresence>
                                    {showAddItem && (
                                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                            <motion.form
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                onSubmit={handleAddItem}
                                                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-2xl relative border border-gray-100 dark:border-gray-700"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowAddItem(false); setEditingItem(null); }}
                                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                                                >
                                                    ✕
                                                </button>

                                                <h4 className="text-xl font-bold mb-6 text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">
                                                    {editingItem ? 'Edit Menu Item' : 'Add New Item'}
                                                </h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Item Name</label>
                                                        <input className="w-full border border-gray-200 dark:border-gray-700 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition dark:bg-gray-700 dark:text-white" placeholder="e.g. Butter Chicken" required value={itemData.name} onChange={e => setItemData({ ...itemData, name: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Price (₹)</label>
                                                        <input className="w-full border border-gray-200 dark:border-gray-700 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition dark:bg-gray-700 dark:text-white" placeholder="e.g. 299" type="number" required value={itemData.price} onChange={e => setItemData({ ...itemData, price: e.target.value })} />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Category</label>
                                                        <select className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white" value={itemData.category} onChange={e => setItemData({ ...itemData, category: e.target.value })}>
                                                            {['Snacks', 'Main Course', 'Dessert', 'Pizza', 'Burger', 'Sandwich', 'South Indian', 'Chinese', 'Fast Food'].map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Type</label>
                                                        <select className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white" value={itemData.foodType} onChange={e => setItemData({ ...itemData, foodType: e.target.value })}>
                                                            <option value="Veg">Veg</option>
                                                            <option value="Non-Veg">Non-Veg</option>
                                                        </select>
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Image URL</label>
                                                        <input className="w-full border border-gray-200 dark:border-gray-700 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition dark:bg-gray-700 dark:text-white" placeholder="https://..." required value={itemData.image} onChange={e => setItemData({ ...itemData, image: e.target.value })} />
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description</label>
                                                        <textarea className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition h-24 resize-none" placeholder="Describe the dish..." value={itemData.description} onChange={e => setItemData({ ...itemData, description: e.target.value })} />
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                                    <button type="button" onClick={() => { setShowAddItem(false); setEditingItem(null); }} className="text-gray-500 hover:bg-gray-100 px-6 py-2.5 rounded-xl font-medium transition">Cancel</button>
                                                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">{editingItem ? 'Update Item' : 'Add Item'}</button>
                                                </div>
                                            </motion.form>
                                        </div>
                                    )}
                                </AnimatePresence>

                                {/* Items Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {items.map(item => (
                                        <div key={item._id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex gap-4 items-center border border-gray-50 dark:border-gray-700 hover:border-gray-200 dark:hover:border-indigo-600 transition">
                                            <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-900 dark:text-white">{item.name}</h4>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setItemData(item);
                                                                setEditingItem(item);
                                                                setShowAddItem(true);
                                                            }}
                                                            className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                                                        >
                                                            ✏️</button>
                                                        <button onClick={() => handleDeleteItem(item._id)} className="text-red-500 hover:bg-red-50 p-1 rounded">🗑️</button>
                                                    </div>
                                                </div>
                                                <p className="text-gray-500 text-sm">₹{parseFloat(item.price).toFixed(2)}</p>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${item.foodType === 'Veg' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {item.foodType}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {items.length === 0 && !showAddItem && (
                                        <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-500 bg-white dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                            No items added yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Promotions Modal */}
                <AnimatePresence>
                    {showPromotions && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-gray-100 dark:border-gray-700">
                                <button onClick={() => setShowPromotions(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-xl transition-colors">✕</button>
                                <h3 className="text-2xl font-black mb-6 flex items-center gap-2 dark:text-white"><span>🎟️</span> Promotions Manager</h3>

                                <form onSubmit={handleCreateCoupon} className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl mb-8 border border-amber-100 dark:border-amber-900/30">
                                    <h4 className="font-bold mb-4 text-amber-800 dark:text-amber-400">Create New Coupon</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <input className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 dark:bg-gray-700 dark:text-white" placeholder="Code (e.g. WELCOME50)" required value={promoData.code} onChange={e => setPromoData({ ...promoData, code: e.target.value.toUpperCase() })} />
                                        <select className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 dark:bg-gray-700 dark:text-white" value={promoData.discountType} onChange={e => setPromoData({ ...promoData, discountType: e.target.value })}>
                                            <option value="Percentage">Percentage (%)</option>
                                            <option value="Flat">Flat Amount (₹)</option>
                                        </select>
                                        <input className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 dark:bg-gray-700 dark:text-white" type="number" placeholder="Discount Value" required value={promoData.value} onChange={e => setPromoData({ ...promoData, value: e.target.value })} />
                                        <input className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 dark:bg-gray-700 dark:text-white" type="number" placeholder="Min Order Value" value={promoData.minOrderValue} onChange={e => setPromoData({ ...promoData, minOrderValue: e.target.value })} />
                                        <input className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 dark:bg-gray-700 dark:text-white" type="date" required value={promoData.validUntil} onChange={e => setPromoData({ ...promoData, validUntil: e.target.value })} />
                                    </div>
                                    <button type="submit" className="w-full bg-amber-500 text-white font-black py-3 rounded-xl hover:bg-amber-600 transition shadow-lg shadow-amber-200 dark:shadow-none">Create Coupon</button>
                                </form>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900 dark:text-white">Active Coupons</h4>
                                    {coupons.length === 0 ? <p className="text-gray-400 dark:text-gray-500 italic">No active coupons.</p> : (
                                        coupons.map(coupon => (
                                            <div key={coupon._id} className="flex justify-between items-center p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                                                <div>
                                                    <p className="font-black text-lg text-gray-800 dark:text-white">{coupon.code}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                                                        {coupon.discountType === 'Percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} FLAT OFF`}
                                                        {coupon.minOrderValue > 0 && ` • Min Order: ₹${coupon.minOrderValue}`}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Exp: {new Date(coupon.validUntil).toLocaleDateString()}</p>
                                                </div>
                                                <button onClick={() => handleDeleteCoupon(coupon._id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors">🗑️</button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Finances Modal */}
                <AnimatePresence>
                    {showFinances && finances && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-gray-100 dark:border-gray-700">
                                <button onClick={() => setShowFinances(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-xl transition-colors">✕</button>
                                <h3 className="text-2xl font-black mb-8 flex items-center gap-2 dark:text-white"><span>💰</span> Financial Center</h3>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-100 dark:border-green-900/30 text-center">
                                        <p className="text-xs font-black uppercase text-green-600 dark:text-green-400 tracking-widest mb-1">Total Earnings</p>
                                        <p className="text-3xl font-black text-green-700 dark:text-green-500">₹{finances.totalEarnings.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-center">
                                        <p className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-1">Available to Withdraw</p>
                                        <p className="text-3xl font-black text-blue-700 dark:text-blue-500">₹{finances.availableBalance.toFixed(2)}</p>
                                    </div>
                                </div>

                                <h4 className="font-bold text-gray-900 dark:text-white mb-4">Recent Transactions</h4>
                                <div className="space-y-3">
                                    {finances.recentTransactions.map(tx => (
                                        <div key={tx.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl transition-colors">
                                            <div>
                                                <p className="font-bold text-sm text-gray-800 dark:text-white">Order Revenue</p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{new Date(tx.date).toLocaleDateString()} • {tx.id.slice(-6).toUpperCase()}</p>
                                            </div>
                                            <p className="font-black text-green-600 dark:text-green-400">+₹{tx.amount.toFixed(2)}</p>
                                        </div>
                                    ))}
                                    {finances.recentTransactions.length === 0 && <p className="text-gray-400 dark:text-gray-500 italic">No transactions yet.</p>}
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <button className="w-full bg-black dark:bg-white dark:text-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition shadow-lg">Request Payout</button>
                                    <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-2">Payouts are processed every Wednesday</p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default OwnerDashboard;
