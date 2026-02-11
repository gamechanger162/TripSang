'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Compass, Users, MapPin, ArrowRight, Calendar,
    Crown, Hash, Mountain, Route, RefreshCw, UserPlus
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { tripAPI, communityAPI, userAPI, friendAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Trip {
    _id: string;
    title: string;
    description?: string;
    startPoint?: { name: string };
    endPoint?: { name: string };
    startDate?: string;
    endDate?: string;
    tags?: string[];
    difficulty?: string;
    coverImage?: string;
    creator?: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    squadMembers?: any[];
    maxSquadSize?: number;
    likes?: string[];
    isPublic?: boolean;
}

interface Community {
    _id: string;
    name: string;
    description?: string;
    logo?: string;
    coverImage?: string;
    memberCount: number;
    category?: string;
    isPremium?: boolean;
    isJoined?: boolean;
}

interface Traveler {
    _id: string;
    name: string;
    profilePicture?: string;
    bio?: string;
    location?: { city?: string; country?: string };
    tripCount: number;
    verificationStatus?: string;
    badges?: string[];
}

export default function ExplorePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const currentUserId = (session?.user as any)?.id;
    const [trips, setTrips] = useState<Trip[]>([]);
    const [allFetchedTrips, setAllFetchedTrips] = useState<Trip[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [travelers, setTravelers] = useState<Traveler[]>([]);
    const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [travelersLoading, setTravelersLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [travelerSearch, setTravelerSearch] = useState('');
    const [debouncedTravelerSearch, setDebouncedTravelerSearch] = useState('');
    const [travelerSearchFocused, setTravelerSearchFocused] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin?callbackUrl=/app/explore');
        }
    }, [status, router]);

    // Debounce main search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Debounce traveler search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedTravelerSearch(travelerSearch), 400);
        return () => clearTimeout(timer);
    }, [travelerSearch]);

    // Fetch friends list
    const fetchFriends = useCallback(async () => {
        if (status !== 'authenticated') return;
        try {
            const response = await friendAPI.getFriends();
            const friends = response.friends || response || [];
            const ids = new Set<string>(
                friends.map((f: any) => f._id || f.user?._id || f.id).filter(Boolean)
            );
            setFriendIds(ids);
        } catch (error) {
            console.error('Failed to fetch friends:', error);
        }
    }, [status]);

    // Fetch trips (upcoming, not joined)
    const fetchTrips = useCallback(async () => {
        if (status !== 'authenticated' || !currentUserId) return;
        try {
            const response = await tripAPI.search({
                search: debouncedSearch || undefined,
                sortBy: 'startDate',
                limit: 20,
            });
            const allTrips: Trip[] = response.trips || [];
            setAllFetchedTrips(allTrips);
            const unjoinedTrips = allTrips.filter(trip => {
                const isCreator = trip.creator?._id === currentUserId;
                const isMember = trip.squadMembers?.some(
                    (m: any) => (typeof m === 'string' ? m : m._id || m.user) === currentUserId
                );
                return !isCreator && !isMember;
            }).slice(0, 2);
            setTrips(unjoinedTrips);
        } catch (error) {
            console.error('Failed to fetch trips:', error);
        }
    }, [status, currentUserId, debouncedSearch]);

    // Extract travelers from trip creators (fallback)
    const extractTravelersFromTrips = useCallback((trips: Trip[], friendSet: Set<string>, search?: string): Traveler[] => {
        const travelerMap = new Map<string, Traveler>();
        trips.forEach(trip => {
            if (trip.creator && trip.creator._id !== currentUserId && !friendSet.has(trip.creator._id)) {
                if (search && !trip.creator.name.toLowerCase().includes(search.toLowerCase())) return;
                if (!travelerMap.has(trip.creator._id)) {
                    travelerMap.set(trip.creator._id, {
                        _id: trip.creator._id,
                        name: trip.creator.name,
                        profilePicture: trip.creator.profilePicture,
                        tripCount: 1,
                    });
                } else {
                    travelerMap.get(trip.creator._id)!.tripCount += 1;
                }
            }
        });
        return Array.from(travelerMap.values()).slice(0, 12);
    }, [currentUserId]);

    // Fetch travelers: try discover API, fallback to trip creators
    const fetchTravelers = useCallback(async (friendSet: Set<string>) => {
        if (status !== 'authenticated') return;
        try {
            setTravelersLoading(true);
            // Try the discover API first
            const response = await userAPI.discoverUsers({
                search: debouncedTravelerSearch || undefined,
                limit: 20,
            });
            const users: Traveler[] = response.users || [];
            // Filter out friends and current user
            const filtered = users.filter(u => !friendSet.has(u._id) && u._id !== currentUserId).slice(0, 12);
            setTravelers(filtered);
        } catch (error) {
            // Fallback: extract travelers from trip creators
            console.warn('Discover API unavailable, falling back to trip creators');
            const fallback = extractTravelersFromTrips(allFetchedTrips, friendSet, debouncedTravelerSearch || undefined);
            setTravelers(fallback);
        } finally {
            setTravelersLoading(false);
        }
    }, [status, currentUserId, debouncedTravelerSearch, refreshKey, allFetchedTrips, extractTravelersFromTrips]);

    // Fetch communities
    const fetchCommunities = useCallback(async () => {
        if (status !== 'authenticated') return;
        try {
            const response = await communityAPI.discover(undefined, debouncedSearch || undefined);
            const data = response.publicCommunities || response.communities || [];
            setCommunities(data.slice(0, 6));
        } catch (error) {
            console.error('Failed to fetch communities:', error);
        }
    }, [status, debouncedSearch]);

    // Initial load: fetch friends first, then everything else
    useEffect(() => {
        if (status !== 'authenticated' || !currentUserId) return;
        setLoading(true);

        const loadData = async () => {
            // 1. Fetch friends list
            let friendSet = new Set<string>();
            try {
                const response = await friendAPI.getFriends();
                const friends = response.friends || response || [];
                friendSet = new Set<string>(
                    friends.map((f: any) => f._id || f.user?._id || f.id).filter(Boolean)
                );
                setFriendIds(friendSet);
            } catch (err) {
                console.error('Failed to fetch friends:', err);
            }

            // 2. Fetch trips and communities in parallel
            let fetchedTrips: Trip[] = [];
            try {
                const [tripResponse] = await Promise.all([
                    tripAPI.search({ sortBy: 'startDate', limit: 20 }),
                    fetchCommunities(),
                ]);
                fetchedTrips = tripResponse.trips || [];
                setAllFetchedTrips(fetchedTrips);
                const unjoinedTrips = fetchedTrips.filter(trip => {
                    const isCreator = trip.creator?._id === currentUserId;
                    const isMember = trip.squadMembers?.some(
                        (m: any) => (typeof m === 'string' ? m : m._id || m.user) === currentUserId
                    );
                    return !isCreator && !isMember;
                }).slice(0, 2);
                setTrips(unjoinedTrips);
            } catch (err) {
                console.error('Failed to fetch trips:', err);
            }

            // 3. Fetch travelers (with fallback using fetched trips directly)
            try {
                setTravelersLoading(true);
                const response = await userAPI.discoverUsers({ limit: 20 });
                const users: Traveler[] = response.users || [];
                const filtered = users.filter(u => !friendSet.has(u._id) && u._id !== currentUserId).slice(0, 12);
                setTravelers(filtered);
            } catch (err) {
                // Fallback: extract from fetched trips directly (no stale state)
                console.warn('Discover API unavailable, using trip creators fallback');
                const fallback = extractTravelersFromTrips(fetchedTrips, friendSet);
                setTravelers(fallback);
            } finally {
                setTravelersLoading(false);
            }

            setLoading(false);
        };

        loadData();
    }, [status, currentUserId]);

    // Refetch travelers when search or refresh changes
    useEffect(() => {
        if (status !== 'authenticated' || loading) return;
        fetchTravelers(friendIds);
    }, [debouncedTravelerSearch, refreshKey]);

    const handleRefreshTravelers = () => {
        setRefreshKey(prev => prev + 1);
    };

    const getDifficultyColor = (difficulty?: string) => {
        switch (difficulty) {
            case 'easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'moderate': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'difficult': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            case 'extreme': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getUserLocation = (user: Traveler) => {
        if (user.location?.city && user.location?.country) return `${user.location.city}, ${user.location.country}`;
        return user.location?.city || user.location?.country || '';
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center w-full h-full bg-[#060a10]">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 animate-pulse" />
                        <motion.div
                            className="absolute inset-0 rounded-2xl border border-cyan-500/30"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                    <p className="text-zinc-500 text-sm">Exploring...</p>
                </motion.div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="flex-1 h-full relative overflow-hidden flex flex-col bg-[#060a10]">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/[0.03] blur-[150px] rounded-full" />
                <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-blue-600/[0.03] blur-[130px] rounded-full" />
                <div className="absolute top-1/2 right-0 w-[350px] h-[350px] bg-violet-500/[0.02] blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto pb-20 app-scrollable">

                {/* Hero */}
                <div className="px-5 md:px-8 pt-6 pb-3">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
                            <Compass size={12} className="text-violet-400" />
                            <span className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider">Explore</span>
                        </div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1"
                    >
                        Discover Adventures
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-zinc-500 text-sm"
                    >
                        Find upcoming trips, active travelers, and thriving communities.
                    </motion.p>
                </div>

                {/* Main Search Bar */}
                <div className="px-5 md:px-8 pb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        className="relative"
                    >
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-md transition-opacity duration-300 ${searchFocused ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="relative flex items-center">
                            <Search size={16} className={`absolute left-3.5 transition-colors ${searchFocused ? 'text-cyan-400' : 'text-zinc-600'}`} />
                            <input
                                type="text"
                                placeholder="Search trips and communities..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-white/5 text-white text-sm placeholder:text-zinc-600 outline-none focus:border-cyan-500/30 transition-all"
                            />
                        </div>
                    </motion.div>
                </div>

                {loading ? (
                    <div className="px-5 md:px-8 space-y-8">
                        {/* Trips skeleton */}
                        <div>
                            <div className="h-5 w-32 bg-zinc-800 rounded mb-4 animate-pulse" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/50">
                                        <div className="h-40 bg-zinc-800/50 animate-pulse" />
                                        <div className="p-4 space-y-3">
                                            <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
                                            <div className="h-3 w-1/2 bg-zinc-800/50 rounded animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Travelers skeleton */}
                        <div>
                            <div className="h-5 w-32 bg-zinc-800 rounded mb-4 animate-pulse" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-[72px] rounded-xl bg-zinc-900/50 border border-white/5 animate-pulse" />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">

                        {/* ===== UPCOMING TRIPS ===== */}
                        {trips.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="px-5 md:px-8"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Route size={18} className="text-cyan-400" />
                                        Upcoming Trips
                                    </h2>
                                    <Link href="/app/squads" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                                        View all <ArrowRight size={12} />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {trips.map((trip, index) => (
                                        <motion.div key={trip._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.05 }}>
                                            <Link href={`/app/squads/${trip._id}`} className="block h-full">
                                                <motion.div
                                                    whileHover={{ y: -3 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                    className="group relative overflow-hidden rounded-2xl border border-white/5 hover:border-cyan-500/20 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all duration-300 h-full flex flex-col"
                                                >
                                                    <div className="relative h-40 overflow-hidden">
                                                        {trip.coverImage ? (
                                                            <Image src={trip.coverImage} alt={trip.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-cyan-600/15 via-blue-600/10 to-violet-600/10 flex items-center justify-center">
                                                                <Mountain size={40} className="text-cyan-500/20" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

                                                        {trip.difficulty && (
                                                            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md z-10 ${getDifficultyColor(trip.difficulty)}`}>
                                                                {trip.difficulty}
                                                            </div>
                                                        )}

                                                        {(trip.startPoint?.name || trip.endPoint?.name) && (
                                                            <div className="absolute bottom-3 left-3 right-3 z-10">
                                                                <div className="flex items-center gap-1.5 text-[11px] text-white/80 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 truncate">
                                                                    <MapPin size={11} className="text-cyan-400 shrink-0" />
                                                                    <span className="truncate">
                                                                        {trip.startPoint?.name || '?'}
                                                                        {trip.endPoint?.name && ` → ${trip.endPoint.name}`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="p-4 flex-1 flex flex-col">
                                                        <h3 className="text-base font-semibold text-white group-hover:text-cyan-50 transition-colors line-clamp-1 mb-1.5">{trip.title}</h3>
                                                        {trip.description && (
                                                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3">{trip.description}</p>
                                                        )}
                                                        <div className="mt-auto flex items-center justify-between">
                                                            {trip.creator && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-800 border border-white/10">
                                                                        {trip.creator.profilePicture ? (
                                                                            <Image src={trip.creator.profilePicture} alt="" width={20} height={20} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-400 font-bold">{trip.creator.name?.[0]}</div>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[11px] text-zinc-500">{trip.creator.name}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2.5">
                                                                {trip.startDate && (
                                                                    <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                                                                        <Calendar size={10} /> {formatDate(trip.startDate)}
                                                                    </span>
                                                                )}
                                                                {trip.squadMembers && (
                                                                    <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                                                                        <Users size={10} /> {trip.squadMembers.length}{trip.maxSquadSize ? `/${trip.maxSquadSize}` : ''}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* ===== MEET TRAVELERS ===== */}
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="px-5 md:px-8"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Compass size={18} className="text-orange-400" />
                                    Meet Travelers
                                </h2>
                                <motion.button
                                    onClick={handleRefreshTravelers}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95, rotate: 180 }}
                                    disabled={travelersLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/15 transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={12} className={travelersLoading ? 'animate-spin' : ''} />
                                    Refresh
                                </motion.button>
                            </div>

                            {/* Traveler Search */}
                            <div className="relative mb-4">
                                <div className={`absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500/15 to-cyan-500/15 blur-md transition-opacity duration-300 ${travelerSearchFocused ? 'opacity-100' : 'opacity-0'}`} />
                                <div className="relative flex items-center">
                                    <Search size={14} className={`absolute left-3 transition-colors ${travelerSearchFocused ? 'text-orange-400' : 'text-zinc-600'}`} />
                                    <input
                                        type="text"
                                        placeholder="Search travelers by name..."
                                        value={travelerSearch}
                                        onChange={(e) => setTravelerSearch(e.target.value)}
                                        onFocus={() => setTravelerSearchFocused(true)}
                                        onBlur={() => setTravelerSearchFocused(false)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-900/60 border border-white/5 text-white text-xs placeholder:text-zinc-600 outline-none focus:border-orange-500/30 transition-all"
                                    />
                                </div>
                            </div>

                            {travelersLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="h-[72px] rounded-xl bg-zinc-900/50 border border-white/5 animate-pulse" />
                                    ))}
                                </div>
                            ) : travelers.length === 0 ? (
                                <div className="text-center py-10">
                                    <Users size={28} className="text-zinc-700 mx-auto mb-3" />
                                    <p className="text-sm text-zinc-600">
                                        {debouncedTravelerSearch ? 'No travelers found' : 'No travelers to discover yet'}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {travelers.map((user, index) => (
                                        <motion.div
                                            key={user._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            onClick={() => router.push(`/profile/${user._id}`)}
                                            className="group bg-zinc-900/50 border border-white/5 hover:border-cyan-500/15 p-3.5 rounded-2xl flex items-center gap-3 hover:bg-zinc-900/80 transition-all cursor-pointer"
                                        >
                                            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-cyan-500/30 transition-colors shrink-0">
                                                {user.profilePicture ? (
                                                    <Image src={user.profilePicture} alt={user.name} width={44} height={44} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                                                        {user.name?.[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="text-sm font-semibold text-white group-hover:text-cyan-50 transition-colors truncate">
                                                        {user.name}
                                                    </h4>
                                                    {user.verificationStatus === 'verified' && (
                                                        <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-zinc-500 truncate">
                                                    {user.tripCount > 0 && `${user.tripCount} trip${user.tripCount > 1 ? 's' : ''}`}
                                                    {user.tripCount > 0 && getUserLocation(user) && ' • '}
                                                    {getUserLocation(user)}
                                                    {!user.tripCount && !getUserLocation(user) && (user.bio ? user.bio.slice(0, 50) : 'New explorer')}
                                                </p>
                                            </div>
                                            <button
                                                className="p-2 rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/profile/${user._id}`);
                                                }}
                                            >
                                                <UserPlus size={15} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.section>

                        {/* ===== COMMUNITIES ===== */}
                        {communities.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="px-5 md:px-8"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Users size={18} className="text-violet-400" />
                                        Communities
                                    </h2>
                                    <Link href="/app/communities" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                                        View all <ArrowRight size={12} />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {communities.map((community, index) => (
                                        <motion.div key={community._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + index * 0.04 }}>
                                            <Link href={`/app/communities/${community._id}`} className="block h-full">
                                                <motion.div
                                                    whileHover={{ y: -3 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                    className="group relative overflow-hidden rounded-2xl border border-white/5 hover:border-violet-500/20 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all duration-300 h-full"
                                                >
                                                    <div className="relative h-28 overflow-hidden">
                                                        {community.coverImage || community.logo ? (
                                                            <Image src={community.coverImage || community.logo || ''} alt={community.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-violet-500/10 via-fuchsia-600/10 to-cyan-500/10" />
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />

                                                        {community.isPremium && (
                                                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/25 backdrop-blur-md z-10">
                                                                <Crown size={10} /> Premium
                                                            </div>
                                                        )}

                                                        <div className="absolute -bottom-4 left-3.5 z-20">
                                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border-2 border-zinc-900 shadow-lg">
                                                                {community.logo ? (
                                                                    <Image src={community.logo} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                                                                        <span className="text-white font-bold text-sm">{community.name.charAt(0)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-6 pb-3.5 px-3.5">
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <h3 className="text-sm font-semibold text-white group-hover:text-violet-50 transition-colors line-clamp-1">{community.name}</h3>
                                                            {community.isJoined && (
                                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 font-semibold uppercase shrink-0">Joined</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-zinc-500 line-clamp-1 mb-2">{community.description || 'A community for like-minded people'}</p>
                                                        <span className="flex items-center gap-1 text-[11px] text-zinc-600">
                                                            <Users size={11} /> {community.memberCount?.toLocaleString()} members
                                                        </span>
                                                    </div>

                                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Empty State */}
                        {trips.length === 0 && travelers.length === 0 && communities.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center py-20 text-center px-5"
                            >
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-600/10 border border-cyan-500/10 flex items-center justify-center mb-6">
                                    <Compass size={32} className="text-cyan-500/40" />
                                </div>
                                <h3 className="text-lg font-semibold text-white/70 mb-2">Nothing to explore yet</h3>
                                <p className="text-sm text-zinc-600 max-w-xs">
                                    {debouncedSearch ? 'Try different keywords' : 'No trips or communities available right now. Check back soon!'}
                                </p>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
