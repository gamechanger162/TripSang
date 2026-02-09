'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import TripCard from '@/components/TripCard';
import FilterModal, { FilterOptions } from '@/components/FilterModal';
import GoogleAd from '@/components/GoogleAd';
import CityAutocomplete from '@/components/CityAutocomplete';
import { INDIAN_CITIES } from '@/data/cities';
import { tripAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import ExcitingBackground from '@/components/ExcitingBackground';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [tripCode, setTripCode] = useState('');
    const [searchingCode, setSearchingCode] = useState(false);
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

    // Local search state (for the input fields)
    const [searchFrom, setSearchFrom] = useState(startPoint);
    const [searchTo, setSearchTo] = useState(endPoint);

    // Update local state when URL params change
    useEffect(() => {
        setSearchFrom(startPoint);
        setSearchTo(endPoint);
    }, [startPoint, endPoint]);

    // Handle destination search
    const handleDestinationSearch = () => {
        const params = new URLSearchParams();
        if (searchFrom) params.append('startPoint', searchFrom);
        if (searchTo) params.append('endPoint', searchTo);
        router.push(`/search?${params.toString()}`);
    };

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

            // Check for auth-related errors and redirect
            const errorMessage = error.message?.toLowerCase() || '';
            if (errorMessage.includes('login required') || errorMessage.includes('access denied') || errorMessage.includes('no token')) {
                toast.error('Please login to view trips');
                router.push('/auth/signin?callbackUrl=/search');
                return;
            }
            if (errorMessage.includes('subscription required')) {
                toast.error('Premium subscription required');
                router.push('/payment/signup');
                return;
            }

            toast.error(error.message || 'Failed to load trips');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, startPoint, endPoint]);

    const handleApplyFilters = (newFilters: FilterOptions) => {
        setFilters(newFilters);
    };

    const searchByCode = async () => {
        if (!tripCode || tripCode.length !== 6) {
            toast.error('Please enter a valid 6-character trip code');
            return;
        }

        setSearchingCode(true);
        try {
            const response = await tripAPI.getByCode(tripCode);
            if (response.success && response.trip) {
                router.push(`/trips/${response.trip._id}`);
            }
        } catch (error: any) {
            toast.error(error.message || 'No trip found with this code');
        } finally {
            setSearchingCode(false);
        }
    };

    return (
        <div className="min-h-screen relative bg-[#001428]">
            {/* Background Layers */}
            <div
                className="fixed inset-0 z-0"
                style={{ background: 'linear-gradient(180deg, #001428 0%, #000a14 100%)' }}
            />
            <div
                className="fixed inset-0 z-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"
            />

            {/* Content Wrapper */}
            <div className="relative z-10">
                {/* Header */}
                <div className="backdrop-blur-xl border-b border-white/10 md:sticky md:top-0 z-50 bg-[#001428]/95">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                            {/* Search Summary */}
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-white drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                                    {startPoint || endPoint
                                        ? `${startPoint || 'Any'} → ${endPoint || 'Any'}`
                                        : 'Explore Trips'}
                                </h1>
                                <p className="text-sm text-cyan-400/80 mt-1">
                                    {loading ? 'Scanning universe...' : `${pagination.totalTrips} adventures found`}
                                </p>
                            </div>

                            {/* Destination Search Bar */}
                            <div className="flex flex-wrap md:flex-nowrap items-end gap-3 flex-1 max-w-2xl bg-white/5 p-2 rounded-xl border border-white/10">
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-xs font-medium text-cyan-300 mb-1 ml-1">From</label>
                                    <CityAutocomplete
                                        id="search-from"
                                        name="searchFrom"
                                        value={searchFrom}
                                        onChange={setSearchFrom}
                                        placeholder="Origin"
                                        cities={INDIAN_CITIES}
                                        className="w-full px-3 py-2 text-sm border border-white/10 rounded-lg bg-black/40 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                                    />
                                </div>
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-xs font-medium text-cyan-300 mb-1 ml-1">Destination</label>
                                    <CityAutocomplete
                                        id="search-to"
                                        name="searchTo"
                                        value={searchTo}
                                        onChange={setSearchTo}
                                        placeholder="Anywhere"
                                        cities={INDIAN_CITIES}
                                        className="w-full px-3 py-2 text-sm border border-white/10 rounded-lg bg-black/40 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                                    />
                                </div>
                                <button
                                    onClick={handleDestinationSearch}
                                    className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(8,145,178,0.4)] whitespace-nowrap"
                                >
                                    Search
                                </button>
                            </div>

                            {/* Search by Code */}
                            <div className="flex-none md:w-auto w-full">
                                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-colors group/code w-full">
                                    <div className="relative flex-1 md:flex-none">
                                        <input
                                            type="text"
                                            value={tripCode}
                                            onChange={(e) => setTripCode(e.target.value.toUpperCase().slice(0, 6))}
                                            placeholder="TRIP CODE"
                                            maxLength={6}
                                            className="w-full md:w-32 px-3 py-2 text-sm font-mono font-bold uppercase tracking-widest border border-transparent rounded-lg bg-black/20 text-white placeholder-gray-500 focus:outline-none focus:bg-black/40 focus:ring-1 focus:ring-purple-500/50 transition-all text-center"
                                            onKeyDown={(e) => e.key === 'Enter' && searchByCode()}
                                        />
                                    </div>
                                    <button
                                        onClick={searchByCode}
                                        disabled={searchingCode || tripCode.length !== 6}
                                        className="w-9 h-9 flex-none flex items-center justify-center bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all shadow-[0_0_10px_rgba(147,51,234,0.3)] hover:shadow-[0_0_15px_rgba(147,51,234,0.5)] active:scale-95"
                                        title="Join Trip"
                                    >
                                        {searchingCode ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Filter Button */}
                            <button
                                onClick={() => setShowFilters(true)}
                                className="flex items-center px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all backdrop-blur-md"
                            >
                                <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                    />
                                </svg>
                                Filters
                                {filters.tags.length > 0 && (
                                    <span className="ml-2 w-5 h-5 bg-cyan-500 text-black font-bold rounded-full text-[10px] flex items-center justify-center">
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
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-cyan-900/30 text-cyan-200 border border-cyan-500/30"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => {
                                                setFilters({
                                                    ...filters,
                                                    tags: filters.tags.filter((t) => t !== tag),
                                                });
                                            }}
                                            className="ml-2 hover:text-white"
                                        >
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
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
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-900/30 text-purple-200 border border-purple-500/30 capitalize">
                                        {filters.difficulty}
                                        <button
                                            onClick={() => setFilters({ ...filters, difficulty: undefined })}
                                            className="ml-2 hover:text-white"
                                        >
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
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
                                <div key={i} className="card animate-pulse bg-white/5 border border-white/10 p-4">
                                    <div className="h-48 bg-white/10 rounded-lg mb-4" />
                                    <div className="space-y-3">
                                        <div className="h-4 bg-white/10 rounded w-3/4" />
                                        <div className="h-4 bg-white/10 rounded w-1/2" />
                                        <div className="h-4 bg-white/10 rounded w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : trips.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                            <svg className="w-24 h-24 mx-auto text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-white mb-2">No trips found</h3>
                            <p className="text-gray-400 mb-6">Try adjusting your filters or search criteria</p>
                            <button onClick={() => setShowFilters(true)} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors">
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

                <FilterModal
                    isOpen={showFilters}
                    onClose={() => setShowFilters(false)}
                    onApply={handleApplyFilters}
                    initialFilters={filters}
                />
            </div>
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
