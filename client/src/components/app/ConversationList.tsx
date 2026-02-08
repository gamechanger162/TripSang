'use client';

import { useState, useEffect, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MessageSquare, Sparkles, RefreshCw } from 'lucide-react';
import VerifiedBadge from './ui/VerifiedBadge';
import { messageAPI, tripAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Conversation {
    _id: string;
    type: 'dm' | 'squad';
    name: string;
    avatar?: string;
    lastMessage?: {
        text: string;
        timestamp: string;
        senderId: string;
    };
    unreadCount: number;
    isVerified?: boolean;
}

interface ConversationListProps {
    onSelectConversation: (id: string, type: 'dm' | 'squad') => void;
    selectedId: string | null;
}

// Default fallback avatar
const DEFAULT_AVATAR = '/assets/default-user.png';

export default function ConversationList({ onSelectConversation, selectedId }: ConversationListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

    const fetchConversations = useCallback(async (retryCount = 0) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 2000;

        try {
            setError(null);

            // Fetch only DM conversations (squads have their own tab)
            const dmResponse = await messageAPI.getConversations().catch(err => ({ success: false, error: err }));

            let allConversations: Conversation[] = [];

            // Process DMs only
            if (dmResponse && dmResponse.conversations) {
                const dmConvos = dmResponse.conversations.map((conv: any) => ({
                    _id: conv._id || conv.recipientId,
                    type: 'dm' as const,
                    name: conv.otherUser?.name || conv.recipientName || conv.name || 'Unknown',
                    avatar: conv.otherUser?.profilePicture,
                    lastMessage: conv.lastMessage ? {
                        text: conv.lastMessage.text || conv.lastMessage.message || '',
                        timestamp: conv.lastMessage.timestamp || conv.lastMessage.createdAt,
                        senderId: conv.lastMessage.senderId || conv.lastMessage.sender
                    } : undefined,
                    unreadCount: conv.unreadCount || 0,
                    isVerified: conv.otherUser?.isVerified || conv.recipientVerified || conv.isVerified
                }));
                allConversations = dmConvos;
            }

            // Sort by timestamp (newest first)
            allConversations.sort((a: Conversation, b: Conversation) => {
                const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
                const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
                return timeB - timeA;
            });

            setConversations(allConversations);
            setError(null);

        } catch (error: any) {
            console.error('Failed to fetch conversations:', error?.message || error);

            // Retry logic
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying... attempt ${retryCount + 1}/${MAX_RETRIES}`);
                setTimeout(() => fetchConversations(retryCount + 1), RETRY_DELAY);
                return; // Don't set loading to false yet
            }

            // All retries failed
            setError('Failed to load conversations');
            toast.error('Unable to connect. Please check your internet connection.', {
                id: 'conv-error',
                duration: 5000,
            });
        } finally {
            if (retryCount >= MAX_RETRIES || retryCount === 0) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchConversations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only fetch on mount

    const filteredConversations = conversations.filter(conv =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = diff / (1000 * 60 * 60);

        if (hours < 24) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (hours < 168) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const renderConversation = (index: number, conv: Conversation) => {
        const isSelected = selectedId === conv._id;

        return (
            <motion.div
                key={conv._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02, duration: 0.3 }}
                className="px-3 py-1"
            >
                <motion.div
                    onClick={() => onSelectConversation(conv._id, conv.type)}
                    className={`
                        group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer
                        transition-all duration-300 ease-out
                        ${isSelected
                            ? 'bg-white/15 shadow-[0_0_20px_rgba(20,184,166,0.15)] border border-teal-500/30'
                            : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10'
                        }
                    `}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {/* Active Indicator */}
                    {isSelected && (
                        <motion.div
                            layoutId="activeConversation"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-teal-400 to-teal-600 rounded-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />
                    )}

                    {/* Avatar - FIXED SIZE */}
                    <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-white/20 transition-all">
                            {conv.avatar && !failedImages.has(conv._id) ? (
                                <img
                                    src={conv.avatar}
                                    alt={conv.name}
                                    className="w-12 h-12 object-cover"
                                    onError={() => {
                                        // Track failed images to show fallback
                                        setFailedImages(prev => new Set(prev).add(conv._id));
                                    }}
                                />
                            ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">
                                        {conv.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        {/* Online Indicator (placeholder) */}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-gray-900" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                        {/* Row 1: Name + Time */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-semibold text-white truncate text-[15px]">
                                    {conv.name}
                                </span>
                                {conv.isVerified && <VerifiedBadge size="sm" />}
                            </div>
                            {conv.lastMessage && (
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                    {formatTime(conv.lastMessage.timestamp)}
                                </span>
                            )}
                        </div>

                        {/* Row 2: Last Message + Unread Badge */}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className="text-sm text-gray-400 truncate">
                                {conv.lastMessage?.text || 'No messages yet'}
                            </p>
                            {conv.unreadCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex-shrink-0 min-w-[22px] h-[22px] px-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full text-[11px] font-bold text-white flex items-center justify-center shadow-lg shadow-teal-500/30"
                                >
                                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                </motion.span>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-black/20 backdrop-blur-xl border-r border-white/10">
            {/* Header */}
            <div className="p-4 pb-3 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white tracking-tight">Messages</h2>
                    <motion.button
                        whileHover={{ scale: 1.05, rotate: 90 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-xl text-teal-400 hover:text-teal-300 transition-colors"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                    </motion.button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-teal-500/50 focus:bg-white/10 transition-all"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-hidden">
                {loading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                                <div className="w-12 h-12 rounded-full bg-white/10" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-white/10 rounded w-3/4" />
                                    <div className="h-3 bg-white/5 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="w-16 h-16 mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-gray-400 mb-4">{error}</p>
                        <motion.button
                            onClick={() => fetchConversations()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-4 py-2 bg-teal-500/20 border border-teal-500/30 rounded-xl text-teal-400 text-sm font-medium"
                        >
                            Retry
                        </motion.button>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-teal-500/10 to-emerald-500/10 flex items-center justify-center"
                        >
                            <Sparkles className="w-10 h-10 text-teal-400" />
                        </motion.div>
                        <p className="text-gray-300 font-medium mb-1">
                            {searchQuery ? 'No results found' : 'No conversations yet'}
                        </p>
                        <p className="text-sm text-gray-500">
                            Start a chat or join a trip!
                        </p>
                    </div>
                ) : (
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={filteredConversations}
                        itemContent={renderConversation}
                        className="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                    />
                )}
            </div>
        </div>
    );
}
