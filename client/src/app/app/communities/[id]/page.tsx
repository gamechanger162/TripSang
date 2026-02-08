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
}

export default function CommunityChatPage() {
    const { id } = useParams();
    const { data: session, status } = useSession();
    const router = useRouter();
    const { apiUrl, socketUrl } = useEnv();
    const [isMobile, setIsMobile] = useState(false);
    const [community, setCommunity] = useState<Community | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
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

        socketRef.current.emit('join_community', { communityId: id });

        socketRef.current.on('community_message', (message: Message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
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

            if (response.success) {
                setNewMessage('');
                // Message will come back via socket
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
                await communityAPI.sendMessage(id as string, {
                    message: '',
                    type: 'image',
                    imageUrl: uploadResponse.url
                });
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

    return (
        <div className="flex-1 flex flex-col h-full pb-16 md:pb-0">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-black/30 backdrop-blur-xl">
                <button
                    onClick={handleBack}
                    className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>

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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isOwn = msg.sender === currentUserId;
                    return (
                        <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] ${isOwn ? 'order-2' : ''}`}>
                                {!isOwn && (
                                    <p className="text-xs text-gray-400 mb-1">{msg.senderName}</p>
                                )}
                                <div className={`rounded-2xl px-4 py-2 ${isOwn ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white' : 'bg-white/10 text-white'}`}>
                                    {msg.type === 'image' && msg.imageUrl ? (
                                        <img src={msg.imageUrl} alt="Shared" className="max-w-full rounded-lg" />
                                    ) : (
                                        <p>{msg.message}</p>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
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
        </div>
    );
}
