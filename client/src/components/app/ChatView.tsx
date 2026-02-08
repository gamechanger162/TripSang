'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { messageAPI, uploadAPI } from '@/lib/api';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    MoreVertical,
    Pin,
    Image as ImageIcon,
    Send,
    X,
    Reply,
    MapPin,
    VolumeX,
    User,
    Ban
} from 'lucide-react';
import { socketManager } from '@/lib/socketManager';
import type { Socket } from 'socket.io-client';
import { useEnv } from '@/hooks/useEnv';
import VerifiedBadge from './ui/VerifiedBadge';
import GlassCard from './ui/GlassCard';
import dynamic from 'next/dynamic';

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

export default function ChatView({ conversationId, conversationType, onBack, isMobile }: ChatViewProps) {
    const { data: session } = useSession(); // Access session data
    const router = useRouter();
    const { apiUrl, socketUrl } = useEnv();
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
                        // Map data for CollaborativeMap
                        startPoint: data.trip?.startPoint ? {
                            ...data.trip.startPoint,
                            lat: data.trip.startPoint.coordinates?.latitude || data.trip.startPoint.lat,
                            lng: data.trip.startPoint.coordinates?.longitude || data.trip.startPoint.lng
                        } : undefined,
                        endPoint: data.trip?.endPoint ? {
                            ...data.trip.endPoint,
                            lat: data.trip.endPoint.coordinates?.latitude || data.trip.endPoint.lat,
                            lng: data.trip.endPoint.coordinates?.longitude || data.trip.endPoint.lng
                        } : undefined,
                        waypoints: (data.trip?.waypoints || []).map((wp: any) => ({
                            ...wp,
                            lat: wp.lat || wp.latitude || wp.coordinates?.latitude,
                            lng: wp.lng || wp.longitude || wp.coordinates?.longitude
                        }))
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
    useEffect(() => {
        const token = session?.user?.accessToken || localStorage.getItem('token');
        // Connect to socket (reuses existing connection if already connected)
        const socket = socketManager.connect(socketUrl, token || undefined);
        if (!socket) return;

        socketRef.current = socket;

        // Join appropriate room based on conversation type
        const roomType = conversationType === 'dm' ? 'dm' :
            conversationType === 'community' ? 'community' : 'squad';
        socketManager.joinRoom(conversationId, roomType);

        // Handler for DM messages
        // Handler for DM messages
        const handleReceiveDM = (message: any) => {
            if (message.conversationId === conversationId) {
                setMessages(prev => {
                    // 1. Check for exact duplicate by ID
                    if (prev.some(m => m._id === message._id)) return prev;

                    // 2. If it's my message, try to find and replace the pending/optimistic version
                    // In DM, optimistic messages have senderId == session.user.id
                    // Incoming message usually has sender field as ID string
                    const currentUserId = session?.user?.id;

                    // Normalize sender ID for comparison
                    const msgSenderId = typeof message.sender === 'object' ? message.sender._id : message.sender;

                    if (currentUserId && String(msgSenderId) === String(currentUserId)) {
                        const pendingIndex = prev.findIndex(m =>
                            m.isPending &&
                            m.type === message.type &&
                            // For text: match content. For image: match URL if available
                            (m.type === 'text' ? m.message === message.message : m.imageUrl === message.imageUrl)
                        );

                        if (pendingIndex !== -1) {
                            const newMessages = [...prev];
                            newMessages[pendingIndex] = message;
                            return newMessages;
                        }
                    }

                    // 3. New message, append it
                    return [...prev, message];
                });

                // Scroll if we're near bottom or if it's our message
                virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' });
            }
        };

        // Handler for squad/trip messages
        const handleReceiveMessage = (message: any) => {
            let formattedMessage = { ...message };
            if (message.senderId && typeof message.senderId === 'object') {
                formattedMessage.senderProfilePicture = message.senderId.profilePicture;
                formattedMessage.senderName = message.senderId.name;
                formattedMessage.senderId = message.senderId._id;
            }

            setMessages(prev => {
                // 1. Check for exact duplicate by ID
                if (prev.some(m => m._id === formattedMessage._id)) return prev;

                // 2. If it's my message, try to find and replace the pending/optimistic version
                const currentUserId = session?.user?.id;
                if (currentUserId && formattedMessage.senderId === currentUserId) {
                    const pendingIndex = prev.findIndex(m =>
                        m.isPending &&
                        m.type === formattedMessage.type &&
                        // For text: match content. For image: match URL (or just type if we want to be loose, but URL is safer)
                        (m.type === 'text' ? m.message === formattedMessage.message : m.imageUrl === formattedMessage.imageUrl)
                    );

                    if (pendingIndex !== -1) {
                        const newMessages = [...prev];
                        newMessages[pendingIndex] = formattedMessage;
                        return newMessages;
                    }
                }

                // 3. New message, append it
                return [...prev, formattedMessage];
            });
            virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' });
        };

        const handleTyping = ({ userId, userName }: { userId: string; userName: string }) => {
            setTypingUsers(prev =>
                prev.includes(userName) ? prev : [...prev, userName]
            );
            setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u !== userName));
            }, 3000);
        };

        const handlePinnedMessage = (data: any) => {
            // data from socket event: { messageId, message, senderName, type, imageUrl, pinnedBy, pinnedById }
            // We need to construct a Message-like object
            setPinnedMessage({
                _id: data.messageId,
                senderName: data.senderName,
                message: data.message,
                type: data.type,
                imageUrl: data.imageUrl,
                timestamp: new Date().toISOString(), // Approximate
                senderId: '', // Not needed for banner
                pinnedBy: data.pinnedById
            });
        };
        const handleMessageUnpinned = () => setPinnedMessage(null);

        const handleSocketError = (error: { message: string }) => {
            console.error('Socket error:', error);
            toast.error(error.message || 'An error occurred');

            // If it was a message send error, remove the optimistic message
            setMessages(prev => prev.filter(m => !m.isPending));
            setSending(false);
        };

        // Add listeners
        socketManager.on('receive_dm', handleReceiveDM);
        socketManager.on('receive_message', handleReceiveMessage);
        socketManager.on('typing_squad', handleTyping);
        socketManager.on('message_pinned', handlePinnedMessage);
        socketManager.on('message_unpinned', handleMessageUnpinned);
        socketManager.on('error', handleSocketError);

        return () => {
            // Leave room but DON'T disconnect - other components may use the socket
            socketManager.leaveRoom(conversationId, roomType);
            socketManager.off('receive_dm', handleReceiveDM);
            socketManager.off('receive_message', handleReceiveMessage);
            socketManager.off('typing_squad', handleTyping);
            socketManager.off('message_pinned', handlePinnedMessage);
            socketManager.off('message_unpinned', handleMessageUnpinned);
            socketManager.off('error', handleSocketError);
        };
    }, [socketUrl, conversationId, conversationType, session?.user?.id]);

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
                        replyTo: replyTo?._id // Add replyTo if supported by backend
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    setMessages(prev => [...prev, data.message]);
                    virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' });
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
        // We use loose equality or string conversion to handle number/string ID mismatches
        const isOwn = String(msgSenderId) === String(currentUserId);

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
                formatTime={formatTime}
                onImageClick={setSelectedImage}
            />
        );
    };

    return (
        <div className="chat-view">
            {/* Header */}
            <div className="chat-header">
                {isMobile && (
                    <button onClick={onBack} className="back-btn">
                        <ArrowLeft size={24} />
                    </button>
                )}

                <div className="header-info">
                    {conversationInfo?.avatar ? (
                        <img src={conversationInfo.avatar} alt="" className="header-avatar" />
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
                                        </button >
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
                            {conversationInfo?.startPoint &&
                                typeof conversationInfo.startPoint.lat === 'number' &&
                                typeof conversationInfo.startPoint.lng === 'number' ? (
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
                    background: transparent;
                }
                
                .chat-header {
                    display: flex;
                    align-items: center;
                    padding: 12px 20px;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    gap: 12px;
                    z-index: 10;
                }
                
                .back-btn {
                    color: white;
                    padding: 4px;
                }
                
                .header-info {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .header-avatar, .header-avatar-placeholder {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    object-fit: cover;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                
                .header-avatar-placeholder {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #14b8a6, #0d9488);
                    color: white;
                    font-weight: 600;
                }
                
                .header-name {
                    font-size: 16px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.95);
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    letter-spacing: -0.01em;
                }
                
                .typing-indicator {
                    font-size: 12px;
                    color: #14b8a6;
                    animation: pulse 1.5s infinite;
                    font-weight: 500;
                }
                
                .header-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .header-action-btn {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255, 255, 255, 0.7);
                    border-radius: 10px;
                    transition: all 0.2s;
                }
                
                .header-action-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }
                
                .options-menu-wrapper {
                    position: relative;
                }
                
                .options-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 8px;
                    min-width: 180px;
                    background: rgba(30, 30, 30, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 8px;
                    z-index: 100;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                }
                
                .option-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 10px 12px;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 14px;
                    border-radius: 8px;
                    transition: all 0.2s;
                    text-align: left;
                }
                
                .option-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .option-item.danger {
                    color: #ef4444;
                }
                
                .option-item.danger:hover {
                    background: rgba(239, 68, 68, 0.15);
                }
                
                .pinned-banner {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(249, 115, 22, 0.1);
                    border-bottom: 1px solid rgba(249, 115, 22, 0.2);
                    color: #f97316;
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
                }
                
                .messages-loading {
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .system-message {
                    text-align: center;
                    padding: 8px 16px;
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 12px;
                    margin: 8px 0;
                }
                
                .reply-preview {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(20, 184, 166, 0.1);
                    border-top: 1px solid rgba(20, 184, 166, 0.2);
                    color: #14b8a6;
                    font-size: 13px;
                    overflow: hidden;
                }
                
                .reply-preview button {
                    margin-left: auto;
                    color: rgba(255, 255, 255, 0.5);
                }
                
                .chat-input-wrapper {
                    padding: 16px;
                    padding-top: 8px;
                    padding-bottom: calc(64px + env(safe-area-inset-bottom)); /* Clear mobile nav (h-16 is 64px) + safe area */
                    background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
                }
                
                @media (min-width: 768px) {
                    .chat-input-wrapper {
                        padding: 16px; /* First reset all padding */
                        padding-bottom: 0px; /* Then override bottom specifically */
                    }
                }
                
                .chat-input-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.07);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }
                
                .input-action-btn {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255, 255, 255, 0.6);
                    border-radius: 50%;
                    transition: all 0.2s;
                }
                
                .input-action-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }
                
                .message-input {
                    flex: 1;
                    padding: 10px 4px;
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 15px;
                    outline: none;
                }
                
                .message-input::placeholder {
                    color: rgba(255, 255, 255, 0.3);
                }
                
                .send-btn {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255, 255, 255, 0.4);
                    border-radius: 50%;
                    transition: all 0.2s;
                    transform: scale(0.9);
                }
                
                .send-btn.active {
                    background: #14b8a6;
                    color: white;
                    transform: scale(1);
                    box-shadow: 0 2px 8px rgba(20, 184, 166, 0.4);
                }
                
                .send-btn:disabled {
                    opacity: 0.5;
                }
                
                .hidden {
                    display: none;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>

        </div >
    );
}

