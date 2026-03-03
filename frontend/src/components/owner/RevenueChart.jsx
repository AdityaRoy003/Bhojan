import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const RevenueChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No revenue data available yet
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
                    <p className="text-sm text-gray-500">Last 7 days performance</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-indigo-600">
                        ₹{data.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">Total Revenue</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        formatter={(value) => [`₹${value}`, 'Revenue']}
                    />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ fill: '#6366f1', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-indigo-50 rounded-xl">
                    <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Avg/Day</p>
                    <p className="text-lg font-black text-indigo-900">
                        ₹{Math.round(data.reduce((sum, d) => sum + d.revenue, 0) / data.length)}
                    </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Best Day</p>
                    <p className="text-lg font-black text-green-900">
                        ₹{Math.max(...data.map(d => d.revenue))}
                    </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Orders</p>
                    <p className="text-lg font-black text-purple-900">
                        {data.reduce((sum, d) => sum + d.orders, 0)}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default RevenueChart;
