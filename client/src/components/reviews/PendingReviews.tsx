'use client';

import { useState, useEffect } from 'react';
import { reviewAPI } from '@/lib/api';
import { PendingReview } from '@/types/reviews';
import Image from 'next/image';
import ReviewModal from './ReviewModal';
import Link from 'next/link';

export default function PendingReviews() {
    const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);

    const fetchPendingReviews = async () => {
        try {
            const response = await reviewAPI.getPending();
            if (response.success) {
                setPendingReviews(response.pendingReviews);
            }
        } catch (error) {
            console.error('Fetch pending reviews error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingReviews();
    }, []);

    const handleReviewSubmitted = () => {
        // Remove the reviewed item from the list
        if (selectedReview) {
            setPendingReviews(prev =>
                prev.filter(r =>
                    r.trip._id !== selectedReview.trip._id ||
                    r.traveler._id !== selectedReview.traveler._id
                )
            );
        }
        setSelectedReview(null);
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-20 bg-gray-200 dark:bg-dark-700 rounded-lg"></div>
            </div>
        );
    }

    if (pendingReviews.length === 0) {
        return null; // Don't show anything if no pending reviews
    }

    return (
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-orange-100 dark:border-dark-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    Pending Reviews
                    <span className="ml-2 bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {pendingReviews.length}
                    </span>
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Your feedback helps the community!
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingReviews.map((item, index) => (
                    <div
                        key={`${item.trip._id}-${item.traveler._id}`}
                        className="flex items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg group hover:bg-orange-50 dark:hover:bg-dark-600 transition-colors cursor-pointer border border-transparent hover:border-orange-200"
                        onClick={() => setSelectedReview(item)}
                    >
                        <div className="flex-shrink-0 relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-dark-600 shadow-sm">
                                {item.traveler.profilePicture ? (
                                    <Image
                                        src={item.traveler.profilePicture}
                                        alt={item.traveler.name}
                                        width={48}
                                        height={48}
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                        {item.traveler.name[0]}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {item.traveler.name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Trip: {item.trip.title}
                            </p>
                        </div>
                        <button className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-white dark:bg-dark-800 px-3 py-1.5 rounded-full shadow-sm group-hover:bg-primary-600 group-hover:text-white transition-all">
                            Review
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {selectedReview && (
                <ReviewModal
                    isOpen={!!selectedReview}
                    onClose={() => setSelectedReview(null)}
                    tripId={selectedReview.trip._id}
                    tripTitle={selectedReview.trip.title}
                    revieweeId={selectedReview.traveler._id}
                    revieweeName={selectedReview.traveler.name}
                    onReviewSubmitted={handleReviewSubmitted}
                />
            )}
        </div>
    );
}
