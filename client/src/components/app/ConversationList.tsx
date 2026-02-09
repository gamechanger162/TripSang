'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Virtuoso } from 'react-virtuoso';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MessageSquare, Sparkles, RefreshCw } from 'lucide-react';
import VerifiedBadge from './ui/VerifiedBadge';
import { messageAPI, tripAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { socketManager } from '@/lib/socketManager';
import { useEnv } from '@/hooks/useEnv';

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
    refreshTrigger?: number;
}

// Default fallback avatar
const DEFAULT_AVATAR = '/assets/default-user.png';

export default function ConversationList({ onSelectConversation, selectedId, refreshTrigger = 0 }: ConversationListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

    const { data: session } = useSession();
    const { socketUrl } = useEnv();

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
    }, [refreshTrigger]); // Fetch on mount and when refreshTrigger changes

    // Socket integration for real-time updates
    useEffect(() => {
        const token = session?.user?.accessToken || localStorage.getItem('token');
        const socket = socketManager.connect(socketUrl, token || undefined);

        if (!socket || !session?.user?.id) return;

        const handleReceiveDM = (message: any) => {
            setConversations(prev => {
                // Find if conversation exists
                const existingIndex = prev.findIndex(c => c._id === message.conversationId);

                if (existingIndex === -1) {
                    // New conversation - fetch to get full details (user name, avatar etc)
                    fetchConversations();
                    return prev;
                }

                // Existing conversation - update it
                const updatedConversations = [...prev];
                const existingConv = updatedConversations[existingIndex];

                // Remove from current position
                updatedConversations.splice(existingIndex, 1);

                // Add to top with updated details
                updatedConversations.unshift({
                    ...existingConv,
                    lastMessage: {
                        text: message.message || (message.type === 'image' ? 'Sent an image' : 'New message'),
                        timestamp: message.timestamp || new Date().toISOString(),
                        senderId: typeof message.sender === 'object' ? message.sender._id : message.sender
                    },
                    // Increment unread count ONLY if not currently selected
                    unreadCount: selectedId === message.conversationId ? 0 : (existingConv.unreadCount || 0) + 1
                });

                return updatedConversations;
            });
        };

        socketManager.on('receive_dm', handleReceiveDM);

        return () => {
            socketManager.off('receive_dm', handleReceiveDM);
        };
    }, [socketUrl, session?.user?.id, fetchConversations, selectedId]);

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
                className="px-2 py-0.5"
            >
                <motion.div
                    onClick={() => onSelectConversation(conv._id, conv.type)}
                    className={`
                        group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer
                        transition-all duration-300
                        ${isSelected
                            ? 'bg-cyan-900/20 border border-cyan-500/30'
                            : 'bg-transparent hover:bg-white/5 border border-transparent hover:border-white/5'
                        }
                    `}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                >
                    {/* Active Indicator */}
                    {isSelected && (
                        <motion.div
                            layoutId="activeConversation"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-cyan-500 rounded-r-full shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />
                    )}

                    {/* Avatar - FIXED SIZE */}
                    <div className="relative flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full overflow-hidden transition-all duration-300 ${isSelected ? 'ring-2 ring-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'ring-1 ring-white/10 group-hover:ring-white/30'}`}>
                            {conv.avatar && !failedImages.has(conv._id) ? (
                                <Image
                                    src={conv.avatar}
                                    alt={conv.name}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-cover"
                                    onError={() => {
                                        // Track failed images to show fallback
                                        setFailedImages(prev => new Set(prev).add(conv._id));
                                    }}
                                />
                            ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                    <span className="text-gray-400 font-bold text-lg group-hover:text-white transition-colors">
                                        {conv.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                        {/* Row 1: Name + Time */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`font-medium truncate text-[15px] transition-colors ${isSelected ? 'text-cyan-100' : 'text-gray-200 group-hover:text-white'}`}>
                                    {conv.name}
                                </span>
                                {conv.isVerified && <VerifiedBadge size="sm" />}
                            </div>
                            {conv.lastMessage && (
                                <span className="text-[10px] text-gray-500 flex-shrink-0 group-hover:text-gray-400 transition-colors">
                                    {formatTime(conv.lastMessage.timestamp)}
                                </span>
                            )}
                        </div>

                        {/* Row 2: Last Message + Unread Badge */}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className={`text-sm truncate transition-colors ${isSelected ? 'text-cyan-200/60' :
                                    conv.unreadCount > 0 ? 'text-gray-100 font-medium' : 'text-gray-500 group-hover:text-gray-400'
                                }`}>
                                {conv.lastMessage?.text || 'No messages yet'}
                            </p>
                            {conv.unreadCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex-shrink-0 min-w-[20px] h-[20px] px-1 bg-cyan-500 rounded-full text-[10px] font-bold text-black flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.4)]"
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
        <div className="h-full flex flex-col bg-[#000a1f] backdrop-blur-xl border-r border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="p-4 pb-3 border-b border-white/5 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Messages</span>
                        <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{conversations.length}</span>
                    </h2>
                    <motion.button
                        whileHover={{ scale: 1.05, rotate: 90 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 rounded-xl text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                    </motion.button>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40 focus:bg-black/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all"
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
                            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 text-sm font-medium shadow-[0_0_15px_rgba(0,255,255,0.15)]"
                        >
                            Retry
                        </motion.button>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-cyan-500/15 to-purple-500/15 flex items-center justify-center border border-cyan-500/30"
                        >
                            <Sparkles className="w-10 h-10 text-cyan-400" style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,255,0.5))' }} />
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
