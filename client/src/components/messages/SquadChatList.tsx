'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Users, MessageSquare } from 'lucide-react';

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
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="card animate-pulse">
                        <div className="flex items-center space-x-3 p-4">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-dark-700 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/3" />
                                <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-2/3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (trips.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No squad chats yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Join or create a trip to start chatting with your squad!
                </p>
                <Link
                    href="/search"
                    className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    Explore Trips
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {trips.map((trip) => (
                <Link
                    key={trip._id}
                    href={`/trips/${trip._id}/chat`}
                    className="block"
                >
                    <div className="card hover:shadow-lg transition-all duration-200 hover:scale-[1.01] cursor-pointer">
                        <div className="flex items-center space-x-3 p-4">
                            {/* Trip Cover */}
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center overflow-hidden">
                                    {trip.coverPhoto ? (
                                        <Image
                                            src={trip.coverPhoto}
                                            alt={trip.title}
                                            width={48}
                                            height={48}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <MessageSquare className="w-6 h-6 text-white" />
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                        {trip.title}
                                    </h3>
                                    {trip.lastMessage && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                            {formatTimestamp(trip.lastMessage.timestamp)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                        {trip.lastMessage ? (
                                            <>
                                                <span className="text-gray-500">{trip.lastMessage.senderName}:</span>{' '}
                                                {trip.lastMessage.message}
                                            </>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {trip.squadMembers.length + 1} members · No messages yet
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
