'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { messageAPI, uploadAPI, communityAPI } from '@/lib/api';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import {
    MoreVertical,
    ArrowLeft,
    Pin,
    Image as ImageIcon,
    Send,
    X,
    Reply,
    MapPin,
    VolumeX,
    User,
    Ban,
    UserMinus,
    Trash2
} from 'lucide-react';
import { socketManager } from '@/lib/socketManager';
import type { Socket } from 'socket.io-client';
import { useEnv } from '@/hooks/useEnv';
import VerifiedBadge from './ui/VerifiedBadge';
import GlassCard from './ui/GlassCard';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// Dynamic import for map to avoid SSR issues
const CollaborativeMap = dynamic(() => import('@/components/CollaborativeMap'), {
    loading: () => <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">Loading Map...</div>,
    ssr: false
});

interface Message {
    _id: string;
    senderId: string;
    senderName: string;
    senderProfilePicture?: string;
    message: string;
    timestamp: string;
    type: 'text' | 'image' | 'system';
    imageUrl?: string;
    replyTo?: {
        senderName: string;
        message: string;
    };
    isPending?: boolean;
    isVerified?: boolean;
    pinnedBy?: string;
}

interface ChatViewProps {
    conversationId: string;
    conversationType: 'dm' | 'squad' | 'community';
    onBack: () => void;
    isMobile: boolean;
}

interface SquadMember {
    _id: string;
    name: string;
    profilePicture?: string;
}

import { useSquads } from '@/contexts/SquadContext';

