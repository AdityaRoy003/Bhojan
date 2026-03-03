import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OrderDetailsModal = ({ isOpen, onClose, order, onDownloadInvoice, isAdmin, deliveryPartners, onAssignOrder }) => {
    const [selectedPartnerId, setSelectedPartnerId] = React.useState('');
    if (!isOpen || !order) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white dark:bg-gray-800 rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
                >
                    <div className="p-8">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
                            <div>
                                <h3 className="text-2xl font-black mb-1 dark:text-white">Order Details</h3>
                                <p className="text-sm text-gray-500 font-bold">#{order._id.toUpperCase()}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Force Assign (Admin Only) */}
                        {isAdmin && (order.orderStatus === 'Ready' || order.orderStatus === 'Placed' || order.orderStatus === 'Preparing') && (
                            <section className="mb-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2">
                                    <span>🛡️</span> Manual Fleet Assignment
                                </h4>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <select
                                        value={selectedPartnerId}
                                        onChange={(e) => setSelectedPartnerId(e.target.value)}
                                        className="flex-1 bg-white dark:bg-gray-700 p-3 rounded-xl border-none text-xs font-bold outline-none ring-2 ring-indigo-500/20 dark:text-white"
                                    >
                                        <option value="">Select Partner...</option>
                                        {(deliveryPartners || [])
                                            .filter(p => p.deliverySpecs?.isOnline)
                                            .map(p => (
                                                <option key={p._id} value={p._id}>
                                                    {p.fullname} ({p.deliverySpecs?.completedDeliveries || 0} del - ⭐{p.deliverySpecs?.rating || 'N/A'})
                                                </option>
                                            ))
                                        }
                                    </select>
                                    <button
                                        onClick={() => {
                                            if (!selectedPartnerId) return alert('Select a partner first');
                                            onAssignOrder(order._id, selectedPartnerId);
                                        }}
                                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 disabled:opacity-50"
                                        disabled={!selectedPartnerId}
                                    >
                                        Force Assign
                                    </button>
                                </div>
                                <p className="text-[8px] font-bold text-gray-400 mt-3 italic uppercase">
                                    * This overrides auto-selection. Partner will be notified immediately.
                                </p>
                            </section>
                        )}

                        {/* Status & Timeline */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                                    order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                                        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                    }`}>
                                    {order.orderStatus}
                                </span>
                                <span className="text-xs font-black text-gray-400 uppercase">
                                    {new Date(order.createdAt).toLocaleString()}
                                </span>
                            </div>

                            {/* Simple Timeline Visualization */}
                            <div className="flex justify-between items-center relative mt-6 px-4">
                                {/* Line */}
                                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-700 -z-10"></div>
                                <div className={`absolute top-1/2 left-0 h-1 bg-green-500 -z-10 transition-all duration-1000`} style={{
                                    width: order.orderStatus === 'Delivered' ? '100%' :
                                        order.orderStatus === 'OutForDelivery' ? '75%' :
                                            order.orderStatus === 'Ready' ? '50%' :
                                                order.orderStatus === 'Preparing' ? '25%' : '0%'
                                }}></div>

                                {['Placed', 'Preparing', 'Ready', 'Out', 'Delivered'].map((step, i) => {
                                    const isActive = ['Placed', 'Preparing', 'Ready', 'OutForDelivery', 'Delivered'].indexOf(order.orderStatus) >= i;
                                    return (
                                        <div key={step} className="flex flex-col items-center gap-2 bg-white dark:bg-gray-800 px-2">
                                            <div className={`w-3 h-3 rounded-full border-2 ${isActive ? 'bg-green-500 border-green-500' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}></div>
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-green-600' : 'text-gray-300'}`}>{step}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Item List */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-6 mb-8">
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Items Ordered</h4>
                            <div className="space-y-4">
                                {order.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-black dark:text-white">{item.quantity}x</div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{item.name || item.item?.name}</p>
                                                {item.type && <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.type === 'Non-Veg' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'}`}>{item.type}</span>}
                                            </div>
                                        </div>
                                        <p className="text-sm font-black dark:text-white">₹{item.price * item.quantity}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 space-y-2">
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-bold">
                                    <span>Item Total</span>
                                    <span>₹{order.items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-bold">
                                    <span>Delivery Fee</span>
                                    <span>₹{order.deliveryFee?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-bold">
                                    <span>Taxes</span>
                                    <span>₹{order.taxAmount?.toFixed(2)}</span>
                                </div>
                                {order.couponDiscount > 0 && (
                                    <div className="flex justify-between text-xs text-green-600 dark:text-green-400 font-bold">
                                        <span>Discount ({order.couponCode})</span>
                                        <span>-₹{order.couponDiscount?.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-black text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span>Grand Total</span>
                                    <span>₹{order.totalAmount?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="p-6 border border-gray-100 dark:border-gray-700 rounded-3xl">
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Restaurant</h4>
                                <p className="font-bold text-gray-900 dark:text-white">{order.shop?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{order.shop?.address}</p>
                            </div>
                            <div className="p-6 border border-gray-100 dark:border-gray-700 rounded-3xl">
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Delivery Address</h4>
                                <p className="font-bold text-gray-900 dark:text-white">{order.deliveryAddress}</p>
                            </div>
                            {order.deliveryPartner && (
                                <div className="p-6 border border-gray-100 dark:border-gray-700 rounded-3xl md:col-span-2 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-xl">🛵</div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Delivered By</h4>
                                        <p className="font-bold text-gray-900 dark:text-white">{order.deliveryPartner.fullname}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{order.deliveryPartner.mobile}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => onDownloadInvoice(order)}
                                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2"
                            >
                                <span>📥</span> Download PDF Invoice
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 transition"
                            >
                                Close Window
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OrderDetailsModal;