// Message Bubble Component with swipe-to-reply and smart grouping
function MessageBubble({
    message,
    isOwn,
    groupPosition,
    onReply,
    onPin,
    formatTime,
    onImageClick
}: {
    message: Message;
    isOwn: boolean;
    groupPosition: 'single' | 'top' | 'middle' | 'bottom';
    onReply: () => void;
    onPin: () => void;
    formatTime: (ts: string) => string;
    onImageClick?: (url: string) => void;
}) {
    const x = useMotionValue(0);
    const replyOpacity = useTransform(x, [-100, -50], [1, 0]);
    const [showActions, setShowActions] = useState(false);

    const handleDragEnd = () => {
        if (x.get() < -50) {
            onReply();
        }
    };

    // Long press handler
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

    const handleTouchStart = () => {
        const timer = setTimeout(() => {
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
        <div className={`message-row ${isOwn ? 'own' : ''} ${groupPosition}`}>
            <motion.div
                className="reply-hint"
                style={{ opacity: replyOpacity }}
            >
                <Reply size={16} />
            </motion.div>

            {/* Profile Picture for received messages - always show */}
            {!isOwn && (
                <img
                    src={
                        message.senderProfilePicture ||
                        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%2306b6d4'/%3E%3Ctext x='16' y='22' font-size='16' text-anchor='middle' fill='white' font-family='Arial'%3E${(message.senderName || 'U').charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`
                    }
                    alt={message.senderName}
                    className="w-8 h-8 rounded-full object-cover mr-2 shrink-0 self-end"
                />
            )}

            <motion.div
                className={`message-bubble ${isOwn ? 'own' : ''} ${message.isPending ? 'pending' : ''}`}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setShowActions(true);
                }}
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
                {/* Message Actions Menu */}
                <AnimatePresence>
                    {showActions && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowActions(false);
                                }}
                            />
                            <motion.div
                                className="absolute z-50 bg-gray-900 border border-gray-700/50 rounded-lg shadow-xl overflow-hidden min-w-[120px]"
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={isOwn ? { right: 0, top: '100%' } : { left: 0, top: '100%' }}
                            >
                                <button
                                    className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReply();
                                        setShowActions(false);
                                    }}
                                >
                                    <Reply size={14} /> Reply
                                </button>
                                <button
                                    className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPin();
                                        setShowActions(false);
                                    }}
                                >
                                    <Pin size={14} /> Pin
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

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
                    color: #14b8a6;
                }
                
                .message-bubble {
                    max-width: 75%;
                    padding: 8px 14px;
                    position: relative;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    transform-origin: bottom right;
                }
                
                .message-bubble.own {
                    background: linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(13, 148, 136, 0.2));
                    border: 1px solid rgba(20, 184, 166, 0.2);
                    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.1);
                }
                
                .message-bubble.pending {
                    opacity: 0.7;
                }
                
                .bubble-sender {
                    font-size: 11px;
                    font-weight: 600;
                    color: rgba(20, 184, 166, 0.9);
                    margin-bottom: 4px;
                    display: flex;
                    align-items: center;
                    gap: 3px;
                }
                
                .bubble-reply {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.6);
                    padding: 6px 10px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    margin-bottom: 6px;
                    border-left: 2px solid #14b8a6;
                }
                
                .bubble-image {
                    max-width: 100%;
                    border-radius: 12px;
                    margin-bottom: 6px;
                }
                
                .bubble-text {
                    color: rgba(255, 255, 255, 0.95);
                    font-size: 15px;
                    line-height: 1.5;
                    word-wrap: break-word;
                    font-weight: 400;
                }
                
                .bubble-time {
                    font-size: 9px;
                    color: rgba(255, 255, 255, 0.3);
                    margin-top: 2px;
                    display: block;
                    text-align: right;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
}
