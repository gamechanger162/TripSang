'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Virtuoso } from 'react-virtuoso';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, Sparkles, RefreshCw } from 'lucide-react';
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
                return;
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
    }, [refreshTrigger]);

    // Socket integration for real-time updates
    useEffect(() => {
        const token = session?.user?.accessToken || localStorage.getItem('token');
        const socket = socketManager.connect(socketUrl, token || undefined);

        if (!socket || !session?.user?.id) return;

        const handleReceiveDM = (message: any) => {
            setConversations(prev => {
                const existingIndex = prev.findIndex(c => c._id === message.conversationId);

                if (existingIndex === -1) {
                    fetchConversations();
                    return prev;
                }

                const updatedConversations = [...prev];
                const existingConv = updatedConversations[existingIndex];
                updatedConversations.splice(existingIndex, 1);
                updatedConversations.unshift({
                    ...existingConv,
                    lastMessage: {
                        text: message.message || (message.type === 'image' ? 'Sent an image' : 'New message'),
                        timestamp: message.timestamp || new Date().toISOString(),
                        senderId: typeof message.sender === 'object' ? message.sender._id : message.sender
                    },
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.015, duration: 0.3 }}
                className="px-3 py-0.5"
            >
                <motion.div
                    onClick={() => onSelectConversation(conv._id, conv.type)}
                    className={`
                        group relative flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer
                        transition-all duration-300
                        ${isSelected
                            ? 'bg-white/[0.06] border border-white/[0.08]'
                            : 'bg-transparent hover:bg-white/[0.03] border border-transparent'
                        }
                    `}
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                >
                    {/* Active Indicator - warm glow */}
                    <AnimatePresence>
                        {isSelected && (
                            <motion.div
                                layoutId="activeConversation"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full"
                                style={{
                                    background: 'linear-gradient(to bottom, #FF9A76, #FECDA6)',
                                    boxShadow: '0 0 12px rgba(255,154,118,0.4)',
                                }}
                                initial={{ opacity: 0, scaleY: 0 }}
                                animate={{ opacity: 1, scaleY: 1 }}
                                exit={{ opacity: 0, scaleY: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            />
                        )}
                    </AnimatePresence>

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full overflow-hidden transition-all duration-300 ${isSelected
                            ? 'ring-2 ring-orange-400/30 shadow-[0_0_12px_rgba(255,154,118,0.15)]'
                            : 'ring-1 ring-white/[0.06] group-hover:ring-white/[0.12]'
                            }`}>
                            {conv.avatar && !failedImages.has(conv._id) ? (
                                <Image
                                    src={conv.avatar}
                                    alt={conv.name}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-cover"
                                    onError={() => {
                                        setFailedImages(prev => new Set(prev).add(conv._id));
                                    }}
                                />
                            ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center">
                                    <span className="text-white/40 font-semibold text-lg group-hover:text-white/60 transition-colors">
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
                                <span className={`font-medium truncate text-[15px] transition-colors ${isSelected ? 'text-white' : 'text-white/70 group-hover:text-white/90'
                                    }`}>
                                    {conv.name}
                                </span>
                                {conv.isVerified && <VerifiedBadge size="sm" />}
                            </div>
                            {conv.lastMessage && (
                                <span className="text-[10px] text-white/25 flex-shrink-0 group-hover:text-white/35 transition-colors">
                                    {formatTime(conv.lastMessage.timestamp)}
                                </span>
                            )}
                        </div>

                        {/* Row 2: Last Message + Unread Badge */}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className={`text-sm truncate transition-colors ${isSelected ? 'text-white/40' :
                                conv.unreadCount > 0 ? 'text-white/60 font-medium' : 'text-white/25 group-hover:text-white/35'
                                }`}>
                                {conv.lastMessage?.text || 'No messages yet'}
                            </p>
                            {conv.unreadCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex-shrink-0 min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, #FF9A76, #e8725a)',
                                        boxShadow: '0 0 10px rgba(255,154,118,0.3)',
                                    }}
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
        <div className="h-full flex flex-col relative overflow-hidden"
            style={{
                background: 'rgba(6, 10, 16, 0.6)',
                borderRight: '1px solid rgba(255,255,255,0.04)',
            }}
        >
            {/* Subtle top gradient */}
            <div className="absolute top-0 left-0 w-full h-32 pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, rgba(255,154,118,0.03), transparent)' }}
            />

            {/* Header */}
            <div className="p-4 pb-3 relative z-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2.5">
                        <span className="text-white/80">Messages</span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-white/30"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.04)' }}>
                            {conversations.length}
                        </span>
                    </h2>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/40 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none transition-all"
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-hidden">
                {loading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                                <div className="w-12 h-12 rounded-full bg-white/[0.04]" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-white/[0.04] rounded w-3/4" />
                                    <div className="h-3 bg-white/[0.02] rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="w-14 h-14 mb-4 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(255,100,100,0.06)', border: '1px solid rgba(255,100,100,0.1)' }}>
                            <MessageSquare className="w-7 h-7 text-red-400/60" />
                        </div>
                        <p className="text-white/30 mb-4 text-sm">{error}</p>
                        <motion.button
                            onClick={() => fetchConversations()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-4 py-2 rounded-xl text-white/50 text-sm font-medium"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                            Retry
                        </motion.button>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-16 h-16 mb-4 rounded-full flex items-center justify-center"
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            <Sparkles className="w-8 h-8 text-white/15" />
                        </motion.div>
                        <p className="text-white/40 font-medium mb-1 text-sm">
                            {searchQuery ? 'No results found' : 'No conversations yet'}
                        </p>
                        <p className="text-xs text-white/20">
                            Start a chat or join a trip!
                        </p>
                    </div>
                ) : (
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={filteredConversations}
                        itemContent={renderConversation}
                        className="app-scrollable"
                    />
                )}
            </div>
        </div>
    );
}
