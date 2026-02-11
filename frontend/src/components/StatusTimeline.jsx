import React from 'react';
import { motion } from 'framer-motion';

const StatusTimeline = ({ currentStatus, statusHistory = [] }) => {
    const statuses = [
        { key: 'Placed', label: 'Order Placed', icon: '📝' },
        { key: 'Preparing', label: 'Preparing', icon: '👨‍🍳' },
        { key: 'Ready', label: 'Ready', icon: '✅' },
        { key: 'OutForDelivery', label: 'Out for Delivery', icon: '🏍️' },
        { key: 'Delivered', label: 'Delivered', icon: '🎉' }
    ];

    const getCurrentIndex = () => {
        return statuses.findIndex(s => s.key === currentStatus);
    };

    const getStatusTimestamp = (statusKey) => {
        const historyItem = statusHistory.find(h => h.status === statusKey);
        if (historyItem) {
            return new Date(historyItem.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return null;
    };

    const currentIndex = getCurrentIndex();

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Order Status</h3>

            <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-primary"
                    />
                </div>

                {/* Status Steps */}
                <div className="relative flex justify-between">
                    {statuses.map((status, index) => {
                        const isCompleted = index <= currentIndex;
                        const isCurrent = index === currentIndex;
                        const timestamp = getStatusTimestamp(status.key);

                        return (
                            <div key={status.key} className="flex flex-col items-center" style={{ width: '20%' }}>
                                {/* Circle */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-4 ${isCompleted
                                            ? 'bg-primary border-primary text-white'
                                            : 'bg-white border-gray-300 text-gray-400'
                                        } ${isCurrent ? 'ring-4 ring-primary/30 animate-pulse' : ''}`}
                                >
                                    {status.icon}
                                </motion.div>

                                {/* Label */}
                                <div className="mt-3 text-center">
                                    <p className={`text-xs font-bold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {status.label}
                                    </p>
                                    {timestamp && (
                                        <p className="text-[10px] text-gray-500 mt-1">{timestamp}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Current Status Message */}
            {currentStatus !== 'Delivered' && currentStatus !== 'Cancelled' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20"
                >
                    <p className="text-sm text-gray-700 text-center">
                        {currentStatus === 'Placed' && '🎯 Your order has been placed successfully!'}
                        {currentStatus === 'Preparing' && '👨‍🍳 The restaurant is preparing your delicious meal!'}
                        {currentStatus === 'Ready' && '✅ Your order is ready and waiting for pickup!'}
                        {currentStatus === 'OutForDelivery' && '🏍️ Your order is on the way!'}
                    </p>
                </motion.div>
            )}

            {currentStatus === 'Delivered' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200"
                >
                    <p className="text-sm text-green-700 text-center font-bold">
                        🎉 Order Delivered! Enjoy your meal!
                    </p>
                </motion.div>
            )}
        </div>
    );
};

export default StatusTimeline;
