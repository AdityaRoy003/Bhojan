import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const PeakHours = ({ hourlyOrders, peakHour }) => {
    if (!hourlyOrders || hourlyOrders.every(count => count === 0)) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center py-12">
                <div className="text-6xl mb-4">⏰</div>
                <p className="text-gray-500 font-medium">No order time data yet</p>
            </div>
        );
    }

    // Convert hourly data to chart format
    const data = hourlyOrders.map((count, hour) => ({
        hour: `${hour}:00`,
        orders: count
    })).filter(d => d.orders > 0); // Only show hours with orders

    const formatHour = (hour) => {
        const h = parseInt(hour);
        if (h === 0) return '12 AM';
        if (h < 12) return `${h} AM`;
        if (h === 12) return '12 PM';
        return `${h - 12} PM`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">⏰ Peak Hours</h3>
                    <p className="text-sm text-gray-500">Order distribution by time</p>
                </div>
                <div className="text-right bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Busiest Hour</p>
                    <p className="text-lg font-black text-orange-900">{formatHour(peakHour)}</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="hour"
                        stroke="#9ca3af"
                        style={{ fontSize: '11px' }}
                        tickFormatter={formatHour}
                    />
                    <YAxis
                        stroke="#9ca3af"
                        style={{ fontSize: '11px' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        formatter={(value, name) => [value, 'Orders']}
                        labelFormatter={formatHour}
                    />
                    <Bar
                        dataKey="orders"
                        fill="#f59e0b"
                        radius={[8, 8, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Morning</p>
                    <p className="text-sm font-black text-blue-900">
                        {hourlyOrders.slice(6, 12).reduce((a, b) => a + b, 0)} orders
                    </p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-xl">
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Afternoon</p>
                    <p className="text-sm font-black text-orange-900">
                        {hourlyOrders.slice(12, 18).reduce((a, b) => a + b, 0)} orders
                    </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Evening</p>
                    <p className="text-sm font-black text-purple-900">
                        {hourlyOrders.slice(18, 24).reduce((a, b) => a + b, 0)} orders
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default PeakHours;
