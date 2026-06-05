import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import OfflineStatus from '../../components/OfflineStatus';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReviewModal from '../../components/ReviewModal';
import OrderDetailsModal from '../../components/OrderDetailsModal';
import FoodQuests from '../../components/FoodQuests';
import MealPlanner from '../../components/MealPlanner';
import { toast } from 'react-toastify';
import { updateUser, logoutUser } from '../../redux/userSlice';
import { addToCart, reorder } from '../../redux/cartSlice';

const UserProfile = () => {
    const { user, isAuthenticated } = useSelector(state => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();
    const isOwner = user?.role === 'Owner';
    const isAdmin = user?.role === 'Admin';
    const isDelivery = user?.role === 'Delivery';
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || (isAdmin ? 'admin-overview' : isOwner ? 'owner-shops' : isDelivery ? 'delivery-available' : 'personal'));
    const [isMobileMain, setIsMobileMain] = useState(!searchParams.get('tab'));

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);
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

    // Email Campaign State
    const [campaignType, setCampaignType] = useState('festival');
    const [recipientType, setRecipientType] = useState('single');
    const [targetUserId, setTargetUserId] = useState('');
    const [campDetails, setCampDetails] = useState({
        festivalName: 'Diwali Dhamaka',
        discountPercent: '50',
        couponCode: 'DIWALI50',
        orderId: '',
        referralCode: ''
    });
    const [sendingCampaign, setSendingCampaign] = useState(false);

    // 2FA Security State
    const [backupCodes, setBackupCodes] = useState([]);
    const [showCodesModal, setShowCodesModal] = useState(false);
    const [availableOrders, setAvailableOrders] = useState([]);
    const [orderTimeouts, setOrderTimeouts] = useState({});
    const [deliveryStats, setDeliveryStats] = useState({ totalEarnings: 0, completedDeliveries: 0, rating: 4.8 });

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
    const [deliveryPartners, setDeliveryPartners] = useState([]);
    const [broadcastMsg, setBroadcastMsg] = useState({ title: '', message: '', role: 'Delivery' });
    const [manualAssign, setManualAssign] = useState({ orderId: '', partnerId: '' });


    // --- Order History State ---
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderSearchTerm, setOrderSearchTerm] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('All Status');
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [showPODModal, setShowPODModal] = useState(false);
    const [disputeFormData, setDisputeFormData] = useState({ type: 'Other', description: '', evidence: [], orderId: '' });
    const [podFormData, setPodFormData] = useState({ otp: '', photoUrl: '', signatureUrl: '' });
    const [zones, setZones] = useState([]);
    const [disputes, setDisputes] = useState([]);

    const getFilteredOrders = () => {
        if (!orders) return [];
        let filtered = orders;

        // Date Filter
        if (filterDate === 'Last 3 Months') {
            const now = new Date();
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(now.getMonth() - 3);
            filtered = filtered.filter(o => new Date(o.createdAt) >= threeMonthsAgo);
        } else if (filterDate !== 'All Time') {
            const y = Number(filterDate);
            if (!isNaN(y)) {
                filtered = filtered.filter(o => new Date(o.createdAt).getFullYear() === y);
            }
        }

        // Search Filter
        if (orderSearchTerm) {
            const lowerTerm = orderSearchTerm.toLowerCase();
            filtered = filtered.filter(o =>
                o.shop?.name?.toLowerCase().includes(lowerTerm) ||
                o.items.some(i => i.name?.toLowerCase().includes(lowerTerm))
            );
        }

        // Status Filter
        if (orderStatusFilter !== 'All Status') {
            filtered = filtered.filter(o => o.orderStatus === orderStatusFilter);
        }

        return filtered;

        if (filterDate === String(y - 1)) {
            return orders.filter(o => new Date(o.createdAt).getFullYear() === (y - 1));
        }

        return orders;
    };

    const filteredOrders = getFilteredOrders();

    const customerTabs = [
        { id: 'personal', label: 'Personal Info', icon: '👤' },
        { id: 'orders', label: 'Order History', icon: '🧾' },
        { id: 'quests', label: 'Food Quests', icon: '🎮' },
        { id: 'meal-planner', label: 'AI Meal Planner', icon: '🧠' },
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
        { id: 'admin-delivery', label: 'Delivery Fleet', icon: '🚚' },
        { id: 'admin-financials', label: 'Financials', icon: '💰' },
        { id: 'admin-settings', label: 'Platform Settings', icon: '⚙️' },
        { id: 'admin-moderation', label: 'Moderation', icon: '🛡️' },
        { id: 'admin-support', label: 'Support', icon: '🎫' },
        { id: 'admin-emails', label: 'Email Campaigns', icon: '✉️' },
        { id: 'personal', label: 'Account', icon: '👤' }
    ];

    const deliveryTabs = [
        { id: 'delivery-available', label: 'Available Orders', icon: '🛵' },
        { id: 'delivery-active', label: 'My Deliveries', icon: '📦' },
        { id: 'delivery-earnings', label: 'Earnings', icon: '💰' },
        { id: 'personal', label: 'Account Info', icon: '👤' },
        { id: 'support', label: 'Support', icon: '🎧' }
    ];

    const tabs = isAdmin ? adminTabs : isOwner ? ownerTabs : isDelivery ? deliveryTabs : customerTabs;

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
        setIsMobileMain(false);
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

    useEffect(() => {
        let watchId;
        if (isDelivery && user?.deliverySpecs?.isOnline) {
            if ("geolocation" in navigator) {
                watchId = navigator.geolocation.watchPosition(
                    async (position) => {
                        try {
                            const { latitude, longitude } = position.coords;
                            await api.put('/auth/delivery/location', { lat: latitude, lng: longitude });
                        } catch (err) {
                            console.error('Error updating location:', err);
                        }
                    },
                    (error) => console.error('Geolocation error:', error),
                    { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
                );
            }
        }
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [isDelivery, user?.deliverySpecs?.isOnline]);

    // Initialize tracking for new available orders & notifications
    useEffect(() => {
        if (!isDelivery || !availableOrders.length) return;

        let newTimeouts = { ...orderTimeouts };
        let hasNew = false;

        availableOrders.forEach(order => {
            if (newTimeouts[order._id] === undefined) {
                newTimeouts[order._id] = 60; // 60 seconds starting timer
                hasNew = true;

                // Browser Push Notification
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("New Delivery Order Available!", {
                        body: `Pickup from ${order.shop?.name}`,
                        icon: '/favicon.ico' // Or your app logo
                    });
                } else if ("Notification" in window && Notification.permission !== "denied") {
                    Notification.requestPermission();
                }

                // Audio Beep Alert
                const context = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = context.createOscillator();
                const gainParams = context.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, context.currentTime); // 800Hz beep
                gainParams.gain.setValueAtTime(0.5, context.currentTime);
                oscillator.connect(gainParams);
                gainParams.connect(context.destination);
                oscillator.start();
                oscillator.stop(context.currentTime + 0.3); // 0.3 seconds duration
            }
        });

        if (hasNew) {
            setOrderTimeouts(newTimeouts);
        }
    }, [availableOrders, isDelivery, orderTimeouts]);

    // Countdown Timer for Auto-Reject
    useEffect(() => {
        if (!isDelivery || !availableOrders.length) return;

        const interval = setInterval(() => {
            setOrderTimeouts(prev => {
                const updated = { ...prev };
                let needsUpdate = false;

                // Track which ones just hit 0 right now to avoid infinite loops during state update
                const expiredIds = [];

                Object.keys(updated).forEach(orderId => {
                    // Only countdown if it exists in availableOrders and > 0
                    if (availableOrders.some(o => o._id === orderId) && updated[orderId] > 0) {
                        updated[orderId] -= 1;
                        needsUpdate = true;

                        if (updated[orderId] === 0) {
                            expiredIds.push(orderId);
                        }
                    }
                });

                // Trigger auto-rejects outside the map
                expiredIds.forEach(id => {
                    handleRejectOrder(id);
                });

                return needsUpdate ? updated : prev;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [availableOrders, isDelivery]);

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
            }

            if (isOwner) {
                try {
                    const { data } = await api.get('/shop/my/shop');
                    if (data.success) {
                        setShop(data.shop);
                        setInsights(prev => ({ ...prev, ...data.insights }));
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
            }
            if (isAdmin) {
                try {
                    const { data } = await api.get('/admin/delivery/partners');
                    if (data.success) setDeliveryPartners(data.partners);
                } catch (e) {
                    console.error("Error fetching delivery partners", e);
                }
            }
            if (isDelivery || isAdmin) {
                try {
                    const [availableRes, myDeliveriesRes, zonesRes, disputesRes] = await Promise.all([
                        api.get('/order/delivery/available'),
                        api.get('/order/delivery/my'),
                        api.get('/order/zones'),
                        isAdmin ? api.get('/admin/delivery/disputes') : Promise.resolve({ data: { success: true, disputes: [] } })
                    ]);

                    if (availableRes.data.success) setAvailableOrders(availableRes.data.orders || []);
                    if (myDeliveriesRes.data.success) {
                        setOrders(myDeliveriesRes.data.orders || []);
                        const completed = myDeliveriesRes.data.orders.filter(o => o.orderStatus === 'Delivered');
                        const earnings = completed.reduce((sum, o) => sum + (o.deliveryFee || 40), 0);
                        setDeliveryStats({ totalEarnings: earnings, completedDeliveries: completed.length, rating: 4.9 });
                    }
                    if (zonesRes.data.success) setZones(zonesRes.data.zones || []);
                    if (disputesRes.data.success) setDisputes(disputesRes.data.disputes || []);
                } catch (e) {
                    console.error("Error fetching delivery data", e);
                }
            }

            // Always fetch customer specific data (Orders, Insights, etc.) for everyone
            // This allows Owners/Admins to also see their personal history as a customer
            const endpoints = [
                { path: '/order/my', setter: (d) => setOrders(d.orders || []) },
                { path: '/order/insights', setter: (d) => setInsights(prev => ({ ...prev, ...d.insights })) },
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

    const handleAssignOrder = async (orderId, partnerId) => {
        try {
            const { data } = await api.put('/admin/order/assign', { orderId, partnerId });
            if (data.success) {
                alert('Order assigned successfully!');
                fetchInitialData();
                setShowDetailsModal(false);
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Assignment failed');
        }
    };

    const handleBroadcastNotification = async () => {
        if (!broadcastMsg.title || !broadcastMsg.message) {
            return alert('Title and Message are required');
        }
        setUpdating(true);
        try {
            const { data } = await api.post('/admin/notifications/broadcast', {
                title: broadcastMsg.title,
                message: broadcastMsg.message,
                targetRole: broadcastMsg.role
            });
            if (data.success) {
                alert(data.message);
                setBroadcastMsg({ title: '', message: '', role: 'Delivery' });
            }
        } catch (error) {
            alert('Broadcast failed');
        } finally {
            setUpdating(false);
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

    const handleToggle2FA = async () => {
        setUpdating(true);
        try {
            const nextStatus = !user?.securitySettings?.twoFactorEnabled;
            const { data } = await api.put('/auth/me/2fa/toggle', { enabled: nextStatus });
            if (data.success) {
                dispatch(updateUser({ ...user, securitySettings: { ...user.securitySettings, twoFactorEnabled: nextStatus, backupCodes: data.backupCodes } }));
                toast.success(data.message);
                if (data.backupCodes && data.backupCodes.length > 0) {
                    setBackupCodes(data.backupCodes);
                    setShowCodesModal(true);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update 2FA status');
        } finally {
            setUpdating(false);
        }
    };

    const handleGenerateBackupCodes = async () => {
        setUpdating(true);
        try {
            const { data } = await api.put('/auth/me/2fa/backup-codes');
            if (data.success) {
                dispatch(updateUser({ ...user, securitySettings: { ...user.securitySettings, backupCodes: data.backupCodes } }));
                setBackupCodes(data.backupCodes);
                setShowCodesModal(true);
                toast.success('Generated new backup codes successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate backup codes');
        } finally {
            setUpdating(false);
        }
    };

    const handleGDPRDataExport = async () => {
        try {
            const { data } = await api.post('/auth/me/privacy/gdpr-export');
            if (data.success) {
                toast.success(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'GDPR request failed');
        }
    };

    const handleSendCampaign = async (e) => {
        e.preventDefault();
        setSendingCampaign(true);
        try {
            const { data } = await api.post('/admin/emails/send', {
                campaignType,
                recipientType,
                userId: recipientType === 'single' ? targetUserId : undefined,
                details: campDetails
            });
            if (data.success) {
                toast.success(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send campaign email');
        } finally {
            setSendingCampaign(false);
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
            // Fetch real key from backend instead of using placeholder
            const { data: keyData } = await api.get('/payment/key');
            const { data } = await api.post('/user-actions/wallet/topup/initiate', { amount });
            if (data.success) {
                const options = {
                    key: keyData.key,
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
                    method: {
                        upi: true,
                        card: true,
                        netbanking: true,
                        wallet: true,
                        paylater: true
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
            _id: item.item?._id || item.item || item._id,
            name: item.item?.name || item.name,
            price: item.price,
            image: item.item?.image || item.image,
            quantity: item.quantity,
            shop: order.shop // Crucial for cart shop tracking
        }));

        dispatch(reorder({ items, restaurant: order.shop }));
        toast.success('Items added to cart! Proceeding to checkout...');
        navigate('/cart');
    };

    const handleDownloadInvoice = (order) => {
        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.setTextColor(0, 0, 0);
            doc.text('BHOJAN', 105, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('Premium Food Delivery Service', 105, 27, { align: 'center' });

            doc.setDrawColor(200);
            doc.line(15, 35, 195, 35);

            // Invoice Info
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont(undefined, 'bold');
            doc.text('INVOICE', 15, 45);

            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text(`Order ID: #${order._id.toUpperCase()}`, 15, 52);
            doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 15, 57);
            doc.text(`Status: ${order.orderStatus.toUpperCase()}`, 15, 62);

            // Customer & Shop Details
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('Bill To:', 15, 75);
            doc.setFont(undefined, 'normal');
            doc.text(`${user?.fullname}`, 15, 80);

            doc.setFont(undefined, 'bold');
            doc.text('Restaurant:', 120, 75);
            doc.setFont(undefined, 'normal');
            doc.text(`${order.shop?.name}`, 120, 80);
            doc.setFontSize(8);
            doc.text(`${order.shop?.address}`, 120, 85, { maxWidth: 75 });

            // Items Table
            const tableColumn = ["Item", "Qty", "Price", "Total"];
            const tableRows = order.items.map(item => [
                item.name || item.item?.name,
                item.quantity,
                `Rs ${item.price.toFixed(2)}`,
                `Rs ${(item.price * item.quantity).toFixed(2)}`
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 95,
                theme: 'striped',
                headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: {
                    2: { halign: 'right' },
                    3: { halign: 'right' }
                }
            });

            // Summary Calculation
            const finalY = doc.lastAutoTable.finalY + 15;
            const subtotal = order.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');

            const summaryX = 140;
            doc.text(`Subtotal:`, summaryX, finalY);
            doc.text(`Rs ${subtotal.toFixed(2)}`, 195, finalY, { align: 'right' });

            doc.text(`Delivery Fee:`, summaryX, finalY + 7);
            doc.text(`Rs ${order.deliveryFee?.toFixed(2) || '0.00'}`, 195, finalY + 7, { align: 'right' });

            doc.text(`Tax:`, summaryX, finalY + 14);
            doc.text(`Rs ${order.taxAmount?.toFixed(2) || '0.00'}`, 195, finalY + 14, { align: 'right' });

            if (order.couponDiscount > 0) {
                doc.setTextColor(34, 197, 94); // Green color
                doc.text(`Discount (${order.couponCode}):`, summaryX, finalY + 21);
                doc.text(`-Rs ${order.couponDiscount.toFixed(2)}`, 195, finalY + 21, { align: 'right' });
                doc.setTextColor(0);
            }

            // Grant Total
            const totalY = finalY + (order.couponDiscount > 0 ? 32 : 25);
            doc.setDrawColor(0);
            doc.setLineWidth(0.5);
            doc.line(summaryX, totalY - 5, 195, totalY - 5);

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`Grand Total:`, summaryX, totalY);
            doc.text(`Rs ${order.totalAmount.toFixed(2)}`, 195, totalY, { align: 'right' });

            // Footer
            doc.setFontSize(8);
            doc.setFont(undefined, 'italic');
            doc.setTextColor(150);
            doc.text('Thank you for choosing Bhojan!', 105, 285, { align: 'center' });

            doc.save(`Bhojan_Invoice_${order._id.slice(-6).toUpperCase()}.pdf`);
            toast.success("Invoice downloaded successfully!");
        } catch (error) {
            console.error("Invoice Generation Error:", error);
            toast.error("Failed to generate invoice. Please try again.");
        }
    };

    const handleRateOrder = (order) => {
        setSelectedOrder(order);
        setShowReviewModal(true);
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setShowDetailsModal(true);
    };

    const handleAcceptOrder = async (orderId) => {
        setUpdating(true);
        try {
            const { data } = await api.put(`/order/${orderId}/accept`);
            if (data.success) {
                alert('Order accepted for delivery!');
                fetchInitialData();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to accept order');
        } finally {
            setUpdating(false);
        }
    };

    const handleRejectOrder = async (orderId) => {
        setUpdating(true);
        try {
            const { data } = await api.put(`/order/${orderId}/reject`);
            if (data.success) {
                alert('Order rejected.');
                fetchInitialData();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to reject order');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateDeliveryStatus = async (orderId, status) => {
        setUpdating(true);
        try {
            const { data } = await api.put(`/order/${orderId}/status`, { status });
            if (data.success) {
                alert(`Order status updated to ${status}`);
                fetchInitialData();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => reject(err),
                { enableHighAccuracy: true }
            );
        });
    };

    const handleVerifyArrival = async (orderId) => {
        setUpdating(true);
        try {
            const loc = await getCurrentLocation();
            const { data } = await api.put(`/order/${orderId}/verify-arrival`, loc);
            if (data.success) {
                toast.success('Arrival verified! You can now pick up the order.');
                fetchInitialData();
            }
        } catch (error) {
            toast.error(error.message || 'Geofencing verification failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleVerifyDelivery = async (orderId) => {
        // This will be called from the POD modal
        setUpdating(true);
        try {
            const loc = await getCurrentLocation();
            const { data } = await api.put(`/order/${orderId}/verify-delivery`, { ...podFormData, ...loc });
            if (data.success) {
                toast.success('Delivery verified and completed! 🎉');
                setShowPODModal(false);
                setPodFormData({ otp: '', photoUrl: '', signatureUrl: '' });
                fetchInitialData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleRaiseDispute = async (e) => {
        if (e) e.preventDefault();
        setUpdating(true);
        try {
            const { data } = await api.post('/order/dispute', disputeFormData);
            if (data.success) {
                toast.success('Dispute raised successfully. Admin will review it.');
                setShowDisputeModal(false);
                setDisputeFormData({ type: 'Other', description: '', evidence: [], orderId: '' });
                fetchInitialData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to raise dispute');
        } finally {
            setUpdating(false);
        }
    };

    const handleResolveDispute = async (disputeId, status, notes) => {
        setUpdating(true);
        try {
            const { data } = await api.put(`/admin/delivery/dispute/${disputeId}`, { status, resolutionNotes: notes });
            if (data.success) {
                toast.success(`Dispute ${status}!`);
                fetchInitialData();
            }
        } catch (error) {
            toast.error('Resolution failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateZoneSurge = async (zoneId, surge) => {
        try {
            const { data } = await api.put(`/admin/delivery/zone/${zoneId}`, { currentSurge: surge });
            if (data.success) {
                toast.success('Surge updated!');
                fetchInitialData();
            }
        } catch (error) {
            toast.error('Update failed');
        }
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

            case 'admin-emails':
                return renderAdminEmails();

            case 'admin-settings':
                return renderAdminSettings();

            // --- DELIVERY TABS ---
            case 'delivery-available':
                return renderDeliveryAvailable();
            case 'delivery-active':
                return renderDeliveryMy();
            case 'delivery-earnings':
                return renderDeliveryEarnings();

            case 'quests':
                return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><FoodQuests /></motion.div>;

            case 'meal-planner':
                return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><MealPlanner /></motion.div>;

            case 'personal':
            case 'owner-personal':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
                                <span>👤</span> Personal Information
                            </h3>
                            <form onSubmit={handleUpdatePersonal} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 transition-all dark:text-white dark:placeholder-gray-500"
                                        value={personalData.fullname}
                                        onChange={e => setPersonalData({ ...personalData, fullname: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 transition-all dark:text-white dark:placeholder-gray-500"
                                        value={personalData.email}
                                        onChange={e => setPersonalData({ ...personalData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Primary Mobile</label>
                                    <input
                                        type="tel"
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 transition-all dark:text-white dark:placeholder-gray-500"
                                        value={personalData.mobile}
                                        onChange={e => setPersonalData({ ...personalData, mobile: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Alternate Mobile</label>
                                    <input
                                        type="tel"
                                        placeholder="Add back-up number"
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 transition-all dark:text-white dark:placeholder-gray-500"
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
                            <section className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black flex items-center gap-2 dark:text-white">
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
                                    {user?.addresses?.map((addr) => (
                                        <div key={addr._id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:border-amber-500 transition-all group relative">
                                            <button
                                                onClick={() => handleDeleteAddress(addr._id)}
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 p-2 rounded-xl text-primary hover:bg-primary hover:text-white shadow-sm"
                                            >
                                                🗑️
                                            </button>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">{addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'}</span>
                                                <span className="font-black text-xs uppercase tracking-widest dark:text-white">{addr.label}</span>
                                                {addr.isDefault && <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-[8px] px-2 py-0.5 rounded-full font-black">DEFAULT</span>}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
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
                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black flex items-center gap-2 dark:text-white">
                                    <span>🏪</span> Shop Management
                                </h3>
                                {user?.businessVerification?.status === 'Verified' ? (
                                    <span className="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">✅ Business Verified</span>
                                ) : (
                                    <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">⏳ Verification Pending</span>
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
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary transition-all dark:text-white"
                                        value={shopData.gstin}
                                        onChange={e => setShopData({ ...shopData, gstin: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">FSSAI License</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary transition-all dark:text-white"
                                        value={shopData.fssai}
                                        onChange={e => setShopData({ ...shopData, fssai: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Min Order Value (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary transition-all dark:text-white"
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
                            <h3 className="text-xl font-black flex items-center gap-2 dark:text-white">
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
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl">
                                    <div className="p-8">
                                        <h4 className="text-2xl font-black mb-6 dark:text-white">{editingItemId ? 'Edit Item' : 'Add New Item'}</h4>
                                        <form onSubmit={handleSaveItem} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Item Name</label>
                                                <input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none" value={itemFormData.name} onChange={e => setItemFormData({ ...itemFormData, name: e.target.value })} required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price (₹)</label>
                                                <input type="number" className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none dark:text-white" value={itemFormData.price} onChange={e => setItemFormData({ ...itemFormData, price: e.target.value })} required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
                                                <select className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none dark:text-white" value={itemFormData.category} onChange={e => setItemFormData({ ...itemFormData, category: e.target.value })}>
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
                                                <input type="text" className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none dark:text-white" value={itemFormData.image} onChange={e => setItemFormData({ ...itemFormData, image: e.target.value })} />
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
                                <div key={item._id} className="bg-white dark:bg-gray-800 p-4 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 group">
                                    <img src={item.image} alt={item.name} className="w-20 h-20 rounded-2xl object-cover bg-gray-50" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${item.foodType === 'Veg' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            <span className="font-black text-gray-900 dark:text-white">{item.name}</span>
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
                                            className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-400 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all"
                                        >✏️</button>
                                        <button onClick={() => handleDeleteItem(item._id)} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all">🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );


            case 'owner-promotions':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700">
                        <span className="text-6xl mb-4 block">🎟️</span>
                        <h3 className="text-xl font-black italic dark:text-white">Promotions & Marketing</h3>
                        <p className="text-gray-400 text-sm mt-2 font-medium">Create coupon codes and festival specials coming soon!</p>
                        <button className="mt-8 bg-black text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest opacity-20 pointer-events-none">Get Early Access</button>
                    </motion.div>
                );

            case 'owner-financials':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
                                <span>💰</span> Financial Overview
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 rounded-3xl bg-green-50 dark:bg-green-900/20">
                                    <p className="text-[10px] font-black uppercase text-green-600 dark:text-green-400 tracking-widest mb-1">Available for Payout</p>
                                    <p className="text-3xl font-black text-green-700 dark:text-green-100 italic">₹{insights?.totalRevenue || 0}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/20">
                                    <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-1">Commission Collected</p>
                                    <p className="text-3xl font-black text-blue-700 dark:text-blue-100 italic">₹{(insights?.totalRevenue || 0) * 0.1}</p>
                                </div>
                            </div>
                            <button className="w-full mt-6 bg-green-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-100 opacity-50 cursor-not-allowed">Request Withdrawal</button>
                        </section>
                    </motion.div>
                );



            case 'owner-settings':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
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
                                        className={`w-14 h-7 rounded-full relative transition-colors ${shopData.settings.acceptsCOD ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${shopData.settings.acceptsCOD ? 'left-8' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-6 mt-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Opening Time</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary transition-all dark:text-white"
                                            value={shopData.timing.open}
                                            onChange={e => setShopData({ ...shopData, timing: { ...shopData.timing, open: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Closing Time</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary transition-all dark:text-white"
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
                            <h3 className="hidden md:flex text-xl font-black mb-6 items-center gap-2">
                                <span>🎖️</span> Achievement Showcase
                            </h3>
                            <div className="flex flex-wrap gap-4">
                                {user?.badges?.map((badge) => (
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        key={badge.name}
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-8">
                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
                                <span>🔒</span> Password & Authentication
                            </h3>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary dark:text-white dark:placeholder-gray-500"
                                        value={passwordData.currentPassword}
                                        onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary dark:text-white dark:placeholder-gray-500"
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary dark:text-white dark:placeholder-gray-500"
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-100"
                                >
                                    {updating ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </section>

                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black flex items-center gap-2 dark:text-white">
                                        <span>🛡️</span> Two-Factor Authentication (2FA)
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">Require an email OTP verification code upon login.</p>
                                </div>
                                <button
                                    onClick={handleToggle2FA}
                                    className={`px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                                        user?.securitySettings?.twoFactorEnabled
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                >
                                    {user?.securitySettings?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                                </button>
                            </div>
                            
                            {user?.securitySettings?.twoFactorEnabled && (
                                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Backup recovery codes</h4>
                                        <p className="text-[10px] text-gray-500 mt-1">If locked out, use a backup code to access your account.</p>
                                    </div>
                                    <button
                                        onClick={handleGenerateBackupCodes}
                                        className="bg-white dark:bg-gray-800 text-indigo-600 border border-indigo-200 dark:border-indigo-900 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-50"
                                    >
                                        Regenerate
                                    </button>
                                </div>
                            )}
                        </section>

                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                            <h3 className="text-xl font-black flex items-center gap-2 dark:text-white">
                                <span>📄</span> GDPR Data Portability
                            </h3>
                            <p className="text-xs text-gray-400">Request a full archive export of all personal data held in Bhojan.</p>
                            <button
                                onClick={handleGDPRDataExport}
                                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition"
                            >
                                Export My Data (GDPR)
                            </button>
                        </section>

                        <section className="bg-red-50 dark:bg-red-900/10 p-8 rounded-[32px] border border-red-100 dark:border-red-900/30">
                            <h3 className="text-xl font-black text-primary mb-2">Danger Zone</h3>
                            <p className="text-sm text-red-600/60 dark:text-red-400/60 font-medium mb-6">Permanently delete your account and all associated data</p>
                            <button
                                onClick={handleDeleteAccount}
                                className="bg-white dark:bg-gray-800 text-primary border-2 border-primary hover:bg-primary hover:text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition"
                            >
                                Delete Account
                            </button>
                        </section>
                    </motion.div>
                );

            case 'orders':
                const activeOrder = orders.find(o => ['Placed', 'Preparing', 'Ready', 'OutForDelivery'].includes(o.orderStatus));
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {/* Active Order Mini Widget */}
                        {activeOrder && (
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                onClick={() => navigate(`/track/${activeOrder._id}`)}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 p-1 rounded-[32px] shadow-lg shadow-emerald-100 dark:shadow-none cursor-pointer group"
                            >
                                <div className="bg-white dark:bg-gray-900 rounded-[31px] p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-2xl">
                                            🛵
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-0.5">Active Order Tracking</h4>
                                            <h3 className="font-black text-gray-900 dark:text-white text-sm">{activeOrder.shop?.name}</h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase">{activeOrder.orderStatus === 'Placed' ? 'Confirmed' : activeOrder.orderStatus}</p>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Tap to view live →</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-pulse">
                                            →
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {/* Filters Header */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-[30px] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                            <h2 className="hidden md:flex text-2xl font-black text-gray-900 dark:text-white items-center gap-2">
                                <span>🧾</span> Order History
                            </h2>
                            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                <input
                                    type="text"
                                    placeholder="Search shop or item..."
                                    className="bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-4 py-2 text-xs font-bold w-full md:w-48 focus:ring-2 ring-primary dark:text-white dark:placeholder-gray-500"
                                    value={orderSearchTerm}
                                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                                />
                                <select
                                    className="bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-4 py-2 text-xs font-black uppercase cursor-pointer focus:ring-2 ring-primary dark:text-white"
                                    value={orderStatusFilter}
                                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                                >
                                    <option>All Status</option>
                                    <option>Placed</option>
                                    <option>Preparing</option>
                                    <option>OutForDelivery</option>
                                    <option>Delivered</option>
                                    <option>Cancelled</option>
                                </select>
                                <select
                                    className="bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-4 py-2 text-xs font-black uppercase cursor-pointer focus:ring-2 ring-primary dark:text-white"
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

                        {/* Orders List */}
                        {getFilteredOrders().length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700">
                                <span className="text-6xl mb-4 block">🛒</span>
                                <h3 className="text-xl font-black dark:text-white">No orders found</h3>
                                <p className="text-gray-400 text-sm mt-2 font-medium">Try adjusting your filters or search terms.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {getFilteredOrders().map((order) => (
                                    <div key={order._id} className="bg-white dark:bg-gray-800 p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-amber-500/5 transition-all group overflow-hidden relative">

                                        {/* Premium Timeline Header */}
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-700 overflow-hidden shadow-inner border border-gray-100 dark:border-gray-600 flex items-center justify-center text-2xl">
                                                    {order.orderStatus === 'Delivered' ? '✅' : order.orderStatus === 'Cancelled' ? '❌' : '⏳'}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight">{order.shop?.name}</h3>
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-0.5 tracking-widest">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-gray-900 dark:text-white">₹{order.totalAmount?.toFixed(0)}</p>
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                                                    order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                                                        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                                    }`}>
                                                    {order.orderStatus}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status Timeline Visualization (Desktop and Mobile) */}
                                        <div className="relative mb-6 px-2">
                                            <div className="flex justify-between relative z-10">
                                                {['Placed', 'Preparing', 'OutForDelivery', 'Delivered'].map((status, idx) => {
                                                    const statuses = ['Placed', 'Preparing', 'OutForDelivery', 'Delivered'];
                                                    const currentIdx = statuses.indexOf(order.orderStatus);
                                                    const isCompleted = currentIdx >= idx;
                                                    const isCurrent = currentIdx === idx && order.orderStatus !== 'Delivered';

                                                    // Skip "OutForDelivery" if cancelled
                                                    if (order.orderStatus === 'Cancelled' && idx > 0) return null;

                                                    return (
                                                        <div key={status} className="flex flex-col items-center gap-1.5 flex-1 max-w-[80px]">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all duration-500 ${isCompleted ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'} ${isCurrent ? 'ring-4 ring-amber-100 dark:ring-amber-900/30' : ''}`}>
                                                                {isCompleted ? '✓' : idx + 1}
                                                            </div>
                                                            <span className={`text-[8px] font-black uppercase tracking-tighter text-center ${isCompleted ? 'text-gray-900 dark:text-gray-100' : 'text-gray-300 dark:text-gray-600'}`}>
                                                                {status === 'OutForDelivery' ? 'On Way' : status}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {order.orderStatus === 'Cancelled' && (
                                                    <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[80px]">
                                                        <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] shadow-lg">✕</div>
                                                        <span className="text-[8px] font-black uppercase tracking-tighter text-red-500">Cancelled</span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Connector Line */}
                                            <div className="absolute top-3 left-0 right-0 h-[1.5px] bg-gray-100 dark:bg-gray-700 -z-0 mx-8">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: order.orderStatus === 'Cancelled' ? '0%' : `${(['Placed', 'Preparing', 'OutForDelivery', 'Delivered'].indexOf(order.orderStatus) / 3) * 100}%` }}
                                                    className="h-full bg-green-500 transition-all duration-1000"
                                                />
                                            </div>
                                        </div>

                                        {/* Action Hub */}
                                        <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-gray-50 dark:border-gray-700 mt-2">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleViewDetails(order)} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl text-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all shadow-sm" title="Details">📋</button>
                                                <button onClick={() => handleDownloadInvoice(order)} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl text-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all shadow-sm" title="Invoice">📄</button>
                                                {['Placed', 'Preparing', 'Ready', 'OutForDelivery'].includes(order.orderStatus) && (
                                                    <button onClick={() => navigate(`/track/${order._id}`)} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl text-lg hover:bg-indigo-100 transition-all shadow-sm" title="Track">🛵</button>
                                                )}
                                                {order.orderStatus === 'Delivered' && (
                                                    <button onClick={() => handleRateOrder(order)} className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl text-lg hover:bg-amber-100 transition-all shadow-sm" title="Rate">⭐</button>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleReorder(order)}
                                                className="bg-black dark:bg-white text-white dark:text-black py-3 px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gray-200 dark:shadow-none"
                                            >
                                                Reorder ↻
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Modals moved to main return */}
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
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-black text-gray-900 dark:text-white">Total Spent</h4>
                                        <span className="text-2xl">💰</span>
                                    </div>
                                    <p className="text-3xl font-black text-primary">₹{orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(0)}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Across {orders.length} orders</p>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-black text-gray-900 dark:text-white">Avg Order</h4>
                                        <span className="text-2xl">📈</span>
                                    </div>
                                    <p className="text-3xl font-black text-green-600 dark:text-green-400">
                                        ₹{orders.length > 0 ? (orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length).toFixed(0) : 0}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Per order value</p>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-black text-gray-900 dark:text-white">Loyalty Points</h4>
                                        <span className="text-2xl">💎</span>
                                    </div>
                                    <p className="text-3xl font-black text-amber-600 dark:text-amber-500">{user?.loyaltyPoints || 0}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">= ₹{((user?.loyaltyPoints || 0) / 10).toFixed(0)} value</p>
                                </div>
                            </div>
                        ) : (
                            // Owner Analytics
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">Total Orders</h4>
                                        <span className="text-2xl">📦</span>
                                    </div>
                                    <p className="text-4xl font-black italic dark:text-white">{insights?.totalOrders || 0}</p>
                                    <div className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-[10px]">
                                        <span>↑ 12%</span>
                                        <span className="text-gray-400 dark:text-gray-500 uppercase">vs last month</span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">Revenue</h4>
                                        <span className="text-2xl">💰</span>
                                    </div>
                                    <p className="text-4xl font-black italic text-green-600 dark:text-green-400">₹{insights?.totalRevenue || 0}</p>
                                    <div className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-[10px]">
                                        <span>↑ 8.4%</span>
                                        <span className="text-gray-400 dark:text-gray-500 uppercase">Growth</span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">Rating</h4>
                                        <span className="text-2xl">⭐</span>
                                    </div>
                                    <p className="text-4xl font-black italic text-amber-500">{insights?.avgRating || 0}</p>
                                    <div className="mt-4 flex items-center gap-2 text-gray-400 dark:text-gray-500 font-bold text-[10px]">
                                        <span>From {insights?.totalReviews || 0} reviews</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                );

            case 'preferences':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
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
                                            ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                            : 'bg-gray-50 border-transparent text-gray-400 hover:border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-400">Spice Preference</label>
                                    <div className="flex gap-4">
                                        {['Mild', 'Medium', 'Spicy'].map(level => (
                                            <button
                                                key={level}
                                                onClick={() => setPreferences({ ...preferences, spicePreference: level })}
                                                className={`flex-1 py-3 rounded-xl border-2 font-black text-xs transition-all ${preferences.spicePreference === level
                                                    ? 'bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                                                    : 'bg-gray-50 border-transparent text-gray-400 dark:bg-gray-700 dark:text-gray-200'
                                                    }`}
                                            >
                                                {level === 'Mild' ? '🌱' : level === 'Medium' ? '🌶️' : '🔥'} {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-400">Allergies (comma separated)</label>
                                    <textarea
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 transition-all min-h-[100px] dark:text-white dark:placeholder-gray-500"
                                        placeholder="e.g. Peanuts, Shellfish"
                                        value={preferences.allergies.join(', ')}
                                        onChange={e => setPreferences({ ...preferences, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleUpdatePreferences}
                                        disabled={updating}
                                        className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition shadow-lg shadow-amber-100 dark:bg-amber-600 dark:hover:bg-amber-700"
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
                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-black mb-8 dark:text-white">Experience Preferences</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                                    <div>
                                        <h5 className="font-black text-sm dark:text-white">Order Notifications</h5>
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Enable real-time order status updates</p>
                                    </div>
                                    <input type="checkbox" defaultChecked className="w-6 h-6 rounded-lg text-primary focus:ring-primary shadow-sm" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                                    <div>
                                        <h5 className="font-black text-sm dark:text-white">Newsletter</h5>
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Get weekly offers and restaurant picks</p>
                                    </div>
                                    <input type="checkbox" className="w-6 h-6 rounded-lg text-primary focus:ring-primary shadow-sm" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                                    <div>
                                        <h5 className="font-black text-sm dark:text-white">Show Allergens</h5>
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Highlight items containing common allergens</p>
                                    </div>
                                    <input type="checkbox" className="w-6 h-6 rounded-lg text-primary focus:ring-primary shadow-sm" />
                                </div>
                                <div className="space-y-2 pt-4 border-t border-gray-50 dark:border-gray-700">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Communication Language</label>
                                    <select className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary dark:text-white">
                                        <option>English (US)</option>
                                        <option>Hindi (HI)</option>
                                        <option>French (FR)</option>
                                    </select>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                );

            case 'payments':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 text-9xl text-amber-500/5 rotate-12">💳</div>
                            <h3 className="text-2xl font-black mb-8 relative z-10 dark:text-white">Payment Hub</h3>

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

                                <div className="p-8 rounded-[32px] bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-100 border-dashed">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Wallet Credits</p>
                                    <p className="text-4xl font-black mb-6">₹{user?.walletBalance || 0}</p>
                                    <p className="text-[8px] font-black uppercase text-amber-500 dark:text-amber-400">Includes Refunds & Rewards</p>
                                </div>

                                <div className="p-8 rounded-[32px] bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 flex flex-col justify-center">
                                    <h5 className="font-black text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Redeem Gift Card</h5>
                                    <div className="flex gap-2">
                                        <input
                                            id="giftCode"
                                            type="text"
                                            placeholder="XXXX-XXXX"
                                            className="flex-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 text-sm font-bold placeholder:opacity-30 dark:text-white"
                                        />
                                        <button
                                            onClick={() => handleRedeemGiftCard(document.getElementById('giftCode').value)}
                                            className="bg-black dark:bg-white text-white dark:text-black px-4 rounded-xl font-black text-[10px] uppercase"
                                        >
                                            OK
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h4 className="text-xl font-black mb-6 dark:text-white">Transaction History</h4>
                            {transactions.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 dark:text-gray-500 italic">No transactions found</div>
                            ) : (
                                <div className="space-y-4">
                                    {transactions.map(tx => (
                                        <div key={tx._id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-2xl transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${tx.type === 'TopUp' ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' :
                                                    tx.type === 'Payment' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                                    }`}>
                                                    {tx.type === 'TopUp' ? '📥' : tx.type === 'Payment' ? '📤' : '🎁'}
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-sm dark:text-white">{tx.description}</h5>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{new Date(tx.createdAt).toLocaleString()} • {tx.paymentMethod}</p>
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
                        <header className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-2xl font-black flex items-center gap-2 dark:text-white"><span>❤️</span> My Wishlist</h3>
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Quick access to your favorite dishes</p>
                        </header>

                        {wishlistItems.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 italic text-gray-400 dark:text-gray-500 font-bold">
                                Your wishlist is empty. Start adding some favorites!
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {wishlistItems.map(item => (
                                    <div key={item._id} className="bg-white dark:bg-gray-800 p-4 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm relative group overflow-hidden">
                                        <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded-2xl mb-4 bg-gray-50 dark:bg-gray-700" />
                                        <button
                                            onClick={() => handleToggleWishlist(item._id)}
                                            className="absolute top-6 right-6 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                        >
                                            ❤️
                                        </button>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-black text-lg text-gray-900 dark:text-white">{item.name}</h4>
                                            <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">₹{item.price}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium line-clamp-2 mb-4">{item.description}</p>
                                        <button
                                            onClick={() => navigate(`/shop/${item.shop}`)}
                                            className="w-full bg-gray-900 dark:bg-white text-white dark:text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
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
                        {isDelivery && (
                            <section className="bg-red-50 dark:bg-red-900/20 p-8 rounded-[32px] border-2 border-red-200 dark:border-red-800/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 text-8xl opacity-10">🚨</div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-black text-red-600 dark:text-red-400 mb-2">Emergency SOS Support</h3>
                                    <p className="text-xs text-red-500/80 dark:text-red-400/80 font-bold max-w-sm">Use this button in case of accidents or severe threats. We will instantly dispatch your location to support agents and emergency contacts.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to trigger SOS? This alert cannot be undone.')) {
                                            toast.error('🚨 SOS TRIGGERED! Support is tracking your live location and will call you immediately.', { autoClose: 10000 });
                                        }
                                    }}
                                    className="relative z-10 bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xl w-full md:w-auto px-12 py-5 rounded-full font-black uppercase tracking-widest text-lg flex items-center justify-center gap-2 animate-pulse"
                                >
                                    <span>🚨</span> SOS
                                </button>
                            </section>
                        )}
                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
                                <span>📧</span> Raise a Concern
                            </h3>
                            <form onSubmit={handleRaiseTicket} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subject</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 dark:text-white dark:placeholder-gray-500"
                                            placeholder="What's the issue?"
                                            value={ticketFormData.subject}
                                            onChange={e => setTicketFormData({ ...ticketFormData, subject: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
                                        <select
                                            className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 dark:text-white"
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
                                                className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 dark:text-white"
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
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-amber-500 min-h-[120px] dark:text-white dark:placeholder-gray-500"
                                        placeholder="Explain the problem in detail..."
                                        value={ticketFormData.message}
                                        onChange={e => setTicketFormData({ ...ticketFormData, message: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition shadow-lg w-full md:w-auto"
                                >
                                    {updating ? 'Sending...' : 'Submit Ticket'}
                                </button>
                            </form>
                        </section>
                    </motion.div>
                );

            case 'admin-delivery':
                return renderAdminDelivery();

            default:
                return null;
        }
    };

    const renderAdminDelivery = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm gap-6">
                <div>
                    <h3 className="text-2xl font-black flex items-center gap-2 dark:text-white"><span>🚚</span> Delivery Fleet Management</h3>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Live monitoring & manual assignment</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 px-6 py-3 rounded-2xl border border-green-100 dark:border-green-800/50">
                        <p className="text-[8px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Online Now</p>
                        <p className="text-xl font-black text-green-700 dark:text-green-300">{deliveryPartners.filter(p => p.deliverySpecs?.isOnline).length}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 rounded-2xl border border-gray-100 dark:border-gray-600">
                        <p className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Total Fleet</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{deliveryPartners.length}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Monitoring Map (Stylized) */}
                <section className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden relative">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600">Live Delivery Map View</h4>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full text-[8px] font-black uppercase">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                            Updating Live
                        </span>
                    </div>

                    <div className="relative aspect-video bg-gray-50 dark:bg-gray-900/50 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center group overflow-hidden">
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                            {/* Visual grid pattern representing a map */}
                            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                        </div>

                        {deliveryPartners.filter(p => p.deliverySpecs?.currentLocation?.lat).map((p, i) => (
                            <motion.div
                                key={p._id}
                                title={p.fullname}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                style={{
                                    left: `${((p.deliverySpecs.currentLocation.lng + 180) % 360) / 360 * 100}%`,
                                    top: `${(90 - p.deliverySpecs.currentLocation.lat) / 180 * 100}%`
                                }}
                                className={`absolute w-8 h-8 -ml-4 -mt-4 cursor-pointer group-hover:z-50 transition-all ${p.deliverySpecs.isOnline ? 'text-green-500' : 'text-gray-400'}`}
                            >
                                <div className="relative">
                                    <span className="text-2xl drop-shadow-md">🚚</span>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white px-2 py-1 rounded text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        {p.fullname}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        <div className="text-center relative z-10">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fleet Spatial Distribution</p>
                            <p className="text-xs text-gray-300 font-bold max-w-[200px]">Live GPS telemetry active. Hover on icons to identify partners.</p>
                        </div>
                    </div>
                </section>

                {/* Broadcast Sidebar */}
                <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
                    <h4 className="text-sm font-black uppercase tracking-widest text-orange-600 mb-6">Channel Broadcast</h4>
                    <div className="space-y-4 flex-1">
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase text-gray-400">Target Segment</label>
                            <select
                                value={broadcastMsg.role}
                                onChange={e => setBroadcastMsg({ ...broadcastMsg, role: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-xs font-bold border-none outline-none dark:text-white"
                            >
                                <option value="Delivery">Delivery Only</option>
                                <option value="Owner">Owners Only</option>
                                <option value="Customer">Customers Only</option>
                                <option value="">All Users</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase text-gray-400">Alert Title</label>
                            <input
                                type="text"
                                value={broadcastMsg.title}
                                onChange={e => setBroadcastMsg({ ...broadcastMsg, title: e.target.value })}
                                placeholder="e.g. Surge Bonus Active"
                                className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-xs font-bold border-none outline-none dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase text-gray-400">Message Content</label>
                            <textarea
                                value={broadcastMsg.message}
                                onChange={e => setBroadcastMsg({ ...broadcastMsg, message: e.target.value })}
                                placeholder="Type your broadcast here..."
                                className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-xs font-bold border-none outline-none h-32 dark:text-white"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleBroadcastNotification}
                        disabled={updating}
                        className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 dark:shadow-none transition-all"
                    >
                        {updating ? 'Sending...' : '⚡ Push Broadcast'}
                    </button>
                </section>
            </div>

            {/* Partners Table */}
            <section className="bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600">Active Partners & KYC status</h4>
                    <input
                        type="text"
                        placeholder="Search partners..."
                        className="bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-xl text-xs font-bold border-none outline-none dark:text-white"
                        onChange={(e) => setAdminSearchTerm(e.target.value)}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Partner Details</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Activity</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Account</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {deliveryPartners
                                .filter(p => p.fullname.toLowerCase().includes(adminSearchTerm.toLowerCase()))
                                .map(partner => (
                                    <tr key={partner._id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg">👤</div>
                                                <div>
                                                    <h5 className="font-black text-sm dark:text-white">{partner.fullname}</h5>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{partner.mobile} • {partner.city || 'Standard Area'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${partner.deliverySpecs?.isOnline ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {partner.deliverySpecs?.isOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400">⭐ {partner.deliverySpecs?.rating || 'N/A'}</p>
                                                <p className="text-[8px] font-black text-gray-400 uppercase">{partner.deliverySpecs?.completedDeliveries || 0} Deliveries</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <select
                                                value={partner.status}
                                                onChange={(e) => handleUpdateUserStatus(partner._id, e.target.value)}
                                                className={`rounded-lg px-2 py-1 text-[8px] font-black uppercase outline-none border-none ${partner.status === 'Active' ? 'bg-green-100 text-green-600' :
                                                    partner.status === 'Suspended' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                                                    }`}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Suspended">Suspension</option>
                                                <option value="Blocked">Block</option>
                                            </select>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => {
                                                    const msg = prompt(`Message ${partner.fullname}:`);
                                                    if (msg) alert('Messaging service coming soon!');
                                                }}
                                                className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors"
                                            >
                                                Contact
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Dispute Resolution Hub */}
                <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <h4 className="text-sm font-black uppercase tracking-widest text-red-600 mb-6">Partner Dispute Hub ⚖️</h4>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {disputes.length === 0 ? (
                            <p className="text-center py-10 text-xs font-bold text-gray-400 italic">No pending disputes found.</p>
                        ) : (
                            disputes.map(dispute => (
                                <div key={dispute._id} className="p-5 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${dispute.status === 'Resolved' ? 'bg-green-100 text-green-600' :
                                                dispute.status === 'Rejected' ? 'bg-red-100 text-primary' : 'bg-amber-100 text-amber-600'
                                                }`}>
                                                {dispute.status}
                                            </span>
                                            <h5 className="font-black text-sm mt-1 dark:text-white">{dispute.type}</h5>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">By: {dispute.raisedBy?.fullname}</p>
                                        </div>
                                        <p className="text-[8px] font-black text-gray-400">{new Date(dispute.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 italic">"{dispute.description}"</p>

                                    {dispute.status === 'Pending' && (
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => handleResolveDispute(dispute._id, 'Resolved', 'Resolved after manual review.')}
                                                className="flex-1 bg-green-600 text-white py-2 rounded-xl text-[10px] font-black uppercase"
                                            >
                                                Resolve
                                            </button>
                                            <button
                                                onClick={() => handleResolveDispute(dispute._id, 'Rejected', 'Insufficient evidence.')}
                                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-white py-2 rounded-xl text-[10px] font-black uppercase"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Smart Zone Management */}
                <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-6">Smart Zone Surge Control 🔥</h4>
                    <div className="space-y-4">
                        {zones.length === 0 ? (
                            <p className="text-center py-10 text-xs font-bold text-gray-400 italic">No zones configured.</p>
                        ) : (
                            zones.map(zone => (
                                <div key={zone._id} className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between">
                                    <div>
                                        <h5 className="font-black text-sm dark:text-white">{zone.name}</h5>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[8px] font-black bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full text-indigo-600">Demand: {zone.demandLevel}</span>
                                            <span className="text-[8px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">Surge: {zone.currentSurge}x</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleUpdateZoneSurge(zone._id, zone.currentSurge - 0.5)}
                                            className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center font-black shadow-sm"
                                        >-</button>
                                        <button
                                            onClick={() => handleUpdateZoneSurge(zone._id, zone.currentSurge + 0.5)}
                                            className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-indigo-100"
                                        >+</button>
                                    </div>
                                </div>
                            ))
                        )}
                        <button className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[32px] text-[10px] font-black uppercase text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
                            + Define New Operational Zone
                        </button>
                    </div>
                </section>
            </div>
        </motion.div>
    );

    // --- ADMIN HELPER RENDERERS ---

    const renderAdminOverview = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Platform Revenue', val: `₹${adminData.stats?.totalRevenue || 0}`, icon: '💰', color: 'from-green-600 to-emerald-500' },
                    { label: 'Active Shops', val: adminData.stats?.totalShops || 0, icon: '🏪', color: 'from-blue-600 to-indigo-500' },
                    { label: 'Total Users', val: adminData.stats?.totalUsers || 0, icon: '👥', color: 'from-purple-600 to-violet-500' },
                    { label: 'Total Orders', val: adminData.stats?.totalOrders || 0, icon: '🧾', color: 'from-orange-600 to-amber-500' },
                ].map((stat) => (
                    <div key={stat.label} className={`bg-gradient-to-br ${stat.color} p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden group hover:scale-105 transition-all duration-300`}>
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">{stat.label}</h4>
                        <p className="text-3xl font-black">{stat.val}</p>
                        <div className="absolute top-0 right-0 p-4 text-5xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform">{stat.icon}</div>
                    </div>
                ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
                        <span>🛡️</span> Quick Verifications
                    </h3>
                    <div className="space-y-4">
                        {adminData.shops.filter(s => s.owner?.businessVerification?.status === 'Pending').slice(0, 3).map(shop => (
                            <div key={shop._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-4">
                                    <img src={shop.logo} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                    <div>
                                        <h4 className="font-black text-sm dark:text-white">{shop.name}</h4>
                                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{shop.owner?.fullname}</p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveTab('admin-shops')} className="cursor-pointer text-indigo-600 font-black text-[10px] uppercase hover:underline">Review →</button>
                            </div>
                        ))}
                        {adminData.shops.filter(s => s.owner?.businessVerification?.status === 'Pending').length === 0 && (
                            <div className="text-center py-8">
                                <span className="text-4xl block mb-2">✅</span>
                                <p className="text-gray-400 dark:text-gray-500 font-black text-xs uppercase italic">Everything is verified!</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
                        <span>📈</span> Growth Trends
                    </h3>
                    <div className="h-48 flex items-end justify-between gap-2 px-4">
                        {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                            <div key={i} className="flex-1 bg-indigo-100 dark:bg-indigo-900/40 rounded-t-xl relative group" style={{ height: `${h}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Day {i + 1}</div>
                                <div className={`absolute bottom-0 left-0 w-full rounded-t-xl bg-indigo-600 transition-all duration-1000 ${loading ? 'h-0' : 'h-full scale-y-100'}`}></div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-[8px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest">
                        <span>Day 1</span>
                        <span>Day 7 (Peak)</span>
                    </div>
                </section>
            </div>
        </motion.div>
    );

    const renderDeliveryAvailable = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <header className="flex justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black flex items-center gap-2 dark:text-white"><span>🛵</span> Available Orders</h3>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Accept orders ready for pickup</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/40 px-6 py-3 rounded-3xl border border-indigo-100 dark:border-indigo-900/40">
                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">Online & Ready 🏁</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(availableOrders || []).length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700">
                        <span className="text-6xl mb-4 block">😴</span>
                        <h3 className="text-xl font-black dark:text-white">No orders right now</h3>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 font-medium italic">We'll alert you when a restaurant finishes preparing an order!</p>
                    </div>
                ) : (
                    availableOrders.map(order => (
                        <div key={order._id} className="bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center text-2xl">🏬</div>
                                    <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{order.orderStatus}</span>
                                </div>
                                <h4 className="font-black text-lg mb-1 dark:text-white">{order.shop?.name}</h4>
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-6">{order.shop?.city}</p>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-gray-400">
                                        <span>📍</span> {order.shop?.address?.slice(0, 30)}...
                                    </div>
                                    <div className="bg-indigo-50 dark:bg-indigo-900/40 p-4 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">Estimated Earnings</span>
                                            <span className="text-lg font-black dark:text-white">₹{order.deliveryFee + (order.earningsEstimation?.surgePay || 0)}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[8px] font-black bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-gray-400 border border-gray-100 dark:border-gray-700">Base: ₹{order.earningsEstimation?.basePay || 40}</span>
                                            {order.earningsEstimation?.surgePay > 0 && <span className="text-[8px] font-black bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded-full text-red-600 dark:text-red-400">Surge: +₹{order.earningsEstimation.surgePay} 🔥</span>}
                                            <span className="text-[8px] font-black bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-gray-400 border border-gray-100 dark:border-gray-700">Distance: +₹{order.earningsEstimation?.distancePay || 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-amber-600 dark:text-amber-500">
                                        <span>⏱️</span> Expires in 60s
                                    </div>
                                </div>

                                {/* Timer Simulation Bar */}
                                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mb-4">
                                    <div className="bg-amber-500 h-full w-full origin-left" style={{ animation: 'shrink 60s linear forwards' }}></div>
                                </div>

                                <div className="flex gap-2 w-full pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => handleRejectOrder(order._id)}
                                        disabled={updating}
                                        className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-colors"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleAcceptOrder(order._id)}
                                        disabled={updating}
                                        className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Accept
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );

    const renderDeliveryMy = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <header className="flex justify-between items-center">
                <h3 className="text-2xl font-black italic dark:text-white">Active Deliveries</h3>
            </header>

            <div className="space-y-6">
                {(orders || []).filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 border-dashed">
                        <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest text-xs">No active tasks</p>
                    </div>
                ) : (
                    orders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').map(order => (
                        <div key={order._id} className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border-2 border-indigo-600 shadow-xl relative overflow-hidden">
                            <div className="flex flex-col md:flex-row justify-between gap-8 mb-8 relative z-10">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pick up from</p>
                                        <h4 className="text-xl font-black dark:text-white">{order.shop?.name}</h4>
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{order.shop?.address}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deliver to</p>
                                        <h4 className="text-xl font-black dark:text-white">{order.user?.fullname}</h4>
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{order.deliveryAddress}</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col justify-between items-end gap-2">
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Status</p>
                                        <p className="text-2xl font-black italic uppercase dark:text-white">{order.orderStatus}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&origin=${user?.deliverySpecs?.currentLocation?.lat || ''},${user?.deliverySpecs?.currentLocation?.lng || ''}&destination=${encodeURIComponent(order.deliveryAddress)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-blue-50 text-blue-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-blue-100 transition-colors"
                                        >
                                            🗺️ Map
                                        </a>
                                        <a href={`tel:${order.user?.mobile}`} className="bg-gray-900 text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-black transition-colors">
                                            📞 Call
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-8 border-t border-gray-100 dark:border-gray-700 relative z-10">
                                {order.orderStatus === 'Ready' && (
                                    <button
                                        onClick={() => handleVerifyArrival(order._id)}
                                        className="flex-1 bg-amber-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-100"
                                    >
                                        I've Arrived at Restaurant 📍
                                    </button>
                                )}
                                {order.orderStatus === 'Preparing' && (
                                    <button
                                        disabled
                                        className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest cursor-not-allowed"
                                    >
                                        Waiting for Pickup...
                                    </button>
                                )}
                                {order.orderStatus === 'OutForDelivery' && (
                                    <button
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowPODModal(true);
                                        }}
                                        className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100"
                                    >
                                        Verify & Deliver 🧾
                                    </button>
                                )}
                                {order.orderStatus === 'Placed' && (
                                    <button
                                        onClick={() => handleAcceptOrder(order._id)}
                                        className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
                                    >
                                        Start Task
                                    </button>
                                )}
                            </div>
                            <div className="absolute top-0 right-0 p-8 text-9xl opacity-5 pointer-events-none">📍</div>
                        </div>
                    ))
                )}
            </div>

            <div className="pt-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black dark:text-white">Delivery History</h3>
                    <button
                        onClick={() => {
                            setDisputeFormData({ ...disputeFormData, orderId: '' });
                            setShowDisputeModal(true);
                        }}
                        className="text-[10px] font-black uppercase text-red-500 hover:underline"
                    >
                        Report an Issue / Dispute 🧑⚖️
                    </button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {(orders || []).filter(o => o.orderStatus === 'Delivered').slice(0, 10).map(order => (
                                <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                                    <td className="px-8 py-6 font-black text-xs dark:text-white">#{order._id.slice(-6).toUpperCase()}</td>
                                    <td className="px-8 py-6 font-bold text-xs text-gray-500 dark:text-gray-400">{order.shop?.name}</td>
                                    <td className="px-8 py-6 font-black text-xs text-green-600 dark:text-green-400">+₹{order.deliveryFee + (order.earningsEstimation?.surgePay || 0)}</td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => {
                                                setDisputeFormData({ ...disputeFormData, orderId: order._id });
                                                setShowDisputeModal(true);
                                            }}
                                            className="text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                        >
                                            Dispute
                                        </button>
                                        <span className="ml-4 text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{new Date(order.updatedAt).toLocaleDateString()}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );

    const renderDeliveryEarnings = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <header className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black italic dark:text-white">Earnings Dashboard</h3>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Real-time payout & Performance metrics</p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1">Total Payouts</p>
                    <p className="text-4xl font-black italic underline decoration-indigo-200 dark:text-white">₹{deliveryStats.totalEarnings}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Today\'s Earnings', val: `₹${Math.floor(deliveryStats.totalEarnings * 0.2)}`, icon: '📆', color: 'from-blue-600 to-indigo-500' },
                    { label: 'Weekly Earnings', val: `₹${deliveryStats.totalEarnings}`, icon: '📈', color: 'from-emerald-600 to-teal-500' },
                    { label: 'Cash Collected (COD)', val: `₹${user?.deliverySpecs?.cashCollected || 0}`, icon: '💵', color: 'from-amber-500 to-orange-400' },
                    { label: 'Acceptance Rate', val: `${user?.deliverySpecs?.acceptanceRate || 100}%`, icon: '✅', color: 'from-green-600 to-emerald-400' }
                ].map((stat, i) => (
                    <div key={i} className={`bg-gradient-to-br ${stat.color} p-6 rounded-[40px] text-white shadow-xl relative overflow-hidden`}>
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">{stat.label}</h4>
                        <p className="text-3xl font-black italic">{stat.val}</p>
                        <div className="absolute top-0 right-0 p-4 text-5xl opacity-10 rotate-12">{stat.icon}</div>
                    </div>
                ))}
            </div>

            <h3 className="text-xl font-black mt-10 mb-4 dark:text-white">Active Incentives & Surges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/50 p-6 rounded-[32px] relative overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-2">🔥 High Demand Surge</p>
                    <h4 className="text-2xl font-black dark:text-white">+₹25 Per Delivery</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-2">Active in matching zones for the next 2 hours.</p>
                    <div className="absolute -bottom-4 -right-4 text-6xl opacity-20">🌧️</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800/50 p-6 rounded-[32px] relative overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">🎯 Daily Target</p>
                    <h4 className="text-2xl font-black dark:text-white">Earn ₹200 Extra</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-2">Complete 12 deliveries today. (Current: {deliveryStats.completedDeliveries % 12}/12)</p>
                    <div className="w-full bg-amber-200 dark:bg-amber-900/40 h-2 rounded-full mt-4 overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${((deliveryStats.completedDeliveries % 12) / 12) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            <section className="bg-white dark:bg-gray-800 p-10 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">🚀</div>
                <h4 className="text-xl font-black mb-2 dark:text-white">Ready to scale your earnings?</h4>
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mb-8 max-w-md mx-auto">Maintain a 4.8+ rating and complete 50 deliveries this month to unlock the Gold Partner Bonus!</p>
                <div className="flex gap-4 justify-center">
                    <button className="bg-gray-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">View Bonus Criteria</button>
                    <button className="bg-gray-100 text-gray-400 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Payout History</button>
                </div>
            </section>
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
                <header className="flex justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div>
                        <h3 className="text-2xl font-black flex items-center gap-2 dark:text-white"><span>👥</span> User Hub</h3>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Manage global user accounts & permissions</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Platform Status</p>
                        <p className="text-2xl font-black dark:text-white">Live 🟢</p>
                    </div>
                </header>

                <section className="bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex gap-4">
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-2xl px-6 py-3 text-sm font-bold border-none outline-none focus:ring-2 ring-indigo-600/20 dark:text-white"
                            value={adminSearchTerm}
                            onChange={(e) => setAdminSearchTerm(e.target.value)}
                        />
                        <select
                            className="bg-gray-50 dark:bg-gray-700 rounded-2xl px-6 py-3 text-sm font-black uppercase border-none outline-none dark:text-white"
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
                            <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Identity</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Role & Status</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Security</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {filteredUsers.map(u => (
                                    <tr key={u._id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg font-black shadow-inner">
                                                    {u.fullname?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-sm dark:text-white">{u.fullname}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <select
                                                    onChange={(e) => handleUpdateUserRole(u._id, e.target.value)}
                                                    value={u.role}
                                                    className="bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-[8px] font-black uppercase px-2 py-1 outline-none appearance-none cursor-pointer dark:text-white"
                                                >
                                                    {['Customer', 'Owner', 'Delivery', 'Admin'].map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${(!u.status || u.status === 'Active') ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'}`}>
                                                    {u.status || 'Active'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleResetUserPassword(u._id)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-xs" title="Reset Password">🔑</button>
                                                <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-xs" title="Force Logout">📱</button>
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
            <header className="flex justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black flex items-center gap-2 dark:text-white"><span>🏪</span> Shop Control</h3>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Manage restaurant verifications & featured status</p>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(adminData.shops || []).map(shop => (
                    <div key={shop._id} className="bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden group">
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
                                    <h4 className="font-black text-sm dark:text-white">{shop.name}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{shop.city}, {shop.address?.slice(0, 20)}...</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-50 dark:border-gray-700">
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
            <header className="flex justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black flex items-center gap-2 dark:text-white"><span>🍳</span> Inventory Moderation</h3>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Review & moderate food items across all restaurants</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center px-6 border-r border-gray-100 dark:border-gray-700">
                        <p className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">Pending Review</p>
                        <p className="text-xl font-black text-amber-500">{(adminData.items || []).filter(i => i.moderationStatus === 'Pending').length}</p>
                    </div>
                    <div className="text-center px-6">
                        <p className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">Total Items</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{(adminData.items || []).length}</p>
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(adminData.items || []).map(item => (
                    <div key={item._id} className={`bg-white dark:bg-gray-800 rounded-[40px] border-2 transition-all shadow-sm overflow-hidden group ${item.moderationStatus === 'Rejected' ? 'border-primary/20 bg-red-50/10' : 'border-transparent hover:border-indigo-600'}`}>
                        <div className="relative h-48">
                            <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                            <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                                <span className={`text-[8px] font-black uppercase tracking-widest ${item.moderationStatus === 'Approved' ? 'text-green-600' : item.moderationStatus === 'Rejected' ? 'text-primary' : 'text-amber-500'}`}>
                                    {item.moderationStatus || 'Approved'}
                                </span>
                            </div>
                        </div>
                        <div className="p-6">
                            <h4 className="font-black text-sm mb-1 line-clamp-1 dark:text-white">{item.name}</h4>
                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-4">{item.shop?.name}</p>
                            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-2 rounded-2xl mb-4">
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{item.category}</span>
                                <span className="text-sm font-black text-gray-900 dark:text-white">₹{item.price}</span>
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
            <header className="flex justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black flex items-center gap-2 dark:text-white"><span>🧾</span> Order Central</h3>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Live platform order stream & monitoring</p>
                </div>
            </header>

            <section className="bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Merchant & Customer</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Value & Status</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Time</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
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
                                            <span className="font-black text-sm text-gray-900 dark:text-white">₹{order.totalAmount}</span>
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
                                        <button onClick={() => handleViewDetails(order)} className="text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors">Details</button>
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
            <header className="flex justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black flex items-center gap-2 dark:text-white"><span>💰</span> Financial Dashboard</h3>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Platform commissions & settlement reports</p>
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

            <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-xl font-black mb-6 dark:text-white">Recent Transactions</h3>
                <div className="space-y-4">
                    {(adminData.orders || []).slice(0, 5).map(order => (
                        <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">💳</div>
                                <div>
                                    <h4 className="font-black text-sm dark:text-white">Payment from {order.user?.fullname}</h4>
                                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
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
            <header className="flex justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black flex items-center gap-2 dark:text-white"><span>🎫</span> Support Tickets</h3>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Manage and resolve user issues</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center px-6 border-r border-gray-100 dark:border-gray-700">
                        <p className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">Open</p>
                        <p className="text-xl font-black text-amber-500">{supportTickets.filter(t => t.status === 'Open').length}</p>
                    </div>
                    <div className="text-center px-6">
                        <p className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">Total</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{supportTickets.length}</p>
                    </div>
                </div>
            </header>

            <section className="bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">User & Issue</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {supportTickets.map(ticket => (
                                <tr key={ticket._id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                        <p className="text-[8px] font-black text-gray-400 dark:text-gray-500">{new Date(ticket.createdAt).toLocaleTimeString()}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div>
                                            <h4 className="font-black text-sm mb-1 dark:text-white">{ticket.subject}</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 line-clamp-2">{ticket.message}</p>
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

    const renderAdminEmails = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
            <header className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black flex items-center gap-2 dark:text-white"><span>✉️</span> Email Campaigns Console</h3>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Draft and send animated HTML marketing emails to Bhojan users</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Controls Card */}
                <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600">Campaign Details</h4>
                    <form onSubmit={handleSendCampaign} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Campaign Template</label>
                            <select
                                className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none outline-none dark:text-white"
                                value={campaignType}
                                onChange={e => setCampaignType(e.target.value)}
                            >
                                <option value="festival">Festival Offer Email</option>
                                <option value="spin">Spin-the-Wheel discount</option>
                                <option value="feedback">Rating stars feedback</option>
                                <option value="prime">Prime renewal reminder</option>
                                <option value="referral">Share referral code</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recipient Target</label>
                            <select
                                className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none outline-none dark:text-white"
                                value={recipientType}
                                onChange={e => setRecipientType(e.target.value)}
                            >
                                <option value="single">Single User</option>
                                <option value="all">All Active Users</option>
                            </select>
                        </div>

                        {recipientType === 'single' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target User</label>
                                <select
                                    className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none outline-none dark:text-white"
                                    value={targetUserId}
                                    onChange={e => setTargetUserId(e.target.value)}
                                    required
                                >
                                    <option value="">Select User</option>
                                    {adminData.users?.map(u => (
                                        <option key={u._id} value={u._id}>{u.fullname} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {campaignType === 'festival' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Festival Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none outline-none dark:text-white"
                                        value={campDetails.festivalName}
                                        onChange={e => setCampDetails({ ...campDetails, festivalName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Discount %</label>
                                        <input
                                            type="number"
                                            className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none outline-none dark:text-white"
                                            value={campDetails.discountPercent}
                                            onChange={e => setCampDetails({ ...campDetails, discountPercent: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Coupon Code</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none outline-none dark:text-white"
                                            value={campDetails.couponCode}
                                            onChange={e => setCampDetails({ ...campDetails, couponCode: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {campaignType === 'feedback' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID (optional)</label>
                                <input
                                    type="text"
                                    placeholder="Enter order ID or leave blank"
                                    className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none outline-none dark:text-white"
                                    value={campDetails.orderId}
                                    onChange={e => setCampDetails({ ...campDetails, orderId: e.target.value })}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={sendingCampaign || (recipientType === 'single' && !targetUserId)}
                            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-lg ${
                                sendingCampaign ? 'bg-gray-300 dark:bg-gray-800' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10'
                            }`}
                        >
                            {sendingCampaign ? 'Sending Campaign...' : 'Send Campaign Email 🚀'}
                        </button>
                    </form>
                </section>

                {/* Email Preview Card Mockup */}
                <section className="bg-gray-900 p-8 rounded-[40px] border border-gray-800 shadow-2xl flex flex-col justify-between text-left">
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-4">Live Email UI Mockup</h4>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 min-h-[350px] flex flex-col">
                            {campaignType === 'festival' && (
                                <>
                                    <div className="bg-gradient-to-r from-orange-500 to-rose-650 p-6 text-center text-white">
                                        <h2 className="text-xl font-extrabold tracking-wide">✨ {campDetails.festivalName || 'Festival Offer'} ✨</h2>
                                        <p className="text-[9px] uppercase tracking-widest mt-1 opacity-80">Exclusive Gift</p>
                                    </div>
                                    <div className="p-6 text-center space-y-4 flex-1 flex flex-col justify-center">
                                        <h3 className="text-gray-800 font-extrabold text-lg">Celebrate With Delicious Savings</h3>
                                        <div className="p-4 border-2 border-dashed border-rose-500 bg-rose-50/50 rounded-xl max-w-xs mx-auto">
                                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Coupon code</span>
                                            <div className="text-2xl font-black text-rose-650 tracking-wider my-1">{campDetails.couponCode || 'CODE'}</div>
                                            <div className="text-sm font-extrabold text-gray-800">Flat {campDetails.discountPercent || '50'}% OFF</div>
                                        </div>
                                        <button className="bg-rose-500 text-white font-extrabold text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-xl mx-auto shadow-md scale-100 hover:scale-105 transition-all">Order Festive Feast 🍲</button>
                                    </div>
                                </>
                            )}
                            {campaignType === 'spin' && (
                                <>
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-650 p-6 text-center text-white">
                                        <h2 className="text-xl font-extrabold tracking-wide">🎡 Spin & Win!</h2>
                                        <p className="text-[9px] uppercase tracking-widest mt-1 opacity-80">Interactive game reward</p>
                                    </div>
                                    <div className="p-6 text-center space-y-4 flex-1 flex flex-col justify-center">
                                        <h3 className="text-gray-800 font-extrabold text-lg">Are you feeling lucky today?</h3>
                                        
                                        {/* CSS Spinning Wheel simulation */}
                                        <div className="w-24 h-24 rounded-full border-[6px] border-gray-800 relative mx-auto overflow-hidden animate-spin" style={{ animationDuration: '6s' }}>
                                            <div className="absolute inset-0 bg-red-400 rotate-0 skew-y-[30deg]"></div>
                                            <div className="absolute inset-0 bg-yellow-400 rotate-60 skew-y-[30deg]"></div>
                                            <div className="absolute inset-0 bg-emerald-400 rotate-120 skew-y-[30deg]"></div>
                                            <div className="absolute inset-0 bg-blue-400 rotate-180 skew-y-[30deg]"></div>
                                            <div className="absolute inset-0 bg-pink-400 rotate-240 skew-y-[30deg]"></div>
                                            <div className="absolute inset-0 bg-indigo-400 rotate-300 skew-y-[30deg]"></div>
                                            <div className="absolute w-6 h-6 rounded-full bg-white border-2 border-gray-800 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"></div>
                                        </div>

                                        <button className="bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-xl mx-auto shadow-md">Spin the Wheel Now 🎡</button>
                                    </div>
                                </>
                            )}
                            {campaignType === 'feedback' && (
                                <>
                                    <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-center text-white">
                                        <h2 className="text-xl font-extrabold tracking-wide">🍽️ Rate Your Meal</h2>
                                        <p className="text-[9px] uppercase tracking-widest mt-1 opacity-80">Feedback request</p>
                                    </div>
                                    <div className="p-6 text-center space-y-4 flex-1 flex flex-col justify-center">
                                        <h3 className="text-gray-800 font-extrabold text-lg">How was your delivery?</h3>
                                        <p className="text-xs text-gray-500">Rate your recent order #{campDetails.orderId?.slice(-6).toUpperCase() || 'RECENT'} with one click:</p>
                                        <div className="flex justify-center gap-2 text-3xl text-gray-300">
                                            <span className="hover:text-yellow-400 cursor-pointer">★</span>
                                            <span className="hover:text-yellow-400 cursor-pointer">★</span>
                                            <span className="hover:text-yellow-400 cursor-pointer">★</span>
                                            <span className="hover:text-yellow-400 cursor-pointer">★</span>
                                            <span className="hover:text-yellow-400 cursor-pointer">★</span>
                                        </div>
                                    </div>
                                </>
                            )}
                            {campaignType === 'prime' && (
                                <>
                                    <div className="bg-gray-900 p-6 text-center border-b-4 border-yellow-500">
                                        <div className="text-3xl">👑</div>
                                        <h2 className="text-xl font-extrabold tracking-wide text-yellow-500">BHOJAN PRIME</h2>
                                        <p className="text-[8px] uppercase tracking-widest mt-1 text-gray-400">Exclusive Membership Perks</p>
                                    </div>
                                    <div className="p-6 text-center space-y-4 flex-1 flex flex-col justify-center bg-gray-50/20">
                                        <h3 className="text-gray-800 font-extrabold text-sm">Upgrade or Renew Your Prime Status</h3>
                                        <ul className="text-left text-[9px] font-bold text-gray-500 space-y-1.5 max-w-xs mx-auto">
                                            <li>🚀 Free Delivery on orders above ₹199</li>
                                            <li>⚡ Express Kitchen Prep (Faster cooking)</li>
                                            <li>💎 Double Loyalty Reward points</li>
                                        </ul>
                                        <button className="bg-yellow-500 text-gray-900 font-black text-[9px] uppercase tracking-widest px-6 py-2.5 rounded-xl mx-auto shadow-md">Renew Membership 👑</button>
                                    </div>
                                </>
                            )}
                            {campaignType === 'referral' && (
                                <>
                                    <div className="bg-emerald-600 p-6 text-center text-white">
                                        <h2 className="text-xl font-extrabold tracking-wide">👥 Spread the Taste</h2>
                                        <p className="text-[9px] uppercase tracking-widest mt-1 opacity-80">Referral Loyalty bonus</p>
                                    </div>
                                    <div className="p-6 text-center space-y-4 flex-1 flex flex-col justify-center">
                                        <h3 className="text-gray-800 font-extrabold text-lg">Invite Friends & Get 500 Pts</h3>
                                        <div className="p-4 border-2 border-dashed border-emerald-500 bg-emerald-50 rounded-xl max-w-xs mx-auto">
                                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Your Code</span>
                                            <div className="text-xl font-black text-emerald-700 tracking-wider my-0.5">REFXXXX</div>
                                        </div>
                                        <button className="bg-emerald-600 text-white font-extrabold text-[9px] uppercase tracking-widest px-6 py-2.5 rounded-xl mx-auto shadow-md">Copy Share Link</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </motion.div>
    );

    const renderAdminSettings = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <header className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-2xl font-black flex items-center gap-2 dark:text-white"><span>⚙️</span> Platform Settings</h3>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Configure global platform parameters & fees</p>
            </header>

            <form onSubmit={handleUpdateSystemConfig} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600">Standard Fees & Taxes</h4>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Global Delivery Charge (₹)</label>
                            <input type="number" className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none outline-none focus:ring-2 ring-indigo-600/20 dark:text-white"
                                value={adminData.config?.deliveryCharges || ''} onChange={e => setAdminData({ ...adminData, config: { ...adminData.config, deliveryCharges: Number(e.target.value) } })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tax Percentage (%)</label>
                            <input type="number" className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none outline-none focus:ring-2 ring-indigo-600/20 dark:text-white"
                                value={adminData.config?.taxPercentage || ''} onChange={e => setAdminData({ ...adminData, config: { ...adminData.config, taxPercentage: Number(e.target.value) } })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Platform Fee (₹)</label>
                            <input type="number" className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none outline-none focus:ring-2 ring-indigo-600/20 dark:text-white"
                                value={adminData.config?.platformFee || ''} onChange={e => setAdminData({ ...adminData, config: { ...adminData.config, platformFee: Number(e.target.value) } })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Referral Bonus (Pts)</label>
                            <input type="number" className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none outline-none focus:ring-2 ring-indigo-600/20 dark:text-white"
                                value={adminData.config?.referralBonus || ''} onChange={e => setAdminData({ ...adminData, config: { ...adminData.config, referralBonus: Number(e.target.value) } })} />
                        </div>
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600">System Controls</h4>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                            <div>
                                <h5 className="font-black text-sm dark:text-white">Maintenance Mode</h5>
                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Redirect users to 'Under Construction' page</p>
                            </div>
                            <input type="checkbox" className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500"
                                checked={adminData.config?.maintenanceMode || false} onChange={e => setAdminData({ ...adminData, config: { ...adminData.config, maintenanceMode: e.target.checked } })} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                            <div>
                                <h5 className="font-black text-sm dark:text-white">Surge Pricing</h5>
                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Enable 1.5x multiplier for peak hours</p>
                            </div>
                            <input type="checkbox" className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500"
                                checked={adminData.config?.surgePricing || false} onChange={e => setAdminData({ ...adminData, config: { ...adminData.config, surgePricing: e.target.checked } })} />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Global Announcement Banner</h4>
                        <textarea
                            className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-xs font-bold min-h-[80px] focus:ring-2 ring-indigo-600/20 dark:text-white"
                            placeholder="Type platform announcement here..."
                            value={adminData.config?.announcementBanner || ''}
                            onChange={e => setAdminData({ ...adminData, config: { ...adminData.config, announcementBanner: e.target.value } })}
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Global Categories</h4>
                        <div className="flex flex-wrap gap-2">
                            {(adminData.config?.globalCategories || ['Pizza', 'Burger', 'Biryani', 'Thali']).map((cat) => (
                                <span key={cat} className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-2">
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
                            <div key={flag} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                                <div className="flex-1">
                                    <h5 className="font-black text-sm capitalize dark:text-white">{flag.replace(/([A-Z])/g, ' $1')}</h5>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Control {flag} visibility</p>
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
                            className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-xs font-bold border-none dark:text-white"
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
            <header className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-2xl font-black flex items-center gap-2 dark:text-white"><span>🛡️</span> Moderation & Security Hub</h3>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Audit logs, fraud detection & user complaints</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <section className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h4 className="text-sm font-black mb-6 dark:text-white">Security Incident Log</h4>
                    <div className="space-y-4">
                        {[
                            { event: 'Suspicious Login Attempt', user: 'aditya@example.com', time: '2 mins ago', level: 'High' },
                            { event: 'Bulk Password Reset Trigger', user: 'admin', time: '1 hour ago', level: 'Med' },
                            { event: 'New Verification Request', user: 'Burger King Patna', time: '3 hours ago', level: 'Info' }
                        ].map((log, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-l-4 border-indigo-600">
                                <div className="flex items-center gap-4">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm ${log.level === 'High' ? 'bg-red-100 text-primary' : 'bg-indigo-100 text-indigo-600'}`}>
                                        !
                                    </span>
                                    <div>
                                        <h5 className="font-black text-sm dark:text-white">{log.event}</h5>
                                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{log.user} • {log.time}</p>
                                    </div>
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${log.level === 'High' ? 'bg-red-100 text-primary' : 'bg-gray-200 text-gray-600'}`}>
                                    {log.level}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">🤖</div>
                    <h4 className="text-lg font-black mb-2 dark:text-white">AI Fraud Detection</h4>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-6 italic uppercase tracking-widest">Scanning transactions in real-time</p>
                    <div className="space-y-4 text-left">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">All systems operational</span>
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

    const renderMobileAccount = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:hidden min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            {/* Swiggy-Style Premium Header */}
            <div className="bg-white dark:bg-gray-800 px-6 pt-12 pb-8 rounded-b-[40px] shadow-sm border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                            {user?.fullname?.split(' ')[0]}
                        </h2>
                        <p className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-1">{user?.mobile || user?.email}</p>
                    </div>
                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-white text-xl md:text-3xl font-black shadow-xl bg-gradient-to-br ${isAdmin ? 'from-indigo-500 to-purple-600' : isOwner ? 'from-red-500 to-orange-600' : 'from-amber-400 to-yellow-500'}`}>
                        {user?.fullname?.charAt(0)}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => handleTabChange('personal')} className="flex-1 bg-gray-50 dark:bg-gray-700/50 py-3 rounded-2xl flex items-center justify-center gap-2 border border-gray-100 dark:border-gray-600 active:scale-95 transition-transform">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">Edit Profile</span>
                    </button>
                    {(isAdmin || isOwner) && (
                        <button onClick={handleSwitchMode} className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-transform">
                            <span className="text-xs font-black uppercase tracking-widest">Dashboard</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Account Sections */}
            <div className="px-6 mt-8 space-y-8">
                {/* Categorized Menu Lists */}
                {[
                    // Management Hub (For Admins, Owners, Delivery)
                    ...(isAdmin || isOwner || isDelivery ? [{
                        title: isAdmin ? 'Platform Control' : isOwner ? 'Shop Management' : 'Delivery Hub',
                        items: tabs.filter(t => t.id.startsWith('admin-') || t.id.startsWith('owner-') || t.id.startsWith('delivery-'))
                    }] : []),

                    // Personal & Account
                    {
                        title: 'Personal Info',
                        items: tabs.filter(t => ['personal', 'analytics', 'security', 'preferences'].includes(t.id))
                    },

                    // Bhojan Hub (Primary User Actions)
                    {
                        title: 'Bhojan Hub',
                        items: tabs.filter(t => ['orders', 'wishlist', 'payments', 'loyalty', 'quests', 'meal-planner'].includes(t.id))
                    },

                    // App Settings
                    {
                        title: 'Others',
                        items: tabs.filter(t => ['settings', 'support'].includes(t.id))
                    }
                ].filter(section => section.items.length > 0).map((section, idx) => (
                    <div key={idx} className="space-y-4">
                        <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">
                            {section.title}
                        </h3>
                        <div className="bg-white dark:bg-gray-800 rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                            {section.items.map((item, i) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleTabChange(item.id)}
                                    className={`w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 active:bg-gray-100 dark:active:bg-gray-700 transition-colors ${i !== section.items.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-xl bg-gray-50 dark:bg-gray-700 w-10 h-10 flex items-center justify-center rounded-xl">{item.icon}</span>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.label}</span>
                                    </div>
                                    <span className="text-gray-300">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="9 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Dangerous Zone */}
                <div className="pt-4 pb-8">
                    <button
                        onClick={() => { dispatch(logoutUser()); navigate('/'); }}
                        className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 py-5 rounded-[32px] font-black text-xs uppercase tracking-widest border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                    >
                        <span>👋</span> Logout Account
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full mt-6 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest text-center"
                    >
                        Delete My Data Permanently
                    </button>
                </div>
            </div>
        </motion.div>
    );

    if (isMobileMain && window.innerWidth < 768) {
        return renderMobileAccount();
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row font-sans text-gray-800 dark:text-gray-100">
            {/* Sidebar / Bottom Tab Bar */}
            <aside className="hidden md:flex md:w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl md:min-h-screen sticky top-16 md:h-[calc(100vh-64px)] md:overflow-y-auto border-r md:border-r border-b md:border-b-0 border-gray-100 dark:border-gray-700 p-4 md:p-6 z-[20] transition-all duration-300">
                <div className="flex flex-col h-full">
                    {/* Profile Header Card */}
                    <div className="relative mb-6 md:mb-10 group cursor-pointer">
                        <div className={`absolute inset-0 bg-gradient-to-br ${isAdmin ? 'from-indigo-500 to-purple-600' : isOwner ? 'from-red-500 to-orange-600' : 'from-amber-400 to-yellow-500'} rounded-[32px] blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500`}></div>
                        <div className="relative bg-white dark:bg-gray-800 p-4 md:p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white text-xl md:text-3xl font-black shadow-lg bg-gradient-to-br ${isAdmin ? 'from-indigo-500 to-purple-600' : isOwner ? 'from-red-500 to-orange-600' : 'from-amber-400 to-yellow-500'}`}>
                                {user?.fullname?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-black text-gray-900 dark:text-white text-base md:text-lg leading-tight truncate">{user?.fullname?.split(' ')[0]}</h2>
                                <p className="text-[9px] md:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                                    {isAdmin ? '👑 ADMIN' : isOwner ? '🏪 OWNER' : isDelivery ? '🛵 PARTNER' : '👤 CUSTOMER'}
                                    {(isOwner || isDelivery) && user?.businessVerification?.status === 'Verified' && <span className="text-green-500 text-xs" title="Verified">✅</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="flex-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 group relative overflow-hidden ${activeTab === tab.id
                                    ? (isAdmin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : isOwner ? 'bg-primary text-white shadow-lg shadow-red-200' : 'bg-amber-500 text-white shadow-lg shadow-amber-200')
                                    : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <span className={`text-lg md:text-xl transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>{tab.icon}</span>
                                <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
                                {activeTab === tab.id && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                            </button>
                        ))}
                    </nav>

                    {/* Stats / Toggle Card */}
                    <div className={`mt-6 md:mt-10 p-4 md:p-6 rounded-[28px] md:rounded-[32px] border relative overflow-hidden group ${isAdmin ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800' : isOwner ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'}`}>
                        <div className={`absolute top-0 right-0 p-4 md:p-8 text-6xl md:text-8xl opacity-5 rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110  ${isAdmin ? 'text-indigo-600' : isOwner ? 'text-primary' : isDelivery ? 'text-indigo-600' : 'text-amber-600'}`}>
                            {isAdmin ? '💰' : isOwner ? '📈' : isDelivery ? '🛵' : '😋'}
                        </div>
                        <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-1 italic relative z-10 ${isAdmin ? 'text-indigo-600' : isOwner ? 'text-primary' : isDelivery ? 'text-indigo-600' : 'text-amber-600'}`}>
                            {isAdmin ? 'System Revenue' : (isOwner && !isShoppingMode) ? 'Total Revenue' : isDelivery ? 'My Earnings' : 'Satisfied Cravings'}
                        </p>
                        <p className={`text-xl md:text-3xl font-black mb-4 md:mb-6 relative z-10 ${isAdmin ? 'text-indigo-900 dark:text-indigo-100' : isOwner ? 'text-red-900 dark:text-red-100' : isDelivery ? 'text-indigo-900 dark:text-indigo-100' : 'text-amber-900 dark:text-amber-100'}`}>
                            {isAdmin ? `₹${adminData.stats?.totalRevenue || 0}` : (isOwner && !isShoppingMode) ? `₹${insights?.totalRevenue || 0}` : isDelivery ? `₹${deliveryStats.totalEarnings}` : `${orders?.length || 0} Orders`}
                        </p>

                        {(isAdmin || isOwner) && (
                            <button
                                onClick={handleSwitchMode}
                                className={`w-full py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border-2 relative z-10 ${isShoppingMode
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
                <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => { setIsMobileMain(true); setSearchParams({}); }}
                            className="md:hidden flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="C15 19l-7-7 7-7" />
                            </svg>
                            Back to Account
                        </button>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-1">{tabs.find(t => t.id === activeTab)?.label}</h1>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium italic">Manage your {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} settings and details properly.</p>
                    </div>
                    {/* Contextual Action Button (Optional Placeholder) */}
                    <div className="hidden md:block">
                        <span className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full text-xs font-black shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2 dark:text-gray-300">
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

                {/* Shared Order Modals */}
                <ReviewModal
                    isOpen={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    order={selectedOrder}
                />

                <OrderDetailsModal
                    isOpen={showDetailsModal}
                    onClose={() => setShowDetailsModal(false)}
                    order={selectedOrder}
                    onDownloadInvoice={handleDownloadInvoice}
                    isAdmin={isAdmin}
                    deliveryPartners={deliveryPartners}
                    onAssignOrder={handleAssignOrder}
                />

                {/* --- Advanced Delivery Modals --- */}

                {/* Proof of Delivery (POD) Modal */}
                <AnimatePresence>
                    {showPODModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh]"
                            >
                                <div className="p-8">
                                    <h4 className="text-2xl font-black mb-2 dark:text-white">Proof of Delivery 🧾</h4>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Confirm order #{selectedOrder?._id.slice(-6)} arrival</p>

                                    <div className="space-y-6">
                                        {/* OTP Section */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer OTP</label>
                                            <input
                                                type="text"
                                                maxLength="4"
                                                className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 text-2xl font-black text-center tracking-[1em] focus:ring-2 ring-green-500 transition-all dark:text-white"
                                                placeholder="0000"
                                                value={podFormData.otp}
                                                onChange={e => setPodFormData({ ...podFormData, otp: e.target.value })}
                                            />
                                        </div>

                                        {/* Photo Upload Simulation */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery Photo</label>
                                            <div className="border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" onClick={() => setPodFormData({ ...podFormData, photoUrl: 'https://via.placeholder.com/400x300?text=Delivery+Photo' })}>
                                                {podFormData.photoUrl ? (
                                                    <img src={podFormData.photoUrl} className="h-40 w-full object-cover rounded-2xl" alt="Proof" />
                                                ) : (
                                                    <div className="space-y-2">
                                                        <span className="text-4xl block">📸</span>
                                                        <p className="text-[10px] font-black uppercase text-gray-400">Click to Snap Photo</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Signature Pad Simulation */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Digital Signature</label>
                                            <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl h-32 flex items-center justify-center border border-gray-100 dark:border-gray-800 italic text-gray-400 font-serif">
                                                {podFormData.signatureUrl ? 'Signed ✓' : 'Customer Signature Pad Area'}
                                            </div>
                                            <button
                                                onClick={() => setPodFormData({ ...podFormData, signatureUrl: 'signed_token' })}
                                                className="w-full text-[8px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                                            >
                                                Simulate Signature
                                            </button>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button onClick={() => setShowPODModal(false)} className="flex-1 py-4 font-black text-xs uppercase text-gray-400">Cancel</button>
                                            <button
                                                onClick={() => handleVerifyDelivery(selectedOrder?._id)}
                                                disabled={updating || !podFormData.otp}
                                                className="flex-[2] bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-100 disabled:opacity-50"
                                            >
                                                {updating ? 'Verifying...' : 'Complete Delivery Payout'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Dispute Modal */}
                <AnimatePresence>
                    {showDisputeModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl"
                            >
                                <div className="p-8">
                                    <h4 className="text-2xl font-black mb-6 dark:text-white">Raise Dispute ⚖️</h4>
                                    <form onSubmit={handleRaiseDispute} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Issue Type</label>
                                            <select
                                                required
                                                className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none dark:text-white"
                                                value={disputeFormData.type}
                                                onChange={e => setDisputeFormData({ ...disputeFormData, type: e.target.value })}
                                            >
                                                <option>Payment Issue</option>
                                                <option>Cancellation Conflict</option>
                                                <option>Customer Behavior</option>
                                                <option>Technical Glitch</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID (Auto-filled)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-2xl p-4 text-xs font-mono text-gray-400"
                                                readOnly
                                                value={disputeFormData.orderId || 'Select from table'}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Detailed Description</label>
                                            <textarea
                                                required
                                                rows="4"
                                                className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none resize-none dark:text-white"
                                                placeholder="Explain what happened..."
                                                value={disputeFormData.description}
                                                onChange={e => setDisputeFormData({ ...disputeFormData, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <button type="button" onClick={() => setShowDisputeModal(false)} className="flex-1 py-4 font-black text-xs uppercase text-gray-400">Discard</button>
                                            <button
                                                type="submit"
                                                disabled={updating || !disputeFormData.orderId}
                                                className="flex-[2] bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-100 disabled:opacity-50"
                                            >
                                                {updating ? 'Submitting...' : 'Submit Report'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
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
                            className="bg-white dark:bg-gray-800 rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="p-8">
                                <h4 className="text-2xl font-black mb-6 flex items-center gap-2 dark:text-white"><span>📍</span> Add New Address</h4>
                                <form onSubmit={handleAddAddress} className="space-y-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Home', 'Work', 'Other'].map(l => (
                                            <button
                                                key={l}
                                                type="button"
                                                onClick={() => setAddressFormData({ ...addressFormData, label: l })}
                                                className={`py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${addressFormData.label === l ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-400' : 'bg-gray-50 dark:bg-gray-700 border-transparent text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Street / Area</label>
                                        <input type="text" required className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none focus:ring-2 ring-primary transition-all dark:text-white" value={addressFormData.street} onChange={e => setAddressFormData({ ...addressFormData, street: e.target.value })} placeholder="Flat No, Building, Street" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pincode</label>
                                            <input
                                                type="text"
                                                required
                                                maxLength="6"
                                                className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none focus:ring-2 ring-primary transition-all dark:text-white"
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
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-gray-800 rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="p-10 text-center">
                                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-primary rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
                                <h4 className="text-2xl font-black mb-2 dark:text-white">Delete Account?</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-8">This will permanently erase all your data, order history, and credits. This action is irreversible.</p>

                                <input
                                    type="password"
                                    placeholder="Confirm with password"
                                    className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-sm font-bold border-none focus:ring-2 ring-primary transition-all mb-6 dark:text-white"
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

            {/* 2FA Backup Codes Modal */}
            {showCodesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[32px] p-8 border border-gray-150 dark:border-gray-800 shadow-2xl relative text-left"
                    >
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2 dark:text-white">
                            <span>🔐</span> Save Backup Codes
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            If you lose access to your verification email, you can use these backup codes to access your account. Write them down in a secure place. Each code can only be used once.
                        </p>
                        <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                            {backupCodes?.map((code, idx) => (
                                <div key={idx} className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-xl text-center font-mono font-black text-sm text-primary select-all">
                                    {code}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(backupCodes.join('\n'));
                                toast.success('Codes copied to clipboard!');
                            }}
                            className="w-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition mb-3"
                        >
                            Copy All Codes
                        </button>
                        <button
                            onClick={() => setShowCodesModal(false)}
                            className="w-full bg-primary text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition"
                        >
                            Done
                        </button>
                    </motion.div>
                </div>
            )}
        </div >
    );
};

export default UserProfile;
