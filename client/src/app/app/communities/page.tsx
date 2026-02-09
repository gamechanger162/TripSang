'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/app/ui/GlassCard';
import { GlassButton } from '@/components/app/ui/GlassCard';
import { useEnv } from '@/hooks/useEnv';
import { communityAPI, userAPI, paymentAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { Globe, Users, Lock, Crown, ChevronRight, Plus, MapPin } from 'lucide-react';
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

import MeshBackground from '@/components/app/ui/MeshBackground';

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
            // Guard: Wait for session to be fully loaded
            if (status !== 'authenticated' || !session?.user) return;

            try {
                setLoading(true);
                let data;

                if (filter === 'joined') {
                    // Get my communities
                    const response = await communityAPI.getMyCommunities();
                    data = response.communities || [];
                } else {
                    // Discover communities with search
                    const response = await communityAPI.discover(undefined, debouncedSearch);
                    data = response.communities || []; // discover returns { publicCommunities, pendingCommunities }, but frontend state is simple array for now. Wait, need to check API response structure.
                    // The discover API returns { success: true, publicCommunities: [], pendingCommunities: [] }
                    // My state expects Community[]. 
                    // Let's adjust this.
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
                // Only show toast once per error
                if (!loading) {
                    toast.error('Failed to load communities');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCommunities();
        // Use stable primitive values as dependencies to prevent infinite loops
    }, [status, (session?.user as any)?.id, filter, debouncedSearch]);

    const handleCreateCommunity = async () => {
        const user = session?.user as any;
        console.log('Debug: Checking premium status for user:', user);

        // 1. Check session first (fast path)
        let isPremium = user?.subscription?.plan === 'premium' || user?.subscription?.plan === 'pro' || user?.isPremium;

        // 2. If not found in session, fetch subscription status from payment API (more reliable)
        if (!isPremium) {
            try {
                const toastId = toast.loading('Verifying membership...');
                const response = await paymentAPI.getStatus();
                toast.dismiss(toastId);

                if (response.success && response.subscription) {
                    const sub = response.subscription;
                    console.log('Debug: Fetched subscription:', sub);

                    // Check for active subscription or valid trial
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
        // Open the create community modal instead of redirecting
        setShowCreateModal(true);
    };

    const handleCommunityCreated = (newCommunity: any) => {
        // Add the new community to the list
        setCommunities(prev => [newCommunity, ...prev]);
        setShowCreateModal(false);
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center w-full h-full bg-[#000a1f]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
            </div>
        );
    }

    if (!session) return null;

    return (
        <>
            <div className="flex-1 h-full relative overflow-hidden flex flex-col">
                <MeshBackground />

                <div className="relative z-10 flex-1 overflow-y-auto pb-20 p-6 flex flex-col gap-8 custom-scrollbar">
                    {/* Header Section */}
                    <div className="flex items-end justify-between border-b border-white/5 pb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 mb-2 tracking-tight">
                                Communities
                            </h1>
                            <p className="text-cyan-200/60 text-base font-light tracking-wide">
                                Join alliances, discover squads, and ride together.
                            </p>
                        </div>
                        <GlassButton
                            onClick={handleCreateCommunity}
                            variant="primary"
                            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-none shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 group"
                        >
                            <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                            <span className="font-semibold tracking-wide">Create Alliance</span>
                        </GlassButton>
                    </div>

                    {/* Filter Tabs & Search */}
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-black/20 backdrop-blur-xl p-2 rounded-2xl border border-white/5 shadow-lg">
                        <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                            <button
                                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${filter === 'all'
                                    ? 'text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-white/5'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                    }`}
                                onClick={() => setFilter('all')}
                            >
                                {filter === 'all' && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white/5 border border-cyan-500/30 rounded-lg"
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    <Globe size={16} className={filter === 'all' ? 'text-cyan-400' : 'text-gray-500 group-hover:text-cyan-400 transition-colors'} />
                                    Discover
                                </span>
                            </button>
                            <button
                                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${filter === 'joined'
                                    ? 'text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-white/5'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                    }`}
                                onClick={() => setFilter('joined')}
                            >
                                {filter === 'joined' && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white/5 border border-emerald-500/30 rounded-lg"
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    <Users size={16} className={filter === 'joined' ? 'text-emerald-400' : 'text-gray-500 group-hover:text-emerald-400 transition-colors'} />
                                    Joined
                                </span>
                            </button>
                        </div>

                        {filter === 'all' && (
                            <div className="w-full max-w-md relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                <input
                                    type="text"
                                    placeholder="Search alliances..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-5 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-sm outline-none focus:border-cyan-500/30 focus:bg-black/60 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all relative z-10"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                </div>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-[360px] rounded-3xl bg-white/10 animate-pulse" />
                            ))}
                        </div>
                    ) : communities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-white/60">
                            <Globe size={48} className="text-white/30 mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {searchQuery ? 'No communities match your search'
                                    : filter === 'joined' ? 'No communities joined yet'
                                        : 'No communities found'}
                            </h3>
                            <p>
                                {filter === 'joined' ? 'Explore and join communities to connect with travelers'
                                    : 'Be the first to create a community!'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {communities.map((community, index) => (
                                <motion.div
                                    key={community._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link href={`/app/communities/${community._id}`} className="block h-full">
                                        <GlassCard padding="none" hover className="h-[360px] relative overflow-hidden rounded-[24px]">
                                            {/* Full Background Image */}
                                            <div className="absolute inset-0 w-full h-full group">
                                                {community.coverImage || community.logo ? (
                                                    <Image
                                                        src={community.coverImage || community.logo || ''}
                                                        alt={community.name}
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-teal-500/40 to-purple-500/40" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                            </div>

                                            {/* Content Overlay */}
                                            <div className="absolute bottom-0 left-0 w-full p-6 z-10">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {community.logo ? (
                                                        <Image
                                                            src={community.logo}
                                                            alt="Logo"
                                                            width={40}
                                                            height={40}
                                                            className="w-10 h-10 rounded-full border-2 border-white/20 object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center">
                                                            <MapPin size={18} className="text-pink-500 fill-pink-500/20" />
                                                        </div>
                                                    )}
                                                    <h3 className="text-2xl font-bold text-white leading-tight shadow-sm">
                                                        {community.name}
                                                    </h3>
                                                </div>

                                                <p className="text-sm text-white/80 mb-4 line-clamp-2 leading-relaxed pl-1">
                                                    {community.description}
                                                </p>

                                                <div className="flex items-center gap-2 pl-1">
                                                    <span className="flex items-center gap-1.5 text-xs text-white/70 font-medium">
                                                        <Users size={14} />
                                                        {community.memberCount} members
                                                    </span>
                                                    {community.isJoined && (
                                                        <span className="text-[11px] px-2.5 py-1 bg-teal-500/30 border border-teal-500/40 rounded-full text-teal-300 font-semibold backdrop-blur-sm ml-auto">
                                                            Joined
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Premium Badge (Top Right) */}
                                            {community.isPremium && (
                                                <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-amber-500/90 rounded-full text-[11px] font-bold text-white z-20 backdrop-blur-sm shadow-md">
                                                    <Crown size={12} />
                                                    Premium
                                                </div>
                                            )}
                                        </GlassCard>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
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
