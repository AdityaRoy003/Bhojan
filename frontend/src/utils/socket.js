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

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

export default socket;
