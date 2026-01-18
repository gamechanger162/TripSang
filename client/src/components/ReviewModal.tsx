'use client';

import { useState } from 'react';
import { reviewAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
    traveler: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    onReviewSubmitted?: () => void;
}

export default function ReviewModal({
    isOpen,
    onClose,
    tripId,
    traveler,
    onReviewSubmitted
}: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [categories, setCategories] = useState({
        punctuality: 0,
        friendliness: 0,
        reliability: 0,
        communication: 0
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setLoading(true);

        try {
            await reviewAPI.create({
                tripId,
                revieweeId: traveler._id,
                rating,
                comment: comment.trim() || undefined,
                categories: {
                    punctuality: categories.punctuality || undefined,
                    friendliness: categories.friendliness || undefined,
                    reliability: categories.reliability || undefined,
                    communication: categories.communication || undefined
                }
            });

            toast.success('Review submitted successfully!');
            onReviewSubmitted?.();
            handleClose();
        } catch (error: any) {
            console.error('Review submission error:', error);
            toast.error(error.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setRating(0);
        setComment('');
        setCategories({
            punctuality: 0,
            friendliness: 0,
            reliability: 0,
            communication: 0
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                                {traveler.profilePicture ? (
                                    <img src={traveler.profilePicture} alt={traveler.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-white font-semibold text-lg">{traveler.name[0]}</span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Review {traveler.name}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Share your experience</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Overall Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Overall Rating *
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <svg
                                        className={`w-10 h-10 ${star <= (hoverRating || rating)
                                                ? 'text-yellow-400 fill-current'
                                                : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                        />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category Ratings */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { key: 'punctuality', label: 'Punctuality', icon: '⏰' },
                            { key: 'friendliness', label: 'Friendliness', icon: '😊' },
                            { key: 'reliability', label: 'Reliability', icon: '🤝' },
                            { key: 'communication', label: 'Communication', icon: '💬' }
                        ].map((category) => (
                            <div key={category.key}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {category.icon} {category.label}
                                </label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setCategories({ ...categories, [category.key]: star })}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <svg
                                                className={`w-6 h-6 ${star <= categories[category.key as keyof typeof categories]
                                                        ? 'text-yellow-400 fill-current'
                                                        : 'text-gray-300 dark:text-gray-600'
                                                    }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                                />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Additional Comments (Optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            maxLength={500}
                            placeholder="Share your thoughts about this traveler..."
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                        <p className="mt-1 text-xs text-gray-500">{comment.length}/500 characters</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || rating === 0}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
