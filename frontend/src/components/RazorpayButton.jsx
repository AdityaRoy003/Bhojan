import React, { useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast'; // optional toast library; replace with any UI feedback you use

/**
 * RazorpayButton – reusable payment button.
 * Props:
 *   amount (number) – total amount in INR (will be multiplied by 100 for paise)
 *   onSuccess (function) – callback after successful payment verification
 *   disabled (bool) – disable button while loading
 */
const RazorpayButton = ({ amount, onSuccess, disabled }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!amount) {
      toast.error('Amount is required');
      return;
    }
    setLoading(true);
    try {
      // 1️⃣ Get the public key from backend
      const { data: { key } } = await api.get('/payment/key');

      // 2️⃣ Create an order on Razorpay
      const { data: orderRes } = await api.post('/payment/create', {
        amount: Math.round(amount), // backend expects INR, it will *100 internally
      });

      if (!orderRes.success) {
        toast.error(orderRes.message || 'Failed to create payment order');
        setLoading(false);
        return;
      }

      // 3️⃣ Open Razorpay Checkout modal
      const options = {
        key,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: 'Bhojan',
        description: `Order payment – ₹${amount}`,
        order_id: orderRes.order.id,
        handler: async (response) => {
          try {
            // Verify payment on backend
            await api.post('/payment/verify', response);
            toast.success('Payment verified!');
            if (onSuccess) onSuccess(response);
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: '', // you can populate from user profile if needed
          email: '',
          contact: ''
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          paylater: true
        },
        theme: { color: '#e63946' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Payment initialization error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      disabled={disabled || loading}
      onClick={handlePayment}
      className={`px-6 py-3 rounded-xl font-bold transition ${disabled || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary text-white hover:bg-red-700'}`}
    >
      {loading ? 'Processing…' : `Pay ₹${amount}`}
    </button>
  );
};

export default RazorpayButton;
