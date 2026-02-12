'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { messageAPI, uploadAPI, communityAPI } from '@/lib/api';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
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
    Trash2,
    Copy
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
                        // Map data for CollaborativeMap - Normalize coordinates from Trip schema
                        startPoint: data.trip?.startPoint ? {
                            name: data.trip.startPoint.name || 'Start',
                            lat: data.trip.startPoint.coordinates?.latitude || data.trip.startPoint.lat || 0,
                            lng: data.trip.startPoint.coordinates?.longitude || data.trip.startPoint.lng || 0
                        } : undefined,

                        endPoint: data.trip?.endPoint ? {
                            name: data.trip.endPoint.name || 'End',
                            lat: data.trip.endPoint.coordinates?.latitude || data.trip.endPoint.lat || 0,
                            lng: data.trip.endPoint.coordinates?.longitude || data.trip.endPoint.lng || 0
                        } : undefined,

                        waypoints: (data.trip?.waypoints || []).map((wp: any) => ({
                            lat: wp.lat || wp.coordinates?.latitude || 0,
                            lng: wp.lng || wp.coordinates?.longitude || 0,
                            name: wp.name
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
                        type: 'community',
                        adminOnlyMessages: data.community?.adminOnlyMessages || false,
                        isCreator: data.isCreator || false,
                        creatorId: data.community?.creator?._id || data.community?.creator,
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
            <div className="relative group/msg px-2 sm:px-0">
                <MessageBubble
                    key={msg._id}
                    message={msg}
                    isOwn={isOwn}
                    groupPosition={groupPosition}
                    onReply={() => setReplyTo(msg)}
                    onPin={() => {
                        if (conversationType === 'squad') {
                            socketRef.current?.emit('pin_message', {
                                tripId: conversationId,
                                messageId: msg._id
                            });
                        } else if (conversationType === 'community') {
                            const token = session?.user?.accessToken || localStorage.getItem('token');
                            fetch(`${apiUrl}/api/communities/${conversationId}/messages/${msg._id}/pin`, {
                                method: 'PUT',
                                headers: { Authorization: `Bearer ${token}` }
                            }).then(res => res.json()).then(data => {
                                if (data.success) {
                                    toast.success(data.message);
                                    setPinnedMessage(data.pinnedMessage);
                                } else {
                                    toast.error(data.message || 'Failed to pin');
                                }
                            }).catch(() => toast.error('Failed to pin message'));
                            return;
                        }
                        setPinnedMessage(msg);
                    }}
                    onDelete={() => handleDeleteMessage(msg._id)}
                    formatTime={formatTime}
                    onImageClick={setSelectedImage}
                    conversationType={conversationType}
                    isMobile={isMobile}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedMessages.has(msg._id)}
                    onSelect={() => {
                        const newSelected = new Set(selectedMessages);
                        if (newSelected.has(msg._id)) {
                            newSelected.delete(msg._id);
                        } else {
                            newSelected.add(msg._id);
                        }
                        setSelectedMessages(newSelected);
                    }}
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden relative bg-[#000a1f]">
            {/* Header */}
            {/* Header */}
            <div className="h-14 sm:h-16 px-3 sm:px-6 border-b border-white/5 flex items-center gap-3 bg-zinc-900/30 backdrop-blur-md z-50 shrink-0">
                {isMobile && (
                    <button
                        onClick={onBack}
                        className="p-1.5 -ml-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors md:hidden"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                <div
                    className="flex-1 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
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
                    <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-tr from-violet-500 to-fuchsia-500 p-0.5 shrink-0">
                        {conversationInfo?.avatar ? (
                            <Image
                                src={conversationInfo.avatar}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover rounded-full border-2 border-zinc-900"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-bold text-white text-sm">
                                {conversationInfo?.name?.charAt(0) || '?'}
                            </div>
                        )}
                    </div>

                    <div className="min-w-0">
                        <h2 className="font-semibold text-white text-sm sm:text-base truncate flex items-center gap-1">
                            {conversationInfo?.name || 'Loading...'}
                            {conversationInfo?.isVerified && <VerifiedBadge size="sm" />}
                        </h2>
                        {typingUsers.length > 0 ? (
                            <p className="text-[11px] sm:text-xs text-emerald-400 truncate animate-pulse">
                                {typingUsers.join(', ')} typing...
                            </p>
                        ) : (
                            <p className="text-[11px] sm:text-xs text-zinc-500 truncate">
                                {conversationInfo?.memberCount || conversationInfo?.members?.length || 0} members
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 relative">
                    {!isSelectionMode && (
                        <button
                            onClick={() => setIsSelectionMode(true)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden sm:flex"
                            title="Select Messages"
                        >
                            <MoreVertical size={18} className="rotate-90" />
                        </button>
                    )}

                    {conversationInfo?.type === 'squad' && (
                        <button
                            className={`p-2 rounded-full transition-colors ${showMiniMap ? 'text-teal-400 bg-teal-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                            onClick={() => setShowMiniMap(!showMiniMap)}
                        >
                            <MapPin size={20} />
                        </button>
                    )}

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
                                        <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 transition-colors flex items-center gap-3">
                                            <VolumeX size={16} className="text-zinc-400" />
                                            Mute Notifications
                                        </button>

                                        {conversationType === 'dm' && (
                                            <>
                                                {isBlocked ? (
                                                    <button
                                                        className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 transition-colors flex items-center gap-3"
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
                                                            } catch {
                                                                toast.error('Failed to unblock user');
                                                            }
                                                        }}
                                                    >
                                                        <VolumeX size={16} className="text-zinc-400" />
                                                        Unblock User
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3 border-t border-white/5"
                                                        onClick={async () => {
                                                            setShowOptionsMenu(false);
                                                            if (window.confirm('Are you sure you want to block this user? You will no longer receive messages from them.')) {
                                                                try {
                                                                    const token = session?.user?.accessToken || localStorage.getItem('token');
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
                                                                } catch {
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
                                                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3 border-t border-white/5"
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
                                                            } catch {
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
                                                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
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
                                </>
                            )}
                        </AnimatePresence >
                    </div >
                </div >
            </div >

            {/* Pinned Message */}
            <AnimatePresence>
                {pinnedMessage && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-cyan-900/10 border-b border-cyan-500/10 backdrop-blur-sm px-4 py-2 flex items-center gap-3 relative z-10"
                    >
                        <Pin size={14} className="text-cyan-400/70 flex-shrink-0" />
                        <span className="flex-1 min-w-0 text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                            <span className="font-semibold text-cyan-400">{pinnedMessage.senderName}</span>
                            <span className="text-cyan-400/70 mx-1">:</span>
                            <span className="text-zinc-300">{pinnedMessage.message || (pinnedMessage.type === 'image' ? '📷 Image' : '')}</span>
                        </span>

                        {/* Unpin Button */}
                        {(pinnedMessage.pinnedBy === getCurrentUserId() || conversationInfo?.creatorId === getCurrentUserId()) && (
                            <button
                                onClick={() => {
                                    if (conversationType === 'squad') {
                                        socketRef.current?.emit('unpin_message', { tripId: conversationId });
                                    }
                                }}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mini Map for Squad Chats */}
            <AnimatePresence>
                {
                    showMiniMap && conversationType === 'squad' && (
                        <motion.div
                            className="mini-map-container relative"
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
                            {/* Close Button */}
                            <button
                                onClick={() => setShowMiniMap(false)}
                                className="absolute top-3 right-3 z-[500] w-8 h-8 bg-black/60 hover:bg-black/80 backdrop-blur rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
                                title="Close map"
                            >
                                <X size={16} />
                            </button>
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
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 sm:px-6 sm:py-4 relative bg-transparent">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
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
            </div>

            {/* Input Area */}
            <div className="bg-zinc-900/50 backdrop-blur-md border-t border-white/5 relative z-20 shrink-0">
                {/* Bottom: Message Input or Admin-Only Notice */}
                {conversationType === 'community' && conversationInfo?.adminOnlyMessages && !conversationInfo?.isCreator ? (
                    <div className="px-4 py-4 border-t border-white/5">
                        <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm bg-zinc-900/50 py-3 rounded-xl border border-white/5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            Only admins can send messages
                        </div>
                    </div>
                ) : (
                    <>
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
                            onClick={() => document.querySelector<HTMLInputElement>('.message-input')?.focus()}
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
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    className="message-input flex-1 bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none py-2"
                                />

                                <button
                                    className={`p-2 rounded-xl transition-all ${newMessage.trim() || sending
                                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                                        : 'bg-zinc-800 text-zinc-600'
                                        }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        sendMessage();
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
                    </>
                )}
            </div>

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
                        <div className="absolute bottom-24 right-4 z-[60] flex flex-col items-center gap-3 bg-zinc-900/80 backdrop-blur-md p-3 rounded-full border border-white/10 shadow-2xl">
                            <button
                                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-all"
                                onClick={(e) => { e.stopPropagation(); setZoomLevel(Math.min(5, zoomLevel + 0.5)); }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                            </button>

                            <span className="text-white/90 text-[10px] font-medium w-full text-center">{Math.round(zoomLevel)}x</span>
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
                                                <div
                                                    className="flex items-center gap-3 overflow-hidden cursor-pointer"
                                                    onClick={() => {
                                                        setShowTripDetails(false);
                                                        router.push(`/profile/${member._id}`);
                                                    }}
                                                >
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
    const [showActions, setShowActions] = useState(false);

    return (
        <div className={`flex w-full px-2 sm:px-4 py-0.5 group relative hover:bg-white/5 transition-colors ${isOwn ? 'justify-end' : 'justify-start'}`}>



            {/* Selection Checkbox */}
            {isSelectionMode && (
                <div
                    className="flex items-center justify-center mr-3 cursor-pointer shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect?.();
                    }}
                >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-zinc-500'}`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                </div>
            )}

            {/* Avatar (Only for received messages) */}
            {!isOwn && (
                <div className={`w-8 h-8 mr-2 shrink-0 flex flex-col justify-end ${(groupPosition === 'bottom' || groupPosition === 'single') ? 'visible' : 'invisible'}`}>
                    {(groupPosition === 'bottom' || groupPosition === 'single') && (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                            {message.senderProfilePicture ? (
                                <Image
                                    src={message.senderProfilePicture}
                                    alt={message.senderName}
                                    width={32} height={32}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                    {message.senderName?.[0]}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Bubble Container */}
            <div className={`relative max-w-[85%] sm:max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>

                {/* Sender Name (Only first message in group for received) */}
                {!isOwn && (groupPosition === 'top' || groupPosition === 'single') && (
                    <span className="text-[11px] text-zinc-400 ml-1 mb-1 font-medium flex items-center gap-1">
                        {message.senderName}
                        {message.isVerified && <VerifiedBadge size="sm" />}
                    </span>
                )}

                {/* Message Bubble */}
                <div
                    className={`
                        relative px-3 py-2 text-sm shadow-sm break-words min-w-[60px]
                        ${isOwn
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl rounded-tr-sm'
                            : 'bg-zinc-800 text-zinc-100 rounded-2xl rounded-tl-sm border border-white/5'}
                        ${groupPosition === 'top' && isOwn ? 'rounded-br-md' : ''}
                        ${groupPosition === 'middle' && isOwn ? 'rounded-br-md rounded-tr-md' : ''}
                        ${groupPosition === 'bottom' && isOwn ? 'rounded-br-2xl' : ''}
                    `}
                >
                    {/* Reply Context */}
                    {message.replyTo && (
                        <div className={`mb-1 p-2 rounded-lg text-xs border-l-2 ${isOwn ? 'bg-black/10 border-white/30' : 'bg-black/20 border-cyan-500/50'}`}>
                            <p className="font-semibold opacity-70 mb-0.5">{message.replyTo.senderName}</p>
                            <p className="opacity-60 truncate">{message.replyTo.message}</p>
                        </div>
                    )}

                    {/* Image Content */}
                    {message.type === 'image' && message.imageUrl && (
                        <div
                            className="mb-1 rounded-lg overflow-hidden cursor-pointer relative group/image"
                            onClick={(e) => {
                                e.stopPropagation();
                                onImageClick?.(message.imageUrl!);
                            }}
                        >
                            <Image
                                src={message.imageUrl}
                                alt="Shared image"
                                width={300} height={200}
                                className="object-cover max-h-60 w-full"
                            />
                        </div>
                    )}

                    {/* Text Content */}
                    <p className="whitespace-pre-wrap leading-relaxed">{message.message}</p>

                    {/* Time & Validations */}
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isOwn ? 'text-white/70' : 'text-zinc-500'}`}>
                        <span>{formatTime(message.timestamp)}</span>
                        {isOwn && (
                            <span>
                                {message.isPending ? '• Sending' : '• Sent'}
                            </span>
                        )}
                        {message.pinnedBy && <Pin size={10} className="ml-1 fill-current" />}
                    </div>

                    {/* Options Button (Inside Bubble for visibility) */}
                    <div className={`absolute top-0 ${isOwn ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-center justify-center h-full`}>
                        <button
                            className="p-1.5 rounded-full bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white shadow-lg backdrop-blur-md"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowActions(!showActions);
                            }}
                        >
                            <MoreVertical size={14} />
                        </button>
                    </div>

                    {/* Dropdown Menu (Popup) */}
                    <AnimatePresence>
                        {showActions && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`absolute bottom-full ${isOwn ? 'right-0' : 'left-0'} mb-1 bg-zinc-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden min-w-[140px] py-1`}
                                >
                                    <button
                                        onClick={() => { onReply(); setShowActions(false); }}
                                        className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 flex items-center gap-2"
                                    >
                                        <Reply size={14} /> Reply
                                    </button>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(message.message); setShowActions(false); toast.success('Copied'); }}
                                        className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 flex items-center gap-2"
                                    >
                                        <Copy size={14} /> Copy
                                    </button>

                                    {/* Pin Option */}
                                    <button
                                        onClick={() => { onPin(); setShowActions(false); }}
                                        className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 flex items-center gap-2"
                                    >
                                        <Pin size={14} /> {message.pinnedBy ? 'Unpin' : 'Pin'}
                                    </button>

                                    {/* Delete (Own or Creator) */}
                                    {(isOwn || conversationType === 'squad') && ( // Logic for delete permission needs check
                                        <button
                                            onClick={() => { onDelete(); setShowActions(false); }}
                                            className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
    );
}

// Helper to check if pinned
function isPinned(msg: Message) {
    return !!msg.pinnedBy;
}
