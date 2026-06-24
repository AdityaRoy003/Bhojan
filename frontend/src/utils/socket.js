import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
    withCredentials: true,
    autoConnect: false
});

export const connectSocket = (userId) => {
    if (!socket.connected) {
        socket.connect();
        socket.emit('join', `user_${userId}`);
    }
};

export const joinOrderRoom = (orderId) => {
    socket.emit('join', `order_${orderId}`);
};

export const joinShopRoom = (shopId) => {
    socket.emit('join', `shop_${shopId}`);
};

// ── Live Tracking Helpers ──

// Customer: start watching a delivery's rider position
export const watchOrder = (orderId) => {
    if (!socket.connected) socket.connect();
    socket.emit('watch_order', orderId);
};

// Delivery boy: join the tracking room for broadcasting location
export const joinTrackingRoom = (orderId) => {
    if (!socket.connected) socket.connect();
    socket.emit('join_tracking_room', orderId);
};

// Delivery boy: emit live location update
export const emitRiderLocation = ({ orderId, latitude, longitude, heading = 0, speed = 0 }) => {
    socket.emit('delivery_location_update', { orderId, latitude, longitude, heading, speed });
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

export default socket;
