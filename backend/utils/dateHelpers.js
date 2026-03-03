// Date helper functions for analytics
const isToday = (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.getDate() === today.getDate() &&
        checkDate.getMonth() === today.getMonth() &&
        checkDate.getFullYear() === today.getFullYear();
};

const isThisWeek = (date) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return new Date(date) >= weekAgo;
};

const getLast7DaysRevenue = (orders) => {
    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const dayOrders = orders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= date && orderDate < nextDay && o.isPaid;
        });

        const revenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        last7Days.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: revenue,
            orders: dayOrders.length
        });
    }

    return last7Days;
};

const getOrderDistribution = (orders) => {
    const distribution = {
        Placed: 0,
        Preparing: 0,
        Ready: 0,
        OutForDelivery: 0,
        Delivered: 0,
        Cancelled: 0
    };

    orders.forEach(order => {
        if (distribution.hasOwnProperty(order.orderStatus)) {
            distribution[order.orderStatus]++;
        }
    });

    return distribution;
};

module.exports = {
    isToday,
    isThisWeek,
    getLast7DaysRevenue,
    getOrderDistribution
};
