'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import { useEnv } from '@/hooks/useEnv';
import toast from 'react-hot-toast';
import { uploadAPI } from '@/lib/api';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { X, Map as MapIcon, Pin, Users } from 'lucide-react';
import { linkifyText } from '@/utils/linkify';
import Link from 'next/link';
import ImageViewer from './ImageViewer';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AnimatedMeshBackground,
    GlassBubble,
    GlassInputBar,
    GlassTypingIndicator,
    GlassHeader,
    PinnedBanner,
    springConfig,
} from './chat/FuturisticUI';

// Dynamic import for Map
const CollaborativeMap = dynamic(() => import('./CollaborativeMap'), {
    loading: () => <div className="h-full w-full flex items-center justify-center bg-black/50 backdrop-blur text-white/50">Loading Map...</div>,
    ssr: false
});

interface Message {
    _id?: string;
    senderId: string;
    senderName: string;
    senderProfilePicture?: string;
    message: string;
    timestamp: string;
    type?: 'text' | 'image' | 'system';
    imageUrl?: string;
    replyTo?: {
        senderName: string;
        message: string;
        type?: 'text' | 'image';
        imageUrl?: string;
    };
}

interface SquadMember {
    _id: string;
    name: string;
    profilePicture?: string;
}

interface FuturisticSquadChatProps {
    tripId: string;
    isSquadMember: boolean;
    squadMembers?: SquadMember[];
    startPoint: { lat: number; lng: number; name: string };
    endPoint?: { lat: number; lng: number; name: string };
    initialWaypoints?: any[];
}

