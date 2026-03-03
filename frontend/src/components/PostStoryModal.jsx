import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const PostStoryModal = ({ onClose, onPosted }) => {
    const [step, setStep] = useState(1); // 1=upload, 2=details
    const [preview, setPreview] = useState(null);
    const [base64, setBase64] = useState(null);
    const [caption, setCaption] = useState('');
    const [shopSearch, setShopSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileRef = useRef(null);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setPreview(ev.target.result);
            setBase64(ev.target.result);
            setStep(2);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!base64 || !caption.trim()) return;
        setSubmitting(true);
        try {
            await api.post('/social/stories', {
                type: 'Story',
                mediaUrl: base64,
                caption,
                isRegional: false,
            });
            setSuccess(true);
            setTimeout(() => { onPosted?.(); onClose(); }, 1500);
        } catch (_) { }
        finally { setSubmitting(false); }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="bg-white dark:bg-gray-900 rounded-t-[40px] md:rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">📸 Post a Food Story</h3>
                        <p className="text-xs text-gray-400 font-medium">Share your food experience</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 font-bold hover:text-red-500 transition-colors">✕</button>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="py-8 text-center">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-6xl mb-3">🎉</motion.div>
                            <p className="font-black text-gray-900 dark:text-white text-lg">Story Posted!</p>
                            <p className="text-sm text-gray-400 mt-1">Your food story is now live</p>
                        </div>
                    ) : step === 1 ? (
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl h-48 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                            <span className="text-4xl">📷</span>
                            <p className="font-black text-gray-700 dark:text-gray-300 text-sm">Tap to upload a photo</p>
                            <p className="text-xs text-gray-400">JPG, PNG — Max 5MB</p>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Preview */}
                            <div className="relative rounded-2xl overflow-hidden h-52 bg-gray-100 dark:bg-gray-800">
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => { setStep(1); setPreview(null); }}
                                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold hover:bg-black/70 transition-colors"
                                >✕</button>
                            </div>

                            {/* Caption */}
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Caption *</label>
                                <textarea
                                    value={caption}
                                    onChange={e => setCaption(e.target.value)}
                                    placeholder="What are you eating? Tell the world! 🍛"
                                    rows={3}
                                    maxLength={200}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-gray-400"
                                />
                                <p className="text-right text-[10px] text-gray-400 mt-1">{caption.length}/200</p>
                            </div>

                            {/* Submit */}
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSubmit}
                                disabled={!caption.trim() || submitting}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-200 dark:shadow-red-900/30 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Posting...</>
                                ) : '📸 Share Story'}
                            </motion.button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PostStoryModal;
