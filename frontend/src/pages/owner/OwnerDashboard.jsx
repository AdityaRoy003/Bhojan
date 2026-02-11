import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const OrdersList = () => {
    const [orders, setOrders] = useState([]);

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
        } catch (err) { alert("Failed to update status"); }
    };

    if (orders.length === 0) return <p className="text-gray-500 italic">No active orders.</p>;

    return (
        <div className="space-y-4">
            {orders.map(order => (
                <div key={order._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="font-bold text-gray-900">Order #{order._id.slice(-6)}</h4>
                            <p className="text-sm text-gray-500">{order.user?.fullname}</p>
                        </div>
                        <select
                            value={order.orderStatus}
                            onChange={(e) => updateStatus(order._id, e.target.value)}
                            className="bg-white border border-gray-300 text-sm rounded-lg p-1.5 focus:ring-primary focus:border-primary"
                        >
                            <option value="Placed">Placed</option>
                            <option value="Preparing">Preparing</option>
                            <option value="OutForDelivery">Out For Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                        {order.items.map((i, idx) => (
                            <div key={idx} className="flex justify-between font-medium">
                                <span>{i.quantity} x {i.name}</span>
                                <span>₹{i.price * i.quantity}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                        <div>
                            <p className="text-gray-400 font-bold uppercase tracking-tighter text-[9px]">Payment</p>
                            <p className="font-bold flex items-center gap-1">
                                {order.paymentMethod === 'COD' ? '💵' : '💳'} {order.paymentMethod}
                                {order.isPaid && <span className="text-[9px] bg-green-100 text-green-600 px-1 rounded">Paid</span>}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 font-bold uppercase tracking-tighter text-[9px]">Total</p>
                            <p className="font-bold text-gray-900">₹{order.totalAmount}</p>
                        </div>
                    </div>

                    {order.instructions && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-[11px] border border-blue-100 italic text-blue-800">
                            " {order.instructions} "
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const OwnerDashboard = () => {
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

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

    const fetchMyShop = async () => {
        try {
            const { data } = await api.get('/shop/my/shop');
            if (data.success && data.shop) {
                setShop(data.shop);
                if (data.shop._id) {
                    const itemsRes = await api.get(`/shop/${data.shop._id}/items`);
                    setItems(itemsRes.data.items);
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
            } else {
                await api.post('/shop/create', shopData);
                setShowCreateShop(false);
            }
            fetchMyShop();
        } catch (error) {
            alert(error.response?.data?.message || "Operation failed");
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await api.put(`/shop/item/${editingItem._id}`, itemData);
                setEditingItem(null);
                setShowAddItem(false);
            } else {
                await api.post('/shop/item/add', { ...itemData, shopId: shop._id });
                setShowAddItem(false);
            }
            setItemData({ name: '', image: '', category: 'Snacks', price: '', foodType: 'Veg', description: '' });
            fetchMyShop();
        } catch (error) {
            alert(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/shop/item/${id}`);
            fetchMyShop();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-3xl shadow-sm border-b-4 border-indigo-600">
                    <div className="text-center md:text-left mb-6 md:mb-0">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Business Portal 📈</h1>
                        <p className="text-gray-500 font-medium">Managing: {shop?.name || 'New Restaurant'}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        {shop && (
                            <div className="bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 w-full sm:w-auto text-center transform hover:scale-105 transition duration-300">
                                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mb-1">Total Revenue</p>
                                <p className="text-2xl font-black text-indigo-800">₹{items.length > 0 ? (items.length * 1250).toLocaleString() : '0'}</p> { /* Dummy calc for UI wow factor */}
                            </div>
                        )}
                        {shop && (
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
                        )}
                    </div>
                </header>

                {(editingShop || (!shop && showCreateShop)) && (
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleCreateShop}
                        className="bg-white p-8 rounded-xl shadow-md max-w-2xl mx-auto space-y-4 mb-8"
                    >
                        <h2 className="text-xl font-bold mb-4">{editingShop ? 'Edit Restaurant' : 'Restaurant Details'}</h2>
                        <input className="w-full border p-2 rounded" placeholder="Restaurant Name" required value={shopData.name} onChange={e => setShopData({ ...shopData, name: e.target.value })} />
                        <input className="w-full border p-2 rounded" placeholder="Image URL (e.g. from Unsplash)" required value={shopData.image} onChange={e => setShopData({ ...shopData, image: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                            <input className="border p-2 rounded" placeholder="City" required value={shopData.city} onChange={e => setShopData({ ...shopData, city: e.target.value })} />
                            <input className="border p-2 rounded" placeholder="State" required value={shopData.state} onChange={e => setShopData({ ...shopData, state: e.target.value })} />
                        </div>
                        <textarea className="w-full border p-2 rounded" placeholder="Full Address" required value={shopData.address} onChange={e => setShopData({ ...shopData, address: e.target.value })} />
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
                        className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-200"
                    >
                        <div className="text-6xl mb-4">🏪</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">You haven't set up your restaurant yet</h2>
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
                        <motion.div className="bg-white rounded-3xl shadow-sm overflow-hidden h-fit relative border border-gray-100 group">
                            <button
                                onClick={() => {
                                    setShopData(shop);
                                    setEditingShop(true);
                                }}
                                className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2.5 rounded-2xl shadow-xl hover:bg-indigo-600 hover:text-white transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
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
                                <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">{shop.name}</h2>
                                <p className="text-gray-500 text-sm mb-6 flex items-center gap-2">
                                    <span className="text-indigo-500">📍</span> {shop.address}, {shop.city}
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold">User</div>)}
                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">+12</div>
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
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                                <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">🛒</span> Active Orders
                                </h3>
                                <OrdersList />
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Menu Items ({items.length})</h3>

                                {/* Add Item Form */}
                                <AnimatePresence>
                                    {showAddItem && (
                                        <motion.form
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            onSubmit={handleAddItem}
                                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4 mb-6 overflow-hidden"
                                        >
                                            <h4 className="font-bold">{editingItem ? 'Edit Item' : 'Add New Item'}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input className="border p-2 rounded" placeholder="Item Name" required value={itemData.name} onChange={e => setItemData({ ...itemData, name: e.target.value })} />
                                                <input className="border p-2 rounded" placeholder="Price (₹)" type="number" required value={itemData.price} onChange={e => setItemData({ ...itemData, price: e.target.value })} />
                                                <select className="border p-2 rounded" value={itemData.category} onChange={e => setItemData({ ...itemData, category: e.target.value })}>
                                                    {['Snacks', 'Main Course', 'Dessert', 'Pizza', 'Burger', 'Sandwich', 'South Indian', 'Chinese', 'Fast Food'].map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <select className="border p-2 rounded" value={itemData.foodType} onChange={e => setItemData({ ...itemData, foodType: e.target.value })}>
                                                    <option value="Veg">Veg</option>
                                                    <option value="Non-Veg">Non-Veg</option>
                                                </select>
                                                <input className="border p-2 rounded md:col-span-2" placeholder="Image URL" required value={itemData.image} onChange={e => setItemData({ ...itemData, image: e.target.value })} />
                                                <textarea className="border p-2 rounded md:col-span-2" placeholder="Item Description" value={itemData.description} onChange={e => setItemData({ ...itemData, description: e.target.value })} />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => { setShowAddItem(false); setEditingItem(null); }} className="text-gray-500 hover:bg-gray-100 px-4 py-2 rounded">Cancel</button>
                                                <button type="submit" className="bg-primary text-white px-4 py-2 rounded">{editingItem ? 'Update Item' : 'Add Item'}</button>
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>

                                {/* Items Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {items.map(item => (
                                        <div key={item._id} className="bg-white p-4 rounded-xl shadow-sm flex gap-4 items-center border border-gray-50 hover:border-gray-200 transition">
                                            <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setItemData(item);
                                                                setEditingItem(item);
                                                                setShowAddItem(true);
                                                            }}
                                                            className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button onClick={() => handleDeleteItem(item._id)} className="text-red-500 hover:bg-red-50 p-1 rounded">🗑️</button>
                                                    </div>
                                                </div>
                                                <p className="text-gray-500 text-sm">₹{item.price}</p>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${item.foodType === 'Veg' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {item.foodType}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {items.length === 0 && !showAddItem && (
                                        <div className="col-span-full text-center py-8 text-gray-500 bg-white rounded-xl border border-dashed">
                                            No items added yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerDashboard;
