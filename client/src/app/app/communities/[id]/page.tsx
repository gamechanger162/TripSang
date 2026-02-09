'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Loader2, Send, Image as ImageIcon } from 'lucide-react';
import { communityAPI, uploadAPI } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { useEnv } from '@/hooks/useEnv';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

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
    creator?: {
        name: string;
        profilePicture?: string;
    };
}

export default function CommunityChatPage() {
    const { id } = useParams();
    const { data: session, status } = useSession();
    const router = useRouter();
    const { apiUrl, socketUrl } = useEnv();
    const [isMobile, setIsMobile] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [community, setCommunity] = useState<Community | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const socketRef = useRef<Socket | null>(null);
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
        socketRef.current = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 1000
        });

        socketRef.current.on('connect', () => {
            console.log('✅ Socket connected:', socketRef.current?.id);
            console.log('🔌 Joining community:', id);
            socketRef.current?.emit('join_community', { communityId: id });
        });

        socketRef.current.on('receive_community_message', (message: Message) => {
            setMessages(prev => {
                if (prev.some(m => m._id === message._id)) return prev;
                return [...prev, message];
            });
            scrollToBottom();
        });

        socketRef.current.on('error', (err: any) => {
            console.error('❌ Socket error:', err);
        });

        return () => {
            socketRef.current?.emit('leave_community', { communityId: id });
            socketRef.current?.disconnect();
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

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-900 via-gray-950 to-black">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
                    <p className="text-gray-400 text-sm">Loading community chat...</p>
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
        <div className="flex-1 flex flex-col h-full pb-16 md:pb-0 relative">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-black/30 backdrop-blur-xl">
                <button
                    onClick={handleBack}
                    className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>

                <div
                    className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setShowDetailsModal(true)}
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center overflow-hidden">
                        {community?.logo ? (
                            <img src={community.logo} alt={community.name} className="w-full h-full object-cover" />
                        ) : (
                            <Users size={20} className="text-white" />
                        )}
                    </div>

                    <div>
                        <h2 className="text-white font-semibold">{community?.name || 'Community'}</h2>
                        <p className="text-xs text-gray-400">{community?.memberCount || 0} members</p>
                    </div>
                </div>
            </div>

            <CommunityDetailsModal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                community={community}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <CommunityMessageBubble
                        key={msg._id}
                        message={msg}
                        isOwn={msg.sender === currentUserId}
                        onImageClick={handleImageClick}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/30 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <ImageIcon size={20} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="p-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                    onClick={() => {
                        setPreviewImage(null);
                        setZoomLevel(1);
                    }}
                >
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <div className="absolute top-4 right-4 z-20">
                            <button
                                onClick={() => {
                                    setPreviewImage(null);
                                    setZoomLevel(1);
                                }}
                                className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div
                            className="flex-1 w-full h-full flex items-center justify-center overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={previewImage}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain transition-transform duration-100 ease-out"
                                style={{ transform: `scale(${zoomLevel})` }}
                            />
                        </div>

                        {/* Zoom Control at Bottom */}
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
                            <div className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-2 backdrop-blur-md">
                                <span className="text-white text-xs font-medium">Zoom</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="0.1"
                                    value={zoomLevel}
                                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-teal-500"
                                />
                                <span className="text-white text-xs w-8 text-right">{Math.round(zoomLevel * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
