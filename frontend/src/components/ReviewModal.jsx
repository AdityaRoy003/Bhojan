import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'react-toastify';

const ReviewModal = ({ isOpen, onClose, order, onReviewSubmit }) => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !order) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await api.post('/review/add', {
                shopId: order.shop._id,
                orderId: order._id,
                rating,
                review
            });

            if (data.success) {
                toast.success('Review submitted successfully!');
                if (onReviewSubmit) onReviewSubmit(data.review);
                onClose();
            }
        } catch (error) {
            console.error('Review submit error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl relative"
                >
                    <div className="p-8">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors font-bold"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-black mb-2">Rate your Order</h3>
                            <p className="text-sm text-gray-500 font-medium">
                                How was your food from <span className="text-gray-900 font-black">{order.shop?.name}</span>?
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Star Rating */}
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <span className={`transition-colors ${star <= (hoverRating || rating)
                                            ? 'text-amber-400'
                                            : 'text-gray-200'
                                            }`}>
                                            ★
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <p className="text-center text-xs font-black uppercase tracking-widest text-amber-500 h-4">
                                {hoverRating === 1 ? 'Terrible 😞' :
                                    hoverRating === 2 ? 'Bad 😕' :
                                        hoverRating === 3 ? 'Okay 😐' :
                                            hoverRating === 4 ? 'Good 🙂' :
                                                hoverRating === 5 ? 'Amazing 🤩' : ''}
                            </p>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Write a Review (Optional)</label>
                                <textarea
                                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary transition-all min-h-[120px] resize-none"
                                    placeholder="Tell us what you liked or disliked..."
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    maxLength={500}
                                />
                                <div className="text-right text-[10px] font-black text-gray-300">
                                    {review.length}/500
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || rating === 0}
                                className="w-full bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-gray-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ReviewModal;
