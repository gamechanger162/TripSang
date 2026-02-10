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
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X, MapPin, ArrowRight, Hash } from 'lucide-react';

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

    const startPoint = searchParams.get('startPoint') || '';
    const endPoint = searchParams.get('endPoint') || '';
    const startDate = searchParams.get('startDate') || '';

    const [searchFrom, setSearchFrom] = useState(startPoint);
    const [searchTo, setSearchTo] = useState(endPoint);

    useEffect(() => {
        setSearchFrom(startPoint);
        setSearchTo(endPoint);
    }, [startPoint, endPoint]);

    const handleDestinationSearch = () => {
        const params = new URLSearchParams();
        if (searchFrom) params.append('startPoint', searchFrom);
        if (searchTo) params.append('endPoint', searchTo);
        router.push(`/search?${params.toString()}`);
    };

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
        <div className="min-h-screen bg-zinc-950 relative">
            {/* Background mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-teal-500/[0.04] blur-[120px] rounded-full" />
                <div className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] bg-orange-500/[0.03] blur-[100px] rounded-full" />
            </div>

            {/* ═══ Dynamic Island Search Bar ═══ */}
            <div className="sticky top-16 z-40">
                <div className="max-w-5xl mx-auto px-4 pt-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-strong rounded-2xl p-3 border border-white/[0.08]"
                    >
                        <div className="flex flex-col md:flex-row items-stretch gap-3">
                            {/* Search fields */}
                            <div className="flex flex-1 items-center gap-2 bg-white/[0.03] rounded-xl border border-white/[0.06] px-3">
                                <MapPin className="w-4 h-4 text-teal-500 flex-shrink-0" />
                                <CityAutocomplete
                                    id="search-from"
                                    name="searchFrom"
                                    value={searchFrom}
                                    onChange={setSearchFrom}
                                    placeholder="From"
                                    cities={INDIAN_CITIES}
                                    className="w-full py-2.5 text-sm bg-transparent text-white placeholder-zinc-600 focus:outline-none"
                                />
                                <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                                <CityAutocomplete
                                    id="search-to"
                                    name="searchTo"
                                    value={searchTo}
                                    onChange={setSearchTo}
                                    placeholder="To"
                                    cities={INDIAN_CITIES}
                                    className="w-full py-2.5 text-sm bg-transparent text-white placeholder-zinc-600 focus:outline-none"
                                />
                            </div>

                            {/* Trip Code */}
                            <div className="flex items-center gap-2 bg-white/[0.03] rounded-xl border border-white/[0.06] px-3">
                                <Hash className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={tripCode}
                                    onChange={(e) => setTripCode(e.target.value.toUpperCase().slice(0, 6))}
                                    placeholder="CODE"
                                    maxLength={6}
                                    className="w-20 py-2.5 text-sm font-mono font-semibold uppercase tracking-widest bg-transparent text-white placeholder-zinc-600 focus:outline-none text-center"
                                    onKeyDown={(e) => e.key === 'Enter' && searchByCode()}
                                />
                                <button
                                    onClick={searchByCode}
                                    disabled={searchingCode || tripCode.length !== 6}
                                    className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/20 flex items-center justify-center disabled:opacity-30 hover:bg-teal-500/25 transition-all flex-shrink-0"
                                >
                                    {searchingCode ? (
                                        <div className="w-3.5 h-3.5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                                    )}
                                </button>
                            </div>

                            {/* Search + Filter buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDestinationSearch}
                                    className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
                                >
                                    <Search className="w-4 h-4" />
                                    <span className="hidden sm:inline">Search</span>
                                </button>
                                <button
                                    onClick={() => setShowFilters(true)}
                                    className="btn-glass px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 relative"
                                >
                                    <SlidersHorizontal className="w-4 h-4" />
                                    <span className="hidden sm:inline">Filters</span>
                                    {filters.tags.length > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-teal-500 text-black font-bold rounded-full text-[10px] flex items-center justify-center">
                                            {filters.tags.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ═══ Results Header & Active Filters ═══ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
                            {startPoint || endPoint
                                ? <>{startPoint || 'Any'} <span className="text-zinc-600">→</span> {endPoint || 'Any'}</>
                                : 'Explore Trips'}
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            {loading ? 'Finding adventures...' : `${pagination.totalTrips} trips found`}
                        </p>
                    </div>
                </div>

                {/* Active Filters */}
                {(filters.tags.length > 0 || filters.difficulty) && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {filters.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/15"
                            >
                                {tag}
                                <button
                                    onClick={() => {
                                        setFilters({
                                            ...filters,
                                            tags: filters.tags.filter((t) => t !== tag),
                                        });
                                    }}
                                    className="hover:text-white"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        {filters.difficulty && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/15 capitalize">
                                {filters.difficulty}
                                <button
                                    onClick={() => setFilters({ ...filters, difficulty: undefined })}
                                    className="hover:text-white"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* ═══ Content Grid ═══ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 relative z-10">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="glass-card p-0 overflow-hidden">
                                <div className="h-52 bg-zinc-800/50 animate-pulse" />
                                <div className="p-4 space-y-3">
                                    <div className="h-5 bg-zinc-800/50 rounded-lg w-3/4 animate-pulse" />
                                    <div className="h-4 bg-zinc-800/30 rounded-lg w-1/2 animate-pulse" />
                                    <div className="h-4 bg-zinc-800/20 rounded-lg w-2/3 animate-pulse" />
                                    <div className="flex gap-2 pt-3 border-t border-white/[0.04]">
                                        <div className="w-7 h-7 rounded-full bg-zinc-800/50 animate-pulse" />
                                        <div className="h-4 bg-zinc-800/30 rounded-lg w-20 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : trips.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 glass-card max-w-md mx-auto"
                    >
                        <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.06] mx-auto mb-6 flex items-center justify-center">
                            <Search className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2 font-display">No trips found</h3>
                        <p className="text-zinc-500 text-sm mb-6">Try adjusting your filters or search criteria</p>
                        <button
                            onClick={() => setShowFilters(true)}
                            className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium"
                        >
                            Adjust Filters
                        </button>
                    </motion.div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {trips.map((trip, index) => (
                                <motion.div
                                    key={trip._id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.4 }}
                                >
                                    <TripCard trip={trip} />
                                    {(index + 1) % 5 === 0 && (
                                        <div className="mt-5">
                                            <GoogleAd className="min-h-[250px]" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="mt-12 flex items-center justify-center gap-3">
                                <button
                                    onClick={() => fetchTrips(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="btn-glass px-5 py-2.5 rounded-xl text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="text-zinc-500 text-sm px-4">
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => fetchTrips(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="btn-glass px-5 py-2.5 rounded-xl text-sm disabled:opacity-30 disabled:cursor-not-allowed"
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
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}
