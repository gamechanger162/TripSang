'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Lock, Globe, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { communityAPI } from '@/lib/api';

interface CreateCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (community: any) => void;
}

const CATEGORIES = [
    'Bikers', 'Photographers', 'Trekkers', 'Foodies',
    'Adventurers', 'Backpackers', 'Luxury', 'Solo',
    'Culture', 'Beach', 'Mountains', 'Other'
];

export default function CreateCommunityModal({ isOpen, onClose, onSuccess }: CreateCommunityModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'Other',
        isPrivate: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Please enter a community name');
            return;
        }

        if (formData.name.length < 3) {
            toast.error('Name must be at least 3 characters');
            return;
        }

        try {
            setLoading(true);
            const response = await communityAPI.create(formData);

            if (response.success) {
                toast.success('Community created successfully!');
                onSuccess(response.community);
                setFormData({ name: '', description: '', category: 'Other', isPrivate: true });
                onClose();
            } else {
                toast.error(response.message || 'Failed to create community');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to create community');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-gray-900 rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-800">
                            <h2 className="text-xl font-bold text-white">Create Community</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Community Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g., Himalayan Trekkers"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    maxLength={50}
                                />
                                <p className="text-xs text-gray-500 mt-1">{formData.name.length}/50 characters</p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    placeholder="What's this community about?"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                    maxLength={500}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Category
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Privacy Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    {formData.isPrivate ? (
                                        <Lock className="w-5 h-5 text-amber-400" />
                                    ) : (
                                        <Globe className="w-5 h-5 text-green-400" />
                                    )}
                                    <div>
                                        <p className="text-white font-medium">
                                            {formData.isPrivate ? 'Private Community' : 'Public Community'}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {formData.isPrivate
                                                ? 'Users must request to join'
                                                : 'Anyone can join instantly'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, isPrivate: !p.isPrivate }))}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${formData.isPrivate ? 'bg-amber-500' : 'bg-green-500'}`}
                                >
                                    <span
                                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.isPrivate ? '' : 'translate-x-6'}`}
                                    />
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !formData.name.trim()}
                                className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Community'
                                )}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
