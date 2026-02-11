'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEnv } from '@/hooks/useEnv';
import { communityAPI, paymentAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Users, Crown, Plus, Search, Sparkles, Hash, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const CreateCommunityModal = dynamic(() => import('@/components/community/CreateCommunityModal'), {
    ssr: false
});

interface Community {
    _id: string;
    name: string;
    description: string;
    logo?: string;
    coverImage?: string;
    memberCount: number;
    category: string;
    isPremium: boolean;
    isJoined: boolean;
}

export default function CommunitiesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { apiUrl } = useEnv();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'joined'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin?callbackUrl=/app/communities');
        }
    }, [status, router]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const fetchCommunities = async () => {
            if (status !== 'authenticated' || !session?.user) return;

            try {
                setLoading(true);
                let data;

                if (filter === 'joined') {
                    const response = await communityAPI.getMyCommunities();
                    data = response.communities || [];
                } else {
                    const response = await communityAPI.discover(undefined, debouncedSearch);
                    data = response.communities || [];
                    if (response.publicCommunities) {
                        data = response.publicCommunities;
                    } else if (Array.isArray(response)) {
                        data = response;
                    } else {
                        data = [];
                    }
                }

                setCommunities(data);
            } catch (error) {
                console.error('Failed to fetch communities:', error);
                if (!loading) {
                    toast.error('Failed to load communities');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCommunities();
    }, [status, (session?.user as any)?.id, filter, debouncedSearch]);

    const handleCreateCommunity = async () => {
        const user = session?.user as any;

        let isPremium = user?.subscription?.plan === 'premium' || user?.subscription?.plan === 'pro' || user?.isPremium;

        if (!isPremium) {
            try {
                const toastId = toast.loading('Verifying membership...');
                const response = await paymentAPI.getStatus();
                toast.dismiss(toastId);

                if (response.success && response.subscription) {
                    const sub = response.subscription;
                    const trialEnd = sub.trialEndDate || sub.trialEnds;
                    isPremium = sub.status === 'active' ||
                        sub.status === 'trial' ||
                        sub.plan === 'premium' ||
                        sub.plan === 'pro' ||
                        (trialEnd && new Date(trialEnd) > new Date());
                }
            } catch (error) {
                console.error('Failed to verify premium status:', error);
                toast.error('Could not verify membership. Please try again.');
                return;
            }
        }

        if (!isPremium) {
            toast.error('Premium subscription required to create communities');
            router.push('/my-plan');
            return;
        }
        setShowCreateModal(true);
    };

    const handleCommunityCreated = (newCommunity: any) => {
        setCommunities(prev => [newCommunity, ...prev]);
        setShowCreateModal(false);
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center w-full h-full bg-[#060a10]">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 animate-pulse" />
                        <motion.div
                            className="absolute inset-0 rounded-2xl border border-cyan-500/30"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                    <p className="text-zinc-500 text-sm">Loading communities...</p>
                </motion.div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <>
            <div className="flex-1 h-full relative overflow-hidden flex flex-col bg-[#060a10]">
                {/* Ambient Background Effects */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.03] blur-[150px] rounded-full" />
                    <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-blue-600/[0.03] blur-[130px] rounded-full" />
                    <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-violet-500/[0.02] blur-[120px] rounded-full" />
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto pb-20 app-scrollable">

                    {/* Hero Section */}
                    <div className="px-5 md:px-8 pt-6 pb-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 mb-2"
                                >
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                                        <Sparkles size={12} className="text-cyan-400" />
                                        <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Communities</span>
                                    </div>
                                </motion.div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                    className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1"
                                >
                                    Find Your Tribe
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-zinc-500 text-sm max-w-md"
                                >
                                    Discover communities that match your vibe. Connect, collaborate, and grow together.
                                </motion.p>
                            </div>

                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.15 }}
                                onClick={handleCreateCommunity}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow shrink-0"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                <span className="hidden sm:inline">Create</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="px-5 md:px-8 pb-5">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
                        >
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-md transition-opacity duration-300 ${searchFocused ? 'opacity-100' : 'opacity-0'}`} />
                                <div className="relative flex items-center">
                                    <Search size={16} className={`absolute left-3.5 transition-colors ${searchFocused ? 'text-cyan-400' : 'text-zinc-600'}`} />
                                    <input
                                        type="text"
                                        placeholder="Search communities..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setSearchFocused(true)}
                                        onBlur={() => setSearchFocused(false)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-white/5 text-white text-sm placeholder:text-zinc-600 outline-none focus:border-cyan-500/30 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex gap-1 p-1 rounded-xl bg-zinc-900/80 border border-white/5 shrink-0">
                                <button
                                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${filter === 'all' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    onClick={() => setFilter('all')}
                                >
                                    {filter === 'all' && (
                                        <motion.div
                                            layoutId="communityTab"
                                            className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/20"
                                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-1.5">
                                        <Globe size={14} /> Discover
                                    </span>
                                </button>
                                <button
                                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${filter === 'joined' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    onClick={() => setFilter('joined')}
                                >
                                    {filter === 'joined' && (
                                        <motion.div
                                            layoutId="communityTab"
                                            className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/20"
                                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-1.5">
                                        <Users size={14} /> Joined
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Content */}
                    <div className="px-5 md:px-8">
                        {loading ? (
                            /* Skeleton Loading */
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/50">
                                        <div className="h-36 bg-zinc-800/50 animate-pulse" />
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
                                                    <div className="h-3 w-1/2 bg-zinc-800/50 rounded animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="h-3 w-full bg-zinc-800/30 rounded animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : communities.length === 0 ? (
                            /* Empty State */
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <div className="relative mb-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/10 flex items-center justify-center">
                                        <Hash size={32} className="text-cyan-500/40" />
                                    </div>
                                    <motion.div
                                        className="absolute -inset-2 rounded-3xl border border-cyan-500/10"
                                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    />
                                </div>
                                <h3 className="text-lg font-semibold text-white/70 mb-2">
                                    {searchQuery ? 'No communities found'
                                        : filter === 'joined' ? 'No communities joined yet'
                                            : 'No communities yet'}
                                </h3>
                                <p className="text-sm text-zinc-600 max-w-xs mb-6">
                                    {filter === 'joined'
                                        ? 'Explore and join communities to connect with fellow travelers'
                                        : 'Be the first to create a community and start something awesome!'}
                                </p>
                                {filter === 'joined' && (
                                    <button
                                        onClick={() => setFilter('all')}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/15 transition-colors"
                                    >
                                        <Globe size={15} /> Explore Communities
                                    </button>
                                )}
                            </motion.div>
                        ) : (
                            /* Community Cards Grid */
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {communities.map((community, index) => (
                                    <motion.div
                                        key={community._id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                                    >
                                        <Link href={`/app/communities/${community._id}`} className="block h-full">
                                            <motion.div
                                                whileHover={{ y: -4 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                className="group relative overflow-hidden rounded-2xl border border-white/5 hover:border-cyan-500/20 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all duration-300 h-full"
                                            >
                                                {/* Cover Image */}
                                                <div className="relative h-36 overflow-hidden">
                                                    {community.coverImage || community.logo ? (
                                                        <Image
                                                            src={community.coverImage || community.logo || ''}
                                                            alt={community.name}
                                                            fill
                                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-violet-500/10" />
                                                    )}
                                                    {/* Gradient Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />

                                                    {/* Premium Badge */}
                                                    {community.isPremium && (
                                                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/25 backdrop-blur-md z-10">
                                                            <Crown size={11} />
                                                            Premium
                                                        </div>
                                                    )}

                                                    {/* Category Badge */}
                                                    {community.category && (
                                                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-cyan-300 bg-cyan-500/15 border border-cyan-500/20 backdrop-blur-md z-10">
                                                            {community.category}
                                                        </div>
                                                    )}

                                                    {/* Logo positioned at bottom edge of cover */}
                                                    <div className="absolute -bottom-5 left-4 z-20">
                                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 border-2 border-zinc-900 shadow-lg">
                                                            {community.logo ? (
                                                                <Image
                                                                    src={community.logo}
                                                                    alt="Logo"
                                                                    width={48}
                                                                    height={48}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                                                    <span className="text-white font-bold text-lg">{community.name.charAt(0)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="pt-8 pb-4 px-4">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <h3 className="text-base font-semibold text-white group-hover:text-cyan-50 transition-colors line-clamp-1">
                                                            {community.name}
                                                        </h3>
                                                        {community.isJoined && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 font-semibold uppercase tracking-wider shrink-0">
                                                                Joined
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3">
                                                        {community.description || 'A community for like-minded travelers'}
                                                    </p>

                                                    <div className="flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5 text-[11px] text-zinc-600 font-medium">
                                                            <Users size={13} className="text-zinc-600" />
                                                            {community.memberCount.toLocaleString()} members
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[11px] text-cyan-500/70 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                            View <ArrowRight size={12} />
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Hover Glow Effect */}
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                                                </div>
                                            </motion.div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Community Modal */}
                <CreateCommunityModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCommunityCreated}
                />
            </div>
        </>
    );
}
