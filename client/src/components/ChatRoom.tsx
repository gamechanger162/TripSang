'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import { useEnv } from '@/hooks/useEnv';
import toast from 'react-hot-toast';
import { uploadAPI } from '@/lib/api';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { X, Map as MapIcon, Pin } from 'lucide-react';
import { linkifyText } from '@/utils/linkify';
import Link from 'next/link';
import ImageViewer from './ImageViewer';
import MeshBackground from '@/components/app/ui/MeshBackground';

// Dynamic import for Map to avoid SSR issues
const CollaborativeMap = dynamic(() => import('./CollaborativeMap'), {
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-dark-800">Loading Map...</div>,
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

interface ChatRoomProps {
    tripId: string;
    isSquadMember: boolean;
    squadMembers?: SquadMember[];
    startPoint: { lat: number; lng: number; name: string };
    endPoint?: { lat: number; lng: number; name: string };
    initialWaypoints?: any[];
    onJoin?: () => void;
}

import { useSquads } from '@/contexts/SquadContext';

export default function ChatRoom({ tripId, isSquadMember, squadMembers = [], startPoint, endPoint, initialWaypoints = [], onJoin }: ChatRoomProps) {
    const { data: session } = useSession();
    const { markAsRead } = useSquads(); // Use context

    // Mark as read on enlist
    useEffect(() => {
        if (tripId) {
            markAsRead(tripId);
        }
    }, [tripId, markAsRead]);

    const { socketUrl } = useEnv();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [connected, setConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [isUploading, setIsUploading] = useState(false);
    const [showMap, setShowMap] = useState(false); // Map Toggle State

    // Mention state
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionIndex, setMentionIndex] = useState(0);
    const [cursorPosition, setCursorPosition] = useState(0);

    // Reply state
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    // Pinned message state
    const [pinnedMessage, setPinnedMessage] = useState<{
        messageId: string;
        message: string;
        senderName: string;
        type?: string;
        imageUrl?: string;
    } | null>(null);

    // Image viewer state
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    // Initialize Socket.io connection
    useEffect(() => {
        if (!isSquadMember || !session?.user?.accessToken) {
            return;
        }

        // Create socket connection
        const newSocket = io(socketUrl, {
            auth: {
                token: session.user.accessToken,
            },
            transports: ['websocket', 'polling'],
        });

        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setConnected(true);

            // Join the trip room
            newSocket.emit('join_room', { tripId });
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            // toast.error('Failed to connect to chat'); // Suppress to avoid spam
        });

        // Listen for messages
        newSocket.on('receive_message', (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        // Listen for message history
        newSocket.on('message_history', (history: Message[]) => {
            setMessages(history);
        });

        // Listen for user joined
        newSocket.on('user_joined', (data: { userName: string }) => {
            setMessages(prev => [...prev, {
                senderId: 'system',
                senderName: 'System',
                message: `${data.userName} joined the squad`,
                timestamp: new Date().toISOString(),
                type: 'system'
            }]);
        });

        // Listen for user left
        newSocket.on('user_left', (data: { userName: string }) => {
            setMessages(prev => [...prev, {
                senderId: 'system',
                senderName: 'System',
                message: `${data.userName} left the squad`,
                timestamp: new Date().toISOString(),
                type: 'system'
            }]);
        });

        // Listen for typing events
        newSocket.on('user_typing_squad', (data: { userId: string, userName: string, isTyping: boolean }) => {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                if (data.isTyping) {
                    newSet.add(data.userName);
                } else {
                    newSet.delete(data.userName);
                }
                return newSet;
            });
        });

        // Listen for pinned message events
        newSocket.on('message_pinned', (data: {
            messageId: string;
            message: string;
            senderName: string;
            type?: string;
            imageUrl?: string;
            pinnedBy: string;
        }) => {
            setPinnedMessage(data);
            toast.success(`${data.pinnedBy} pinned a message`);
        });

        newSocket.on('message_unpinned', (data: { unpinnedBy: string }) => {
            setPinnedMessage(null);
            toast.success(`${data.unpinnedBy} unpinned the message`);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            newSocket.emit('leave_room', { tripId });
            newSocket.disconnect();
        };
    }, [tripId, isSquadMember, session?.user?.id, socketUrl]);

    const handleTyping = () => {
        if (!socket) return;

        socket.emit('typing_squad', { tripId, isTyping: true });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

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

    // Filter squad members for mentions (exclude current user)
    const filteredMembers = squadMembers.filter(member =>
        member._id !== session?.user?.id &&
        member.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );

    // Handle mention selection
    const handleMentionSelect = useCallback((member: SquadMember) => {
        const beforeMention = newMessage.slice(0, cursorPosition - mentionQuery.length - 1);
        const afterMention = newMessage.slice(cursorPosition);
        const newText = `${beforeMention}@${member.name} ${afterMention}`;
        setNewMessage(newText);
        setShowMentionDropdown(false);
        setMentionQuery('');
        setMentionIndex(0);
        inputRef.current?.focus();
    }, [newMessage, cursorPosition, mentionQuery]);

    // Handle input change with mention detection
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const selectionStart = e.target.selectionStart || 0;
        setNewMessage(value);
        setCursorPosition(selectionStart);
        handleTyping();

        // Check for @ mention trigger
        const textBeforeCursor = value.slice(0, selectionStart);
        const atIndex = textBeforeCursor.lastIndexOf('@');

        if (atIndex !== -1) {
            const charBeforeAt = textBeforeCursor[atIndex - 1];
            // Only trigger if @ is at start or after a space
            if (atIndex === 0 || charBeforeAt === ' ') {
                const query = textBeforeCursor.slice(atIndex + 1);
                // Show dropdown if query doesn't contain space (still typing name)
                if (!query.includes(' ') && squadMembers.length > 0) {
                    setMentionQuery(query);
                    setShowMentionDropdown(true);
                    setMentionIndex(0);
                    return;
                }
            }
        }
        setShowMentionDropdown(false);
    };

    // Handle keyboard navigation in mention dropdown
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showMentionDropdown || filteredMembers.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setMentionIndex(prev => (prev + 1) % filteredMembers.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setMentionIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
                break;
            case 'Enter':
                if (showMentionDropdown) {
                    e.preventDefault();
                    handleMentionSelect(filteredMembers[mentionIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setShowMentionDropdown(false);
                break;
        }
    };

    // Render message with highlighted mentions and clickable links
    const renderMessageWithMentions = (text: string) => {
        // First, process mentions
        const mentionRegex = /@(\w+)/g;
        const parts: (string | JSX.Element)[] = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(text)) !== null) {
            const username = match[1];
            const index = match.index;

            // Add text before mention (with link detection)
            if (index > lastIndex) {
                const beforeText = text.substring(lastIndex, index);
                parts.push(...linkifyText(beforeText));
            }

            // Check if mentioned user is in squad
            const mentionedUser = squadMembers.find(
                member => member.name.toLowerCase() === username.toLowerCase()
            );

            // Add mention
            parts.push(
                <span
                    key={`mention-${index}`}
                    className={`font-semibold ${mentionedUser ? 'text-primary-400' : 'text-gray-300'
                        }`}
                >
                    @{username}
                </span>
            );

            lastIndex = index + match[0].length;
        }

        // Add remaining text (with link detection)
        if (lastIndex < text.length) {
            const remainingText = text.substring(lastIndex);
            parts.push(...linkifyText(remainingText));
        }

        // If no mentions, just linkify the whole text
        return parts.length > 0 ? parts : linkifyText(text);
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || !socket || !session) {
            return;
        }

        const messageData = {
            tripId,
            message: newMessage.trim(),
            senderName: session.user.name || 'Anonymous',
            senderProfilePicture: session.user.image,
            type: 'text',
            replyTo: replyingTo ? replyingTo._id : undefined
        };

        socket.emit('send_message', messageData);
        setNewMessage('');
        setReplyingTo(null);
        socket.emit('typing_squad', { tripId, isTyping: false });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !socket || !session) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        try {
            setIsUploading(true);
            const response = await uploadAPI.uploadFile(file);

            if (response.success) {
                const messageData = {
                    tripId,
                    message: 'Shared an image',
                    imageUrl: response.url,
                    senderName: session.user.name || 'Anonymous',
                    senderProfilePicture: session.user.image,
                    type: 'image'
                };
                socket.emit('send_message', messageData);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to send image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (!isSquadMember) {
        return (
            <div className="relative h-[650px] overflow-hidden rounded-3xl bg-[#000a1f] border border-white/10 p-10 text-center flex flex-col justify-center items-center">
                <MeshBackground />

                <div className="relative z-10 max-w-sm mx-auto p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                    {/* Lock icon with premium styling */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(6,182,212,0.2)] rotate-3 hover:rotate-0 transition-transform duration-500 group">
                        <svg className="w-10 h-10 text-cyan-400/80 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent mb-3 tracking-tight">
                        Join Squad to Access Chat
                    </h3>
                    <p className="text-cyan-200/60 text-sm leading-relaxed mb-8">
                        Connect with fellow travelers, share coordinates, and synchronize your plans.
                    </p>

                    {/* Join Squad Button */}
                    <button
                        onClick={() => {
                            if (onJoin) {
                                onJoin();
                            } else {
                                // Scroll to the join button section on the trip page
                                const joinBtn = document.querySelector('[data-join-squad]');
                                if (joinBtn) {
                                    joinBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    (joinBtn as HTMLElement).classList.add('ring-4', 'ring-cyan-500/50');
                                    setTimeout(() => (joinBtn as HTMLElement).classList.remove('ring-4', 'ring-cyan-500/50'), 2000);
                                }
                            }
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:-translate-y-1 group"
                    >
                        <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Join This Squad
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card relative flex flex-col h-[650px] p-0 overflow-hidden bg-[#000a1f] backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl">
            <MeshBackground />
            {/* Decorated Header */}
            <div className="relative z-10 p-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md sticky top-0 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                            <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center overflow-hidden">
                                <span className="text-xl">🚀</span>
                            </div>
                        </div>
                        {connected && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-black rounded-full shadow-[0_0_8px_#10b981]"></span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-wide">Squad Chat</h3>
                        <div className="flex items-center text-xs font-medium text-cyan-200/50">
                            {squadMembers.length} members • {connected ? <span className="text-emerald-400 ml-1">Live</span> : 'Connecting...'}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowMap(!showMap)}
                    className="group relative p-3 bg-white/5 rounded-2xl hover:bg-cyan-500/10 text-cyan-400/70 hover:text-cyan-400 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    title="Toggle Map"
                >
                    <MapIcon size={20} className="relative z-10" />
                </button>
            </div>

            {/* Map Drawer/Overlay */}
            <div
                className={`absolute inset-0 z-20 bg-white dark:bg-dark-800 transition-transform duration-300 transform ${showMap ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <div className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-dark-700/90 backdrop-blur rounded-full shadow-lg p-1">
                    <button
                        onClick={() => setShowMap(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>
                {/* Render map only when visible or mounted to save resources, but keeping it mounted preserves state */}
                {showMap && (
                    <CollaborativeMap
                        tripId={tripId}
                        initialWaypoints={initialWaypoints}
                        startPoint={startPoint}
                        endPoint={endPoint}
                    />
                )}
            </div>

            {/* Messages Area */}
            <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

                {/* Pinned Message Banner */}
                {pinnedMessage && (
                    <div className="sticky top-0 z-20 mx-auto max-w-md bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 rounded-xl p-3 shadow-lg mb-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <Pin size={16} className="text-amber-400 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-amber-300">{pinnedMessage.senderName}</p>
                                    <p className="text-sm text-amber-100/80 truncate">
                                        {pinnedMessage.type === 'image' ? '📷 Image' : pinnedMessage.message}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleUnpinMessage}
                                className="p-1.5 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/20 rounded-full transition-colors flex-shrink-0"
                                title="Unpin message"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-2xl border border-white/5 animate-float">
                            <span className="text-4xl">💭</span>
                        </div>
                        <p className="text-xl font-bold text-white mb-2 tracking-wide">Quiet in here...</p>
                        <p className="text-sm text-cyan-200/50">Break the ice and start planning! 🚀</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        // System message
                        if (msg.type === 'system') {
                            return (
                                <div key={index} className="flex justify-center my-6 relative z-10">
                                    <span className="bg-white/5 backdrop-blur-sm text-cyan-200/40 text-[10px] uppercase tracking-widest font-medium py-1.5 px-4 rounded-full border border-white/5">
                                        {msg.message}
                                    </span>
                                </div>
                            );
                        }

                        const isOwnMessage = msg.senderName === session?.user?.name;
                        const showAvatar = index === 0 || messages[index - 1].senderName !== msg.senderName || messages[index - 1].type === 'system';

                        return (
                            <div key={msg._id || index} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group relative z-10`}>
                                {!isOwnMessage && (
                                    <Link
                                        href={`/profile/${msg.senderId}`}
                                        className={`mr-3 w-8 h-8 flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'} self-end mb-1 cursor-pointer hover:opacity-80 transition-opacity`}
                                    >
                                        {msg.senderProfilePicture ? (
                                            <Image
                                                src={msg.senderProfilePicture}
                                                alt={msg.senderName}
                                                width={32}
                                                height={32}
                                                className="w-full h-full rounded-full object-cover shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/20"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-900 to-blue-900 flex items-center justify-center text-white text-xs font-bold border border-white/10">
                                                {msg.senderName[0]}
                                            </div>
                                        )}
                                    </Link>
                                )}

                                {/* Sender Name (only if first in group) */}
                                {!isOwnMessage && showAvatar && (
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-cyan-400 ml-1 mb-1 shadow-black drop-shadow-md">{msg.senderName}</span>
                                )}

                                {/* Message Bubble */}
                                <div
                                    className={`px-5 py-3 shadow-lg backdrop-blur-md transition-all duration-300 ${isOwnMessage
                                        ? 'bg-gradient-to-br from-cyan-600/20 to-blue-600/20 text-white rounded-2xl rounded-tr-sm border border-cyan-500/30 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                        : 'bg-white/5 text-gray-200 rounded-2xl rounded-tl-sm border border-white/10 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {/* Quoted Message */}
                                    {msg.replyTo && (
                                        <div
                                            className={`mb-2 p-2 rounded-lg text-xs border-l-2 cursor-pointer ${isOwnMessage
                                                ? 'bg-black/20 border-cyan-400/50 text-cyan-100/90'
                                                : 'bg-black/20 border-white/30 text-gray-300'
                                                }`}
                                        >
                                            <p className="font-bold mb-0.5">{msg.replyTo.senderName}</p>
                                            <p className="truncate opacity-80">
                                                {msg.replyTo.type === 'image' ? '📷 Image' : msg.replyTo.message}
                                            </p>
                                        </div>
                                    )}

                                    {msg.type === 'image' && msg.imageUrl ? (
                                        <div
                                            className="-m-2 rounded-xl overflow-hidden cursor-pointer relative group-image"
                                            onClick={() => setViewingImage(msg.imageUrl!)}
                                        >
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-image-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                                <span className="text-white text-xs font-medium px-3 py-1 bg-black/50 rounded-full backdrop-blur-md border border-white/10">View</span>
                                            </div>
                                            <Image
                                                src={msg.imageUrl}
                                                alt="Shared image"
                                                width={300}
                                                height={225}
                                                unoptimized
                                                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    ) : (
                                        <p className={`text-sm break-words whitespace-pre-wrap leading-relaxed tracking-wide font-light ${isOwnMessage ? 'text-cyan-50' : 'text-gray-200'}`}>{renderMessageWithMentions(msg.message)}</p>
                                    )}
                                </div>

                                {/* Message Footer & Actions */}
                                <div className={`text-[10px] mt-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isOwnMessage ? 'mr-1 flex-row-reverse' : 'ml-1'}`}>
                                    <span className="text-cyan-200/40 mx-2">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                                    <div className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-0.5 backdrop-blur-md border border-white/5">
                                        {/* Reply Button */}
                                        <button
                                            onClick={() => handleReply(msg)}
                                            className="text-gray-400 hover:text-cyan-400 transition-colors p-1 rounded-full hover:bg-white/5"
                                            title="Reply"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                            </svg>
                                        </button>

                                        {/* Pin Button */}
                                        <button
                                            onClick={() => handlePinMessage(msg)}
                                            className={`transition-colors p-1 rounded-full hover:bg-white/5 ${pinnedMessage?.messageId === msg._id
                                                ? 'text-amber-400'
                                                : 'text-gray-400 hover:text-amber-400'
                                                }`}
                                            title={pinnedMessage?.messageId === msg._id ? 'Pinned' : 'Pin message'}
                                        >
                                            <Pin size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Typing Indicator */}
                {typingUsers.size > 0 && (
                    <div className="flex items-center ml-12 space-x-2 animate-pulse mb-4">
                        <div className="flex space-x-1 bg-white/5 p-2.5 rounded-2xl rounded-tl-none border border-white/10 shadow-lg backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-[10px] text-cyan-200/50 font-medium tracking-wide lowercase">
                            {typingUsers.size} typing...
                        </span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative z-20 p-4 border-t border-white/5 bg-black/20 backdrop-blur-xl">
                <form onSubmit={sendMessage} className="flex items-end gap-3 relative">
                    {/* Image Upload Button */}
                    <div className="relative group">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                            disabled={!connected || isUploading}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!connected || isUploading}
                            className="p-3 text-gray-400 hover:text-primary-600 bg-gray-50 dark:bg-dark-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-2xl transition-all duration-200 border border-transparent hover:border-primary-100"
                            title="Send image"
                        >
                            <svg className="w-6 h-6 transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 relative group">
                        {/* Mention Dropdown */}
                        {showMentionDropdown && filteredMembers.length > 0 && (
                            <div className="absolute bottom-full left-0 right-0 mb-3 bg-white dark:bg-dark-700 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-600 max-h-48 overflow-y-auto z-50 animate-fade-in-up">
                                <div className="p-2.5 text-[10px] uppercase tracking-wider font-semibold text-gray-400 border-b border-gray-50 dark:border-gray-600/50">
                                    Mention Member
                                </div>
                                {filteredMembers.map((member, index) => (
                                    <button
                                        key={member._id}
                                        type="button"
                                        onClick={() => handleMentionSelect(member)}
                                        className={`w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600/50 transition-colors ${index === mentionIndex ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                            }`}
                                    >
                                        {member.profilePicture ? (
                                            <Image
                                                src={member.profilePicture}
                                                alt={member.name}
                                                width={24}
                                                height={24}
                                                className="w-6 h-6 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                                                {member.name[0]}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {member.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Replying To UI */}
                        {replyingTo && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 mx-1 p-3 bg-white dark:bg-dark-700 rounded-xl shadow-lg border-l-4 border-primary-500 flex items-center justify-between animate-fade-in-up z-40">
                                <div className="flex-1 min-w-0 mr-2">
                                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mb-0.5">
                                        Replying to {replyingTo.senderName}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                        {replyingTo.type === 'image' ? '📷 Image' : replyingTo.message}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setReplyingTo(null)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-primary-500/5 rounded-2xl pointer-events-none group-focus-within:bg-primary-500/10 transition-colors"></div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={isUploading ? "Uploading image..." : "Type your message..."}
                            className="w-full pl-5 pr-12 py-3.5 bg-gray-50 dark:bg-dark-700 border-2 border-transparent focus:border-primary-200 dark:focus:border-primary-800 rounded-2xl focus:ring-0 text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all font-medium shadow-inner"
                            disabled={!connected || isUploading}
                        />
                        <button
                            type="button"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors"
                            title="Mention someone"
                        >
                            <span className="text-xl font-bold">@</span>
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={!connected || (!newMessage.trim() && !isUploading)}
                        className="p-3.5 bg-gradient-to-br from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white rounded-2xl shadow-lg hover:shadow-primary-500/30 transform hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed group"
                    >
                        {isUploading ? (
                            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>

            {/* Image Viewer Modal */}
            <ImageViewer
                imageUrl={viewingImage || ''}
                isOpen={!!viewingImage}
                onClose={() => setViewingImage(null)}
                alt="Chat image"
            />
        </div >
    );
}
