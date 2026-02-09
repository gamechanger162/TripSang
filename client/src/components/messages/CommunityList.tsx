'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Users, Lock, Globe } from 'lucide-react';

interface Community {
    _id: string;
    name: string;
    description: string;
    category: string;
    isPrivate: boolean;
    coverImage?: string;
    logo?: string;
    memberCount: number;
    creator: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    lastMessage?: {
        message: string;
        senderName: string;
        timestamp: string;
        type: string;
    };
}

interface CommunityListProps {
    communities: Community[];
    loading: boolean;
}

const categoryColors: Record<string, string> = {
    'Bikers': 'bg-red-500/20 text-red-400',
    'Photographers': 'bg-purple-500/20 text-purple-400',
    'Trekkers': 'bg-green-500/20 text-green-400',
    'Foodies': 'bg-orange-500/20 text-orange-400',
    'Adventurers': 'bg-cyan-500/20 text-cyan-400',
    'Backpackers': 'bg-blue-500/20 text-blue-400',
    'Luxury': 'bg-amber-500/20 text-amber-400',
    'Solo': 'bg-pink-500/20 text-pink-400',
    'Culture': 'bg-indigo-500/20 text-indigo-400',
    'Beach': 'bg-teal-500/20 text-teal-400',
    'Mountains': 'bg-emerald-500/20 text-emerald-400',
    'Other': 'bg-gray-500/20 text-gray-400'
};

export default function CommunityList({ communities, loading }: CommunityListProps) {
    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-800/50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-gray-700 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-700 rounded w-1/3" />
                                <div className="h-3 bg-gray-700 rounded w-2/3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (communities.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-800/50 rounded-2xl flex items-center justify-center">
                    <Users className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">No Communities Yet</h3>
                <p className="text-gray-500 mb-6">Join or create a community to connect with travelers</p>
                <Link
                    href="/app/communities"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors"
                >
                    <Globe className="w-4 h-4" />
                    Discover Communities
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {communities.map(community => (
                <Link
                    key={community._id}
                    href={`/app/communities/${community._id}`}
                    className="block bg-gray-800/60 hover:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 transition-all border border-gray-700/50 hover:border-gray-600/50 group"
                >
                    <div className="flex items-center gap-4">
                        {/* Community Image */}
                        <div className="relative w-14 h-14 flex-shrink-0">
                            {(community.logo || community.coverImage) ? (
                                <Image
                                    src={(community.logo || community.coverImage) as string}
                                    alt={community.name}
                                    fill
                                    className="rounded-xl object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center">
                                    <span className="text-white text-xl font-bold">
                                        {community.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            {/* Privacy indicator */}
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${community.isPrivate ? 'bg-gray-700' : 'bg-green-600'}`}>
                                {community.isPrivate ? (
                                    <Lock className="w-2.5 h-2.5 text-gray-300" />
                                ) : (
                                    <Globe className="w-2.5 h-2.5 text-white" />
                                )}
                            </div>
                        </div>

                        {/* Community Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
                                    {community.name}
                                </h3>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[community.category] || categoryColors['Other']}`}>
                                    {community.category}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                                <Users className="w-3.5 h-3.5" />
                                <span>{community.memberCount} member{community.memberCount !== 1 ? 's' : ''}</span>
                            </div>

                            {community.lastMessage && (
                                <p className="text-sm text-gray-500 truncate">
                                    <span className="text-gray-400">{community.lastMessage.senderName}:</span>{' '}
                                    {community.lastMessage.type === 'image' ? '📷 Sent an image' : community.lastMessage.message}
                                </p>
                            )}
                        </div>

                        {/* Timestamp */}
                        {community.lastMessage?.timestamp && (
                            <div className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(community.lastMessage.timestamp), { addSuffix: false })}
                            </div>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    );
}
