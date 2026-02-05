'use client';

import { useEffect, useState } from 'react';
import { reviewAPI } from '@/lib/api';

import Link from 'next/link';

interface UserReviewsProps {
    userId: string;
}

export default function UserReviews({ userId }: UserReviewsProps) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchReviews();
    }, [userId, currentPage]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await reviewAPI.getUserReviews(userId, currentPage, 5);
            if (response.success) {
                setReviews(response.reviews || []);
                setStats(response.stats || null);
                setTotalPages(response.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && currentPage === 1) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Section */}
            {stats && stats.totalReviews > 0 && (
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                                {stats.averageRating?.toFixed(1) || '0.0'}
                            </div>
                            <div className="flex justify-center mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                        key={star}
                                        className={`w-5 h-5 ${star <= Math.round(stats.averageRating)
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
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
                                ))}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                            </div>
                        </div>

                        {stats.averagePunctuality > 0 && (
                            <div className="text-center">
                                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {stats.averagePunctuality?.toFixed(1)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">⏰ Punctuality</div>
                            </div>
                        )}

                        {stats.averageFriendliness > 0 && (
                            <div className="text-center">
                                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {stats.averageFriendliness?.toFixed(1)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">😊 Friendliness</div>
                            </div>
                        )}

                        {stats.averageReliability > 0 && (
                            <div className="text-center">
                                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {stats.averageReliability?.toFixed(1)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">🤝 Reliability</div>
                            </div>
                        )}

                        {stats.averageCommunication > 0 && (
                            <div className="text-center">
                                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {stats.averageCommunication?.toFixed(1)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">💬 Communication</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No reviews yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div
                            key={review._id}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-3">
                                {/* Reviewer Avatar - Clickable */}
                                <Link
                                    href={`/profile/${review.reviewer?._id}`}
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-primary-500 hover:ring-offset-2 transition-all cursor-pointer"
                                >
                                    {review.reviewer?.profilePicture ? (
                                        <img src={review.reviewer.profilePicture} alt={review.reviewer.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span className="text-white font-semibold">{review.reviewer?.name?.[0]}</span>
                                    )}
                                </Link>

                                <div className="flex-1">
                                    {/* Reviewer Info */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Link
                                                href={`/profile/${review.reviewer?._id}`}
                                                className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                                            >
                                                {review.reviewer?.name}
                                            </Link>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {review.trip?.title} • {new Date(review.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {/* Overall Rating */}
                                        <div className="flex items-center gap-1">
                                            <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                            <span className="font-semibold text-gray-900 dark:text-white">{review.rating}</span>
                                        </div>
                                    </div>

                                    {/* Category Ratings */}
                                    {(review.categories?.punctuality || review.categories?.friendliness ||
                                        review.categories?.reliability || review.categories?.communication) && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                                                {review.categories.punctuality > 0 && (
                                                    <div className="text-gray-600 dark:text-gray-400">
                                                        ⏰ {review.categories.punctuality}/5
                                                    </div>
                                                )}
                                                {review.categories.friendliness > 0 && (
                                                    <div className="text-gray-600 dark:text-gray-400">
                                                        😊 {review.categories.friendliness}/5
                                                    </div>
                                                )}
                                                {review.categories.reliability > 0 && (
                                                    <div className="text-gray-600 dark:text-gray-400">
                                                        🤝 {review.categories.reliability}/5
                                                    </div>
                                                )}
                                                {review.categories.communication > 0 && (
                                                    <div className="text-gray-600 dark:text-gray-400">
                                                        💬 {review.categories.communication}/5
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    {/* Comment */}
                                    {review.comment && (
                                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                                            "{review.comment}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
