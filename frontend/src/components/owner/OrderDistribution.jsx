import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const OrderDistribution = ({ distribution }) => {
    if (!distribution) {
        return <div className="text-center py-8 text-gray-500">No order data available</div>;
    }

    const data = Object.entries(distribution)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({ name, value }));

    const COLORS = {
        Placed: '#f59e0b',
        Preparing: '#3b82f6',
        Ready: '#8b5cf6',
        OutForDelivery: '#06b6d4',
        Delivered: '#10b981',
        Cancelled: '#ef4444'
    };

    const totalOrders = data.reduce((sum, item) => sum + item.value, 0);

    if (totalOrders === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-500 font-medium">No orders yet</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Distribution</h3>

            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>

            <div className="mt-6 grid grid-cols-2 gap-3">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[item.name] }}
                            />
                            <span className="text-sm font-medium text-gray-700">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{item.value}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default OrderDistribution;
