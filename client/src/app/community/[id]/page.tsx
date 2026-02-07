'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { communityAPI, uploadAPI } from '@/lib/api';
import { GlassBubble, GlassInputBar, AnimatedMeshBackground } from '@/components/chat/FuturisticUI';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Settings, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';

interface CommunityMember {
    _id: string;
    name: string;
    profilePicture?: string;
}

interface Community {
    _id: string;
    name: string;
    description: string;
    category: string;
    isPrivate: boolean;
    coverImage?: string;
    memberCount: number;
    creator: CommunityMember;
    members: CommunityMember[];
}

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

export default function CommunityPage() {
    const { id } = useParams();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [community, setCommunity] = useState<Community | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isCreator, setIsCreator] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [showMembers, setShowMembers] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const currentUserId = (session?.user as any)?.id;

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated' && id) {
            loadCommunity();
            initializeSocket();
        }

        return () => {
            if (socket) {
                socket.emit('leave_community', { communityId: id });
                socket.disconnect();
            }
        };
    }, [status, id]);

    const initializeSocket = useCallback(() => {
        const token = (session?.user as any)?.accessToken || localStorage.getItem('token');
        if (!token) return;

        const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
            auth: { token }
        });

        newSocket.on('connect', () => {
            console.log('🏘️ Community socket connected');
            newSocket.emit('join_community', { communityId: id });
        });

        newSocket.on('receive_community_message', (message: Message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        });

        newSocket.on('user_typing_community', (data: { userName: string; isTyping: boolean }) => {
            // Could show typing indicator here
        });

        newSocket.on('error', (error: { message: string }) => {
            toast.error(error.message);
        });

        setSocket(newSocket);
    }, [session, id]);

    const loadCommunity = async () => {
        try {
            setLoading(true);
            const [detailsRes, messagesRes] = await Promise.all([
                communityAPI.getDetails(id as string),
                communityAPI.getMessages(id as string)
            ]);

            if (detailsRes.success) {
                setCommunity(detailsRes.community);
                setIsCreator(detailsRes.isCreator);
            } else {
                toast.error(detailsRes.message || 'Failed to load community');
                router.push('/messages');
                return;
            }

            if (messagesRes.success) {
                setMessages(messagesRes.messages || []);
            }
        } catch (error: any) {
            console.error('Error loading community:', error);
            if (error.message?.includes('Premium')) {
                toast.error('Premium membership required');
                router.push('/messages');
            } else {
                toast.error('Failed to load community');
            }
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || !socket) return;

        const messageText = inputValue.trim();
        setInputValue('');

        socket.emit('send_community_message', {
            communityId: id,
            message: messageText,
            type: 'text'
        });
    };

    const handleImageUpload = async (file: File) => {
        if (!socket) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await uploadAPI.uploadImage(formData as any);
            if (response.success && response.url) {
                socket.emit('send_community_message', {
                    communityId: id,
                    message: '',
                    type: 'image',
                    imageUrl: response.url
                });
            }
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!community) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <p className="text-gray-400">Community not found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-3 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 z-10">
                <Link
                    href="/messages"
                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-300" />
                </Link>

                <Link
                    href={`/community/${id}/settings`}
                    className="flex items-center gap-3 flex-1 min-w-0 hover:bg-gray-700/50 rounded-lg p-2 -m-2 transition-colors"
                >
                    {community.coverImage ? (
                        <Image
                            src={community.coverImage}
                            alt={community.name}
                            width={44}
                            height={44}
                            className="rounded-xl object-cover"
                        />
                    ) : (
                        <div className="w-11 h-11 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                                {community.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}

                    <div className="min-w-0">
                        <h1 className="font-semibold text-white truncate">
                            {community.name}
                        </h1>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {community.memberCount} member{community.memberCount !== 1 ? 's' : ''} • Tap for details
                        </p>
                    </div>
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowMembers(!showMembers)}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <Users className="w-5 h-5 text-gray-400" />
                    </button>
                    {isCreator && (
                        <Link
                            href={`/community/${id}/settings`}
                            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <Settings className="w-5 h-5 text-gray-400" />
                        </Link>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatedMeshBackground className="absolute inset-0 opacity-30" />

                <div className="relative h-full flex">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                                    <Users className="w-8 h-8 text-gray-500" />
                                </div>
                                <p className="text-gray-400 mb-1">No messages yet</p>
                                <p className="text-gray-500 text-sm">Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <GlassBubble
                                    key={msg._id}
                                    isOwn={msg.sender === currentUserId}
                                    senderId={msg.sender}
                                    senderName={msg.senderName}
                                    senderProfilePicture={msg.senderProfilePicture}
                                    message={msg.message}
                                    type={msg.type}
                                    imageUrl={msg.imageUrl}
                                    timestamp={msg.timestamp}
                                    showAvatar={true}
                                    index={index}
                                    enableSwipeGestures={false}
                                />
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Members Sidebar */}
                    {showMembers && (
                        <div className="w-64 bg-gray-800/90 backdrop-blur-sm border-l border-gray-700/50 overflow-y-auto">
                            <div className="p-4">
                                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                                    Members ({community.members.length})
                                </h3>
                                <div className="space-y-2">
                                    {community.members.map(member => (
                                        <Link
                                            key={member._id}
                                            href={`/profile/${member._id}`}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                                        >
                                            {member.profilePicture ? (
                                                <Image
                                                    src={member.profilePicture}
                                                    alt={member.name}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs font-medium">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm text-white truncate">{member.name}</p>
                                                {member._id === community.creator._id && (
                                                    <span className="text-xs text-amber-400">Admin</span>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Bar */}
            <div className="border-t border-gray-700/50 bg-gray-800/80 backdrop-blur-sm">
                <GlassInputBar
                    ref={inputRef}
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={handleSend}
                    onFileUpload={handleImageUpload}
                    placeholder="Message the community..."
                    disabled={sending}
                    isUploading={uploading}
                />
            </div>
        </div>
    );
}
