'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Conversation } from '@/types/messages';
import { MessageCircle, Sparkles } from 'lucide-react';

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
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/5 animate-pulse">
                        <div className="flex items-center gap-4 p-5">
                            <div className="w-14 h-14 bg-gray-700/50 rounded-full" />
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

    if (conversations.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-800/40 via-gray-900/60 to-black/40 backdrop-blur-2xl border border-white/10 p-12 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.08),transparent_50%)]" />
                <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center border border-white/10 shadow-lg shadow-violet-500/10">
                        <MessageCircle className="w-10 h-10 text-violet-400/80" />
                    </div>
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-3">
                        No conversations yet
                    </h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                        Start a conversation by messaging someone from a trip!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {conversations.map((conversation, index) => (
                <Link
                    key={conversation._id}
                    href={`/messages/${conversation.otherUser._id}`}
                    className="block group"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-800/40 via-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-white/5 hover:border-violet-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-0.5">
                        {/* Animated gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-purple-600/0 to-violet-600/0 group-hover:from-violet-600/5 group-hover:via-purple-600/10 group-hover:to-violet-600/5 transition-all duration-500" />

                        {/* Glow effect for unread */}
                        {conversation.unreadCount > 0 && (
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-violet-400 to-purple-500 rounded-full blur-sm" />
                        )}

                        <div className="relative flex items-center gap-4 p-5">
                            {/* Premium Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-violet-500/50 via-purple-500/50 to-pink-500/50 group-hover:from-violet-400 group-hover:via-purple-500 group-hover:to-pink-500 transition-all duration-500 shadow-lg shadow-violet-500/20">
                                    <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                                        {conversation.otherUser.profilePicture ? (
                                            <Image
                                                src={conversation.otherUser.profilePicture}
                                                alt={conversation.otherUser.name}
                                                width={54}
                                                height={54}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <span className="text-xl font-bold bg-gradient-to-br from-violet-400 to-purple-500 bg-clip-text text-transparent">
                                                {conversation.otherUser.name[0].toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Online indicator */}
                                {conversation.otherUser.isOnline && (
                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-gray-900 rounded-full shadow-lg shadow-emerald-500/50 animate-pulse" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                    <h3 className="font-semibold text-white group-hover:text-violet-200 transition-colors truncate">
                                        {conversation.otherUser.name}
                                    </h3>
                                    {conversation.lastMessage && (
                                        <span className="text-[11px] text-gray-500 flex-shrink-0 ml-3 font-medium tracking-wide">
                                            {formatTimestamp(conversation.lastMessage.timestamp)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <p
                                        className={`text-sm truncate ${conversation.unreadCount > 0
                                            ? 'font-medium text-gray-200'
                                            : 'text-gray-400'
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
                                            <span className="text-gray-500 italic">Start chatting...</span>
                                        )}
                                    </p>
                                    {conversation.unreadCount > 0 && (
                                        <span className="flex-shrink-0 ml-3 px-2.5 py-1 text-[10px] font-bold bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full shadow-lg shadow-violet-500/30 flex items-center gap-1">
                                            <Sparkles className="w-2.5 h-2.5" />
                                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Arrow indicator */}
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
