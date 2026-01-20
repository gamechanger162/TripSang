'use client';

import { useState } from 'react';
import { reviewAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
    tripTitle: string;
    revieweeId: string;
    revieweeName: string;
    onReviewSubmitted: () => void;
}

export default function ReviewModal({
    isOpen,
    onClose,
    tripId,
    tripTitle,
    revieweeId,
    revieweeName,
    onReviewSubmitted
}: ReviewModalProps) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [categories, setCategories] = useState({
        punctuality: 5,
        friendliness: 5,
        reliability: 5,
        communication: 5
    });
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleCategoryChange = (category: keyof typeof categories, value: number) => {
        setCategories(prev => ({
            ...prev,
            [category]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await reviewAPI.create({
                tripId,
                revieweeId,
                rating,
                comment,
                categories
            });
            toast.success('Review submitted successfully');
            onReviewSubmitted();
            onClose();
        } catch (error: any) {
            console.error('Submit review error:', error);
            toast.error(error.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (currentRating: number, onRate: (r: number) => void, size = 'lg') => {
        return (
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onRate(star)}
                        className={`focus:outline-none transition-colors ${size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'}`}
                    >
                        <svg
                            className="w-full h-full"
                            fill={star <= currentRating ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                className={star <= currentRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                            />
                        </svg>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                {/* Overlay */}
                <div
                    className="fixed inset-0 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-black dark:opacity-80"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div
                    className="inline-block align-bottom bg-white dark:bg-dark-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"
                >
                    <div className="bg-white dark:bg-dark-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="w-full">
                                <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white mb-2">
                                    Review {revieweeName}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    How was your experience with {revieweeName} on {tripTitle}?
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Overall Rating */}
                                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                                        <label className="text-sm font-medium text-gray-700 dark:text-white mb-2">
                                            Overall Rating
                                        </label>
                                        {renderStars(rating, setRating, 'lg')}
                                        <p className="text-xs text-center mt-2 font-medium text-yellow-600 dark:text-yellow-400">
                                            {rating === 1 && "Terrible"}
                                            {rating === 2 && "Poor"}
                                            {rating === 3 && "Average"}
                                            {rating === 4 && "Good"}
                                            {rating === 5 && "Excellent!"}
                                        </p>
                                    </div>

                                    {/* Detailed Categories */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-white border-b border-gray-100 dark:border-dark-700 pb-1 mb-3">
                                            Detailed Ratings
                                        </label>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Punctuality</span>
                                            {renderStars(categories.punctuality, (v) => handleCategoryChange('punctuality', v), 'sm')}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Friendliness</span>
                                            {renderStars(categories.friendliness, (v) => handleCategoryChange('friendliness', v), 'sm')}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Reliability</span>
                                            {renderStars(categories.reliability, (v) => handleCategoryChange('reliability', v), 'sm')}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Communication</span>
                                            {renderStars(categories.communication, (v) => handleCategoryChange('communication', v), 'sm')}
                                        </div>
                                    </div>

                                    {/* Comments */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                            Comments (Optional)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-dark-600 rounded-md dark:bg-dark-700 dark:text-white p-2 border"
                                            placeholder="Sharing is caring! Tell others about your experience..."
                                            maxLength={500}
                                        />
                                        <p className="text-xs text-gray-400 text-right mt-1">
                                            {comment.length}/500
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:w-auto sm:text-sm dark:bg-dark-700 dark:text-gray-200 dark:border-dark-600"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:w-auto sm:text-sm"
                                        >
                                            {submitting ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