export default function ChatView({ conversationId, conversationType, onBack, isMobile }: ChatViewProps) {
    const { data: session } = useSession(); // Access session data
    const router = useRouter();
    const { apiUrl, socketUrl } = useEnv();
    const { markAsRead, setActiveSquadId } = useSquads();

    // Mark as read if squad and set active squad
    useEffect(() => {
        if (conversationType === 'squad' && conversationId) {
            markAsRead(conversationId);
            setActiveSquadId(conversationId);
        }

        return () => {
            if (conversationType === 'squad') {
                setActiveSquadId(null);
            }
        };
    }, [conversationId, conversationType, markAsRead, setActiveSquadId]);
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const socketRef = useRef<Socket | null>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [conversationInfo, setConversationInfo] = useState<any>(null);
    const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [showMiniMap, setShowMiniMap] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isBlocked, setIsBlocked] = useState(false);
    const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false); // State for remove member modal
    const [showTripDetails, setShowTripDetails] = useState(false); // State for trip details modal
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());



    // Fetch messages
    const fetchMessages = useCallback(async () => {
        try {
            const token = session?.user?.accessToken || localStorage.getItem('token');

            // Use different endpoint based on conversation type
            let endpoint: string;
            if (conversationType === 'squad') {
                endpoint = `${apiUrl}/api/trips/${conversationId}/chat`;
            } else if (conversationType === 'community') {
                endpoint = `${apiUrl}/api/communities/${conversationId}/messages`;
            } else {
                // DM conversation - use the history endpoint
                endpoint = `${apiUrl}/api/messages/${conversationId}/history`;
            }

            const response = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                let msgs = data.messages || [];

                // Normalize community messages (uses 'sender' instead of 'senderId')
                if (conversationType === 'community') {
                    msgs = msgs.map((m: any) => ({
                        ...m,
                        senderId: m.sender || m.senderId,
                        // Community already has these correctly named
                    }));
                }

                // Normalize squad messages (senderId is populated as object from backend)
                if (conversationType === 'squad') {
                    msgs = msgs.map((m: any) => ({
                        ...m,
                        // Extract senderId from populated object or use as-is
                        senderId: typeof m.senderId === 'object' && m.senderId?._id
                            ? m.senderId._id
                            : m.senderId,
                        senderName: m.senderName || m.senderId?.name || 'Unknown',
                        senderProfilePicture: m.senderProfilePicture || m.senderId?.profilePicture,
                    }));
                }

                // API already returns [Oldest, ..., Newest] thanks to server-side reverse()
                // So we do NOT need to reverse again for DM.
                setMessages(msgs);

                // Set conversation info based on type
                if (conversationType === 'squad') {
                    setConversationInfo({
                        name: data.trip?.title || data.tripTitle || 'Squad Chat',
                        avatar: data.trip?.coverPhoto,
                        type: 'squad',
                        creatorId: data.trip?.creator,
                        // Map data for CollaborativeMap - Standardized with TripDetailsClient logic
                        startPoint: data.trip?.startPoint ? {
                            ...data.trip.startPoint,
                            lat: data.trip.startPoint.coordinates?.latitude || data.trip.startPoint.coordinates?.lat || data.trip.startPoint.lat || 20.5937, // Nagpur
                            lng: data.trip.startPoint.coordinates?.longitude || data.trip.startPoint.coordinates?.lng || data.trip.startPoint.lng || 78.9629,
                            name: data.trip.startPoint.name || 'Start (Nagpur)'
                        } : { lat: 20.5937, lng: 78.9629, name: 'Start (Nagpur)' },

                        endPoint: data.trip?.endPoint ? {
                            ...data.trip.endPoint,
                            lat: data.trip.endPoint.coordinates?.latitude || data.trip.endPoint.coordinates?.lat || data.trip.endPoint.lat || 28.6139, // New Delhi
                            lng: data.trip.endPoint.coordinates?.longitude || data.trip.endPoint.coordinates?.lng || data.trip.endPoint.lng || 77.2090,
                            name: data.trip.endPoint.name || 'End (New Delhi)'
                        } : undefined,

                        waypoints: (data.trip?.waypoints || []).map((wp: any) => ({
                            ...wp,
                            lat: wp.lat || wp.latitude || wp.coordinates?.latitude || wp.coordinates?.lat,
                            lng: wp.lng || wp.longitude || wp.coordinates?.longitude || wp.coordinates?.lng
                        })),
                        members: data.trip?.squadMembers || [], // Members now includes creator from backend
                        isCreator: data.trip?.creator === session?.user?.id || data.trip?.creator?._id === session?.user?.id,
                        // Itinerary for in-chat view
                        itinerary: data.trip?.itinerary || [],
                        startDate: data.trip?.startDate,
                        endDate: data.trip?.endDate
                    });
                } else if (conversationType === 'community') {
                    setConversationInfo({
                        name: data.community?.name || 'Community Chat',
                        avatar: data.community?.coverImage,
                        type: 'community'
                    });
                } else {
                    setConversationInfo(data.conversation);
                }
                setPinnedMessage(data.pinnedMessage || null);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, conversationId, conversationType, session?.user?.id]);

    useEffect(() => {
        fetchMessages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId, conversationType]); // Only fetch when conversation changes

    // Socket connection - use singleton manager for better performance
    // Socket Event Handlers
    const handleReceiveDM = useCallback((message: any) => {
        if (message.conversationId === conversationId) {
            setMessages(prev => {
                if (prev.some(m => m._id === message._id)) return prev;
                const currentUserId = session?.user?.id;
                const msgSenderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
                if (currentUserId && String(msgSenderId) === String(currentUserId)) {
                    const pendingIndex = prev.findIndex(m =>
                        m.isPending &&
                        m.type === message.type &&
                        (m.type === 'text' ? m.message === message.message : m.imageUrl === message.imageUrl)
                    );
                    if (pendingIndex !== -1) {
                        const newMessages = [...prev];
                        newMessages[pendingIndex] = message;
                        return newMessages;
                    }
                }
                return [...prev, message];
            });
            virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' });
        }
    }, [conversationId, session?.user?.id]);

    const handleReceiveMessage = useCallback((message: any) => {
        let formattedMessage = { ...message };
        if (message.senderId && typeof message.senderId === 'object') {
            formattedMessage.senderProfilePicture = message.senderId.profilePicture;
            formattedMessage.senderName = message.senderId.name;
            formattedMessage.senderId = message.senderId._id;
        }

        setMessages(prev => {
            if (prev.some(m => m._id === formattedMessage._id)) return prev;
            const currentUserId = session?.user?.id;
            if (currentUserId && formattedMessage.senderId === currentUserId) {
                const pendingIndex = prev.findIndex(m =>
                    m.isPending &&
                    m.type === formattedMessage.type &&
                    (m.type === 'text' ? m.message === formattedMessage.message : m.imageUrl === formattedMessage.imageUrl)
                );
                if (pendingIndex !== -1) {
                    const newMessages = [...prev];
                    newMessages[pendingIndex] = formattedMessage;
                    return newMessages;
                }
            }
            return [...prev, formattedMessage];
        });
        virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' });
    }, [session?.user?.id]);

    const handleTyping = useCallback(({ userId, userName }: { userId: string; userName: string }) => {
        setTypingUsers(prev => prev.includes(userName) ? prev : [...prev, userName]);
        setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u !== userName));
        }, 3000);
    }, []);

    const handlePinnedMessage = useCallback((data: any) => {
        setPinnedMessage({
            _id: data.messageId,
            senderName: data.senderName,
            message: data.message,
            type: data.type,
            imageUrl: data.imageUrl,
            timestamp: new Date().toISOString(),
            senderId: '',
            pinnedBy: data.pinnedById
        });
    }, []);

    const handleMessageUnpinned = useCallback(() => setPinnedMessage(null), []);

    const handleSocketError = useCallback((error: { message: string }) => {
        console.error('Socket error:', error);
        toast.error(error.message || 'An error occurred');
        setMessages(prev => prev.filter(m => !m.isPending));
        setSending(false);
    }, []);

    const handleMessageDeleted = useCallback(({ messageId }: { messageId: string }) => {
        setMessages(prev => prev.filter(m => m._id !== messageId));
        if (pinnedMessage?._id === messageId) {
            setPinnedMessage(null);
        }
    }, [pinnedMessage]);

    // Socket connection and listeners
    useEffect(() => {
        const token = session?.user?.accessToken || localStorage.getItem('token');
        const socket = socketManager.connect(socketUrl, token || undefined);
        if (!socket) return;

        socketRef.current = socket;
        const roomType = conversationType === 'dm' ? 'dm' : conversationType === 'community' ? 'community' : 'squad';
        socketManager.joinRoom(conversationId, roomType);

        socketManager.on('receive_dm', handleReceiveDM);
        socketManager.on('receive_message', handleReceiveMessage);
        socketManager.on('typing_squad', handleTyping);
        socketManager.on('message_pinned', handlePinnedMessage);
        socketManager.on('message_unpinned', handleMessageUnpinned);
        socketManager.on('message_deleted', handleMessageDeleted);
        socketManager.on('error', handleSocketError);

        return () => {
            socketManager.leaveRoom(conversationId, roomType);
            socketManager.off('receive_dm', handleReceiveDM);
            socketManager.off('receive_message', handleReceiveMessage);
            socketManager.off('typing_squad', handleTyping);
            socketManager.off('message_pinned', handlePinnedMessage);
            socketManager.off('message_unpinned', handleMessageUnpinned);
            socketManager.off('message_deleted', handleMessageDeleted);
            socketManager.off('error', handleSocketError);
        };
    }, [
        socketUrl, conversationId, conversationType, session?.user?.id,
        handleReceiveDM, handleReceiveMessage, handleTyping,
        handlePinnedMessage, handleMessageUnpinned, handleMessageDeleted, handleSocketError
    ]);

    // Auto-scroll to bottom when messages load initially
    useEffect(() => {
        if (!loading && messages.length > 0) {
            console.log("📜 Triggering initial scroll. Messages:", messages.length);
            // Wait for next tick to ensure Virtuoso has rendered items
            setTimeout(() => {
                console.log("📜 Executing scroll to index:", messages.length - 1);
                virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: 'end' });
            }, 300);
        }
    }, [loading, conversationId]);

    // Check block status for DM
    useEffect(() => {
        const checkBlockStatus = async () => {
            if (conversationType === 'dm' && conversationInfo?.otherUserId) {
                try {
                    const token = session?.user?.accessToken || localStorage.getItem('token');
                    const response = await fetch(`${apiUrl}/api/messages/block-status/${conversationInfo.otherUserId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (data.success) {
                        setIsBlocked(data.iBlockedThem);
                    }
                } catch (error) {
                    console.error('Failed to check block status:', error);
                }
            }
        };
        checkBlockStatus();
    }, [conversationType, conversationInfo, apiUrl, session?.user?.id]);

    // Mark conversation as read
    useEffect(() => {
        const markAsRead = async () => {
            if (!loading && messages.length > 0 && conversationType === 'dm') {
                try {
                    const token = session?.user?.accessToken || localStorage.getItem('token');
                    await fetch(`${apiUrl}/api/messages/mark-read`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ conversationId })
                    });
                } catch (error) {
                    console.error('Failed to mark conversation as read:', error);
                }
            }
        };
        markAsRead();
    }, [conversationId, conversationType, loading, messages.length, apiUrl, session?.user?.id]);

    // Send message (no optimistic update to prevent duplication)
    const sendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        const trimmedMessage = newMessage.trim();
        setNewMessage('');
        setReplyTo(null);

        setSending(true);
        try {
            if (conversationType === 'dm') {
                // Optimistic update for DM text messages
                const tempId = `temp-${Date.now()}`;
                const optimisticMessage: Message = {
                    _id: tempId,
                    senderId: session?.user?.id || '',
                    senderName: session?.user?.name || 'You',
                    senderProfilePicture: session?.user?.image || undefined,
                    message: trimmedMessage,
                    timestamp: new Date().toISOString(),
                    type: 'text',
                    isPending: true
                };
                setMessages(prev => [...prev, optimisticMessage]);
                setTimeout(() => virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' }), 100);

                // DM messages use Socket.IO (not REST API)
                socketRef.current?.emit('send_dm', {
                    conversationId,
                    receiverId: conversationInfo?.otherUserId || conversationInfo?._id,
                    message: trimmedMessage,
                    type: 'text',
                    replyTo: replyTo?._id
                });
            } else if (conversationType === 'community') {
                // Community messages use REST API
                const token = session?.user?.accessToken || localStorage.getItem('token');
                const response = await fetch(`${apiUrl}/api/communities/${conversationId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        message: trimmedMessage,
                        type: 'text',
                        replyTo: replyTo?._id
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Add message from API response (normalize senderId)
                    const normalizedMessage = {
                        ...data.message,
                        senderId: data.message.sender || data.message.senderId
                    };
                    setMessages(prev => [...prev, normalizedMessage]);
                    virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' });
                } else {
                    // Show error from API
                    toast.error(data.message || 'Failed to send message');
                    setNewMessage(trimmedMessage); // Restore message
                }
            } else {
                // Squad messages use Socket.IO
                socketRef.current?.emit('send_message', {
                    tripId: conversationId,
                    message: trimmedMessage,
                    type: 'text',
                    replyTo: replyTo?._id
                });
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
            // Restore message on error (optional, but good UX)
            setNewMessage(trimmedMessage);
        } finally {
            setSending(false);
        }
    };

    // Handle image upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const token = session?.user?.accessToken || localStorage.getItem('token');

            // First upload the image (use standardized API)
            const response = await uploadAPI.uploadFile(file);

            if (response.success) {
                const messageData = {
                    message: 'Shared an image',
                    type: 'image',
                    imageUrl: response.url
                };

                // Optimistic update for image
                const tempId = `temp-img-${Date.now()}`;
                const optimisticMessage: Message = {
                    _id: tempId,
                    senderId: session?.user?.id || '',
                    senderName: session?.user?.name || 'You',
                    senderProfilePicture: session?.user?.image || undefined,
                    message: messageData.message,
                    timestamp: new Date().toISOString(),
                    type: 'image',
                    imageUrl: messageData.imageUrl,
                    isPending: true
                };
                setMessages(prev => [...prev, optimisticMessage]);
                setTimeout(() => virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' }), 100);

                if (conversationType === 'dm') {
                    // DM images use Socket.IO
                    socketRef.current?.emit('send_dm', {
                        conversationId,
                        receiverId: conversationInfo?.otherUserId || conversationInfo?._id,
                        ...messageData
                    });
                } else if (conversationType === 'community') {
                    // Community images use REST API
                    const token = session?.user?.accessToken || localStorage.getItem('token');
                    const apiResponse = await fetch(`${apiUrl}/api/communities/${conversationId}/messages`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify(messageData)
                    });

                    if (apiResponse.ok) {
                        const data = await apiResponse.json();
                        // Replace optimistic message with real one to avoid duplicates if needed, 
                        // but usually we just let the socket/state update handle it. 
                        // For community (REST), we might get double if we don't handled it, but let's stick to pattern.
                    } else {
                        throw new Error('Failed to send community image');
                    }
                } else {
                    // Squad images use Socket.IO
                    socketRef.current?.emit('send_message', {
                        tripId: conversationId,
                        ...messageData
                    });
                }
            }
        } catch (error) {
            console.error('Image upload failed:', error);
            toast.error('Failed to send image');
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return;

        try {
            if (conversationType === 'squad') {
                socketRef.current?.emit('delete_message', {
                    tripId: conversationId,
                    messageId
                });
            } else if (conversationType === 'community') {
                const token = session?.user?.accessToken || localStorage.getItem('token');
                const response = await fetch(`${apiUrl}/api/communities/${conversationId}/messages/${messageId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to delete');
                // Optimistic update handled by socket usually, but for REST we can remove locally too
                setMessages(prev => prev.filter(m => m._id !== messageId));
            } else {
                // DM
                const token = session?.user?.accessToken || localStorage.getItem('token');
                const response = await fetch(`${apiUrl}/api/messages/${messageId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to delete');
                // DM uses socket for deletion broadcast, so wait for that or remove optimistically
                setMessages(prev => prev.filter(m => m._id !== messageId));
            }
            toast.success('Message deleted');
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete message');
        }
    };

    // Format timestamp
    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    // Helper to get current user ID (handles different formats)
    const getCurrentUserId = () => {
        const user = session?.user as any;
        // Check all possible locations for user ID
        const userId = user?.id || user?._id || user?.userId || user?.sub || '';
        return String(userId);
    };

    const renderMessage = (index: number, msg: Message) => {
        // Handle different senderId formats (string, object with _id, or 'sender' field for DMs)
        let msgSenderId: string = '';

        // Check senderId first (most common)
        if (msg.senderId) {
            if (typeof msg.senderId === 'object' && msg.senderId !== null) {
                msgSenderId = (msg.senderId as any)?._id || (msg.senderId as any)?.id || '';
            } else {
                msgSenderId = String(msg.senderId);
            }
        }

        // DMs may use 'sender' instead of 'senderId'
        if (!msgSenderId && (msg as any).sender) {
            const sender = (msg as any).sender;
            msgSenderId = typeof sender === 'object'
                ? (sender._id || sender.id || '')
                : String(sender);
        }

        const currentUserId = getCurrentUserId();

        // Universal detection: Compare sender to current user
        // Handle case where senderId might be an object or string
        const senderIdStr = String(msgSenderId);
        const currentIdStr = String(currentUserId);

        const isOwn = senderIdStr === currentIdStr ||
            Boolean(session?.user?.email && (msg as any).senderEmail === session.user.email); // Fallback to email if IDs fail

        const isSystem = msg.type === 'system';

        if (isSystem) {
            return (
                <div className="system-message" key={msg._id}>
                    {msg.message}
                </div>
            );
        }

        // Calculate group position
        const prevMsg = messages[index - 1];
        const nextMsg = messages[index + 1];

        const isSamePrev = prevMsg && prevMsg.senderId === msg.senderId && prevMsg.type !== 'system';
        const isSameNext = nextMsg && nextMsg.senderId === msg.senderId && nextMsg.type !== 'system'; // Note: Virtuoso might not give easy access to next if not passed in context, but here we use the state 'messages' which is available in closure scope.

        let groupPosition: 'single' | 'top' | 'middle' | 'bottom' = 'single';
        if (!isSamePrev && isSameNext) groupPosition = 'top';
        else if (isSamePrev && isSameNext) groupPosition = 'middle';
        else if (isSamePrev && !isSameNext) groupPosition = 'bottom';

        return (
            <div className="relative group/msg">
                <MessageBubble
                    key={msg._id}
                    message={msg}
                    isOwn={isOwn}
                    groupPosition={groupPosition}
                    onReply={() => setReplyTo(msg)}
                    onPin={() => {
                        // Emit socket event to persist pin to backend
                        if (conversationType === 'squad') {
                            socketRef.current?.emit('pin_message', {
                                tripId: conversationId,
                                messageId: msg._id
                            });
                        }
                        setPinnedMessage(msg);
                    }}
                    onDelete={() => handleDeleteMessage(msg._id)}
                    formatTime={formatTime}
                    onImageClick={setSelectedImage}
                    conversationType={conversationType}
                    isMobile={isMobile}
                />
            </div>
        );
    };

    return (
        <div className="chat-view">
            {/* Header */}
            {/* Header */}
            <div className="chat-header">
                {isMobile && (
                    <button onClick={onBack} className="back-btn">
                        <ArrowLeft size={24} />
                    </button>
                )}

                <div
                    className={`header-info cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => {
                        if (conversationType === 'dm' && conversationInfo?.otherUserId) {
                            router.push(`/profile/${conversationInfo.otherUserId}`);
                        } else if (conversationType === 'squad') {
                            setShowTripDetails(true);
                        } else if (conversationType === 'community') {
                            router.push(`/app/communities/${conversationId}`);
                        }
                    }}
                >
                    {conversationInfo?.avatar ? (
                        <div className="header-avatar-container">
                            <Image
                                src={conversationInfo.avatar}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="header-avatar-placeholder">
                            {conversationInfo?.name?.charAt(0) || '?'}
                        </div>
                    )}
                    <div>
                        <h3 className="header-name">
                            {conversationInfo?.name || 'Loading...'}
                            {conversationInfo?.isVerified && <VerifiedBadge size="sm" className="ml-1" />}
                        </h3>
                        {typingUsers.length > 0 && (
                            <span className="typing-indicator">
                                {typingUsers.join(', ')} typing...
                            </span>
                        )}
                    </div>
                </div>

                {!isSelectionMode && (
                    <button
                        onClick={() => setIsSelectionMode(true)}
                        className="p-2 rounded-full hover:bg-white/10 text-white/60 transition-colors ml-auto mr-2"
                        title="Select Messages"
                    >
                        <MoreVertical size={20} />
                    </button>
                )}

                {/* Remove Member Modal */}
                <AnimatePresence>
                    {showRemoveMemberModal && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowRemoveMemberModal(false)}
                        >
                            <motion.div
                                className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white">Remove Member</h3>
                                    <button
                                        onClick={() => setShowRemoveMemberModal(false)}
                                        className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-4 max-h-[60vh] overflow-y-auto">
                                    {conversationInfo?.members?.filter((m: any) => m._id !== session?.user?.id).length === 0 ? (
                                        <p className="text-center text-white/50 py-4">No other members to remove.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {conversationInfo?.members?.filter((m: any) => m._id !== session?.user?.id).map((member: any) => (
                                                <div key={member._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                                                            {member.profilePicture ? (
                                                                <Image
                                                                    src={member.profilePicture}
                                                                    alt={member.name}
                                                                    width={40}
                                                                    height={40}
                                                                    className="object-cover w-full h-full"
                                                                />
                                                            ) : (
                                                                <span className="text-white font-bold">{member.name[0]}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-white font-medium">{member.name}</span>
                                                    </div>
                                                    <button
                                                        className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                                        onClick={async () => {
                                                            if (window.confirm(`Are you sure you want to remove ${member.name}?`)) {
                                                                try {
                                                                    const token = session?.user?.accessToken || localStorage.getItem('token');
                                                                    await fetch(`${apiUrl}/api/trips/${conversationId}/remove-member/${member._id}`, {
                                                                        method: 'DELETE',
                                                                        headers: {
                                                                            'Authorization': `Bearer ${token}`
                                                                        }
                                                                    });
                                                                    toast.success('Member removed');
                                                                    // Update local state to remove member
                                                                    setConversationInfo((prev: any) => ({
                                                                        ...prev,
                                                                        members: prev.members.filter((m: any) => m._id !== member._id)
                                                                    }));
                                                                } catch (error) {
                                                                    console.error('Failed to remove member:', error);
                                                                    toast.error('Failed to remove member');
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <UserMinus size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>


                <div className="header-actions">


                    {conversationInfo?.type === 'squad' && (
                        <>
                            <button
                                className="header-action-btn"
                                onClick={() => setShowMiniMap(!showMiniMap)}
                            >
                                <MapPin size={20} />
                            </button>
                        </>
                    )}
                    <div className="options-menu-wrapper">
                        <button
                            className="header-action-btn"
                            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                        >
                            <MoreVertical size={20} />
                        </button>

                        <AnimatePresence>
                            {showOptionsMenu && (
                                <motion.div
                                    className="options-dropdown"
                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                >
                                    <button className="option-item" onClick={() => { setShowOptionsMenu(false); }}>
                                        <VolumeX size={16} />
                                        Mute Notifications
                                    </button>

                                    {conversationType === 'dm' && (
                                        <>
                                            {isBlocked ? (
                                                <button
                                                    className="option-item"
                                                    onClick={async () => {
                                                        setShowOptionsMenu(false);
                                                        try {
                                                            const token = session?.user?.accessToken || localStorage.getItem('token');
                                                            const userToUnblockId = conversationInfo?.otherUserId;

                                                            if (userToUnblockId) {
                                                                await fetch(`${apiUrl}/api/messages/unblock/${userToUnblockId}`, {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Authorization': `Bearer ${token}`
                                                                    }
                                                                });
                                                                toast.success('User unblocked');
                                                                setIsBlocked(false);
                                                            }
                                                        } catch (error) {
                                                            toast.error('Failed to unblock user');
                                                        }
                                                    }}
                                                >
                                                    <VolumeX size={16} />
                                                    Unblock User
                                                </button>
                                            ) : (
                                                <button
                                                    className="option-item danger"
                                                    onClick={async () => {
                                                        setShowOptionsMenu(false);
                                                        if (window.confirm('Are you sure you want to block this user? You will no longer receive messages from them.')) {
                                                            try {
                                                                const token = session?.user?.accessToken || localStorage.getItem('token');
                                                                // For DM, conversationInfo contains otherUserId. _id is Conversation ID.
                                                                const userToBlockId = conversationInfo?.otherUserId;

                                                                if (userToBlockId) {
                                                                    await fetch(`${apiUrl}/api/messages/block/${userToBlockId}`, {
                                                                        method: 'POST',
                                                                        headers: {
                                                                            'Authorization': `Bearer ${token}`
                                                                        }
                                                                    });
                                                                    toast.success('User blocked');
                                                                    setIsBlocked(true);
                                                                    onBack();
                                                                }
                                                            } catch (error) {
                                                                toast.error('Failed to block user');
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Ban size={16} />
                                                    Block User
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {conversationInfo?.type === 'squad' && (
                                        <>
                                            <button
                                                className="option-item danger"
                                                onClick={async () => {
                                                    setShowOptionsMenu(false);
                                                    if (window.confirm('Are you sure you want to leave this squad?')) {
                                                        try {
                                                            const token = session?.user?.accessToken || localStorage.getItem('token');
                                                            await fetch(`${apiUrl}/api/trips/${conversationId}/leave`, {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Authorization': `Bearer ${token}`
                                                                }
                                                            });
                                                            toast.success('Left squad');
                                                            onBack();
                                                        } catch (error) {
                                                            toast.error('Failed to leave squad');
                                                        }
                                                    }
                                                }}
                                            >
                                                <User size={16} />
                                                Leave Squad
                                            </button>
                                            {conversationInfo?.isCreator && (
                                                <button
                                                    className="option-item danger"
                                                    onClick={() => {
                                                        setShowOptionsMenu(false);
                                                        setShowRemoveMemberModal(true);
                                                    }}
                                                >
                                                    <UserMinus size={16} />
                                                    Remove Member
                                                </button>
                                            )}
                                        </>
                                    )}
                                </motion.div >
                            )}
                        </AnimatePresence >
                    </div >
                </div >
            </div >

            {/* Pinned Message */}
            <AnimatePresence>
                {
                    pinnedMessage && (
                        <motion.div
                            className="pinned-banner"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <Pin size={14} className="flex-shrink-0" />
                            <span className="pinned-text">
                                <strong>{pinnedMessage.senderName}:</strong> {pinnedMessage.message || (pinnedMessage.type === 'image' ? '📷 Image' : '')}
                            </span>

                            {/* Unpin Button - Only for pinner or trip creator */}
                            {(pinnedMessage.pinnedBy === getCurrentUserId() || conversationInfo?.creatorId === getCurrentUserId()) && (
                                <button
                                    onClick={() => {
                                        if (conversationType === 'squad') {
                                            socketRef.current?.emit('unpin_message', { tripId: conversationId });
                                        }
                                    }}
                                    className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Mini Map for Squad Chats */}
            <AnimatePresence>
                {
                    showMiniMap && conversationType === 'squad' && (
                        <motion.div
                            className="mini-map-container"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: '65vh', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(0, 0, 0, 0.3)',
                                overflow: 'hidden',
                                borderRadius: '8px',
                                margin: '8px'
                            }}
                        >
                            {conversationInfo?.startPoint ? (
                                <CollaborativeMap
                                    tripId={conversationId}
                                    startPoint={conversationInfo.startPoint}
                                    endPoint={conversationInfo.endPoint}
                                    initialWaypoints={conversationInfo.waypoints || []}
                                    isReadOnly={false}
                                />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '14px'
                                }}>
                                    <MapPin size={20} style={{ marginRight: '8px' }} />
                                    No trip location set
                                </div>
                            )}
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Messages */}
            < div className="messages-container" >
                {
                    loading ? (
                        <div className="messages-loading" >
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
                        </div>
                    ) : (
                        <Virtuoso
                            ref={virtuosoRef}
                            style={{ height: '100%' }}
                            data={messages}
                            itemContent={renderMessage}
                            followOutput="smooth"
                            className="app-scrollable"
                        />
                    )}
            </div >

            {/* Reply Preview */}
            <AnimatePresence>
                {
                    replyTo && (
                        <motion.div
                            className="reply-preview"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <Reply size={14} />
                            <span>Replying to <strong>{replyTo.senderName}</strong></span>
                            <button onClick={() => setReplyTo(null)}>
                                <X size={16} />
                            </button>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Input Island */}
            < div className="chat-input-wrapper" >
                <div className="chat-input-container">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <button
                        className="input-action-btn"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="message-input"
                    />
                    <button
                        className={`send-btn ${newMessage.trim() ? 'active' : ''}`}
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div >

            {/* Image Modal/Lightbox */}
            {/* Image Modal/Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
                        onClick={() => { setSelectedImage(null); setZoomLevel(1); }}
                        style={{ touchAction: 'none' }} // Prevent browser zoom
                    >
                        {/* Close Button */}
                        <button
                            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-[60]"
                            onClick={() => { setSelectedImage(null); setZoomLevel(1); }}
                        >
                            <X size={28} />
                        </button>

                        {/* Zoom Controls */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[60] bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 w-72">
                            <button
                                className="text-white/80 hover:text-white"
                                onClick={(e) => { e.stopPropagation(); setZoomLevel(1); }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                            </button>

                            <input
                                type="range"
                                min="1"
                                max="5"
                                step="0.1"
                                value={zoomLevel}
                                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400 transition-all"
                            />

                            <button
                                className="text-white/80 hover:text-white"
                                onClick={(e) => { e.stopPropagation(); setZoomLevel(5); }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                            </button>
                            <span className="text-white/90 text-xs font-medium w-8 text-center">{Math.round(zoomLevel)}x</span>





                            {/* Trip Details & Members Modal */}
                            <AnimatePresence>
                                {showTripDetails && conversationInfo?.type === 'squad' && (
                                    <motion.div
                                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setShowTripDetails(false)}
                                    >
                                        <motion.div
                                            className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.9, opacity: 0 }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
                                                <h3 className="text-lg font-bold text-white">Trip Details</h3>
                                                <button
                                                    onClick={() => setShowTripDetails(false)}
                                                    className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            <div className="overflow-y-auto p-5 space-y-8">
                                                {/* Details Section */}
                                                <div className="space-y-4">
                                                    <div className="flex items-start gap-5">
                                                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0 shadow-lg border border-white/10">
                                                            {conversationInfo.avatar ? (
                                                                <Image
                                                                    src={conversationInfo.avatar}
                                                                    alt={conversationInfo.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-white/50">
                                                                    <ImageIcon size={32} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pt-1">
                                                            <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{conversationInfo.name}</h2>
                                                            <div className="flex items-center gap-2 text-white/70 bg-white/5 px-3 py-1.5 rounded-lg w-fit">
                                                                <MapPin size={16} className="text-teal-400" />
                                                                <span className="text-sm font-medium">{conversationInfo.endPoint?.name || 'Destination'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => router.push(`/trips/${conversationId}`)}
                                                        className="w-full py-3 px-4 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 hover:text-teal-300 font-semibold transition-all flex items-center justify-center gap-2"
                                                    >
                                                        View Full Itinerary
                                                    </button>
                                                </div>

                                                {/* Members Section */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest">
                                                            Squad Members
                                                        </h4>
                                                        <span className="text-xs font-bold text-white/30 bg-white/10 px-2 py-1 rounded-full">
                                                            {conversationInfo?.members?.length || 0}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {conversationInfo?.members?.map((member: any) => (
                                                            <div key={member._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/5 group">
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center relative flex-shrink-0 border border-white/10">
                                                                        {member.profilePicture ? (
                                                                            <Image
                                                                                src={member.profilePicture}
                                                                                alt={member.name}
                                                                                fill
                                                                                className="object-cover"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-white font-bold">{member.name[0]}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-white font-medium truncate block">{member.name}</span>
                                                                            {member._id === conversationInfo.creatorId && (
                                                                                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                                                    Host
                                                                                </span>
                                                                            )}
                                                                            {member._id === session?.user?.id && (
                                                                                <span className="text-[10px] font-bold bg-white/10 text-white/50 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                                                    You
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Remove Button (Only for Creator, not for self) */}
                                                                {conversationInfo?.isCreator && member._id !== session?.user?.id && (
                                                                    <button
                                                                        className="p-2 rounded-full bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all transform hover:scale-110"
                                                                        title="Remove Member"
                                                                        onClick={async () => {
                                                                            if (window.confirm(`Are you sure you want to remove ${member.name}?`)) {
                                                                                try {
                                                                                    const token = session?.user?.accessToken || localStorage.getItem('token');
                                                                                    await fetch(`${apiUrl}/api/trips/${conversationId}/remove-member/${member._id}`, {
                                                                                        method: 'DELETE',
                                                                                        headers: {
                                                                                            'Authorization': `Bearer ${token}`
                                                                                        }
                                                                                    });
                                                                                    toast.success('Member removed');
                                                                                    // Update local state
                                                                                    setConversationInfo((prev: any) => ({
                                                                                        ...prev,
                                                                                        members: prev.members.filter((m: any) => m._id !== member._id)
                                                                                    }));
                                                                                } catch (error) {
                                                                                    console.error('Failed to remove member:', error);
                                                                                    toast.error('Failed to remove member');
                                                                                }
                                                                            }
                                                                        }}
                                                                    >
                                                                        <UserMinus size={18} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.div
                            className="w-full h-full flex items-center justify-center overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.img
                                src={selectedImage}
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

            <style jsx>{`
                .chat-view {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: linear-gradient(180deg, rgba(0, 20, 40, 0.8) 0%, rgba(0, 10, 20, 0.95) 100%);
                    position: relative;
                }
                
                .chat-view::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: 
                        radial-gradient(ellipse at top right, rgba(0, 255, 255, 0.05) 0%, transparent 50%),
                        radial-gradient(ellipse at bottom left, rgba(139, 92, 246, 0.05) 0%, transparent 50%);
                    pointer-events: none;
                }
                
                .chat-header {
                    display: flex;
                    align-items: center;
                    padding: 12px 20px;
                    background: rgba(0, 20, 40, 0.6);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(0, 255, 255, 0.15);
                    gap: 12px;
                    z-index: 10;
                    position: relative;
                    box-shadow: 0 4px 30px rgba(0, 255, 255, 0.1);
                }
                
                .chat-header::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.5), rgba(139, 92, 246, 0.5), transparent);
                }
                
                .back-btn {
                    color: rgba(0, 255, 255, 0.8);
                    padding: 4px;
                    transition: all 0.3s;
                }
                
                .back-btn:hover {
                    color: #00ffff;
                    filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.5));
                }
                
                .header-info {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .header-avatar-container {
                    width: 44px;
                    height: 44px;
                    min-width: 44px;
                    border-radius: 50%;
                    overflow: hidden;
                    position: relative;
                    flex-shrink: 0;
                    border: 2px solid rgba(0, 255, 255, 0.4);
                    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
                }

                .header-avatar-placeholder {
                    width: 44px;
                    height: 44px;
                    min-width: 44px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #0891b2, #06b6d4);
                    color: white;
                    font-weight: 700;
                    border: 2px solid rgba(0, 255, 255, 0.4);
                    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
                }
                
                .header-name {
                    font-size: 17px;
                    font-weight: 700;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    letter-spacing: 0.02em;
                    text-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
                }
                
                .typing-indicator {
                    font-size: 12px;
                    color: #00ffff;
                    animation: typingGlow 1.5s infinite;
                    font-weight: 500;
                }
                
                @keyframes typingGlow {
                    0%, 100% { opacity: 1; text-shadow: 0 0 10px rgba(0, 255, 255, 0.5); }
                    50% { opacity: 0.6; text-shadow: 0 0 5px rgba(0, 255, 255, 0.3); }
                }
                
                .header-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .header-action-btn {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(0, 255, 255, 0.7);
                    border-radius: 12px;
                    transition: all 0.3s;
                    border: 1px solid transparent;
                }
                
                .header-action-btn:hover {
                    background: rgba(0, 255, 255, 0.1);
                    color: #00ffff;
                    border-color: rgba(0, 255, 255, 0.3);
                    box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
                }
                
                .options-menu-wrapper {
                    position: relative;
                }
                
                .options-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 8px;
                    min-width: 200px;
                    background: rgba(0, 20, 40, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(0, 255, 255, 0.2);
                    border-radius: 16px;
                    padding: 8px;
                    z-index: 100;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 255, 255, 0.1);
                }
                
                .option-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 12px 14px;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 14px;
                    font-weight: 500;
                    border-radius: 10px;
                    transition: all 0.2s;
                    text-align: left;
                }
                
                .option-item:hover {
                    background: rgba(0, 255, 255, 0.1);
                    color: #00ffff;
                }
                
                .option-item.danger {
                    color: #f87171;
                }
                
                .option-item.danger:hover {
                    background: rgba(248, 113, 113, 0.15);
                    color: #fca5a5;
                }
                
                .pinned-banner {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 16px;
                    background: linear-gradient(90deg, rgba(139, 92, 246, 0.15), rgba(0, 255, 255, 0.1));
                    border-bottom: 1px solid rgba(139, 92, 246, 0.3);
                    color: #a78bfa;
                    font-size: 13px;
                    overflow: hidden;
                }
                
                .pinned-text {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .messages-container {
                    flex: 1;
                    overflow: hidden;
                    padding-bottom: 0px;
                    position: relative;
                }
                
                .messages-loading {
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .system-message {
                    text-align: center;
                    padding: 12px 20px;
                    color: rgba(0, 255, 255, 0.6);
                    font-size: 12px;
                    margin: 12px 0;
                    font-weight: 500;
                    letter-spacing: 0.02em;
                }
                
                .reply-preview {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 16px;
                    background: linear-gradient(90deg, rgba(0, 255, 255, 0.1), rgba(139, 92, 246, 0.1));
                    border-top: 1px solid rgba(0, 255, 255, 0.2);
                    color: #00ffff;
                    font-size: 13px;
                    overflow: hidden;
                }
                
                .reply-preview button {
                    margin-left: auto;
                    color: rgba(255, 255, 255, 0.5);
                    transition: all 0.2s;
                }
                
                .reply-preview button:hover {
                    color: #00ffff;
                }
                
                .chat-input-wrapper {
                    padding: 16px;
                    padding-top: 8px;
                    padding-bottom: calc(64px + env(safe-area-inset-bottom));
                    background: linear-gradient(to top, rgba(0, 20, 40, 0.9), transparent);
                    position: relative;
                }
                
                @media (min-width: 768px) {
                    .chat-input-wrapper {
                        padding: 16px;
                        padding-bottom: 16px;
                    }
                }
                
                .chat-input-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    background: rgba(0, 30, 50, 0.8);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(0, 255, 255, 0.2);
                    border-radius: 28px;
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 255, 255, 0.1), inset 0 0 15px rgba(0, 255, 255, 0.03);
                    transition: all 0.3s;
                }
                
                .chat-input-container:focus-within {
                    border-color: rgba(0, 255, 255, 0.5);
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 255, 255, 0.2), inset 0 0 15px rgba(0, 255, 255, 0.05);
                }
                
                .input-action-btn {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(0, 255, 255, 0.6);
                    border-radius: 50%;
                    transition: all 0.3s;
                }
                
                .input-action-btn:hover {
                    background: rgba(0, 255, 255, 0.15);
                    color: #00ffff;
                    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
                }
                
                .message-input {
                    flex: 1;
                    padding: 12px 8px;
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 15px;
                    outline: none;
                    font-weight: 400;
                }
                
                .message-input::placeholder {
                    color: rgba(0, 255, 255, 0.3);
                }
                
                .send-btn {
                    width: 44px;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(0, 255, 255, 0.4);
                    border-radius: 50%;
                    transition: all 0.3s;
                    transform: scale(0.9);
                }
                
                .send-btn.active {
                    background: linear-gradient(135deg, #0891b2, #06b6d4);
                    color: white;
                    transform: scale(1);
                    box-shadow: 0 0 25px rgba(0, 255, 255, 0.5), 0 4px 15px rgba(0, 0, 0, 0.3);
                }
                
                .send-btn.active:hover {
                    box-shadow: 0 0 35px rgba(0, 255, 255, 0.7), 0 4px 15px rgba(0, 0, 0, 0.3);
                    transform: scale(1.05);
                }
                
                .send-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                
                .hidden {
                    display: none;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>


            {/* Trip Details & Members Modal */}
            <AnimatePresence>
                {showTripDetails && conversationInfo?.type === 'squad' && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowTripDetails(false)}
                    >
                        <motion.div
                            className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
                                <h3 className="text-lg font-bold text-white">Trip Details</h3>
                                <button
                                    onClick={() => setShowTripDetails(false)}
                                    className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-5 space-y-8">
                                {/* Details Section */}
                                <div className="space-y-4">
                                    <div className="flex items-start gap-5">
                                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0 shadow-lg border border-white/10">
                                            {conversationInfo.avatar ? (
                                                <Image
                                                    src={conversationInfo.avatar}
                                                    alt={conversationInfo.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/50">
                                                    <ImageIcon size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{conversationInfo.name}</h2>
                                            <div className="flex items-center gap-2 text-white/70 bg-white/5 px-3 py-1.5 rounded-lg w-fit">
                                                <MapPin size={16} className="text-teal-400" />
                                                <span className="text-sm font-medium">{conversationInfo.endPoint?.name || 'Destination'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Members Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest">
                                            Squad Members
                                        </h4>
                                        <span className="text-xs font-bold text-white/30 bg-white/10 px-2 py-1 rounded-full">
                                            {conversationInfo?.members?.length || 0}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {conversationInfo?.members?.map((member: any) => (
                                            <div key={member._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/5 group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center relative flex-shrink-0 border border-white/10">
                                                        {member.profilePicture ? (
                                                            <Image
                                                                src={member.profilePicture}
                                                                alt={member.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-white font-bold">{member.name[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white font-medium truncate block">{member.name}</span>
                                                            {member._id === conversationInfo.creatorId && (
                                                                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                                    Host
                                                                </span>
                                                            )}
                                                            {member._id === session?.user?.id && (
                                                                <span className="text-[10px] font-bold bg-white/10 text-white/50 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remove Button (Only for Creator, not for self) */}
                                                {conversationInfo?.isCreator && member._id !== session?.user?.id && (
                                                    <button
                                                        className="p-2 rounded-full bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all transform hover:scale-110"
                                                        title="Remove Member"
                                                        onClick={async () => {
                                                            if (window.confirm(`Are you sure you want to remove ${member.name}?`)) {
                                                                try {
                                                                    const token = session?.user?.accessToken || localStorage.getItem('token');
                                                                    await fetch(`${apiUrl}/api/trips/${conversationId}/remove-member/${member._id}`, {
                                                                        method: 'DELETE',
                                                                        headers: {
                                                                            'Authorization': `Bearer ${token}`
                                                                        }
                                                                    });
                                                                    toast.success('Member removed');
                                                                    // Update local state
                                                                    setConversationInfo((prev: any) => ({
                                                                        ...prev,
                                                                        members: prev.members.filter((m: any) => m._id !== member._id)
                                                                    }));
                                                                } catch (error) {
                                                                    console.error('Failed to remove member:', error);
                                                                    toast.error('Failed to remove member');
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <UserMinus size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Itinerary Section */}
                                    <div className="mt-6 pt-4 border-t border-white/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-[#00f2ea]">Trip Itinerary</h3>
                                            {conversationInfo?.isCreator && (
                                                <button
                                                    className="px-3 py-1.5 bg-[#00f2ea]/20 text-[#00f2ea] rounded-lg text-sm font-medium hover:bg-[#00f2ea]/30 transition-colors"
                                                    onClick={() => {
                                                        const newDay = {
                                                            day: (conversationInfo?.itinerary?.length || 0) + 1,
                                                            date: conversationInfo?.startDate
                                                                ? new Date(new Date(conversationInfo.startDate).getTime() + (conversationInfo?.itinerary?.length || 0) * 24 * 60 * 60 * 1000)
                                                                : new Date(),
                                                            activities: []
                                                        };
                                                        const updatedItinerary = [...(conversationInfo?.itinerary || []), newDay];
                                                        // Save to backend
                                                        const token = session?.user?.accessToken || localStorage.getItem('token');
                                                        fetch(`${apiUrl}/api/trips/${conversationId}/itinerary`, {
                                                            method: 'PUT',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({ itinerary: updatedItinerary })
                                                        }).then(() => {
                                                            setConversationInfo((prev: any) => ({
                                                                ...prev,
                                                                itinerary: updatedItinerary
                                                            }));
                                                            toast.success('Day added');
                                                        }).catch(() => toast.error('Failed to add day'));
                                                    }}
                                                >
                                                    + Add Day
                                                </button>
                                            )}
                                        </div>

                                        {(!conversationInfo?.itinerary || conversationInfo.itinerary.length === 0) ? (
                                            <div className="text-center py-8 text-white/40">
                                                <p className="text-sm">No itinerary planned yet</p>
                                                {conversationInfo?.isCreator && (
                                                    <p className="text-xs mt-1">Click "Add Day" to start planning</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
                                                {conversationInfo.itinerary.map((day: any, dayIndex: number) => (
                                                    <div key={dayIndex} className="bg-white/5 rounded-xl p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                <span className="text-[#00f2ea] font-bold">Day {day.day}</span>
                                                                {day.date && (
                                                                    <span className="text-white/40 text-sm ml-2">
                                                                        {new Date(day.date).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {conversationInfo?.isCreator && (
                                                                <button
                                                                    className="text-xs text-[#00f2ea]/60 hover:text-[#00f2ea] transition-colors"
                                                                    onClick={() => {
                                                                        const activityTitle = prompt('Enter activity title:');
                                                                        if (activityTitle) {
                                                                            const time = prompt('Enter time (e.g. 09:00 AM):', '09:00 AM');
                                                                            const description = prompt('Enter description (optional):');
                                                                            const location = prompt('Enter location (optional):');

                                                                            const updatedItinerary = [...conversationInfo.itinerary];
                                                                            updatedItinerary[dayIndex].activities.push({
                                                                                time: time || '',
                                                                                title: activityTitle,
                                                                                description: description || '',
                                                                                location: location || ''
                                                                            });

                                                                            const token = session?.user?.accessToken || localStorage.getItem('token');
                                                                            fetch(`${apiUrl}/api/trips/${conversationId}/itinerary`, {
                                                                                method: 'PUT',
                                                                                headers: {
                                                                                    'Content-Type': 'application/json',
                                                                                    'Authorization': `Bearer ${token}`
                                                                                },
                                                                                body: JSON.stringify({ itinerary: updatedItinerary })
                                                                            }).then(() => {
                                                                                setConversationInfo((prev: any) => ({
                                                                                    ...prev,
                                                                                    itinerary: updatedItinerary
                                                                                }));
                                                                                toast.success('Activity added');
                                                                            }).catch(() => toast.error('Failed to add activity'));
                                                                        }
                                                                    }}
                                                                >
                                                                    + Add Activity
                                                                </button>
                                                            )}
                                                        </div>

                                                        {(!day.activities || day.activities.length === 0) ? (
                                                            <p className="text-white/30 text-xs">No activities planned</p>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {day.activities.map((activity: any, actIndex: number) => (
                                                                    <div key={actIndex} className="flex items-start gap-3 text-sm group">
                                                                        <span className="text-[#00f2ea]/60 font-mono text-xs w-16 flex-shrink-0">
                                                                            {activity.time || '--:--'}
                                                                        </span>
                                                                        <div className="flex-1">
                                                                            <p className="text-white/80 font-medium">{activity.title}</p>
                                                                            {activity.location && (
                                                                                <p className="text-white/40 text-xs">📍 {activity.location}</p>
                                                                            )}
                                                                            {activity.description && (
                                                                                <p className="text-white/30 text-xs mt-1">{activity.description}</p>
                                                                            )}
                                                                        </div>
                                                                        {conversationInfo?.isCreator && (
                                                                            <button
                                                                                className="opacity-0 group-hover:opacity-100 text-red-500/60 hover:text-red-500 text-xs transition-all"
                                                                                onClick={() => {
                                                                                    if (confirm('Remove this activity?')) {
                                                                                        const updatedItinerary = [...conversationInfo.itinerary];
                                                                                        updatedItinerary[dayIndex].activities.splice(actIndex, 1);

                                                                                        const token = session?.user?.accessToken || localStorage.getItem('token');
                                                                                        fetch(`${apiUrl}/api/trips/${conversationId}/itinerary`, {
                                                                                            method: 'PUT',
                                                                                            headers: {
                                                                                                'Content-Type': 'application/json',
                                                                                                'Authorization': `Bearer ${token}`
                                                                                            },
                                                                                            body: JSON.stringify({ itinerary: updatedItinerary })
                                                                                        }).then(() => {
                                                                                            setConversationInfo((prev: any) => ({
                                                                                                ...prev,
                                                                                                itinerary: updatedItinerary
                                                                                            }));
                                                                                            toast.success('Activity removed');
                                                                                        }).catch(() => toast.error('Failed to remove activity'));
                                                                                    }
                                                                                }}
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


        </div>
    );
}

// Message Bubble Component with swipe-to-reply and smart grouping
function MessageBubble({
    message,
    isOwn,
    groupPosition,
    onReply,
    onPin,
    onDelete,
    formatTime,
    onImageClick,
    isSelectionMode,
    isSelected,
    onSelect,
    conversationType,
    isMobile
}: {
    message: Message;
    isOwn: boolean;
    groupPosition: 'single' | 'top' | 'middle' | 'bottom';
    onReply: () => void;
    onPin: () => void;
    onDelete: () => void;
    formatTime: (ts: string) => string;
    onImageClick?: (url: string) => void;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
    conversationType?: string;
    isMobile?: boolean;
}) {
    const x = useMotionValue(0);
    const replyOpacity = useTransform(x, [-100, -50], [1, 0]);
    const [showActions, setShowActions] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const handleDragEnd = () => {
        if (x.get() < -50) {
            onReply();
        }
    };

    // Long press handler
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        const timer = setTimeout(() => {
            setMenuPosition({ x: touch.clientX, y: touch.clientY });
            setShowActions(true);
        }, 500);
        setLongPressTimer(timer);
    };

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setShowActions(true);
    };

    // Calculate border radius based on group position and ownership
    const getBorderRadius = () => {
        const r = '20px';
        const s = '4px';

        if (isOwn) {
            switch (groupPosition) {
                case 'single': return `${r} ${r} ${r} ${r}`;
                case 'top': return `${r} ${r} ${s} ${r}`;
                case 'middle': return `${r} ${s} ${s} ${r}`;
                case 'bottom': return `${r} ${s} ${r} ${r}`;
                default: return r;
            }
        } else {
            switch (groupPosition) {
                case 'single': return `${r} ${r} ${r} ${r}`;
                case 'top': return `${r} ${r} ${r} ${s}`;
                case 'middle': return `${s} ${r} ${r} ${s}`;
                case 'bottom': return `${s} ${r} ${r} ${r}`;
                default: return r;
            }
        }
    };

    return (
        <div className={`message-row ${isOwn ? 'own' : ''} ${groupPosition} group`}>
            <motion.div
                className="reply-hint"
                style={{ opacity: replyOpacity }}
            >
                <Reply size={16} />
            </motion.div>

            {/* Selection Checkbox */}
            {isSelectionMode && (
                <div
                    className="shrink-0 cursor-pointer p-2 mr-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect?.();
                    }}
                >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-gray-500'}`}>
                        {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                </div>
            )}

            {/* Profile Picture for received messages - always show */}
            {!isOwn && (
                <div
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        let senderId: string | null = null;
                        if (message.senderId) {
                            if (typeof message.senderId === 'object') {
                                senderId = (message.senderId as any)?._id || (message.senderId as any)?.id;
                            } else {
                                senderId = message.senderId;
                            }
                        }
                        if (senderId) {
                            window.location.href = `/app/profile/${senderId}`;
                        }
                    }}
                    title={`View ${message.senderName}'s profile`}
                >
                    <Image
                        src={
                            message.senderProfilePicture ||
                            `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%2306b6d4'/%3E%3Ctext x='16' y='22' font-size='16' text-anchor='middle' fill='white' font-family='Arial'%3E${(message.senderName || 'U').charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`
                        }
                        alt={message.senderName}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover mr-2 shrink-0 self-end mb-1"
                    />
                </div>
            )}

            <div className="relative flex items-center max-w-[75%]">
                {/* More Button (Visible on Hover/Focus or always on Mobile) */}
                <button
                    className={`p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'} ${isOwn ? 'mr-2 order-first' : 'ml-2 order-last'}`}
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuPosition({ x: rect.left, y: rect.bottom });
                        setShowActions(true);
                    }}
                >
                    <MoreVertical size={16} />
                </button>

                <motion.div
                    className={`message-bubble ${isOwn ? 'own' : ''} ${message.isPending ? 'pending' : ''}`}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onContextMenu={handleContextMenu}
                    style={{
                        x,
                        borderRadius: getBorderRadius(),
                        marginBottom: groupPosition === 'bottom' || groupPosition === 'single' ? '12px' : '2px',
                        position: 'relative'
                    }}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Show sender name only for first message in group of received messages */}
                    {!isOwn && (groupPosition === 'top' || groupPosition === 'single') && (
                        <div className="bubble-sender">
                            {message.senderName}
                            {message.isVerified && <VerifiedBadge size="sm" className="ml-1" />}
                        </div>
                    )}

                    {message.replyTo && (
                        <div className="bubble-reply">
                            <strong>{message.replyTo.senderName}:</strong> {message.replyTo.message}
                        </div>
                    )}

                    {message.type === 'image' && message.imageUrl && (
                        <img
                            src={message.imageUrl}
                            alt=""
                            className="bubble-image"
                            onClick={() => onImageClick?.(message.imageUrl!)}
                            style={{ cursor: onImageClick ? 'pointer' : 'default' }}
                        />
                    )}

                    {message.message && (
                        <p className="bubble-text">{message.message}</p>
                    )}

                    <span className="bubble-time">{formatTime(message.timestamp)}</span>
                </motion.div>
            </div>

            {/* Message Actions Menu (Fixed Position) */}
            <AnimatePresence>
                {showActions && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowActions(false);
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setShowActions(false);
                            }}
                        />
                        <motion.div
                            className="fixed z-50 bg-gray-900/95 border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden min-w-[160px] backdrop-blur-xl"
                            style={{
                                boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 30px rgba(0,255,255,0.1)',
                                left: Math.min(menuPosition.x, window.innerWidth - 170), // Keep within screen
                                top: Math.min(menuPosition.y, window.innerHeight - 100)  // Keep within screen
                            }}
                        >
                            <button
                                className="w-full px-4 py-3 text-left text-sm text-white hover:bg-cyan-500/10 flex items-center gap-3 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReply();
                                    setShowActions(false);
                                }}
                            >
                                <Reply size={16} className="text-cyan-400" /> Reply
                            </button>

                            {conversationType === 'squad' && (
                                <button
                                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-purple-500/10 flex items-center gap-3 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPin();
                                        setShowActions(false);
                                    }}
                                >
                                    <Pin size={16} className="text-purple-400" /> Pin Message
                                </button>
                            )}

                            {isOwn && (
                                <button
                                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-white/5"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                        setShowActions(false);
                                    }}
                                >
                                    <Trash2 size={16} className="text-red-400" /> Delete
                                </button>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style jsx>{`
                .message-row {
                    display: flex;
                    padding: 0 16px;
                    position: relative;
                }
                
                .message-row.own {
                    justify-content: flex-end;
                }
                
                .reply-hint {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #00ffff;
                    filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.5));
                }
                
                .message-bubble {
                    width: 100%;
                    padding: 10px 16px;
                    position: relative;
                    background: rgba(0, 30, 50, 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(139, 92, 246, 0.03);
                    transform-origin: bottom right;
                }
                
                .message-bubble.own {
                    background: linear-gradient(135deg, rgba(0, 180, 180, 0.25), rgba(0, 140, 160, 0.25));
                    border: 1px solid rgba(0, 255, 255, 0.3);
                    box-shadow: 0 4px 20px rgba(0, 255, 255, 0.15), inset 0 0 15px rgba(0, 255, 255, 0.05);
                }
                
                .message-bubble.pending {
                    opacity: 0.6;
                }
                
                .bubble-sender {
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(0, 255, 255, 0.9);
                    margin-bottom: 4px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
                }
                
                .bubble-reply {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                    padding: 8px 12px;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 10px;
                    margin-bottom: 8px;
                    border-left: 3px solid rgba(0, 255, 255, 0.6);
                }
                
                .bubble-image {
                    max-width: 100%;
                    border-radius: 14px;
                    margin-bottom: 8px;
                    border: 1px solid rgba(0, 255, 255, 0.2);
                }
                
                .bubble-text {
                    color: rgba(255, 255, 255, 0.95);
                    font-size: 15px;
                    line-height: 1.55;
                    word-wrap: break-word;
                    font-weight: 400;
                }
                
                .bubble-time {
                    font-size: 10px;
                    color: rgba(0, 255, 255, 0.4);
                    margin-top: 4px;
                    display: block;
                    text-align: right;
                    font-weight: 500;
                }
            `}</style>

        </div>
    );
}
