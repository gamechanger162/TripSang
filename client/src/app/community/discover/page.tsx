'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { communityAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Lock, Globe, Search, Loader2, Check, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Community {
    _id: string;
    name: string;
    description: string;
    category: string;
    isPrivate: boolean;
    coverImage?: string;
    memberCount: number;
    creator: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    hasPendingRequest?: boolean;
}

const CATEGORIES = ['All', 'Bikers', 'Photographers', 'Trekkers', 'Foodies', 'Adventurers', 'Backpackers', 'Luxury', 'Solo', 'Culture', 'Beach', 'Mountains', 'Other'];

const categoryColors: Record<string, string> = {
    'Bikers': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Photographers': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Trekkers': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Foodies': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Adventurers': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Backpackers': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Luxury': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Solo': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'Culture': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'Beach': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    'Mountains': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Other': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

export default function DiscoverCommunitiesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [publicCommunities, setPublicCommunities] = useState<Community[]>([]);
    const [pendingCommunities, setPendingCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [joiningId, setJoiningId] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchCommunities();
        }
    }, [status, selectedCategory, searchQuery]);

    const fetchCommunities = async () => {
        try {
            setLoading(true);
            const response = await communityAPI.discover(
                selectedCategory !== 'All' ? selectedCategory : undefined,
                searchQuery || undefined
            );
            if (response.success) {
                setPublicCommunities(response.publicCommunities || []);
                setPendingCommunities(response.pendingCommunities || []);
            }
        } catch (error: any) {
            if (error.message?.includes('Premium')) {
                toast.error('Premium membership required');
                router.push('/messages');
            } else {
                toast.error('Failed to load communities');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (community: Community) => {
        try {
            setJoiningId(community._id);

            if (community.isPrivate) {
                const response = await communityAPI.requestToJoin(community._id);
                if (response.success) {
                    toast.success('Join request sent!');
                    setPendingCommunities(prev => [...prev, { ...community, hasPendingRequest: true }]);
                    setPublicCommunities(prev => prev.filter(c => c._id !== community._id));
                }
            } else {
                const response = await communityAPI.join(community._id);
                if (response.success) {
                    toast.success('Joined community!');
                    router.push(`/community/${community._id}`);
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to join');
        } finally {
            setJoiningId(null);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-8 pt-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href="/app"
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-300" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Discover Communities
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Find and join travel communities
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search communities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
                    {CATEGORIES.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${selectedCategory === category
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Pending Requests */}
                {pendingCommunities.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-400" />
                            Pending Requests
                        </h2>
                        <div className="space-y-3">
                            {pendingCommunities.map(community => (
                                <CommunityCard
                                    key={community._id}
                                    community={community}
                                    isPending={true}
                                    onJoin={() => { }}
                                    joiningId={null}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Public Communities */}
                <div>
                    <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-green-400" />
                        Public Communities
                    </h2>

                    {publicCommunities.length === 0 ? (
                        <div className="text-center py-12 bg-gray-800/50 rounded-xl">
                            <Users className="w-12 h-12 mx-auto text-gray-500 mb-3" />
                            <p className="text-gray-400">No communities found</p>
                            <p className="text-gray-500 text-sm">Try a different category or search</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {publicCommunities.map(community => (
                                <CommunityCard
                                    key={community._id}
                                    community={community}
                                    isPending={false}
                                    onJoin={handleJoin}
                                    joiningId={joiningId}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CommunityCard({
    community,
    isPending,
    onJoin,
    joiningId
}: {
    community: Community;
    isPending: boolean;
    onJoin: (c: Community) => void;
    joiningId: string | null;
}) {
    return (
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-start gap-4">
                {/* Cover Image */}
                <div className="relative w-16 h-16 flex-shrink-0">
                    {community.coverImage ? (
                        <Image
                            src={community.coverImage}
                            alt={community.name}
                            fill
                            className="rounded-xl object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">
                                {community.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${community.isPrivate ? 'bg-gray-700' : 'bg-green-600'}`}>
                        {community.isPrivate ? (
                            <Lock className="w-3 h-3 text-gray-300" />
                        ) : (
                            <Globe className="w-3 h-3 text-white" />
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">{community.name}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${categoryColors[community.category] || categoryColors['Other']}`}>
                            {community.category}
                        </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                        {community.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {community.memberCount} members
                        </span>
                        <span>by {community.creator.name}</span>
                    </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                    {isPending ? (
                        <span className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            Pending
                        </span>
                    ) : (
                        <button
                            onClick={() => onJoin(community)}
                            disabled={joiningId === community._id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {joiningId === community._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : community.isPrivate ? (
                                <>
                                    <Lock className="w-4 h-4" />
                                    Request
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Join
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
