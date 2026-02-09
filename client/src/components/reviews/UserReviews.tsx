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
            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} ${star <= rating ? 'text-yellow-500 filter drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]' : 'text-gray-700'}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
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
                <div className="flex flex-col md:flex-row items-center justify-between bg-black/20 backdrop-blur-md border border-white/5 p-6 rounded-2xl mb-8 shadow-lg">
                    <div className="text-center md:text-left mb-6 md:mb-0">
                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-emerald-400 filter drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                                {stats.averageRating.toFixed(1)}
                            </span>
                            <div className="flex flex-col">
                                {renderStars(Math.round(stats.averageRating), 'lg')}
                                <span className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-wide">
                                    {stats.totalReviews} total reviews
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 text-sm w-full md:w-auto">
                        <div className="flex items-center justify-between gap-4 group">
                            <span className="text-gray-400 group-hover:text-cyan-300 transition-colors">Punctuality</span>
                            <div className="flex items-center gap-3">
                                <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${(stats.averagePunctuality / 5) * 100}%` }}></div>
                                </div>
                                <span className="font-bold w-6 text-white text-right">{stats.averagePunctuality.toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 group">
                            <span className="text-gray-400 group-hover:text-cyan-300 transition-colors">Friendliness</span>
                            <div className="flex items-center gap-3">
                                <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" style={{ width: `${(stats.averageFriendliness / 5) * 100}%` }}></div>
                                </div>
                                <span className="font-bold w-6 text-white text-right">{stats.averageFriendliness.toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 group">
                            <span className="text-gray-400 group-hover:text-cyan-300 transition-colors">Reliability</span>
                            <div className="flex items-center gap-3">
                                <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${(stats.averageReliability / 5) * 100}%` }}></div>
                                </div>
                                <span className="font-bold w-6 text-white text-right">{stats.averageReliability.toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 group">
                            <span className="text-gray-400 group-hover:text-cyan-300 transition-colors">Communication</span>
                            <div className="flex items-center gap-3">
                                <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${(stats.averageCommunication / 5) * 100}%` }}></div>
                                </div>
                                <span className="font-bold w-6 text-white text-right">{stats.averageCommunication.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.map((review) => (
                    <div key={review._id} className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all hover:border-white/10 group">
                        <div className="flex items-start justify-between mb-4 gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-black/40 ring-2 ring-white/10 flex-shrink-0">
                                    {review.reviewer.profilePicture ? (
                                        <Image
                                            src={review.reviewer.profilePicture}
                                            alt={review.reviewer.name}
                                            width={48}
                                            height={48}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-cyan-500 font-bold bg-gradient-to-br from-cyan-900/20 to-teal-900/20">
                                            {review.reviewer.name[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-base font-bold text-gray-200 group-hover:text-white transition-colors">
                                        {review.reviewer.name}
                                    </h4>
                                    <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap mt-1">
                                        <span className="truncate bg-white/5 px-2 py-0.5 rounded text-cyan-400/80">Trip: {review.trip.title}</span>
                                        <span className="text-gray-600">•</span>
                                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                                {renderStars(review.rating)}
                            </div>
                        </div>
                        {review.comment && (
                            <div className="relative pl-4 md:pl-16">
                                <div className="absolute left-0 md:left-12 top-0 bottom-0 w-0.5 bg-gradient-to-b from-white/10 to-transparent"></div>
                                <p className="text-gray-400 text-sm leading-relaxed italic">
                                    "{review.comment}"
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="px-6 py-2 rounded-full border border-cyan-500/30 text-cyan-400 font-medium hover:bg-cyan-500/10 hover:text-cyan-300 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]"
                    >
                        Load More Reviews
                    </button>
                </div>
            )}
        </div>
    );
}
