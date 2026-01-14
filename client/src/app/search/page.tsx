'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TripCard from '@/components/TripCard';
import FilterModal, { FilterOptions } from '@/components/FilterModal';
import GoogleAd from '@/components/GoogleAd';
import { tripAPI } from '@/lib/api';
import toast from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function SearchPageContent() {
    const searchParams = useSearchParams();
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({
        tags: [],
        sortBy: 'recent',
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalTrips: 0,
    });

    // Get initial params from URL
    const startPoint = searchParams.get('startPoint') || '';
    const endPoint = searchParams.get('endPoint') || '';
    const startDate = searchParams.get('startDate') || '';

    // Fetch trips
    const fetchTrips = async (page = 1) => {
        setLoading(true);

        try {
            const params: any = {
                page,
                limit: 20,
                ...filters,
            };

            if (startPoint) params.startPoint = startPoint;
            if (endPoint) params.endPoint = endPoint;
            if (startDate) params.startDate = startDate;
            if (filters.tags.length > 0) params.tags = filters.tags;
            if (filters.difficulty) params.difficulty = filters.difficulty;
            if (filters.minBudget) params.minBudget = filters.minBudget;
            if (filters.maxBudget) params.maxBudget = filters.maxBudget;
            if (filters.sortBy) params.sortBy = filters.sortBy;

            const response = await tripAPI.search(params);

            if (response.success) {
                setTrips(response.trips);
                setPagination({
                    currentPage: response.pagination.currentPage,
                    totalPages: response.pagination.totalPages,
                    totalTrips: response.pagination.totalTrips,
                });
            }
        } catch (error: any) {
            console.error('Error fetching trips:', error);
            toast.error(error.message || 'Failed to load trips');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const handleApplyFilters = (newFilters: FilterOptions) => {
        setFilters(newFilters);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
            {/* Header */}
            <div className="bg-white dark:bg-dark-800 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        {/* Search Summary */}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {startPoint || endPoint
                                    ? `${startPoint || 'Any'} → ${endPoint || 'Any'}`
                                    : 'All Trips'}
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {loading ? 'Loading...' : `${pagination.totalTrips} trips found`}
                            </p>
                        </div>

                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilters(true)}
                            className="btn-primary flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                />
                            </svg>
                            Filters
                            {filters.tags.length > 0 && (
                                <span className="ml-2 w-6 h-6 bg-secondary-500 text-white rounded-full text-xs flex items-center justify-center">
                                    {filters.tags.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Active Filters */}
                    {(filters.tags.length > 0 || filters.difficulty) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {filters.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                >
                                    {tag}
                                    <button
                                        onClick={() => {
                                            setFilters({
                                                ...filters,
                                                tags: filters.tags.filter((t) => t !== tag),
                                            });
                                        }}
                                        className="ml-2 hover:text-primary-900"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </span>
                            ))}
                            {filters.difficulty && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary-100 text-secondary-700 capitalize">
                                    {filters.difficulty}
                                    <button
                                        onClick={() => setFilters({ ...filters, difficulty: undefined })}
                                        className="ml-2 hover:text-secondary-900"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="card animate-pulse">
                                <div className="h-48 bg-gray-200 dark:bg-dark-700 rounded-lg mb-4" />
                                <div className="space-y-3">
                                    <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/2" />
                                    <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : trips.length === 0 ? (
                    <div className="text-center py-20">
                        <svg
                            className="w-24 h-24 mx-auto text-gray-400 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No trips found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Try adjusting your filters or search criteria
                        </p>
                        <button onClick={() => setShowFilters(true)} className="btn-primary">
                            Adjust Filters
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {trips.map((trip, index) => (
                                <div key={trip._id}>
                                    <TripCard trip={trip} />
                                    {/* Insert Google Ad after every 5th card */}
                                    {(index + 1) % 5 === 0 && (
                                        <div className="mt-6 mb-6">
                                            <GoogleAd className="min-h-[250px]" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="mt-12 flex items-center justify-center space-x-2">
                                <button
                                    onClick={() => fetchTrips(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="text-gray-700 dark:text-gray-300 px-4">
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => fetchTrips(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Filter Modal */}
            <FilterModal
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                onApply={handleApplyFilters}
                initialFilters={filters}
            />
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}
