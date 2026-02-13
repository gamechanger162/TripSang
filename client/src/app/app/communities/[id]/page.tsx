'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Loader2, Send, Image as ImageIcon, X, MoreVertical, VolumeX, Plus, Minus, Shield } from 'lucide-react';
import { communityAPI, uploadAPI } from '@/lib/api';
import { socketManager } from '@/lib/socketManager';
import { useEnv } from '@/hooks/useEnv';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const CommunityDetailsModal = dynamic(() => import('@/components/CommunityDetailsModal'), {
    ssr: false
});

import CommunityMessageBubble from '@/components/chat/CommunityMessageBubble';

interface Message {
    _id: string;
    sender: string;
    senderName: string;
    senderProfilePicture?: string;
    message: string;
    type: 'text' | 'image';
    imageUrl?: string;
    timestamp: string;
}

interface Community {
    _id: string;
    name: string;
    logo?: string;
    memberCount: number;
    description?: string;
    coverImage?: string;
    category?: string;
    isPrivate?: boolean;
    adminOnlyMessages?: boolean;
    creator?: {
        _id?: string;
        name: string;
        profilePicture?: string;
    };
    members?: any[];
}

export default function CommunityChatPage() {
    const { id } = useParams();
    const { data: session, status } = useSession();
    const router = useRouter();
    const { apiUrl, socketUrl } = useEnv();
    const [isMobile, setIsMobile] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [isMember, setIsMember] = useState(true); // assume member until loaded
    const [isCreator, setIsCreator] = useState(false);
    const [adminOnlyMessages, setAdminOnlyMessages] = useState(false);
    const [community, setCommunity] = useState<Community | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentUserId = (session?.user as any)?.id;

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin?callbackUrl=/app/communities');
        }
    }, [status, router]);

    // Load community and messages
    const loadCommunity = useCallback(async () => {
        try {
            const response = await communityAPI.getById(id as string);
            if (response.success) {
                setCommunity(response.community);
                setIsMember(response.isMember ?? false);
                setIsCreator(response.isCreator ?? false);
                setAdminOnlyMessages(response.community?.adminOnlyMessages ?? false);
                // Auto-show details modal for non-members
                if (!response.isMember) {
                    setShowDetailsModal(true);
                }
            }
        } catch (error) {
            console.error('Failed to load community:', error);
            toast.error('Failed to load community');
        }
    }, [id]);

    const loadMessages = useCallback(async () => {
        try {
            const response = await communityAPI.getMessages(id as string);
            if (response.success) {
                setMessages(response.messages || []);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (status === 'authenticated' && id) {
            loadCommunity();
            loadMessages();
        }
    }, [status, id, loadCommunity, loadMessages]);

    // Socket connection
    useEffect(() => {
        if (!socketUrl || !id || status !== 'authenticated') return;

        const token = (session?.user as any)?.accessToken || localStorage.getItem('token');
        socketManager.connect(socketUrl, token);

        const handleConnect = () => {
            socketManager.emit('join_community', { communityId: id });
        };

        const handleReceiveMessage = (message: Message) => {
            setMessages(prev => {
                if (prev.some(m => m._id === message._id)) return prev;
                return [...prev, message];
            });
            scrollToBottom();
        };

        const handleMessageDeleted = (data: { messageId: string }) => {
            if (data?.messageId) {
                setMessages(prev => prev.filter(m => m._id !== data.messageId));
            }
        };

        const handleError = (err: any) => {
            console.error('Socket error:', err);
        };

        // If already connected, join room immediately
        if (socketManager.isSocketConnected()) {
            socketManager.emit('join_community', { communityId: id });
        }

        socketManager.on('connect', handleConnect);
        socketManager.on('receive_community_message', handleReceiveMessage);
        socketManager.on('message_deleted', handleMessageDeleted);
        socketManager.on('error', handleError);

        return () => {
            socketManager.emit('leave_community', { communityId: id });
            socketManager.off('connect', handleConnect);
            socketManager.off('receive_community_message', handleReceiveMessage);
            socketManager.off('message_deleted', handleMessageDeleted);
            socketManager.off('error', handleError);
        };
    }, [socketUrl, id, status, session?.user?.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const response = await communityAPI.sendMessage(id as string, {
                message: newMessage,
                type: 'text'
            });

            if (response.success && response.message) {
                setNewMessage('');
                setReplyTo(null);
                setMessages(prev => {
                    if (prev.some(m => m._id === response.message._id)) return prev;
                    return [...prev, response.message];
                });
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const uploadResponse = await uploadAPI.uploadFile(file);
            if (uploadResponse.success && uploadResponse.url) {
                const response = await communityAPI.sendMessage(id as string, {
                    message: '',
                    type: 'image',
                    imageUrl: uploadResponse.url
                });

                if (response.success && response.message) {
                    setMessages(prev => {
                        if (prev.some(m => m._id === response.message._id)) return prev;
                        return [...prev, response.message];
                    });
                }
            }
        } catch (error) {
            console.error('Failed to upload image:', error);
            toast.error('Failed to send image');
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        setMessages(prev => prev.filter(m => m._id !== messageId));

        try {
            await communityAPI.deleteMessage(id as string, messageId);
        } catch (error) {
            console.error('Failed to delete message:', error);
            toast.error('Failed to delete message');
            loadMessages();
        }
    };

    // Determine message grouping
    const getGroupPosition = (index: number): 'single' | 'top' | 'middle' | 'bottom' => {
        const msg = messages[index];
        const prev = index > 0 ? messages[index - 1] : null;
        const next = index < messages.length - 1 ? messages[index + 1] : null;
        const sameSenderAsPrev = prev && prev.sender === msg.sender;
        const sameSenderAsNext = next && next.sender === msg.sender;

        if (sameSenderAsPrev && sameSenderAsNext) return 'middle';
        if (sameSenderAsPrev) return 'bottom';
        if (sameSenderAsNext) return 'top';
        return 'single';
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-[#000a1f]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 animate-pulse" />
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-cyan-500/50"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                    <p className="text-zinc-400 text-sm">Loading community chat...</p>
                </motion.div>
            </div>
        );
    }

    if (!session) return null;

    const handleBack = () => {
        router.push('/app/communities');
    };

    const handleImageClick = (imageUrl: string) => {
        setPreviewImage(imageUrl);
        setZoomLevel(1);
    };

    return (
        <div className="flex flex-col flex-1 h-full w-full overflow-hidden bg-[#000a1f]">

            {/* Header — matching Squad Chat */}
            <div className="h-14 sm:h-16 px-3 sm:px-6 border-b border-white/5 flex items-center gap-3 bg-zinc-900/30 backdrop-blur-md z-50 shrink-0">
                {isMobile && (
                    <button
                        onClick={handleBack}
                        className="p-1.5 -ml-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors md:hidden"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                <div
                    className="flex-1 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
                    onClick={() => setShowDetailsModal(true)}
                >
                    <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-tr from-violet-500 to-fuchsia-500 p-0.5 shrink-0">
                        {community?.logo ? (
                            <Image
                                src={community.logo}
                                alt={community.name || ''}
                                fill
                                sizes="40px"
                                className="object-cover rounded-full border-2 border-zinc-900"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-bold text-white text-sm">
                                {community?.name?.charAt(0) || '#'}
                            </div>
                        )}
                    </div>

                    <div className="min-w-0">
                        <h2 className="font-semibold text-white text-sm sm:text-base truncate">
                            {community?.name || 'Community'}
                        </h2>
                        <p className="text-[11px] sm:text-xs text-zinc-500 truncate">
                            {community?.memberCount || 0} members
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 relative">
                    <div className="relative">
                        <button
                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                        >
                            <MoreVertical size={20} />
                        </button>

                        <AnimatePresence>
                            {showOptionsMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowOptionsMenu(false)}
                                    />
                                    <motion.div
                                        className="absolute right-0 top-full mt-2 w-56 bg-zinc-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden py-1"
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    >
                                        <button
                                            className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 transition-colors flex items-center gap-3"
                                            onClick={() => {
                                                setShowOptionsMenu(false);
                                                setShowDetailsModal(true);
                                            }}
                                        >
                                            <Users size={16} className="text-zinc-400" />
                                            Community Details
                                        </button>
                                        <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 transition-colors flex items-center gap-3">
                                            <VolumeX size={16} className="text-zinc-400" />
                                            Mute Notifications
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <CommunityDetailsModal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                community={community}
                preventClose={!isMember}
                onJoinSuccess={() => {
                    setShowDetailsModal(false);
                    setIsMember(true);
                    loadCommunity();
                    loadMessages();
                }}
            />

            {/* Messages — matching Squad Chat */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 sm:px-6 sm:py-4 relative bg-transparent">
                <div className="space-y-0">
                    {messages.map((msg, index) => (
                        <CommunityMessageBubble
                            key={msg._id}
                            message={msg}
                            isOwn={msg.sender === currentUserId}
                            onImageClick={handleImageClick}
                            onDelete={() => handleDeleteMessage(msg._id)}
                            onReply={() => setReplyTo(msg)}
                            isMobile={isMobile}
                            groupPosition={getGroupPosition(index)}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area — matching Squad Chat */}
            {adminOnlyMessages && !isCreator ? (
                /* Admin-only banner */
                <div className="bg-zinc-900/50 backdrop-blur-md border-t border-white/5 relative z-20 shrink-0">
                    <div className="px-4 py-3 flex items-center justify-center gap-2 text-zinc-500 text-sm">
                        <Shield size={16} className="text-amber-500/60" />
                        <span>Only admins can send messages in this community</span>
                    </div>
                </div>
            ) : (
                <div className="bg-zinc-900/50 backdrop-blur-md border-t border-white/5 relative z-20 shrink-0">
                    {/* Reply Preview */}
                    <AnimatePresence>
                        {replyTo && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex items-center gap-2 px-4 pt-2.5 pb-1">
                                    <div className="flex-1 border-l-2 border-cyan-500 pl-3 py-1">
                                        <p className="text-[11px] font-semibold text-cyan-400">
                                            Replying to {replyTo.senderName}
                                        </p>
                                        <p className="text-xs text-zinc-400 truncate">
                                            {replyTo.message || (replyTo.type === 'image' ? '📷 Image' : '')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setReplyTo(null)}
                                        className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Input Row */}
                    <div
                        className="px-3 py-2 sm:px-4 sm:py-3 cursor-text"
                        onClick={() => document.querySelector<HTMLInputElement>('.community-message-input')?.focus()}
                    >
                        <div className="flex items-end gap-2 bg-zinc-950/50 p-2 rounded-2xl border border-white/5 ring-1 ring-white/5 focus-within:ring-cyan-500/30 transition-all">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <button
                                className="p-2 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                            >
                                <ImageIcon size={20} />
                            </button>

                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                className="community-message-input flex-1 bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none py-2"
                            />

                            <button
                                className={`p-2 rounded-xl transition-all ${newMessage.trim() || sending
                                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                                    : 'bg-zinc-800 text-zinc-600'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendMessage();
                                }}
                                disabled={!newMessage.trim() || sending}
                            >
                                {sending ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                                ) : (
                                    <Send size={18} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal — matching Squad Chat */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
                        onClick={() => { setPreviewImage(null); setZoomLevel(1); }}
                    >
                        <button
                            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-[60]"
                            onClick={() => { setPreviewImage(null); setZoomLevel(1); }}
                        >
                            <X size={28} />
                        </button>

                        {/* Zoom Controls */}
                        {/* Zoom Controls */}
                        <div className="absolute bottom-24 right-4 z-[60] flex flex-col items-center gap-3 bg-zinc-900/80 backdrop-blur-md p-3 rounded-full border border-white/10 shadow-2xl">
                            <button
                                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-all"
                                onClick={(e) => { e.stopPropagation(); setZoomLevel(Math.min(5, zoomLevel + 0.5)); }}
                            >
                                <Plus size={16} />
                            </button>

                            <div className="relative h-32 w-2 bg-zinc-700/50 rounded-full overflow-hidden">
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-teal-500 rounded-full w-full"
                                    style={{ height: `${((zoomLevel - 1) / 4) * 100}%` }}
                                />
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    step="0.1"
                                    value={zoomLevel}
                                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                                />
                            </div>

                            <button
                                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-all"
                                onClick={(e) => { e.stopPropagation(); setZoomLevel(Math.max(1, zoomLevel - 0.5)); }}
                            >
                                <Minus size={16} />
                            </button>

                            <span className="text-white/90 text-[10px] font-medium w-full text-center">{Math.round(zoomLevel)}x</span>
                        </div>

                        <motion.div
                            className="w-full h-full flex items-center justify-center overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.img
                                src={previewImage}
                                alt="Full size"
                                className="max-w-full max-h-full object-contain"
                                style={{
                                    cursor: zoomLevel > 1 ? 'grab' : 'default',
                                    touchAction: 'none'
                                }}
                                animate={{ scale: zoomLevel }}
                                drag={zoomLevel > 1}
                                dragConstraints={{ left: -100 * zoomLevel, right: 100 * zoomLevel, top: -100 * zoomLevel, bottom: 100 * zoomLevel }}
                                dragElastic={0.1}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
