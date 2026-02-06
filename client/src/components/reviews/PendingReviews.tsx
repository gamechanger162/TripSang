'use client';

import { useState, useEffect, useRef } from 'react';
import { reviewAPI } from '@/lib/api';
import { PendingReview } from '@/types/reviews';
import Image from 'next/image';
import ReviewModal from './ReviewModal';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';

export default function PendingReviews() {
    const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
    const [skippedReviews, setSkippedReviews] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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
        // Load skipped reviews from localStorage
        const saved = localStorage.getItem('skippedReviews');
        if (saved) {
            setSkippedReviews(new Set(JSON.parse(saved)));
        }
    }, []);

    const handleReviewSubmitted = () => {
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

    const handleSkip = (e: React.MouseEvent, item: PendingReview) => {
        e.stopPropagation();
        const key = `${item.trip._id}-${item.traveler._id}`;
        const newSkipped = new Set(skippedReviews);
        newSkipped.add(key);
        setSkippedReviews(newSkipped);
        localStorage.setItem('skippedReviews', JSON.stringify([...newSkipped]));
    };

    const handleRemindLater = (e: React.MouseEvent, item: PendingReview) => {
        e.stopPropagation();
        // Just hide for this session (no localStorage)
        const key = `${item.trip._id}-${item.traveler._id}`;
        const newSkipped = new Set(skippedReviews);
        newSkipped.add(key);
        setSkippedReviews(newSkipped);
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollAmount = 280; // Approximate card width
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Filter out skipped reviews
    const visibleReviews = pendingReviews.filter(
        item => !skippedReviews.has(`${item.trip._id}-${item.traveler._id}`)
    );

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-20 bg-gray-200 dark:bg-dark-700 rounded-lg"></div>
            </div>
        );
    }

    if (visibleReviews.length === 0) {
        return null; // Don't show anything if no pending reviews
    }

    return (
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-orange-100 dark:border-dark-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    Pending Reviews
                    <span className="ml-2 bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {visibleReviews.length}
                    </span>
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
                        Your feedback helps the community!
                    </span>
                    {visibleReviews.length > 2 && (
                        <div className="flex gap-1">
                            <button
                                onClick={() => scroll('left')}
                                className="p-1.5 rounded-full bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-600 dark:text-gray-400 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                className="p-1.5 rounded-full bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-600 dark:text-gray-400 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Container */}
            <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {visibleReviews.map((item) => (
                    <div
                        key={`${item.trip._id}-${item.traveler._id}`}
                        className="flex-shrink-0 w-64 snap-start"
                    >
                        <div
                            className="relative p-4 bg-gray-50 dark:bg-dark-700 rounded-xl group hover:bg-orange-50 dark:hover:bg-dark-600 transition-all cursor-pointer border border-transparent hover:border-orange-200 hover:shadow-md"
                            onClick={() => setSelectedReview(item)}
                        >
                            {/* Skip/Dismiss Buttons - Always visible */}
                            <div className="absolute top-2 right-2 flex gap-1">
                                <button
                                    onClick={(e) => handleRemindLater(e, item)}
                                    className="p-1.5 rounded-full bg-white dark:bg-dark-800 shadow-sm text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                    title="Remind me later"
                                >
                                    <Clock size={16} />
                                </button>
                                <button
                                    onClick={(e) => handleSkip(e, item)}
                                    className="p-1.5 rounded-full bg-white dark:bg-dark-800 shadow-sm text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Skip this review"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 mb-3">
                                <div className="relative flex-shrink-0">
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
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                        {item.traveler.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {item.trip.title}
                                    </p>
                                </div>
                            </div>

                            <button className="w-full text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg transition-colors">
                                Write Review
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Skipped Count */}
            {skippedReviews.size > 0 && (
                <div className="mt-3 text-center">
                    <button
                        onClick={() => {
                            setSkippedReviews(new Set());
                            localStorage.removeItem('skippedReviews');
                        }}
                        className="text-xs text-gray-500 hover:text-primary-600 transition-colors"
                    >
                        Show {skippedReviews.size} skipped review{skippedReviews.size > 1 ? 's' : ''}
                    </button>
                </div>
            )}

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

