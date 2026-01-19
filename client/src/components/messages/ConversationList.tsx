'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Conversation } from '@/types/messages';

interface ConversationListProps {
    conversations: Conversation[];
    loading?: boolean;
}

export default function ConversationList({ conversations, loading }: ConversationListProps) {
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
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="card animate-pulse">
                        <div className="flex items-center space-x-3 p-4">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-dark-700 rounded-full" />
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

    if (conversations.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No conversations yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Start a conversation by messaging someone from a trip!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {conversations.map((conversation) => (
                <Link
                    key={conversation._id}
                    href={`/messages/${conversation.otherUser._id}`}
                    className="block"
                >
                    <div className="card hover:shadow-lg transition-all duration-200 hover:scale-[1.01] cursor-pointer">
                        <div className="flex items-center space-x-3 p-4">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                                    {conversation.otherUser.profilePicture ? (
                                        <Image
                                            src={conversation.otherUser.profilePicture}
                                            alt={conversation.otherUser.name}
                                            width={48}
                                            height={48}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                                            {conversation.otherUser.name[0].toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                {/* Online indicator */}
                                {conversation.otherUser.isOnline && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-800 rounded-full" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                        {conversation.otherUser.name}
                                    </h3>
                                    {conversation.lastMessage && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                            {formatTimestamp(conversation.lastMessage.timestamp)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <p
                                        className={`text-sm truncate ${conversation.unreadCount > 0
                                                ? 'font-semibold text-gray-900 dark:text-white'
                                                : 'text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        {conversation.lastMessage ? (
                                            <>
                                                {conversation.lastMessage.isOwnMessage && (
                                                    <span className="text-gray-500 mr-1">You:</span>
                                                )}
                                                {conversation.lastMessage.text}
                                            </>
                                        ) : (
                                            <span className="text-gray-400 italic">No messages yet</span>
                                        )}
                                    </p>
                                    {conversation.unreadCount > 0 && (
                                        <span className="flex-shrink-0 ml-2 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