export default function FuturisticSquadChat({
    tripId,
    isSquadMember,
    squadMembers = [],
    startPoint,
    endPoint,
    initialWaypoints = []
}: FuturisticSquadChatProps) {
    const { data: session } = useSession();
    const { socketUrl } = useEnv();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [connected, setConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [isUploading, setIsUploading] = useState(false);
    const [showMap, setShowMap] = useState(false);

    // Mention state
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionIndex, setMentionIndex] = useState(0);
    const [cursorPosition, setCursorPosition] = useState(0);

    // Reply state
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    // Pinned message
    const [pinnedMessage, setPinnedMessage] = useState<{
        messageId: string;
        message: string;
        senderName: string;
        type?: string;
    } | null>(null);

    // Image viewer
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    // Socket connection
    useEffect(() => {
        if (!isSquadMember || !session?.user?.accessToken || !socketUrl) return;

        const newSocket = io(socketUrl, {
            auth: { token: session.user.accessToken },
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            console.log('Squad chat socket connected:', newSocket.id);
            setConnected(true);
            // Join the trip room after connection is established
            newSocket.emit('join_room', { tripId });
        });
        newSocket.on('disconnect', () => setConnected(false));

        // Load chat history
        newSocket.on('message_history', (history: Message[]) => {
            setMessages(history);
        });

        // Receive pinned message on join
        newSocket.on('pinned_message', (pinned) => {
            if (pinned) setPinnedMessage(pinned);
        });

        newSocket.on('receive_message', (data: Message) => {
            setMessages(prev => [...prev, data]);
        });

        newSocket.on('typing_squad', ({ userName, isTyping }) => {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                isTyping ? newSet.add(userName) : newSet.delete(userName);
                return newSet;
            });
        });

        newSocket.on('message_pinned', (pinned) => {
            setPinnedMessage(pinned);
            toast.success(`Message pinned by ${pinned.senderName}`);
        });

        newSocket.on('message_unpinned', () => {
            setPinnedMessage(null);
        });

        setSocket(newSocket);

        return () => {
            newSocket.emit('leave_room', { tripId });
            newSocket.disconnect();
        };
    }, [tripId, isSquadMember, session, socketUrl]);

    const handleTyping = () => {
        if (!socket) return;
        socket.emit('typing_squad', { tripId, isTyping: true });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_squad', { tripId, isTyping: false });
        }, 2000);
    };

    const handleReply = (message: Message) => {
        setReplyingTo(message);
        inputRef.current?.focus();
    };

    const handlePinMessage = (message: Message) => {
        if (!socket || !message._id) return;
        socket.emit('pin_message', { tripId, messageId: message._id });
    };

    const handleUnpinMessage = () => {
        if (!socket) return;
        socket.emit('unpin_message', { tripId });
    };

    // Mention logic
    const filteredMembers = squadMembers.filter(member =>
        member._id !== session?.user?.id &&
        member.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );

    const handleMentionSelect = useCallback((member: SquadMember) => {
        const beforeMention = newMessage.slice(0, cursorPosition - mentionQuery.length - 1);
        const afterMention = newMessage.slice(cursorPosition);
        setNewMessage(`${beforeMention}@${member.name} ${afterMention}`);
        setShowMentionDropdown(false);
        setMentionQuery('');
        setMentionIndex(0);
        inputRef.current?.focus();
    }, [newMessage, cursorPosition, mentionQuery]);

    const handleInputChange = (value: string) => {
        setNewMessage(value);
        handleTyping();

        // Mention detection
        const textBeforeCursor = value.slice(0, value.length);
        const atIndex = textBeforeCursor.lastIndexOf('@');
        if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ')) {
            const query = textBeforeCursor.slice(atIndex + 1);
            if (!query.includes(' ') && squadMembers.length > 0) {
                setMentionQuery(query);
                setShowMentionDropdown(true);
                setCursorPosition(value.length);
                return;
            }
        }
        setShowMentionDropdown(false);
    };

    const sendMessage = () => {
        if (!newMessage.trim() || !socket || !session?.user) return;

        const messageData = {
            tripId,
            message: newMessage.trim(),
            senderName: session.user.name,
            senderProfilePicture: session.user.image,
            type: 'text' as const,
            replyTo: replyingTo ? replyingTo._id : undefined,
        };

        socket.emit('send_message', messageData);
        setNewMessage('');
        setReplyingTo(null);
    };

    const handleFileUpload = async (file: File) => {
        if (!socket || !session?.user) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be under 5MB');
            return;
        }

        try {
            setIsUploading(true);
            const response = await uploadAPI.uploadFile(file);
            if (response.success) {
                socket.emit('send_message', {
                    tripId,
                    message: 'Shared an image',
                    senderName: session.user.name,
                    senderProfilePicture: session.user.image,
                    type: 'image',
                    imageUrl: response.url,
                });
            }
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    // Render mentions with highlights
    const renderMessageWithMentions = (text: string) => {
        const parts = text.split(/(@\w+)/g);
        return (
            <>
                {parts.map((part, i) => {
                    if (part.startsWith('@')) {
                        const mentionedMember = squadMembers.find(m => `@${m.name}` === part);
                        return (
                            <span key={i} className={`font-semibold ${mentionedMember ? 'text-cyan-300' : 'text-teal-300'}`}>
                                {part}
                            </span>
                        );
                    }
                    // linkifyText returns array, so wrap it
                    return <span key={i}>{linkifyText(part)}</span>;
                })}
            </>
        );
    };

    // Non-member state
    if (!isSquadMember) {
        return (
            <div className="relative w-full h-[calc(100vh-200px)] min-h-[300px] rounded-2xl overflow-hidden">
                <AnimatedMeshBackground />
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center p-8 rounded-3xl max-w-sm mx-4"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-orange-500 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Join Squad to Chat</h3>
                        <p className="text-white/60 text-sm mb-6">
                            Connect with travelers, share plans, and get excited together!
                        </p>
                        <button
                            onClick={() => {
                                const joinBtn = document.querySelector('[data-join-squad]');
                                if (joinBtn) {
                                    joinBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    (joinBtn as HTMLElement).classList.add('ring-4', 'ring-teal-500/50');
                                    setTimeout(() => (joinBtn as HTMLElement).classList.remove('ring-4', 'ring-teal-500/50'), 2000);
                                }
                            }}
                            className="px-8 py-3 bg-gradient-to-r from-teal-500 to-orange-500 text-white rounded-2xl font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all hover:-translate-y-1"
                        >
                            Join This Squad
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[calc(100vh-200px)] min-h-[300px] rounded-2xl overflow-hidden flex flex-col">
            <AnimatedMeshBackground />

            {/* Header */}
            <GlassHeader
                title="Squad Chat"
                subtitle={`${squadMembers.length} members • ${connected ? 'Live' : 'Connecting...'}`}
                avatarIcon={<Users className="w-5 h-5 text-white" />}
                isConnected={connected}
                rightContent={
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowMap(!showMap)}
                        className="p-3 rounded-2xl hover:bg-white/10 transition-colors"
                        style={{
                            background: showMap ? 'rgba(0,128,128,0.3)' : 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <MapIcon className="w-5 h-5 text-white/70" />
                    </motion.button>
                }
            />

            {/* Map Overlay */}
            <AnimatePresence>
                {showMap && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20"
                    >
                        <div className="absolute top-4 right-4 z-[1000]">
                            <button
                                onClick={() => setShowMap(false)}
                                className="p-2 rounded-full bg-black/50 backdrop-blur hover:bg-black/70 transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <CollaborativeMap
                            tripId={tripId}
                            initialWaypoints={initialWaypoints}
                            startPoint={startPoint}
                            endPoint={endPoint}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages */}
            <div
                className="relative z-10 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 px-2"
                style={{
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)',
                }}
            >
                {/* Pinned message */}
                <AnimatePresence>
                    {pinnedMessage && (
                        <PinnedBanner
                            senderName={pinnedMessage.senderName}
                            message={pinnedMessage.message}
                            type={pinnedMessage.type}
                            onUnpin={handleUnpinMessage}
                        />
                    )}
                </AnimatePresence>

                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/20 to-orange-500/20 flex items-center justify-center mb-4 backdrop-blur"
                        >
                            <span className="text-4xl">💬</span>
                        </motion.div>
                        <p className="text-lg font-semibold text-white/80 mb-1">Quiet in here...</p>
                        <p className="text-sm text-white/40">Break the ice and start planning! 🚀</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msg, index) => {
                            if (msg.type === 'system') {
                                return (
                                    <GlassBubble
                                        key={msg._id || index}
                                        isOwn={false}
                                        message={msg.message}
                                        timestamp={msg.timestamp}
                                        type="system"
                                        index={index}
                                    />
                                );
                            }

                            const isOwnMessage = msg.senderName === session?.user?.name;
                            const showAvatar = index === 0 || messages[index - 1]?.senderName !== msg.senderName || messages[index - 1]?.type === 'system';

                            return (
                                <GlassBubble
                                    key={msg._id || index}
                                    isOwn={isOwnMessage}
                                    senderId={msg.senderId}
                                    senderName={msg.senderName}
                                    senderProfilePicture={msg.senderProfilePicture}
                                    message={msg.message}
                                    timestamp={msg.timestamp}
                                    type={msg.type}
                                    imageUrl={msg.imageUrl}
                                    replyTo={msg.replyTo}
                                    isPinned={pinnedMessage?.messageId === msg._id}
                                    showAvatar={showAvatar}
                                    onReply={() => handleReply(msg)}
                                    onPin={() => handlePinMessage(msg)}
                                    onImageClick={setViewingImage}
                                    enableSwipeGestures={true}
                                    index={index}
                                    renderMessage={renderMessageWithMentions}
                                />
                            );
                        })}
                    </AnimatePresence>
                )}

                {/* Typing indicator */}
                <AnimatePresence>
                    {typingUsers.size > 0 && (
                        <GlassTypingIndicator names={Array.from(typingUsers)} />
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="relative z-20">
                <GlassInputBar
                    ref={inputRef}
                    value={newMessage}
                    onChange={handleInputChange}
                    onSend={sendMessage}
                    onFileUpload={handleFileUpload}
                    placeholder="Type your message..."
                    disabled={!connected}
                    isUploading={isUploading}
                    replyingTo={replyingTo ? { senderName: replyingTo.senderName, message: replyingTo.message, type: replyingTo.type } : null}
                    onCancelReply={() => setReplyingTo(null)}
                >
                    {/* Mention Dropdown */}
                    {showMentionDropdown && filteredMembers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-4 right-4 mb-2 rounded-2xl overflow-hidden"
                            style={{
                                background: 'rgba(0,0,0,0.8)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <div className="p-2 text-[10px] uppercase tracking-wider font-semibold text-white/40 border-b border-white/10">
                                Mention Member
                            </div>
                            {filteredMembers.map((member, index) => (
                                <button
                                    key={member._id}
                                    onClick={() => handleMentionSelect(member)}
                                    className={`w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-white/10 transition-colors ${index === mentionIndex ? 'bg-teal-500/20' : ''}`}
                                >
                                    {member.profilePicture ? (
                                        <Image
                                            src={member.profilePicture}
                                            alt={member.name}
                                            width={24}
                                            height={24}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-orange-400 flex items-center justify-center text-white text-[10px] font-bold">
                                            {member.name[0]}
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-white/80">{member.name}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </GlassInputBar>
            </div>

            {/* Image Viewer */}
            <ImageViewer
                imageUrl={viewingImage || ''}
                isOpen={!!viewingImage}
                onClose={() => setViewingImage(null)}
                alt="Chat image"
            />
        </div>
    );
}
