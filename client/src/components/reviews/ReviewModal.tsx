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
                                className={star <= currentRating ? 'text-yellow-500 filter drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]' : 'text-gray-600'}
                            />
                        </svg>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">

                {/* Overlay */}
                <div
                    className="fixed inset-0 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div
                    className="inline-block align-bottom bg-[#001428]/95 backdrop-blur-xl border border-cyan-500/20 rounded-2xl text-left overflow-hidden shadow-[0_0_50px_rgba(8,145,178,0.2)] transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
                >
                    <div className="px-6 pt-6 pb-6">
                        <div className="sm:flex sm:items-start">
                            <div className="w-full">
                                <h3 className="text-xl leading-6 font-bold text-white mb-2 font-heading">
                                    Review {revieweeName}
                                </h3>
                                <p className="text-sm text-gray-400 mb-6">
                                    How was your experience with <span className="text-cyan-400">{revieweeName}</span> on <span className="text-cyan-400">{tripTitle}</span>?
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Overall Rating */}
                                    <div className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-xl">
                                        <label className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wider">
                                            Overall Rating
                                        </label>
                                        {renderStars(rating, setRating, 'lg')}
                                        <p className="text-xs text-center mt-3 font-medium text-cyan-400 animate-pulse">
                                            {rating === 1 && "Terrible"}
                                            {rating === 2 && "Poor"}
                                            {rating === 3 && "Average"}
                                            {rating === 4 && "Good"}
                                            {rating === 5 && "Excellent!"}
                                        </p>
                                    </div>

                                    {/* Detailed Categories */}
                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-cyan-400 border-b border-white/10 pb-2 mb-3 uppercase tracking-wider">
                                            Detailed Ratings
                                        </label>

                                        <div className="flex items-center justify-between group">
                                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Punctuality</span>
                                            {renderStars(categories.punctuality, (v) => handleCategoryChange('punctuality', v), 'sm')}
                                        </div>
                                        <div className="flex items-center justify-between group">
                                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Friendliness</span>
                                            {renderStars(categories.friendliness, (v) => handleCategoryChange('friendliness', v), 'sm')}
                                        </div>
                                        <div className="flex items-center justify-between group">
                                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Reliability</span>
                                            {renderStars(categories.reliability, (v) => handleCategoryChange('reliability', v), 'sm')}
                                        </div>
                                        <div className="flex items-center justify-between group">
                                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Communication</span>
                                            {renderStars(categories.communication, (v) => handleCategoryChange('communication', v), 'sm')}
                                        </div>
                                    </div>

                                    {/* Comments */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider">
                                            Comments (Optional)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="block w-full sm:text-sm bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 p-3 transition-all resize-none"
                                            placeholder="Sharing is caring! Tell others about your experience..."
                                            maxLength={500}
                                        />
                                        <p className="text-xs text-gray-500 text-right mt-1">
                                            {comment.length}/500
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 border border-white/10 text-base font-medium rounded-xl text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 sm:text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="inline-flex justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-xl text-black bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Submitting...
                                                </span>
                                            ) : 'Submit Review'}
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
