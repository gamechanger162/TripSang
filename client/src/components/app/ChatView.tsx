'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { messageAPI } from '@/lib/api';
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
    Ban,
    Flag,
    VolumeX,
    User
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useEnv } from '@/hooks/useEnv';
import VerifiedBadge from './ui/VerifiedBadge';
import GlassCard from './ui/GlassCard';

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

    // Fetch messages
    const fetchMessages = useCallback(async () => {
        try {
            const token = session?.user?.accessToken || localStorage.getItem('token');

            // Use different endpoint based on conversation type
            let endpoint: string;
            if (conversationType === 'squad') {
                endpoint = `${apiUrl}/api/trips/${conversationId}/chat`;
            } else {
                // DM conversation - use the history endpoint
                endpoint = `${apiUrl}/api/messages/${conversationId}/history`;
            }

            const response = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // Reverse messages for DM so newest are at bottom
                const msgs = data.messages || [];
                setMessages(conversationType === 'dm' ? msgs.reverse() : msgs);

                // Set conversation info based on type
                if (conversationType === 'squad') {
                    setConversationInfo({
                        name: data.trip?.title || data.tripTitle || 'Squad Chat',
                        avatar: data.trip?.coverPhoto,
                        type: 'squad'
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
    }, [apiUrl, conversationId, conversationType, session]);

    useEffect(() => {
        fetchMessages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId, conversationType]); // Only fetch when conversation changes

    // Socket connection
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        socketRef.current = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
            timeout: 10000, // 10 second timeout
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 1000
        });

        socketRef.current.emit('join_room', { tripId: conversationId });

        socketRef.current.on('receive_message', (message: any) => {
            // Transform if senderId is populated (object)
            let formattedMessage = { ...message };
            if (message.senderId && typeof message.senderId === 'object') {
                formattedMessage.senderProfilePicture = message.senderId.profilePicture;
                formattedMessage.senderName = message.senderId.name;
                formattedMessage.senderId = message.senderId._id;
            }

            setMessages(prev => [...prev, formattedMessage]);
            virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' });
        });

        socketRef.current.on('typing_squad', ({ userId, userName }) => {
            setTypingUsers(prev =>
                prev.includes(userName) ? prev : [...prev, userName]
            );
            setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u !== userName));
            }, 3000);
        });

        socketRef.current.on('pinned_message', (msg: Message) => {
            setPinnedMessage(msg);
        });

        socketRef.current.on('message_unpinned', () => {
            setPinnedMessage(null);
        });

        return () => {
            socketRef.current?.emit('leave_room', { tripId: conversationId });
            socketRef.current?.disconnect();
        };
    }, [socketUrl, conversationId]);

    // Send message with optimistic update
    const sendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            _id: tempId,
            senderId: session?.user?.id || '',
            senderName: session?.user?.name || 'You',
            senderProfilePicture: session?.user?.image || undefined,
            message: newMessage,
            timestamp: new Date().toISOString(),
            type: 'text',
            isPending: true,
            replyTo: replyTo ? { senderName: replyTo.senderName, message: replyTo.message } : undefined
        };

        // Optimistic update
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        setReplyTo(null);
        virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' });

        setSending(true);
        try {
            if (conversationType === 'dm') {
                // DM messages use Socket.IO (not REST API)
                socketRef.current?.emit('send_dm', {
                    conversationId,
                    receiverId: conversationInfo?.otherUserId || conversationInfo?._id,
                    message: optimisticMessage.message,
                    type: 'text',
                    replyTo: replyTo?._id
                });

                // Remove pending state - real message will come via socket
                setMessages(prev =>
                    prev.map(m => m._id === tempId ? { ...m, isPending: false } : m)
                );
            } else {
                // Squad/Community messages use socket
                socketRef.current?.emit('send_message', {
                    tripId: conversationId,
                    message: optimisticMessage.message,
                    type: 'text',
                    replyTo: replyTo ? replyTo._id : undefined
                });

                // Remove pending state
                setMessages(prev =>
                    prev.map(m => m._id === tempId ? { ...m, isPending: false } : m)
                );
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            // Remove failed message
            setMessages(prev => prev.filter(m => m._id !== tempId));
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

            // First upload the image
            const uploadResponse = await fetch(`${apiUrl}/api/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Upload failed');
            }

            const { url } = await uploadResponse.json();

            if (conversationType === 'dm') {
                // DM images use Socket.IO (same as text messages)
                socketRef.current?.emit('send_dm', {
                    conversationId,
                    receiverId: conversationInfo?.otherUserId || conversationInfo?._id,
                    message: '',
                    type: 'image',
                    imageUrl: url
                });
            } else if (conversationType === 'community') {
                // Community images use REST API
                const response = await fetch(`${apiUrl}/api/communities/${conversationId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        message: '',
                        type: 'image',
                        imageUrl: url
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    setMessages(prev => [...prev, data.message]);
                }
            } else {
                // Squad images use Socket.IO
                socketRef.current?.emit('send_message', {
                    tripId: conversationId,
                    message: '',
                    type: 'image',
                    imageUrl: url
                });
            }
        } catch (error) {
            console.error('Image upload failed:', error);
        }
    };

    // Format timestamp
    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    // Block user
    const handleBlockUser = async () => {
        if (!conversationInfo?._id || conversationType === 'squad') return;

        if (window.confirm(`Are you sure you want to block ${conversationInfo.name}?`)) {
            try {
                await messageAPI.blockUser(conversationInfo._id);
                toast.success('User blocked');
                router.push('/app'); // Redirect to main app
            } catch (error) {
                console.error('Failed to block user:', error);
                toast.error('Failed to block user');
            }
        }
    };

    // Report user
    const handleReportUser = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Submitting report...',
                success: 'User reported',
                error: 'Failed to report'
            }
        );
        setShowOptionsMenu(false);
    };

    const renderMessage = (index: number, msg: Message) => {
        const isOwn = msg.senderId === session?.user?.id;
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
                    setPinnedMessage(msg);
                    // Add API call to persist pin if needed
                }}
                formatTime={formatTime}
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
                            <button
                                className="header-action-btn text-red-400 hover:text-red-300"
                                onClick={async () => {
                                    if (window.confirm('Are you sure you want to leave this squad?')) {
                                        try {
                                            await fetch(`${apiUrl}/api/trips/${conversationId}/leave`, {
                                                method: 'POST',
                                                headers: {
                                                    'Authorization': `Bearer ${session?.user?.accessToken || localStorage.getItem('token')}`
                                                }
                                            });
                                            toast.success('Left squad');
                                            onBack();
                                        } catch (error) {
                                            toast.error('Failed to leave squad');
                                        }
                                    }
                                }}
                                title="Leave Squad"
                            >
                                <User size={20} />
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
                                        <User size={16} />
                                        View Profile
                                    </button>
                                    <button className="option-item" onClick={() => { setShowOptionsMenu(false); }}>
                                        <VolumeX size={16} />
                                        Mute Notifications
                                    </button>
                                    <button className="option-item danger" onClick={handleBlockUser}>
                                        <Ban size={16} />
                                        Block User
                                    </button>
                                    <button className="option-item danger" onClick={handleReportUser}>
                                        <Flag size={16} />
                                        Report User
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Pinned Message */}
            <AnimatePresence>
                {pinnedMessage && (
                    <motion.div
                        className="pinned-banner"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <Pin size={14} />
                        <span className="pinned-text">
                            <strong>{pinnedMessage.senderName}:</strong> {pinnedMessage.message}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mini Map for Squad Chats */}
            <AnimatePresence>
                {showMiniMap && conversationType === 'squad' && (
                    <motion.div
                        className="mini-map-container"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 200, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '8px',
                            background: 'rgba(0, 0, 0, 0.3)'
                        }}
                    >
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
                            Trip Location Map
                            <br />
                            <small style={{ opacity: 0.7 }}>(Map integration coming soon)</small>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages */}
            <div className="messages-container">
                {loading ? (
                    <div className="messages-loading">
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
                        initialTopMostItemIndex={messages.length - 1}
                    />
                )}
            </div>

            {/* Reply Preview */}
            <AnimatePresence>
                {replyTo && (
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
                )}
            </AnimatePresence>

            {/* Input Island */}
            <div className="chat-input-wrapper">
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
            </div>

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
                    background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
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
    formatTime
}: {
    message: Message;
    isOwn: boolean;
    groupPosition: 'single' | 'top' | 'middle' | 'bottom';
    onReply: () => void;
    onPin: () => void;
    formatTime: (ts: string) => string;
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

            {/* Profile Picture for received messages */}
            {!isOwn && (groupPosition === 'bottom' || groupPosition === 'single') && (
                <img
                    src={
                        message.senderProfilePicture ||
                        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%2306b6d4'/%3E%3Ctext x='16' y='22' font-size='16' text-anchor='middle' fill='white' font-family='Arial'%3E${(message.senderName || 'U').charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`
                    }
                    alt={message.senderName}
                    className="w-8 h-8 rounded-full object-cover mr-2 shrink-0"
                />
            )}
            {!isOwn && (groupPosition === 'top' || groupPosition === 'middle') && (
                <div className="w-8 mr-2 shrink-0" /> // Spacer for alignment
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
                    <img src={message.imageUrl} alt="" className="bubble-image" />
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
