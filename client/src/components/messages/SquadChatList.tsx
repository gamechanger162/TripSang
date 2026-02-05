'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Users, MessageSquare, Compass, Sparkles } from 'lucide-react';

interface Trip {
    _id: string;
    title: string;
    coverPhoto?: string;
    squadMembers: any[];
    creator: {
        _id: string;
        name: string;
    };
    lastMessage?: {
        senderName: string;
        message: string;
        timestamp: string;
    };
}

interface SquadChatListProps {
    trips: Trip[];
    loading?: boolean;
}

export default function SquadChatList({ trips, loading }: SquadChatListProps) {
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } else if (diffInHours < 168) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/5 animate-pulse">
                        <div className="flex items-center gap-4 p-5">
                            <div className="w-14 h-14 bg-gray-700/50 rounded-xl" />
                            <div className="flex-1 space-y-3">
                                <div className="h-4 bg-gray-700/50 rounded-full w-1/3" />
                                <div className="h-3 bg-gray-700/30 rounded-full w-2/3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (trips.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-800/40 via-gray-900/60 to-black/40 backdrop-blur-2xl border border-white/10 p-12 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.08),transparent_50%)]" />
                <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 flex items-center justify-center border border-white/10 shadow-lg shadow-blue-500/10 rotate-3">
                        <Users className="w-10 h-10 text-blue-400/80" />
                    </div>
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-3">
                        No squad chats yet
                    </h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed mb-6">
                        Join or create a trip to start chatting with your squad!
                    </p>
                    <Link
                        href="/search"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                    >
                        <Compass className="w-4 h-4" />
                        Explore Trips
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {trips.map((trip, index) => (
                <Link
                    key={trip._id}
                    href={`/trips/${trip._id}/chat`}
                    className="block group"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-800/40 via-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-white/5 hover:border-blue-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5">
                        {/* Animated gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-cyan-600/0 to-blue-600/0 group-hover:from-blue-600/5 group-hover:via-cyan-600/10 group-hover:to-blue-600/5 transition-all duration-500" />

                        <div className="relative flex items-center gap-4 p-5">
                            {/* Trip Cover with Premium Styling */}
                            <div className="relative flex-shrink-0">
                                <div className="w-14 h-14 rounded-xl p-[2px] bg-gradient-to-br from-blue-500/50 via-cyan-500/50 to-teal-500/50 group-hover:from-blue-400 group-hover:via-cyan-500 group-hover:to-teal-400 transition-all duration-500 shadow-lg shadow-blue-500/20 overflow-hidden">
                                    {trip.coverPhoto ? (
                                        <Image
                                            src={trip.coverPhoto}
                                            alt={trip.title}
                                            width={54}
                                            height={54}
                                            className="object-cover w-full h-full rounded-[10px]"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-[10px] bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 flex items-center justify-center">
                                            <MessageSquare className="w-6 h-6 text-white/90" />
                                        </div>
                                    )}
                                </div>
                                {/* Member count badge */}
                                <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-900/90 border border-white/10 rounded-full text-[9px] text-gray-300 font-medium backdrop-blur-sm">
                                    <Users className="w-2.5 h-2.5" />
                                    {trip.squadMembers.length + 1}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                    <h3 className="font-semibold text-white group-hover:text-blue-200 transition-colors truncate">
                                        {trip.title}
                                    </h3>
                                    {trip.lastMessage && (
                                        <span className="text-[11px] text-gray-500 flex-shrink-0 ml-3 font-medium tracking-wide">
                                            {formatTimestamp(trip.lastMessage.timestamp)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-400 truncate">
                                        {trip.lastMessage ? (
                                            <>
                                                <span className="text-cyan-400/80 font-medium">{trip.lastMessage.senderName}:</span>{' '}
                                                <span className="text-gray-400">{trip.lastMessage.message}</span>
                                            </>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-gray-500">
                                                <Sparkles className="w-3 h-3 text-blue-400" />
                                                Ready to start planning!
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Arrow indicator */}
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
