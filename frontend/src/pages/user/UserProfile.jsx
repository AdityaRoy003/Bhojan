import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import OfflineStatus from '../../components/OfflineStatus';
import { updateUser, logoutUser } from '../../redux/userSlice';

const UserProfile = () => {
    const { user, isAuthenticated } = useSelector(state => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();
    const isOwner = user?.role === 'Owner';
    const isAdmin = user?.role === 'Admin';
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || (isAdmin ? 'admin-overview' : isOwner ? 'owner-shops' : 'personal'));
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [insights, setInsights] = useState(null);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [shop, setShop] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [menuItems, setMenuItems] = useState([]);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [itemFormData, setItemFormData] = useState({
        name: '', description: '', price: '', category: 'Others', foodType: 'Veg', image: '', dietaryTags: [], spiceLevel: 'Medium'
    });
    const [adminData, setAdminData] = useState({
        stats: null, users: [], shops: [], items: [], orders: [], config: { featureFlags: {} }
    });

    const [isShoppingMode, setIsShoppingMode] = useState(localStorage.getItem('isShoppingMode') === 'true');

    const handleSwitchMode = () => {
        const newMode = !isShoppingMode;
        localStorage.setItem('isShoppingMode', newMode);
        setIsShoppingMode(newMode);
        if (newMode) {
            navigate('/');
        }
    };

    // Form States
    const [personalData, setPersonalData] = useState({
        fullname: '', email: '', mobile: '', alternateMobile: '', avatar: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });
    const [preferences, setPreferences] = useState({
        dietaryRestrictions: [], allergies: [], favoriteCategories: [], spicePreference: 'Medium'
    });
    const [shopData, setShopData] = useState({
        name: '', city: '', state: '', address: '', logo: '', banner: '',
        gstin: '', fssai: '', minOrderValue: 0,
        timing: { open: '09:00 AM', close: '10:00 PM' },
        settings: { acceptsCOD: true, acceptsOnline: true, isOpen: true }
    });
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressFormData, setAddressFormData] = useState({
        label: 'Home', street: '', city: '', state: '', pincode: '', isDefault: false
    });
    const [ticketFormData, setTicketFormData] = useState({
        subject: '', message: '', category: 'Other', orderId: ''
    });
    const [notificationSettings, setNotificationSettings] = useState({
        email: true, sms: true, push: true
    });
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsPredictions, setAnalyticsPredictions] = useState([]);
    const [supportTickets, setSupportTickets] = useState([]);
    const [filterDate, setFilterDate] = useState('All Time');
    const [adminSearchTerm, setAdminSearchTerm] = useState('');
    const [adminRoleFilter, setAdminRoleFilter] = useState('All Roles');

    const getFilteredOrders = () => {
        if (!orders) return [];
        if (filterDate === 'All Time') return orders;

        const now = new Date();
        const y = now.getFullYear();

        if (filterDate === 'Last 3 Months') {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(now.getMonth() - 3);
            return orders.filter(o => new Date(o.createdAt) >= threeMonthsAgo);
        }

        if (filterDate === String(y)) {
            return orders.filter(o => new Date(o.createdAt).getFullYear() === y);
        }

        if (filterDate === String(y - 1)) {
            return orders.filter(o => new Date(o.createdAt).getFullYear() === (y - 1));
        }

        return orders;
    };

    const filteredOrders = getFilteredOrders();

    const customerTabs = [
        { id: 'personal', label: 'Personal Info', icon: '👤' },
        { id: 'orders', label: 'Order History', icon: '🧾' },
        { id: 'wishlist', label: 'My Wishlist', icon: '❤️' },
        { id: 'payments', label: 'Payments & Wallet', icon: '💳' },
        { id: 'analytics', label: 'My Analytics', icon: '📊' },
        { id: 'security', label: 'Security', icon: '🔒' },
        { id: 'preferences', label: 'Preferences', icon: '🍴' },
        { id: 'loyalty', label: 'Loyalty & Rewards', icon: '💎' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
        { id: 'support', label: 'Support', icon: '🎧' }
    ];

    const ownerTabs = [
        { id: 'owner-shops', label: 'Shop Info', icon: '🏪' },
        { id: 'owner-menu', label: 'Menu Management', icon: '🍳' },
        { id: 'owner-overview', label: 'Orders & Analytics', icon: '📊' },
        { id: 'owner-promotions', label: 'Promotions', icon: '🎟️' },
        { id: 'owner-financials', label: 'Financials', icon: '💰' },
        { id: 'owner-settings', label: 'Settings', icon: '⚙️' },
        { id: 'owner-personal', label: 'Personal Info', icon: '👤' }
    ];

    const adminTabs = [
        { id: 'admin-overview', label: 'Platform Overview', icon: '🌐' },
        { id: 'admin-users', label: 'User Hub', icon: '👥' },
        { id: 'admin-shops', label: 'Shop Control', icon: '🏪' },
        { id: 'admin-items', label: 'Inventory', icon: '🍳' },
        { id: 'admin-orders', label: 'Order Central', icon: '🧾' },
        { id: 'admin-financials', label: 'Financials', icon: '💰' },
        { id: 'admin-settings', label: 'Platform Settings', icon: '⚙️' },
        { id: 'admin-moderation', label: 'Moderation', icon: '🛡️' },
        { id: 'admin-support', label: 'Support', icon: '🎫' },
        { id: 'personal', label: 'Account', icon: '👤' }
    ];

    const tabs = isAdmin ? adminTabs : isOwner ? ownerTabs : customerTabs;

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
    };

    useEffect(() => {
        if (!isAuthenticated) navigate('/login');
        if (isAuthenticated) {
            // Immediately populate from Redux state
            if (user) {
                setPersonalData({
                    fullname: user.fullname || '',
                    email: user.email || '',
                    mobile: user.mobile || user.mobileNumber || '',
                    alternateMobile: user.alternateMobile || '',
                    avatar: user.avatar || ''
                });
                setPreferences({
                    dietaryRestrictions: user.preferences?.dietaryRestrictions || [],
                    allergies: user.preferences?.allergies || [],
                    favoriteCategories: user.preferences?.favoriteCategories || [],
                    spicePreference: user.preferences?.spicePreference || 'Medium'
                });
            }
            fetchInitialData();
        }
    }, [isAuthenticated, user]);

    const fetchInitialData = async () => {
        try {
            if (isAdmin) {
                const results = await Promise.allSettled([
                    api.get('/admin/stats'),
                    api.get('/admin/users'),
                    api.get('/admin/shops'),
                    api.get('/admin/items'),
                    api.get('/admin/orders'),
                    api.get('/admin/config'),
                    api.get('/admin/tickets')
                ]);

                const data = results.map(r => r.status === 'fulfilled' ? r.value.data : null);
                setAdminData({
                    stats: data[0]?.stats,
                    users: data[1]?.users || [],
                    shops: data[2]?.shops || [],
                    items: data[3]?.items || [],
                    orders: data[4]?.orders || [],
                    config: data[5]?.config || { featureFlags: {} }
                });
                setSupportTickets(data[6]?.tickets || []);
            } else if (isOwner) {
                try {
                    const { data } = await api.get('/shop/my/shop');
                    if (data.success) {
                        setShop(data.shop);
                        setInsights(data.insights);
                        if (data.shop) {
                            setShopData({
                                name: data.shop.name || '',
                                city: data.shop.city || '',
                                state: data.shop.state || '',
                                address: data.shop.address || '',
                                logo: data.shop.logo || '',
                                banner: data.shop.banner || '',
                                gstin: data.shop.gstin || '',
                                fssai: data.shop.fssai || '',
                                minOrderValue: data.shop.minOrderValue || 0,
                                timing: data.shop.timing || { open: '09:00 AM', close: '10:00 PM' },
                                settings: data.shop.settings || { acceptsCOD: true, acceptsOnline: true, isOpen: true }
                            });
                        }
                    }
                } catch (e) {
                    console.error("Error fetching shop data", e);
                }
            } else {
                // Fetch customer specific data independently
                const endpoints = [
                    { path: '/order/my', setter: (d) => setOrders(d.orders || []) },
                    { path: '/order/insights', setter: (d) => setInsights(d.insights) },
                    { path: '/user-actions/wishlist', setter: (d) => setWishlistItems(d.wishlist || []) },
                    { path: '/user-actions/wallet/transactions', setter: (d) => setTransactions(d.transactions || []) }
                ];

                await Promise.allSettled(endpoints.map(async (ep) => {
                    try {
                        const { data } = await api.get(ep.path);
                        if (data.success) ep.setter(data);
                    } catch (err) {
                        console.error(`Failed to fetch ${ep.path}:`, err);
                    }
                }));
            }
        } catch (error) {
            console.error("Error in fetchInitialData", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyShop = async (shopId, status) => {
        try {
            await api.put('/admin/shop/verify', { shopId, status });
            alert(`Shop ${status} successfully!`);
            fetchInitialData();
        } catch (error) {
            alert('Action failed');
        }
    };

    const handleUpdateUserRole = async (userId, role) => {
        try {
            await api.put('/admin/user/role', { userId, role });
            alert('User role updated!');
            fetchInitialData();
        } catch (error) {
            alert('Failed to update role');
        }
    };

    const handleUpdateUserStatus = async (userId, status) => {
        try {
            const adminNotes = status === 'Suspended' ? prompt('Reason for suspension:') : '';
            await api.put('/admin/user/status', { userId, status, adminNotes });
            alert(`User status updated to ${status}`);
            fetchInitialData();
        } catch (error) {
            alert('Failed to update user status');
        }
    };

    const handleResetUserPassword = async (userId) => {
        const newPassword = prompt('Enter new password for user:');
        if (!newPassword) return;
        try {
            await api.put('/admin/user/password-reset', { userId, newPassword });
            alert('Password reset successful! User forced to re-login.');
        } catch (error) {
            alert('Failed to reset password');
        }
    };

    const handleToggleShopField = async (shopId, field) => {
        try {
            await api.put('/admin/shop/toggle-field', { shopId, field });
            fetchInitialData(); // Refresh to show toggled state
        } catch (error) {
            alert(`Failed to toggle ${field}`);
        }
    };

    const handleModerateItem = async (itemId, status) => {
        try {
            await api.put('/admin/item/moderate', { itemId, status });
            alert(`Item ${status}!`);
            fetchInitialData();
        } catch (error) {
            alert('Moderation failed');
        }
    };

    const handleUpdateSystemConfig = async (e) => {
        if (e) e.preventDefault();
        setUpdating(true);
        try {
            await api.put('/admin/config', adminData.config);
            alert('System configuration updated globally!');
            fetchInitialData();
        } catch (error) {
            alert('Failed to update system config');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateTicketStatus = async (ticketId, status) => {
        try {
            await api.put('/admin/ticket/status', { ticketId, status });
            setSupportTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status } : t));
        } catch (error) {
            alert('Failed to update ticket status');
        }
    };

    const handleUpdatePersonal = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const { data } = await api.put('/auth/me/update', personalData);
            if (data.success) {
                dispatch(updateUser(data.user));
                alert('Personal information updated!');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Update failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateShopSettings = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const { data } = await api.put(`/shop/settings/${shop?._id}`, shopData);
            if (data.success) {
                setShop(data.shop);
                alert('Shop settings updated successfully!');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Update failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            if (editingItemId) {
                await api.put(`/shop/item/${editingItemId}`, itemFormData);
                alert('Item updated!');
            } else {
                await api.post('/shop/item/add', { ...itemFormData, shopId: shop?._id });
                alert('Item added to menu!');
            }
            fetchInitialData(); // Refresh list
            setShowItemModal(false);
            setItemFormData({ name: '', description: '', price: '', category: 'Others', foodType: 'Veg', image: '', dietaryTags: [], spiceLevel: 'Medium' });
            setEditingItemId(null);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save item');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm('Delete this item?')) return;
        try {
            await api.delete(`/shop/item/${id}`);
            setShop({ ...shop, items: shop.items.filter(i => i._id !== id) });
        } catch (error) {
            alert('Failed to delete item');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            // Using POST instead of DELETE to ensure body payload is correctly handled by all proxies/servers
            const { data } = await api.post('/auth/me/delete', { password: deletePassword });
            if (data.success) {
                alert('Account deleted permanently.');
                localStorage.removeItem('isShoppingMode');
                dispatch(logoutUser());
                navigate('/');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Deletion failed');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return alert('Passwords do not match');
        }
        setUpdating(true);
        try {
            const { data } = await api.put('/auth/password/change', passwordData);
            if (data.success) {
                alert('Password updated successfully!');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Password update failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const { data } = await api.post('/auth/address/add', addressFormData);
            if (data.success) {
                dispatch(updateUser({ ...user, addresses: data.addresses }));
                setShowAddressModal(false);
                setAddressFormData({ label: 'Home', street: '', city: '', state: '', pincode: '', isDefault: false });
                alert('Address added!');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add address');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm('Delete this address?')) return;
        try {
            const { data } = await api.delete(`/auth/address/${id}`);
            if (data.success) {
                dispatch(updateUser({ ...user, addresses: data.addresses }));
            }
        } catch (error) {
            alert('Failed to delete address');
        }
    };

    const handleUpdatePreferences = async () => {
        setUpdating(true);
        try {
            const { data } = await api.put('/auth/me/preferences', preferences);
            if (data.success) {
                dispatch(updateUser(data.user));
                alert('Preferences updated!');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update preferences');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateSettings = async () => {
        setUpdating(true);
        try {
            const { data } = await api.put('/auth/me/settings', { notifications: notificationSettings });
            if (data.success) {
                dispatch(updateUser(data.user));
                alert('Settings updated!');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update settings');
        } finally {
            setUpdating(false);
        }
    };

    const handleRaiseTicket = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const { data } = await api.post('/auth/support/ticket', ticketFormData);
            if (data.success) {
                alert('Your concern has been registered. Ticket ID: ' + (data.ticket._id || 'N/A'));
                setTicketFormData({ subject: '', message: '', category: 'Other', orderId: '' });
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to raise ticket');
        } finally {
            setUpdating(false);
        }
    };

    const handleToggleWishlist = async (itemId) => {
        try {
            await api.post('/user-actions/wishlist/toggle', { itemId });
            setWishlistItems(prev => prev.filter(item => item._id !== itemId));
        } catch (error) {
            alert('Failed to update wishlist');
        }
    };

    const handleTopUp = async (amount) => {
        try {
            const { data } = await api.post('/user-actions/wallet/topup/initiate', { amount });
            if (data.success) {
                const options = {
                    key: "rzp_test_placeholder", // Replace with real key from env if needed
                    amount: data.order.amount,
                    currency: "INR",
                    name: "Bhojan",
                    description: "Top up Bhojan Money",
                    order_id: data.order.id,
                    handler: async (response) => {
                        try {
                            const res = await api.post('/user-actions/wallet/topup/confirm', response);
                            if (res.data.success) {
                                alert('Bhojan Money added successfully!');
                                fetchInitialData();
                            }
                        } catch (err) {
                            alert('Payment verification failed');
                        }
                    },
                    prefill: {
                        name: user.fullname,
                        email: user.email,
                        contact: user.mobile
                    },
                    theme: { color: "#ff4d4d" }
                };
                const rzp1 = new window.Razorpay(options);
                rzp1.open();
            }
        } catch (error) {
            alert('Top-up failed to initiate');
        }
    };

    const handleRedeemGiftCard = async (code) => {
        try {
            const { data } = await api.post('/user-actions/wallet/giftcard/redeem', { code });
            if (data.success) {
                alert(`Successfully redeemed ₹500! New balance: ₹${data.balance}`);
                fetchInitialData();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Invalid gift card code');
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!orderId) {
            alert("Unexpected error: Order ID missing");
            return;
        }
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            const idToCancel = typeof orderId === 'object' ? (orderId._id || orderId.id || orderId) : orderId;
            console.log('Attempting to cancel order:', idToCancel);
            const { data } = await api.put(`/order/${idToCancel}/cancel`);
            if (data.success) {
                alert("Order cancelled successfully");
                fetchInitialData(); // Refresh order list
            }
        } catch (error) {
            console.error('Cancel order error:', error);
            alert(error.response?.data?.message || "Failed to cancel order");
        }
    };

    const handleReorder = async (order) => {
        const { reorder } = await import('../../redux/cartSlice');
        const items = order.items.map(item => ({
            _id: item.foodItem?._id || item._id, // Handle potential population or raw ID
            name: item.name,
            price: item.price,
            image: item.image,
            shop: order.shop // Crucial for cart shop tracking
        }));

        dispatch(reorder({ items, restaurant: order.shop }));
        alert('Items added to cart! Proceeding to checkout...');
        navigate('/cart');
    };

    const renderTabContent = () => {
        switch (activeTab) {
            // --- ADMIN TABS ---
            case 'admin-overview':
                return renderAdminOverview();
            case 'admin-users':
                return renderAdminUsers();
            case 'admin-shops':
                return renderAdminShops();
            case 'admin-items':
                return renderAdminItems();
            case 'admin-orders':
                return renderAdminOrders();
            case 'admin-financials':
                return renderAdminFinancials();
            case 'admin-moderation':
                return renderAdminModerationHub();

            case 'admin-support':
                return renderAdminSupport();

            case 'admin-settings':
                return renderAdminSettings();
            case 'personal':
            case 'owner-personal':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <span>👤</span> Personal Information
                            </h3>
                            <form onSubmit={handleUpdatePersonal} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 transition-all"
                                        value={personalData.fullname}
                                        onChange={e => setPersonalData({ ...personalData, fullname: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 transition-all"
                                        value={personalData.email}
                                        onChange={e => setPersonalData({ ...personalData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Primary Mobile</label>
                                    <input
                                        type="tel"
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 transition-all"
                                        value={personalData.mobile}
                                        onChange={e => setPersonalData({ ...personalData, mobile: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Alternate Mobile</label>
                                    <input
                                        type="tel"
                                        placeholder="Add back-up number"
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 transition-all"
                                        value={personalData.alternateMobile}
                                        onChange={e => setPersonalData({ ...personalData, alternateMobile: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition shadow-lg shadow-amber-100"
                                    >
                                        {updating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </section>

                        {!isOwner && (
                            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black flex items-center gap-2">
                                        <span>📍</span> Saved Addresses
                                    </h3>
                                    <button
                                        onClick={() => setShowAddressModal(true)}
                                        className="text-amber-500 text-xs font-black uppercase tracking-wide hover:underline"
                                    >
                                        + Add New
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user?.addresses?.map((addr, idx) => (
                                        <div key={idx} className="p-4 rounded-2xl bg-gray-50 border-2 border-transparent hover:border-amber-500 transition-all group relative">
                                            <button
                                                onClick={() => handleDeleteAddress(addr._id)}
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-2 rounded-xl text-primary hover:bg-primary hover:text-white shadow-sm"
                                            >
                                                🗑️
                                            </button>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">{addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'}</span>
                                                <span className="font-black text-xs uppercase tracking-widest">{addr.label}</span>
                                                {addr.isDefault && <span className="bg-amber-100 text-amber-600 text-[8px] px-2 py-0.5 rounded-full font-black">DEFAULT</span>}
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium leading-relaxed">{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </motion.div>
                );

            case 'owner-shops':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black flex items-center gap-2">
                                    <span>🏪</span> Shop Management
                                </h3>
                                {user?.businessVerification?.status === 'Verified' ? (
                                    <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">✅ Business Verified</span>
                                ) : (
                                    <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">⏳ Verification Pending</span>
                                )}
                            </div>
                            <form onSubmit={handleUpdateShopSettings} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Shop Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary transition-all"
                                        value={shopData.name}
                                        onChange={e => setShopData({ ...shopData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">GSTIN Number</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary transition-all"
                                        value={shopData.gstin}
                                        onChange={e => setShopData({ ...shopData, gstin: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">FSSAI License</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary transition-all"
                                        value={shopData.fssai}
                                        onChange={e => setShopData({ ...shopData, fssai: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Min Order Value (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary transition-all"
                                        value={shopData.minOrderValue}
                                        onChange={e => setShopData({ ...shopData, minOrderValue: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Address</label>
                                    <textarea
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary transition-all min-h-[100px]"
                                        value={shopData.address}
                                        onChange={e => setShopData({ ...shopData, address: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition shadow-lg shadow-red-100"
                                    >
                                        {updating ? 'Saving...' : 'Update Shop Details'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </motion.div>
                );

            case 'owner-menu':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black flex items-center gap-2">
                                <span>🍳</span> Menu Management
                            </h3>
                            <button
                                onClick={() => { setEditingItemId(null); setShowItemModal(true); }}
                                className="bg-primary text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100"
                            >
                                + Add New Item
                            </button>
                        </div>

                        {showItemModal && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl">
                                    <div className="p-8">
                                        <h4 className="text-2xl font-black mb-6">{editingItemId ? 'Edit Item' : 'Add New Item'}</h4>
                                        <form onSubmit={handleSaveItem} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Item Name</label>
                                                <input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none" value={itemFormData.name} onChange={e => setItemFormData({ ...itemFormData, name: e.target.value })} required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price (₹)</label>
                                                <input type="number" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none" value={itemFormData.price} onChange={e => setItemFormData({ ...itemFormData, price: e.target.value })} required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
                                                <select className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none" value={itemFormData.category} onChange={e => setItemFormData({ ...itemFormData, category: e.target.value })}>
                                                    {['Snacks', 'Main Course', 'Dessert', 'Pizza', 'Burger', 'Sandwich', 'South Indian', 'North Indian', 'Chinese', 'Fast Food', 'Others'].map(c => <option key={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Food Type</label>
                                                <div className="flex gap-4">
                                                    {['Veg', 'Non-Veg'].map(t => (
                                                        <button type="button" key={t} onClick={() => setItemFormData({ ...itemFormData, foodType: t })} className={`flex-1 py-3 rounded-xl border-2 font-black text-xs transition-all ${itemFormData.foodType === t ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-gray-50 border-transparent text-gray-400'}`}>{t}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Image URL</label>
                                                <input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none" value={itemFormData.image} onChange={e => setItemFormData({ ...itemFormData, image: e.target.value })} />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                                                <textarea className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none min-h-[80px]" value={itemFormData.description} onChange={e => setItemFormData({ ...itemFormData, description: e.target.value })} />
                                            </div>
                                            <div className="md:col-span-2 flex justify-end gap-4 pt-4">
                                                <button type="button" onClick={() => setShowItemModal(false)} className="px-6 py-3 font-black text-xs uppercase tracking-widest text-gray-400">Cancel</button>
                                                <button type="submit" disabled={updating} className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100">{updating ? 'Saving...' : 'Save Item'}</button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {shop?.items?.map(item => (
                                <div key={item._id} className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group">
                                    <img src={item.image} alt={item.name} className="w-20 h-20 rounded-2xl object-cover bg-gray-50" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${item.foodType === 'Veg' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            <span className="font-black text-gray-900">{item.name}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.category} • ₹{item.price}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingItemId(item._id);
                                                setItemFormData({ ...item });
                                                setShowItemModal(true);
                                            }}
                                            className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all"
                                        >✏️</button>
                                        <button onClick={() => handleDeleteItem(item._id)} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all">🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );


            case 'owner-promotions':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-[40px] border border-gray-100">
                        <span className="text-6xl mb-4 block">🎟️</span>
                        <h3 className="text-xl font-black italic">Promotions & Marketing</h3>
                        <p className="text-gray-400 text-sm mt-2 font-medium">Create coupon codes and festival specials coming soon!</p>
                        <button className="mt-8 bg-black text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest opacity-20 pointer-events-none">Get Early Access</button>
                    </motion.div>
                );

            case 'owner-financials':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <span>💰</span> Financial Overview
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 rounded-3xl bg-green-50">
                                    <p className="text-[10px] font-black uppercase text-green-600 tracking-widest mb-1">Available for Payout</p>
                                    <p className="text-3xl font-black text-green-700 italic">₹{insights?.totalRevenue || 0}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-blue-50">
                                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Commission Collected</p>
                                    <p className="text-3xl font-black text-blue-700 italic">₹{(insights?.totalRevenue || 0) * 0.1}</p>
                                </div>
                            </div>
                            <button className="w-full mt-6 bg-green-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-100 opacity-50 cursor-not-allowed">Request Withdrawal</button>
                        </section>
                    </motion.div>
                );



            case 'owner-settings':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <span>⚙️</span> Operational Settings
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-black text-sm text-gray-900">Shop Availability</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Toggle if you are taking orders right now</p>
                                    </div>
                                    <button
                                        onClick={() => setShopData({ ...shopData, settings: { ...shopData.settings, isOpen: !shopData.settings.isOpen } })}
                                        className={`w-14 h-7 rounded-full relative transition-colors ${shopData.settings.isOpen ? 'bg-primary' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${shopData.settings.isOpen ? 'left-8' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-black text-sm text-gray-900">COD (Cash on Delivery)</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Enable or disable cash payments</p>
                                    </div>
                                    <button
                                        onClick={() => setShopData({ ...shopData, settings: { ...shopData.settings, acceptsCOD: !shopData.settings.acceptsCOD } })}
                                        className={`w-14 h-7 rounded-full relative transition-colors ${shopData.settings.acceptsCOD ? 'bg-primary' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${shopData.settings.acceptsCOD ? 'left-8' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-6 mt-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Opening Time</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary transition-all"
                                            value={shopData.timing.open}
                                            onChange={e => setShopData({ ...shopData, timing: { ...shopData.timing, open: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Closing Time</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary transition-all"
                                            value={shopData.timing.close}
                                            onChange={e => setShopData({ ...shopData, timing: { ...shopData.timing, close: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-6">
                                    <button
                                        onClick={handleUpdateShopSettings}
                                        className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition shadow-lg shadow-red-100"
                                    >
                                        Save All Settings
                                    </button>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                );

            case 'owner-loyalty':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <section className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-[40px] text-white overflow-hidden relative group">
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-80">Loyalty Balance</h3>
                                <div className="flex items-end gap-2 mb-6">
                                    <span className="text-6xl font-black italic">₹{user?.loyaltyPoints}</span>
                                    <span className="text-xs font-black mb-2 opacity-80">BHOJAN CREDITS</span>
                                </div>
                                <button className="bg-white/20 backdrop-blur-md border border-white/30 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/30 transition">Redeem Now</button>
                            </div>
                            <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 rotate-12 transition-transform group-hover:scale-125">💎</div>
                            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                <div className="text-3xl mb-3">🏅</div>
                                <h4 className="font-black text-xs uppercase tracking-widest mb-1">Badges Earned</h4>
                                <p className="text-2xl font-black text-gray-900">{user?.badges?.length || 0}</p>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                <div className="text-3xl mb-3">🏆</div>
                                <h4 className="font-black text-xs uppercase tracking-widest mb-1">Total Orders</h4>
                                <p className="text-2xl font-black text-gray-900">{orders.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                <div className="text-3xl mb-3">🔥</div>
                                <h4 className="font-black text-xs uppercase tracking-widest mb-1">Current Streak</h4>
                                <p className="text-2xl font-black text-gray-900">5 Days</p>
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <span>🎖️</span> Achievement Showcase
                            </h3>
                            <div className="flex flex-wrap gap-4">
                                {user?.badges?.map((badge, idx) => (
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        key={idx}
                                        className="w-24 h-24 bg-gray-50 rounded-3xl flex flex-col items-center justify-center border border-gray-100 group cursor-pointer relative"
                                    >
                                        <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">{badge.icon}</span>
                                        <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400 text-center px-1">{badge.name}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    </motion.div>
                );

            case 'security':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <span>🔑</span> Change Password
                            </h3>
                            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 transition-all"
                                        value={passwordData.currentPassword}
                                        onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">New Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 transition-all"
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 transition-all"
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition shadow-lg shadow-amber-100"
                                >
                                    Update Password
                                </button>
                            </form>
                        </section>

                        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-primary">
                                <span>⚠️</span> Danger Zone
                            </h3>
                            <p className="text-sm text-gray-500 mb-6 font-medium">Once you delete your account, there is no going back. Please be certain.</p>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="border-2 border-primary text-primary px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary hover:text-white transition"
                            >
                                Delete My Account
                            </button>
                        </section>
                    </motion.div>
                );

            case 'orders':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900">Order History</h2>
                            <div className="flex gap-2">
                                <select
                                    className="bg-white border-gray-200 rounded-xl text-[10px] font-black uppercase px-4 py-2 outline-none cursor-pointer"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                >
                                    <option>All Time</option>
                                    <option>Last 3 Months</option>
                                    <option>{new Date().getFullYear()}</option>
                                    <option>{new Date().getFullYear() - 1}</option>
                                </select>
                            </div>
                        </div>
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[40px] border border-gray-100">
                                <span className="text-6xl mb-4 block">🛒</span>
                                <h3 className="text-xl font-black">No orders yet</h3>
                                <p className="text-gray-400 text-sm mt-2 font-medium">Your empty stomach is waiting for some delicious food!</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {filteredOrders.map((order) => (
                                    <div key={order._id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-amber-500/5 transition-all group overflow-hidden relative">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-xl">🏠</div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 line-clamp-1">{order.shop?.name}</h4>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase">{new Date(order.createdAt).toDateString()}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-black text-gray-900">₹{order.totalAmount}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex -space-x-3">
                                                {order.items.slice(0, 3).map((item, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black shadow-sm">
                                                        {item.quantity}x
                                                    </div>
                                                ))}
                                                {order.items.length > 3 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-black shadow-sm">
                                                        +{order.items.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/track/${order._id}`)}
                                                    className="bg-primary text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition shadow-lg"
                                                >
                                                    Track Order
                                                </button>
                                                {order.orderStatus === 'Placed' && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order._id)}
                                                        className="bg-red-50 text-red-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dashed border-red-200 hover:bg-red-100 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleReorder(order)}
                                                    className="bg-gray-50 text-gray-700 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition"
                                                >
                                                    Reorder
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                );

            case 'owner-overview':
            case 'analytics':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[32px] text-white shadow-xl">
                            <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                                <span>📊</span> {isOwner ? 'Business Analytics' : 'My Insights'}
                            </h3>
                            <p className="text-indigo-100 text-sm">
                                {isOwner ? 'Predictive analytics and sales forecasting' : 'Track your spending, favorites, and health metrics'}
                            </p>
                        </div>

                        {!isOwner ? (
                            // Customer Analytics
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-black text-gray-900">Total Spent</h4>
                                        <span className="text-2xl">💰</span>
                                    </div>
                                    <p className="text-3xl font-black text-primary">₹{orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(0)}</p>
                                    <p className="text-xs text-gray-400 mt-2">Across {orders.length} orders</p>
                                </div>

                                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-black text-gray-900">Avg Order</h4>
                                        <span className="text-2xl">📈</span>
                                    </div>
                                    <p className="text-3xl font-black text-green-600">
                                        ₹{orders.length > 0 ? (orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length).toFixed(0) : 0}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">Per order value</p>
                                </div>

                                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-black text-gray-900">Loyalty Points</h4>
                                        <span className="text-2xl">💎</span>
                                    </div>
                                    <p className="text-3xl font-black text-amber-600">{user?.loyaltyPoints || 0}</p>
                                    <p className="text-xs text-gray-400 mt-2">= ₹{((user?.loyaltyPoints || 0) / 10).toFixed(0)} value</p>
                                </div>
                            </div>
                        ) : (
                            // Owner Analytics
                            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                <h4 className="font-black text-lg mb-6 flex items-center gap-2">
                                    <span>📈</span> Sales Overview
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center p-6 bg-green-50 rounded-2xl">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Revenue</p>
                                        <p className="text-3xl font-black text-green-600">₹{shop?.revenue || 0}</p>
                                    </div>
                                    <div className="text-center p-6 bg-blue-50 rounded-2xl">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Orders</p>
                                        <p className="text-3xl font-black text-blue-600">{shop?.totalOrders || 0}</p>
                                    </div>
                                    <div className="text-center p-6 bg-amber-50 rounded-2xl">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Pending</p>
                                        <p className="text-3xl font-black text-amber-600">{shop?.pendingOrders || 0}</p>
                                    </div>
                                </div>
                                <p className="text-center text-sm text-gray-500 mt-6">
                                    📊 Visit <a href="/analytics" className="text-primary font-bold hover:underline">Analytics Dashboard</a> for detailed insights
                                </p>
                            </div>
                        )}
                    </motion.div>
                );

            case 'preferences':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <span>🥦</span> Dietary Preferences
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {['Vegan', 'Jain', 'Keto', 'Gluten-Free', 'Non-Veg', 'Organic', 'Dairy-Free'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            const newTags = preferences.dietaryRestrictions.includes(tag)
                                                ? preferences.dietaryRestrictions.filter(t => t !== tag)
                                                : [...preferences.dietaryRestrictions, tag];
                                            setPreferences({ ...preferences, dietaryRestrictions: newTags });
                                        }}
                                        className={`p-4 rounded-2xl border-2 transition-all font-bold text-xs ${preferences.dietaryRestrictions.includes(tag)
                                            ? 'bg-amber-50 border-amber-500 text-amber-700'
                                            : 'bg-gray-50 border-transparent text-gray-400 hover:border-gray-200'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Spice Preference</label>
                                    <div className="flex gap-4">
                                        {['Mild', 'Medium', 'Spicy'].map(level => (
                                            <button
                                                key={level}
                                                onClick={() => setPreferences({ ...preferences, spicePreference: level })}
                                                className={`flex-1 py-3 rounded-xl border-2 font-black text-xs transition-all ${preferences.spicePreference === level
                                                    ? 'bg-orange-50 border-orange-500 text-orange-700'
                                                    : 'bg-gray-50 border-transparent text-gray-400'
                                                    }`}
                                            >
                                                {level === 'Mild' ? '🌱' : level === 'Medium' ? '🌶️' : '🔥'} {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Allergies (comma separated)</label>
                                    <textarea
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 transition-all min-h-[100px]"
                                        placeholder="e.g. Peanuts, Shellfish"
                                        value={preferences.allergies.join(', ')}
                                        onChange={e => setPreferences({ ...preferences, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleUpdatePreferences}
                                        disabled={updating}
                                        className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition shadow-lg shadow-amber-100"
                                    >
                                        {updating ? 'Saving...' : 'Save Preferences'}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                );

            case 'settings':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <span>🔔</span> Notifications
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { id: 'email', label: 'Email Notifications', sub: 'Orders updates, monthly reports' },
                                    { id: 'sms', label: 'SMS Alerts', sub: 'Instant order alerts and promos' },
                                    { id: 'push', label: 'Push Notifications', sub: 'App alerts and delivery tracking' }
                                ].map(notif => (
                                    <div key={notif.id} className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-black text-sm text-gray-900">{notif.label}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{notif.sub}</p>
                                        </div>
                                        <button
                                            onClick={() => setNotificationSettings({ ...notificationSettings, [notif.id]: !notificationSettings[notif.id] })}
                                            className={`w-12 h-6 rounded-full relative transition-colors ${notificationSettings[notif.id] ? 'bg-amber-500' : 'bg-gray-200'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationSettings[notif.id] ? 'left-7' : 'left-1'}`}></div>
                                        </button>
                                    </div>
                                ))}
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleUpdateSettings}
                                        disabled={updating}
                                        className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition shadow-lg shadow-amber-100"
                                    >
                                        {updating ? 'Saving...' : 'Save Settings'}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                );

            case 'payments':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 text-9xl text-amber-500/5 rotate-12">💳</div>
                            <h3 className="text-2xl font-black mb-8 relative z-10">Payment Hub</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                <div className="p-8 rounded-[32px] bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-xl shadow-indigo-200">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Bhojan Money</p>
                                    <p className="text-4xl font-black mb-6">₹{user?.bhojanMoney || 0}</p>
                                    <button
                                        onClick={() => {
                                            const amt = prompt('Enter amount to add (₹):', '500');
                                            if (amt) handleTopUp(Number(amt));
                                        }}
                                        className="w-full bg-white/20 hover:bg-white/30 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        + Add Money
                                    </button>
                                </div>

                                <div className="p-8 rounded-[32px] bg-amber-50 border-2 border-amber-200 text-amber-900 border-dashed">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Wallet Credits</p>
                                    <p className="text-4xl font-black mb-6">₹{user?.walletBalance || 0}</p>
                                    <p className="text-[8px] font-black uppercase text-amber-500">Includes Refunds & Rewards</p>
                                </div>

                                <div className="p-8 rounded-[32px] bg-gray-50 border border-gray-100 flex flex-col justify-center">
                                    <h5 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-3">Redeem Gift Card</h5>
                                    <div className="flex gap-2">
                                        <input
                                            id="giftCode"
                                            type="text"
                                            placeholder="XXXX-XXXX"
                                            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold placeholder:opacity-30"
                                        />
                                        <button
                                            onClick={() => handleRedeemGiftCard(document.getElementById('giftCode').value)}
                                            className="bg-black text-white px-4 rounded-xl font-black text-[10px] uppercase"
                                        >
                                            OK
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                            <h4 className="text-xl font-black mb-6">Transaction History</h4>
                            {transactions.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 italic">No transactions found</div>
                            ) : (
                                <div className="space-y-4">
                                    {transactions.map(tx => (
                                        <div key={tx._id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${tx.type === 'TopUp' ? 'bg-green-100 text-green-600' :
                                                    tx.type === 'Payment' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {tx.type === 'TopUp' ? '📥' : tx.type === 'Payment' ? '📤' : '🎁'}
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-sm">{tx.description}</h5>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(tx.createdAt).toLocaleString()} • {tx.paymentMethod}</p>
                                                </div>
                                            </div>
                                            <p className={`font-black text-sm italic ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.amount > 0 ? '+' : ''}₹{tx.amount}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </motion.div>
                );

            case 'wishlist':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <header className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                            <h3 className="text-2xl font-black flex items-center gap-2"><span>❤️</span> My Wishlist</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Quick access to your favorite dishes</p>
                        </header>

                        {wishlistItems.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[40px] border border-gray-100 italic text-gray-400 font-bold">
                                Your wishlist is empty. Start adding some favorites!
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {wishlistItems.map(item => (
                                    <div key={item._id} className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm relative group overflow-hidden">
                                        <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded-2xl mb-4 bg-gray-50" />
                                        <button
                                            onClick={() => handleToggleWishlist(item._id)}
                                            className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur-sm rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                        >
                                            ❤️
                                        </button>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-black text-lg text-gray-900">{item.name}</h4>
                                            <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">₹{item.price}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium line-clamp-2 mb-4">{item.description}</p>
                                        <button
                                            onClick={() => navigate(`/shop/${item.shop}`)}
                                            className="w-full bg-gray-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                                        >
                                            View Shop
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                );

            case 'support':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <span>📧</span> Raise a Concern
                            </h3>
                            <form onSubmit={handleRaiseTicket} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subject</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500"
                                            placeholder="What's the issue?"
                                            value={ticketFormData.subject}
                                            onChange={e => setTicketFormData({ ...ticketFormData, subject: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
                                        <select
                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500"
                                            value={ticketFormData.category}
                                            onChange={e => setTicketFormData({ ...ticketFormData, category: e.target.value })}
                                        >
                                            <option value="Order">Order Issue</option>
                                            <option value="Delivery">Delivery Partner</option>
                                            <option value="Payment">Payment Problem</option>
                                            <option value="App">App Bug</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    {ticketFormData.category === 'Order' && (
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Order</label>
                                            <select
                                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500"
                                                value={ticketFormData.orderId || ''}
                                                onChange={e => setTicketFormData({ ...ticketFormData, orderId: e.target.value })}
                                            >
                                                <option value="">-- Select related order --</option>
                                                {orders.map(order => (
                                                    <option key={order._id} value={order._id}>
                                                        Order #{order._id.slice(-6).toUpperCase()} - {new Date(order.createdAt).toLocaleDateString()} - ₹{order.totalAmount}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Message</label>
                                    <textarea
                                        required
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 min-h-[120px]"
                                        placeholder="Explain the problem in detail..."
                                        value={ticketFormData.message}
                                        onChange={e => setTicketFormData({ ...ticketFormData, message: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="bg-black text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition shadow-lg shadow-gray-200 w-full md:w-auto"
                                >
                                    {updating ? 'Sending...' : 'Submit Ticket'}
                                </button>
                            </form>
                        </section>
                    </motion.div >
                );

            default:
                return null;
        }
    };

    // --- ADMIN HELPER RENDERERS ---

    const renderAdminOverview = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Platform Revenue', val: `₹${adminData.stats?.totalRevenue || 0}`, icon: '💰', color: 'from-green-600 to-emerald-500' },
                    { label: 'Active Shops', val: adminData.stats?.totalShops || 0, icon: '🏪', color: 'from-blue-600 to-indigo-500' },
                    { label: 'Total Users', val: adminData.stats?.totalUsers || 0, icon: '👥', color: 'from-purple-600 to-violet-500' },
                    { label: 'Total Orders', val: adminData.stats?.totalOrders || 0, icon: '🧾', color: 'from-orange-600 to-amber-500' },
                ].map((stat, i) => (
                    <div key={i} className={`bg-gradient-to-br ${stat.color} p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden group hover:scale-105 transition-all duration-300`}>
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">{stat.label}</h4>
                        <p className="text-3xl font-black">{stat.val}</p>
                        <div className="absolute top-0 right-0 p-4 text-5xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform">{stat.icon}</div>
                    </div>
                ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                        <span>🛡️</span> Quick Verifications
                    </h3>
                    <div className="space-y-4">
                        {adminData.shops.filter(s => s.owner?.businessVerification?.status === 'Pending').slice(0, 3).map(shop => (
                            <div key={shop._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <img src={shop.logo} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                    <div>
                                        <h4 className="font-black text-sm">{shop.name}</h4>
                                        <p className="text-[10px] font-black text-gray-400 tracking-widest">{shop.owner?.fullname}</p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveTab('admin-shops')} className="cursor-pointer text-indigo-600 font-black text-[10px] uppercase hover:underline">Review →</button>
                            </div>
                        ))}
                        {adminData.shops.filter(s => s.owner?.businessVerification?.status === 'Pending').length === 0 && (
                            <div className="text-center py-8">
                                <span className="text-4xl block mb-2">✅</span>
                                <p className="text-gray-400 font-black text-xs uppercase italic">Everything is verified!</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                        <span>📈</span> Growth Trends
                    </h3>
                    <div className="h-48 flex items-end justify-between gap-2 px-4">
                        {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                            <div key={i} className="flex-1 bg-indigo-100 rounded-t-xl relative group" style={{ height: `${h}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Day {i + 1}</div>
                                <div className={`absolute bottom-0 left-0 w-full rounded-t-xl bg-indigo-600 transition-all duration-1000 ${loading ? 'h-0' : 'h-full scale-y-100'}`}></div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-[8px] font-black uppercase text-gray-400 tracking-widest">
                        <span>Day 1</span>
                        <span>Day 7 (Peak)</span>
                    </div>
                </section>
            </div>
        </motion.div>
    );

    const renderAdminUsers = () => {
        const filteredUsers = (adminData.users || []).filter(u => {
            const matchesSearch = !adminSearchTerm ||
                u.fullname?.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                u.mobile?.includes(adminSearchTerm);

            const matchesRole = adminRoleFilter === 'All Roles' || u.role === adminRoleFilter;

            return matchesSearch && matchesRole;
        });

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <header className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <div>
                        <h3 className="text-2xl font-black flex items-center gap-2"><span>👥</span> User Hub</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage global user accounts & permissions</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Platform Status</p>
                        <p className="text-2xl font-black">Live 🟢</p>
                    </div>
                </header>

                <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex gap-4">
                        <input
                            type="text"
                            placeholder="Search users by name, email or mobile..."
                            className="flex-1 bg-gray-50 rounded-2xl px-6 py-3 text-sm font-bold border-none outline-none focus:ring-2 ring-indigo-600/20"
                            value={adminSearchTerm}
                            onChange={(e) => setAdminSearchTerm(e.target.value)}
                        />
                        <select
                            className="bg-gray-50 rounded-2xl px-6 py-3 text-sm font-black uppercase border-none outline-none"
                            value={adminRoleFilter}
                            onChange={(e) => setAdminRoleFilter(e.target.value)}
                        >
                            <option value="All Roles">All Roles</option>
                            <option value="Customer">Customer</option>
                            <option value="Owner">Owner</option>
                            <option value="Delivery">Delivery</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Identity</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Role & Status</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Security</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map(u => (
                                    <tr key={u._id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg font-black shadow-inner">
                                                    {u.fullname?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-sm">{u.fullname}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <select
                                                    onChange={(e) => handleUpdateUserRole(u._id, e.target.value)}
                                                    value={u.role}
                                                    className="bg-gray-100 border-none rounded-lg text-[8px] font-black uppercase px-2 py-1 outline-none appearance-none cursor-pointer"
                                                >
                                                    {['Customer', 'Owner', 'Delivery', 'Admin'].map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${(!u.status || u.status === 'Active') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    {u.status || 'Active'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleResetUserPassword(u._id)} className="p-2 bg-gray-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-xs" title="Reset Password">🔑</button>
                                                <button className="p-2 bg-gray-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-xs" title="Force Logout">📱</button>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {(!u.status || u.status === 'Active') ? (
                                                    <button onClick={() => handleUpdateUserStatus(u._id, 'Suspended')} className="bg-primary text-white text-[8px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl">Suspend</button>
                                                ) : (
                                                    <button onClick={() => handleUpdateUserStatus(u._id, 'Active')} className="bg-green-600 text-white text-[8px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl">Activate</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </motion.div>
        );
    };

    const renderAdminShops = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <header className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black flex items-center gap-2"><span>🏪</span> Shop Control</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage restaurant verifications & featured status</p>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(adminData.shops || []).map(shop => (
                    <div key={shop._id} className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden group">
                        <div className="relative h-40">
                            <img src={shop.banner || shop.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-4 left-4 flex gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white ${shop.owner?.businessVerification?.status === 'Verified' ? 'bg-green-500' : 'bg-amber-500'}`}>
                                    {shop.owner?.businessVerification?.status || 'Pending'}
                                </span>
                                {shop.isFeatured && <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-indigo-600 text-white">✨ Featured</span>}
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <img src={shop.logo} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt="" />
                                <div>
                                    <h4 className="font-black text-sm">{shop.name}</h4>
                                    <p className="text-[10px] font-bold text-gray-400">{shop.city}, {shop.address?.slice(0, 20)}...</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => handleToggleShopField(shop._id, 'isFeatured')}
                                    className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-wider border-2 transition-all ${shop.isFeatured ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-100 text-gray-400 hover:border-indigo-600 hover:text-indigo-600'}`}
                                >
                                    {shop.isFeatured ? 'Unfeature' : 'Feature'}
                                </button>
                                <button
                                    onClick={() => handleToggleShopField(shop._id, 'isLocal')}
                                    className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-wider border-2 transition-all ${shop.isLocal ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-100 text-gray-400 hover:border-orange-500 hover:text-orange-500'}`}
                                >
                                    {shop.isLocal ? 'Remove Gem' : 'Make Gem'}
                                </button>
                                {shop.owner?.businessVerification?.status === 'Pending' && (
                                    <div className="col-span-2 flex gap-2 pt-2">
                                        <button onClick={() => handleVerifyShop(shop._id, 'Verified')} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-green-100">Approve Business</button>
                                        <button onClick={() => handleVerifyShop(shop._id, 'Rejected')} className="flex-1 bg-primary text-white py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-red-100">Reject</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </section>
        </motion.div>
    );

    const renderAdminItems = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <header className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black flex items-center gap-2"><span>🍳</span> Inventory Moderation</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Review & moderate food items across all restaurants</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center px-6 border-r border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase">Pending Review</p>
                        <p className="text-xl font-black text-amber-500">{(adminData.items || []).filter(i => i.moderationStatus === 'Pending').length}</p>
                    </div>
                    <div className="text-center px-6">
                        <p className="text-[8px] font-black text-gray-400 uppercase">Total Items</p>
                        <p className="text-xl font-black text-gray-900">{(adminData.items || []).length}</p>
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(adminData.items || []).map(item => (
                    <div key={item._id} className={`bg-white rounded-[40px] border-2 transition-all shadow-sm overflow-hidden group ${item.moderationStatus === 'Rejected' ? 'border-primary/20 bg-red-50/10' : 'border-transparent hover:border-indigo-600'}`}>
                        <div className="relative h-48">
                            <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                                <span className={`text-[8px] font-black uppercase tracking-widest ${item.moderationStatus === 'Approved' ? 'text-green-600' : item.moderationStatus === 'Rejected' ? 'text-primary' : 'text-amber-500'}`}>
                                    {item.moderationStatus || 'Approved'}
                                </span>
                            </div>
                        </div>
                        <div className="p-6">
                            <h4 className="font-black text-sm mb-1 line-clamp-1">{item.name}</h4>
                            <p className="text-[10px] font-bold text-indigo-600 mb-4">{item.shop?.name}</p>
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-2xl mb-4">
                                <span className="text-[10px] font-bold text-gray-500">{item.category}</span>
                                <span className="text-sm font-black text-gray-900">₹{item.price}</span>
                            </div>
                            <div className="flex gap-2">
                                {item.moderationStatus !== 'Approved' && (
                                    <button onClick={() => handleModerateItem(item._id, 'Approved')} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-green-100">Approve</button>
                                )}
                                {item.moderationStatus !== 'Rejected' && (
                                    <button onClick={() => handleModerateItem(item._id, 'Rejected')} className="flex-1 bg-primary text-white py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-red-100">Reject</button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </section>
        </motion.div>
    );

    const renderAdminOrders = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <header className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black flex items-center gap-2"><span>🧾</span> Order Central</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Live platform order stream & monitoring</p>
                </div>
            </header>

            <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Merchant & Customer</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Value & Status</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Time</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(adminData.orders || []).map(order => (
                                <tr key={order._id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <span className="font-black text-xs text-indigo-600">#{order._id.slice(-6).toUpperCase()}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div>
                                            <h4 className="font-black text-sm">{order.shop?.name}</h4>
                                            <p className="text-[10px] font-bold text-gray-400">Cust: {order.user?.fullname}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-sm text-gray-900">₹{order.totalAmount}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-600' :
                                                order.orderStatus === 'Cancelled' ? 'bg-red-100 text-primary' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {order.orderStatus}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-[10px] font-bold text-gray-400">
                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors">Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </motion.div>
    );

    const renderAdminFinancials = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <header className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black flex items-center gap-2"><span>💰</span> Financial Dashboard</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Platform commissions & settlement reports</p>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Platform Commission (10%)', val: `₹${(adminData.stats?.totalRevenue * 0.1 || 0).toLocaleString()}`, icon: '🏷️', color: 'from-indigo-600 to-indigo-400' },
                    { label: 'Merchant Payouts', val: `₹${(adminData.stats?.totalRevenue * 0.9 || 0).toLocaleString()}`, icon: '🏦', color: 'from-emerald-600 to-emerald-400' },
                    { label: 'Active Refunds', val: '₹420', icon: '🔙', color: 'from-primary to-red-400' }
                ].map((stat, i) => (
                    <div key={i} className={`bg-gradient-to-br ${stat.color} p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden`}>
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">{stat.label}</h4>
                        <p className="text-3xl font-black">{stat.val}</p>
                        <div className="absolute top-0 right-0 p-4 text-5xl opacity-10 rotate-12">{stat.icon}</div>
                    </div>
                ))}
            </section>

            <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black mb-6">Recent Transactions</h3>
                <div className="space-y-4">
                    {(adminData.orders || []).slice(0, 5).map(order => (
                        <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm">💳</div>
                                <div>
                                    <h4 className="font-black text-sm">Payment from {order.user?.fullname}</h4>
                                    <p className="text-[10px] font-bold text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-sm text-green-600">+₹{order.totalAmount}</p>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Commission: ₹{order.totalAmount * 0.1}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </motion.div>
    );

    const renderAdminSupport = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <header className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black flex items-center gap-2"><span>🎫</span> Support Tickets</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage and resolve user issues</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center px-6 border-r border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase">Open</p>
                        <p className="text-xl font-black text-amber-500">{supportTickets.filter(t => t.status === 'Open').length}</p>
                    </div>
                    <div className="text-center px-6">
                        <p className="text-[8px] font-black text-gray-400 uppercase">Total</p>
                        <p className="text-xl font-black text-gray-900">{supportTickets.length}</p>
                    </div>
                </div>
            </header>

            <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">User & Issue</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {supportTickets.map(ticket => (
                                <tr key={ticket._id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <p className="text-[10px] font-bold text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                        <p className="text-[8px] font-black text-gray-400">{new Date(ticket.createdAt).toLocaleTimeString()}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div>
                                            <h4 className="font-black text-sm mb-1">{ticket.subject}</h4>
                                            <p className="text-xs text-gray-600 mb-1 line-clamp-2">{ticket.message}</p>
                                            <div className="flex gap-2 items-center">
                                                <span className="text-[10px] font-bold text-indigo-600">User: {ticket.user?.fullname}</span>
                                                {ticket.orderId && <span className="text-[10px] font-bold text-amber-600">Order: #{ticket.orderId._id.slice(-6).toUpperCase()}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <select
                                            value={ticket.status}
                                            onChange={(e) => handleUpdateTicketStatus(ticket._id, e.target.value)}
                                            className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider outline-none border-none ${ticket.status === 'Open' ? 'bg-red-100 text-red-600' :
                                                ticket.status === 'In-Progress' ? 'bg-amber-100 text-amber-600' :
                                                    'bg-green-100 text-green-600'
                                                }`}
                                        >
                                            <option value="Open">Open</option>
                                            <option value="In-Progress">In-Progress</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="text-[10px] font-black uppercase text-gray-400 hover:text-indigo-600 transition-colors">View Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </motion.div>
    );

    const renderAdminSettings = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <header className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-black flex items-center gap-2"><span>⚙️</span> Platform Settings</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configure global platform parameters & fees</p>
            </header>

            <form onSubmit={handleUpdateSystemConfig} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600">Standard Fees & Taxes</h4>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Global Delivery Charge (₹)</label>
                            <input type="number" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none outline-none focus:ring-2 ring-indigo-600/20"
                                value={adminData.config?.deliveryCharges || ''} onChange={e => setAdminData({ ...adminData, config: { ...adminData.config, deliveryCharges: Number(e.target.value) } })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tax Percentage (%)</label>
                            <input type="number" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none outline-none focus:ring-2 ring-indigo-600/20"
                                value={adminData.config?.taxPercentage || ''} onChange={e => setAdminData({ ...adminData, config: { ...adminData.config, taxPercentage: Number(e.target.value) } })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Platform Fee (₹)</label>
                            <input type="number" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none outline-none focus:ring-2 ring-indigo-600/20"
                                value={adminData.config?.platformFee || ''} onChange={e => setAdminData({ ...adminData, config: { ...adminData.config, platformFee: Number(e.target.value) } })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Referral Bonus (Pts)</label>
                            <input type="number" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none outline-none focus:ring-2 ring-indigo-600/20"
                                value={adminData.config?.referralBonus || ''} onChange={e => setAdminData({ ...adminData, config: { ...adminData.config, referralBonus: Number(e.target.value) } })} />
                        </div>
                    </div>
                </section>

                <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600">System Controls</h4>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                            <div>
                                <h5 className="font-black text-sm">Maintenance Mode</h5>
                                <p className="text-[10px] font-bold text-gray-500">Redirect users to 'Under Construction' page</p>
                            </div>
                            <input type="checkbox" className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500"
                                checked={adminData.config?.maintenanceMode || false} onChange={e => setAdminData({ ...adminData, config: { ...adminData.config, maintenanceMode: e.target.checked } })} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                            <div>
                                <h5 className="font-black text-sm">Surge Pricing</h5>
                                <p className="text-[10px] font-bold text-gray-500">Enable 1.5x multiplier for peak hours</p>
                            </div>
                            <input type="checkbox" className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500"
                                checked={adminData.config?.surgePricing || false} onChange={e => setAdminData({ ...adminData, config: { ...adminData.config, surgePricing: e.target.checked } })} />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Global Announcement Banner</h4>
                        <textarea
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold min-h-[80px] focus:ring-2 ring-indigo-600/20"
                            placeholder="Type platform announcement here..."
                            value={adminData.config?.announcementBanner || ''}
                            onChange={e => setAdminData({ ...adminData, config: { ...adminData.config, announcementBanner: e.target.value } })}
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Global Categories</h4>
                        <div className="flex flex-wrap gap-2">
                            {(adminData.config?.globalCategories || ['Pizza', 'Burger', 'Biryani', 'Thali']).map((cat, idx) => (
                                <span key={idx} className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-2">
                                    {cat}
                                    <button type="button" onClick={() => {
                                        const newCats = adminData.config.globalCategories.filter((_, i) => i !== idx);
                                        setAdminData({ ...adminData, config: { ...adminData.config, globalCategories: newCats } });
                                    }} className="hover:text-primary">✕</button>
                                </span>
                            ))}
                            <button type="button" onClick={() => {
                                const cat = prompt('Enter new category:');
                                if (cat) {
                                    const current = adminData.config?.globalCategories || [];
                                    setAdminData({ ...adminData, config: { ...adminData.config, globalCategories: [...current, cat] } });
                                }
                            }} className="bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-[10px] font-black hover:bg-gray-200">
                                + Add New
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={updating} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 mt-6">
                        {updating ? 'Saving Changes...' : 'Save Global Config'}
                    </button>
                </section>

                <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600">Feature Flags</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enable or disable features instantly without code changes</p>

                    <div className="space-y-4">
                        {Object.entries(adminData.config?.featureFlags || {}).map(([flag, enabled]) => (
                            <div key={flag} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div className="flex-1">
                                    <h5 className="font-black text-sm capitalize">{flag.replace(/([A-Z])/g, ' $1')}</h5>
                                    <p className="text-[10px] font-bold text-gray-400">Control {flag} visibility</p>
                                </div>
                                <div
                                    onClick={() => {
                                        const newFlags = { ...adminData.config.featureFlags, [flag]: !enabled };
                                        setAdminData({ ...adminData, config: { ...adminData.config, featureFlags: newFlags } });
                                    }}
                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-all ${enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 flex gap-2">
                        <input
                            id="newFlagName"
                            type="text"
                            placeholder="New Flag Name..."
                            className="flex-1 bg-gray-50 rounded-xl p-3 text-xs font-bold border-none"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const name = document.getElementById('newFlagName').value;
                                if (name) {
                                    const newFlags = { ...adminData.config.featureFlags, [name]: false };
                                    setAdminData({ ...adminData, config: { ...adminData.config, featureFlags: newFlags } });
                                    document.getElementById('newFlagName').value = '';
                                }
                            }}
                            className="bg-indigo-600 text-white px-4 rounded-xl font-black text-[10px] uppercase shadow-md shadow-indigo-100"
                        >
                            Add
                        </button>
                    </div>
                </section>
            </form>
        </motion.div>
    );

    const renderAdminModerationHub = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <header className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-black flex items-center gap-2"><span>🛡️</span> Moderation & Security Hub</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Audit logs, fraud detection & user complaints</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <section className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <h4 className="text-sm font-black mb-6">Security Incident Log</h4>
                    <div className="space-y-4">
                        {[
                            { event: 'Suspicious Login Attempt', user: 'aditya@example.com', time: '2 mins ago', level: 'High' },
                            { event: 'Bulk Password Reset Trigger', user: 'admin', time: '1 hour ago', level: 'Med' },
                            { event: 'New Verification Request', user: 'Burger King Patna', time: '3 hours ago', level: 'Info' }
                        ].map((log, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border-l-4 border-indigo-600">
                                <div className="flex items-center gap-4">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm ${log.level === 'High' ? 'bg-red-100 text-primary' : 'bg-indigo-100 text-indigo-600'}`}>
                                        !
                                    </span>
                                    <div>
                                        <h5 className="font-black text-sm">{log.event}</h5>
                                        <p className="text-[10px] font-bold text-gray-500">{log.user} • {log.time}</p>
                                    </div>
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${log.level === 'High' ? 'bg-red-100 text-primary' : 'bg-gray-200 text-gray-600'}`}>
                                    {log.level}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm text-center">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">🤖</div>
                    <h4 className="text-lg font-black mb-2">AI Fraud Detection</h4>
                    <p className="text-xs font-medium text-gray-400 mb-6 italic uppercase tracking-widest">Scanning transactions in real-time</p>
                    <div className="space-y-4 text-left">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">All systems operational</span>
                        </div>
                        <div className="p-4 bg-indigo-600 rounded-2xl text-white">
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-1">Trust Score</p>
                            <p className="text-2xl font-black italic underline decoration-indigo-300">98.4%</p>
                        </div>
                    </div>
                </section>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800">
            {/* Sidebar */}
            <aside className="w-full md:w-80 bg-white/80 backdrop-blur-xl md:min-h-screen sticky top-16 md:h-[calc(100vh-64px)] overflow-y-auto border-r border-gray-100 p-6 z-10 transition-all duration-300">
                <div className="flex flex-col h-full">
                    {/* Profile Header Card */}
                    <div className="relative mb-10 group cursor-pointer">
                        <div className={`absolute inset-0 bg-gradient-to-br ${isAdmin ? 'from-indigo-500 to-purple-600' : isOwner ? 'from-red-500 to-orange-600' : 'from-amber-400 to-yellow-500'} rounded-[32px] blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500`}></div>
                        <div className="relative bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg bg-gradient-to-br ${isAdmin ? 'from-indigo-500 to-purple-600' : isOwner ? 'from-red-500 to-orange-600' : 'from-amber-400 to-yellow-500'}`}>
                                {user?.fullname?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-black text-gray-900 text-lg leading-tight truncate">{user?.fullname?.split(' ')[0]}</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                                    {isAdmin ? '👑 ADMIN' : isOwner ? '🏪 OWNER' : '👤 CUSTOMER'}
                                    {isOwner && user?.businessVerification?.status === 'Verified' && <span className="text-green-500" title="Verified">✅</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="flex-1 space-y-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl text-xs font-black uppercase tracking-widest transition-all duration-300 group relative overflow-hidden ${activeTab === tab.id
                                    ? (isAdmin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : isOwner ? 'bg-primary text-white shadow-lg shadow-red-200' : 'bg-amber-500 text-white shadow-lg shadow-amber-200')
                                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`text-xl transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>{tab.icon}</span>
                                <span className="relative z-10">{tab.label}</span>
                                {activeTab === tab.id && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                            </button>
                        ))}
                    </nav>

                    {/* Stats / Toggle Card */}
                    <div className={`mt-10 p-6 rounded-[32px] border relative overflow-hidden group ${isAdmin ? 'bg-indigo-50 border-indigo-100' : isOwner ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                        <div className={`absolute top-0 right-0 p-8 text-8xl opacity-5 rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110  ${isAdmin ? 'text-indigo-600' : isOwner ? 'text-primary' : 'text-amber-600'}`}>
                            {isAdmin ? '💰' : isOwner ? '📈' : '😋'}
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 italic relative z-10 ${isAdmin ? 'text-indigo-600' : isOwner ? 'text-primary' : 'text-amber-600'}`}>
                            {isAdmin ? 'System Revenue' : isOwner ? 'Total Revenue' : 'Satisfied Cravings'}
                        </p>
                        <p className={`text-3xl font-black mb-6 relative z-10 ${isAdmin ? 'text-indigo-900' : isOwner ? 'text-red-900' : 'text-amber-900'}`}>
                            {isAdmin ? `₹${adminData.stats?.totalRevenue || 0}` : isOwner ? `₹${insights?.totalRevenue || 0}` : `${orders.length} Orders`}
                        </p>

                        {(isAdmin || isOwner) && (
                            <button
                                onClick={handleSwitchMode}
                                className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 relative z-10 ${isShoppingMode
                                    ? 'bg-black text-white border-black shadow-lg hover:bg-gray-800'
                                    : (isAdmin ? 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white' : 'border-primary text-primary hover:bg-primary hover:text-white')
                                    }`}
                            >
                                {isShoppingMode ? '🔙 Back to Dashboard' : '🛒 Switch to Shopping'}
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-hidden">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 mb-1">{tabs.find(t => t.id === activeTab)?.label}</h1>
                        <p className="text-sm text-gray-500 font-medium">Manage your {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} settings and details properly.</p>
                    </div>
                    {/* Contextual Action Button (Optional Placeholder) */}
                    <div className="hidden md:block">
                        <span className="px-4 py-2 bg-white rounded-full text-xs font-black shadow-sm border border-gray-100 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            System Online
                        </span>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full"
                    >
                        {renderTabContent()}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Address Modal */}
            <AnimatePresence>
                {showAddressModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="p-8">
                                <h4 className="text-2xl font-black mb-6 flex items-center gap-2"><span>📍</span> Add New Address</h4>
                                <form onSubmit={handleAddAddress} className="space-y-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Home', 'Work', 'Other'].map(l => (
                                            <button
                                                key={l}
                                                type="button"
                                                onClick={() => setAddressFormData({ ...addressFormData, label: l })}
                                                className={`py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${addressFormData.label === l ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Street / Area</label>
                                        <input type="text" required className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none focus:ring-2 ring-primary transition-all" value={addressFormData.street} onChange={e => setAddressFormData({ ...addressFormData, street: e.target.value })} placeholder="Flat No, Building, Street" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pincode</label>
                                            <input
                                                type="text"
                                                required
                                                maxLength="6"
                                                className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none focus:ring-2 ring-primary transition-all"
                                                value={addressFormData.pincode}
                                                onChange={e => {
                                                    const pin = e.target.value.replace(/\D/g, ''); // Only numbers
                                                    setAddressFormData(prev => ({ ...prev, pincode: pin }));
                                                    if (pin.length === 6) {
                                                        fetch(`https://api.postalpincode.in/pincode/${pin}`)
                                                            .then(res => res.json())
                                                            .then(data => {
                                                                if (data[0].Status === 'Success') {
                                                                    const details = data[0].PostOffice[0];
                                                                    setAddressFormData(prev => ({
                                                                        ...prev,
                                                                        city: details.District,
                                                                        state: details.State
                                                                    }));
                                                                } else {
                                                                    alert('Invalid Pincode');
                                                                }
                                                            })
                                                            .catch(err => console.error('Pincode lookup failed', err));
                                                    }
                                                }}
                                                placeholder="6-digit PIN"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">City</label>
                                            <input type="text" required className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none focus:ring-2 ring-primary transition-all" value={addressFormData.city} onChange={e => setAddressFormData({ ...addressFormData, city: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">State</label>
                                        <select
                                            required
                                            className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none focus:ring-2 ring-primary transition-all outline-none"
                                            value={addressFormData.state || ''}
                                            onChange={e => setAddressFormData({ ...addressFormData, state: e.target.value })}
                                        >
                                            <option value="" disabled>Select State</option>
                                            {[
                                                "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
                                                "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu",
                                                "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
                                                "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
                                                "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
                                                "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
                                                "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
                                            ].map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3 pt-2 bg-gray-50 p-4 rounded-2xl">
                                        <input type="checkbox" id="isDefault" checked={addressFormData.isDefault} onChange={e => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })} className="w-5 h-5 rounded-md border-gray-300 text-primary focus:ring-primary" />
                                        <label htmlFor="isDefault" className="text-xs font-black text-gray-600 uppercase tracking-widest cursor-pointer">Set as default address</label>
                                    </div>
                                    <div className="flex justify-end gap-4 pt-4">
                                        <button type="button" onClick={() => setShowAddressModal(false)} className="px-6 py-3 font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
                                        <button type="submit" disabled={updating} className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-600 hover:shadow-xl transition-all">{updating ? 'Adding...' : 'Save Address'}</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Account Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-red-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, rotate: -5 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border-4 border-red-500 relative"
                        >
                            <div className="absolute top-0 inset-x-0 h-2 bg-stripes-red"></div>
                            <div className="p-10 text-center">
                                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce-slow">⚠️</div>
                                <h4 className="text-3xl font-black mb-3 text-gray-900">Final Warning</h4>
                                <p className="text-gray-500 font-medium mb-8 text-sm leading-relaxed">
                                    You are about to permanently delete your account.
                                    <br /> This action <strong className="text-red-600">cannot be undone</strong>.
                                </p>
                                <input
                                    type="password"
                                    className="w-full bg-gray-50 rounded-2xl p-5 text-center text-lg font-bold border-2 border-transparent focus:border-red-500 focus:bg-white mb-6 transition-all outline-none"
                                    placeholder="Enter Password to Confirm"
                                    value={deletePassword}
                                    onChange={e => setDeletePassword(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex flex-col gap-3">
                                    <button onClick={handleDeleteAccount} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 hover:scale-[1.02] transition-all">
                                        Delete Permanently
                                    </button>
                                    <button onClick={() => setShowDeleteConfirm(false)} className="w-full text-gray-400 py-3 font-black text-xs uppercase tracking-widest hover:text-gray-700 transition-colors">
                                        Cancel, keep my account
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserProfile;
