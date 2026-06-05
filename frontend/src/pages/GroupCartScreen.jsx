import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const GroupCartScreen = () => {
    const { partyId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Connect to Socket
        const newSocket = io('http://localhost:8000');
        setSocket(newSocket);

        newSocket.emit('join_group', partyId);

        newSocket.on('group_cart_updated', (data) => {
            // Re-fetch cart or update state
            console.log('Group cart updated by:', data.userName);
            fetchCartData();
        });

        return () => {
            newSocket.emit('leave_group', partyId);
            newSocket.disconnect();
        };
    }, [partyId]);

    useEffect(() => {
        fetchCartData();
    }, [partyId]);

    const fetchCartData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8000/api/cart/group/${partyId}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setCart(data.cart);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleLockCart = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8000/api/cart/group/${partyId}/lock`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setCart(data.cart);
                navigate('/checkout', { state: { isGroupOrder: true, partyId } });
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Group Cart...</div>;
    if (!cart) return <div className="p-8 text-center text-red-500">Cart not found or no longer active.</div>;

    const isHost = cart.hostId === user?._id;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h1 className="text-3xl font-bold mb-4">🛒 Group Cart</h1>
                <p className="text-gray-600 mb-6">Party ID: <span className="font-mono font-bold">{partyId}</span></p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Participants</h2>
                        <ul className="space-y-3">
                            {cart.participants.map((p, idx) => (
                                <li key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span>User: {p.user} {p.user === cart.hostId && '👑'}</span>
                                    <span className={`px-2 py-1 rounded text-sm ${p.status === 'Ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {p.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-4">Items</h2>
                        {cart.items.length === 0 ? (
                            <p className="text-gray-500 italic">Cart is empty. Add some items!</p>
                        ) : (
                            <ul className="space-y-4">
                                {cart.items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between border-b pb-2">
                                        <div>
                                            <p className="font-semibold">{item.name} x {item.quantity}</p>
                                            <p className="text-sm text-gray-500">Added by: {item.addedBy}</p>
                                        </div>
                                        <p className="font-bold">₹{item.price * item.quantity}</p>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {isHost && cart.status === 'Active' && (
                            <button
                                onClick={handleLockCart}
                                className="mt-6 w-full bg-[#f97316] text-white py-3 rounded-lg font-bold shadow-md hover:bg-[#ea580c] transition-colors"
                            >
                                Lock Cart & Proceed to Split Checkout
                            </button>
                        )}
                        {!isHost && cart.status === 'Active' && (
                            <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-lg">
                                Waiting for host to lock the cart...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupCartScreen;
