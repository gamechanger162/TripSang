'use client';

import { useState, useEffect } from 'react';
import { reviewAPI } from '@/lib/api';
import { Review, ReviewStats } from '@/types/reviews';
import Image from 'next/image';

interface UserReviewsProps {
    userId: string;
}

export default function UserReviews({ userId }: UserReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [userId]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await reviewAPI.getUserReviews(userId, page);
            if (response.success) {
                setReviews(response.reviews);
                setStats(response.stats);
                setHasMore(response.pagination.currentPage < response.pagination.totalPages);
            }
        } catch (error) {
            console.error('Fetch reviews error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating: number, size = 'sm') => {
        return (
            <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} ${star <= rating ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={star <= rating ? 0 : 2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                ))}
            </div>
        );
    };

    if (loading && reviews.length === 0) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg w-full"></div>
                <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg w-full"></div>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-10">
                <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No reviews yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">This traveler is just getting started.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Stats Summary */}
            {stats && stats.totalReviews > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl mb-8">
                    <div className="text-center md:text-left mb-6 md:mb-0">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <span className="text-5xl font-bold text-gray-900 dark:text-white">
                                {stats.averageRating.toFixed(1)}
                            </span>
                            <div className="flex flex-col">
                                {renderStars(Math.round(stats.averageRating), 'lg')}
                                <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {stats.totalReviews} total reviews
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm w-full md:w-auto">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-600 dark:text-gray-300">Punctuality</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400" style={{ width: `${(stats.averagePunctuality / 5) * 100}%` }}></div>
                                </div>
                                <span className="font-bold w-6">{stats.averagePunctuality.toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-600 dark:text-gray-300">Friendliness</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400" style={{ width: `${(stats.averageFriendliness / 5) * 100}%` }}></div>
                                </div>
                                <span className="font-bold w-6">{stats.averageFriendliness.toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-600 dark:text-gray-300">Reliability</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400" style={{ width: `${(stats.averageReliability / 5) * 100}%` }}></div>
                                </div>
                                <span className="font-bold w-6">{stats.averageReliability.toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-600 dark:text-gray-300">Communication</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400" style={{ width: `${(stats.averageCommunication / 5) * 100}%` }}></div>
                                </div>
                                <span className="font-bold w-6">{stats.averageCommunication.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.map((review) => (
                    <div key={review._id} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 mr-3">
                                    {review.reviewer.profilePicture ? (
                                        <Image
                                            src={review.reviewer.profilePicture}
                                            alt={review.reviewer.name}
                                            width={40}
                                            height={40}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                            {review.reviewer.name[0]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                        {review.reviewer.name}
                                    </h4>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <span>Trip: {review.trip.title}</span>
                                        <span>•</span>
                                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            {renderStars(review.rating)}
                        </div>
                        {review.comment && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 leading-relaxed">
                                "{review.comment}"
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                        Load More Reviews
                    </button>
                </div>
            )}
        </div>
    );
}
