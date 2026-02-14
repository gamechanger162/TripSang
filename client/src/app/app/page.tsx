'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { socketManager } from '@/lib/socketManager';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareDashed } from 'lucide-react';
import toast from 'react-hot-toast';

import ChatList from '@/components/chat/ChatList';
import ChatView from '@/components/chat/ChatView';
import { messageAPI } from '@/lib/api';

export default function ChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    // Removed local socket state in favor of socketManager

    // State
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [blockStatus, setBlockStatus] = useState<{ isBlocked: boolean; blockedByMe: boolean } | null>(null);

    // Mobile: track whether we're showing the chat view
    const [mobileShowChat, setMobileShowChat] = useState(false);

    // Refs for socket listeners to access latest state without re-running effect
    const activeChatRef = useRef(activeChat);
    const sessionRef = useRef(session);

    useEffect(() => {
        activeChatRef.current = activeChat;
        sessionRef.current = session;
    }, [activeChat, session]);

    // 1. Auth & Socket Connection
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (session?.user?.accessToken) {
            const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
            const socket = socketManager.connect(socketUrl, session.user.accessToken);

            if (!socket) return;

            const handleConnect = () => {
                console.log('socket connected', socket.id);
            };

            const handleConnectError = (err: any) => {
                console.error('Socket connection error:', err);
                toast.error('Connection error: ' + err.message);
            };

            const handleError = (err: any) => {
                console.error('Socket generic error:', err);
                toast.error('Error: ' + (err.message || 'Unknown socket error'));
            };

            const handleReceiveMessage = (message: any) => {
                const currentActive = activeChatRef.current;
                const currentSession = sessionRef.current;

                if (currentActive && (
                    message.conversationId === currentActive._id ||
                    message.recipient === currentSession?.user?.id
                )) {
                    setMessages((prev) => [...prev, message]);
                }

                refreshConversations();
            };

            const handleReceiveDM = (message: any) => {
                console.log('Received DM Payload:', JSON.stringify(message, null, 2));
                const currentActive = activeChatRef.current;

                // If this message belongs to the active conversation
                if (currentActive && message.conversationId === currentActive._id) {
                    setMessages((prev) => {
                        // Avoid duplicates if we optimistically added it
                        // Check if we have a temporary message with the same content
                        const tempIndex = prev.findIndex(m =>
                            m._id.startsWith('temp-') &&
                            m.message === message.message &&
                            // Optional: Check if timestamp is within 10 seconds to be safe
                            (Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 10000)
                        );

                        if (tempIndex !== -1) {
                            // Replace temp message with real one
                            const newMessages = [...prev];
                            newMessages[tempIndex] = message;
                            return newMessages;
                        }

                        // Check if message ID already exists
                        if (prev.some(m => m._id === message._id)) {
                            return prev;
                        }

                        return [...prev, message];
                    });
                } else {
                    // Notification logic or update list if not active
                }

                refreshConversations();
            };

            const handleUserStatus = (data: any) => {
                if (data.status === 'online') {
                    setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
                } else {
                    setOnlineUsers(prev => prev.filter(id => id !== data.userId));
                }
            };

            // Attach listeners using socketManager
            socketManager.on('connect', handleConnect);
            socketManager.on('connect_error', handleConnectError);
            socketManager.on('error', handleError);
            socketManager.on('receive_message', handleReceiveMessage);
            socketManager.on('receive_dm', handleReceiveDM);
            socketManager.on('user_status', handleUserStatus);

            refreshConversations();

            return () => {
                // Detach listeners on cleanup
                socketManager.off('connect', handleConnect);
                socketManager.off('connect_error', handleConnectError);
                socketManager.off('error', handleError);
                socketManager.off('receive_message', handleReceiveMessage);
                socketManager.off('receive_dm', handleReceiveDM);
                socketManager.off('user_status', handleUserStatus);
                // We don't disconnect the socket manager here as it might be used by other components
                // potentially use socketManager.disconnect() only on full app unmount or logout
            };
        }
    }, [session?.user?.accessToken, status, router]);

    // Handle ?userId= query param — auto-open DM with that user
    useEffect(() => {
        const targetUserId = searchParams.get('userId');
        if (!targetUserId || status !== 'authenticated' || isLoadingChats) return;

        const openDMWithUser = async () => {
            try {
                // Check if we already have a conversation with this user in the loaded list
                const existing = conversations.find(
                    (c: any) => c.otherUser?._id === targetUserId
                );

                if (existing) {
                    handleSelectChat(existing);
                } else {
                    // Create or find conversation via API
                    const res = await messageAPI.getOrCreateConversation(targetUserId);
                    if (res.success && res.conversation) {
                        // Refresh list first, then select
                        await refreshConversations();
                        handleSelectChat(res.conversation);
                    } else {
                        toast.error('Could not start conversation');
                    }
                }

                // Clear the query param to avoid re-triggering
                router.replace('/app', { scroll: false });
            } catch (err) {
                console.error('Failed to open DM:', err);
                toast.error('Failed to start conversation');
            }
        };

        openDMWithUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, status, isLoadingChats]);

    // 2. Fetch Conversations
    const refreshConversations = async () => {
        if (typeof document !== 'undefined' && document.hidden) return;
        try {
            const res = await messageAPI.getConversations();
            if (res.success) {
                // Backend already returns otherUser at top level — use as-is
                setConversations(res.conversations || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingChats(false);
        }
    };

    // 3. Select Chat & Load Messages
    const handleSelectChat = async (chat: any) => {
        setActiveChat(chat);
        setMobileShowChat(true); // Switch to chat view on mobile
        setIsLoadingMessages(true);
        setMessages([]);

        if (socketManager.isSocketConnected()) {
            // Leave previous room if any
            if (activeChatRef.current) {
                socketManager.emit('leave_dm_conversation', { conversationId: activeChatRef.current._id });
            }
            // Join new room
            socketManager.emit('join_dm_conversation', { conversationId: chat._id });
        }

        try {
            if (chat.unreadCount > 0) {
                await messageAPI.markAsRead(chat._id);
                setConversations(prev => prev.map(c =>
                    c._id === chat._id ? { ...c, unreadCount: 0 } : c
                ));
            }

            console.log(`[DEBUG] Fetching history for chat: ${chat._id}`);
            const res = await messageAPI.getMessageHistory(chat._id);
            console.log(`[DEBUG] History Response:`, res);

            if (res.success) {
                setMessages(res.messages);
            } else {
                console.error('[DEBUG] Fetch failed:', res.message);
                toast.error('Failed to load messages: ' + res.message);
            }
        } catch (err: any) {
            console.error('[DEBUG] Fetch Exception:', err);
            toast.error('Error loading history: ' + (err.message || 'Unknown error'));
        } finally {
            setIsLoadingMessages(false);
        }

        // Fetch block status separately
        if (chat.otherUser?._id) {
            messageAPI.getBlockStatus(chat.otherUser._id)
                .then((res: any) => {
                    setBlockStatus({
                        isBlocked: res.isBlocked || false,
                        blockedByMe: res.blockedByMe || false
                    });
                })
                .catch(() => setBlockStatus(null));
        } else {
            setBlockStatus(null);
        }
    };

    // 4. Go back to list on mobile
    const handleMobileBack = () => {
        if (socketManager.isSocketConnected() && activeChat) {
            socketManager.emit('leave_dm_conversation', { conversationId: activeChat._id });
        }
        setMobileShowChat(false);
        setActiveChat(null);
    };

    // 5. Send Message
    const handleSendMessage = async (text: string, file?: File | null, replyToId?: string) => {
        if (!activeChat || (!text && !file)) return;

        try {
            // Optimistic UI — use field names matching backend schema
            const tempMsg = {
                _id: 'temp-' + Date.now(),
                message: text,
                sender: session?.user?.id, // string ID (backend format after flatten)
                senderName: session?.user?.name,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'text' as const,
                ...(replyToId ? { replyTo: { _id: replyToId } } : {})
            };
            setMessages(prev => [...prev, tempMsg]);

            console.log('Emitting send_dm:', {
                receiverId: activeChat.otherUser?._id,
                message: text,
                conversationId: activeChat._id
            });

            if (socketManager.isSocketConnected()) {
                const socket = socketManager.getSocket();
                if (!socket?.connected) {
                    console.error('Socket not connected when trying to send!');
                    toast.error('Connection lost. Please refresh.');
                    return;
                }

                socketManager.emit('send_dm', {
                    receiverId: activeChat.otherUser?._id,
                    message: text,
                    type: 'text',
                    conversationId: activeChat._id,
                    ...(replyToId ? { replyTo: replyToId } : {})
                });
            } else {
                console.error('Socket instance is null or disconnected');
            }

        } catch (err) {
            console.error('Send error:', err);
        }
    };

    // 6. Delete Message
    const handleDeleteMessage = async (msgId: string) => {
        // Remove optimistic
        setMessages(prev => prev.filter(m => m._id !== msgId));

        try {
            // API call to delete on server
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${msgId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session?.user?.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            // Refresh conversation list so deleted message no longer shows as preview
            refreshConversations();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    // 7. Block/Unblock User
    const handleToggleBlockUser = async () => {
        if (!activeChat?.otherUser?._id) return;
        const userId = activeChat.otherUser._id;
        const isBlocked = blockStatus?.blockedByMe;

        try {
            if (isBlocked) {
                await messageAPI.unblockUser(userId);
                toast.success('User unblocked');
                setBlockStatus(prev => ({ ...prev!, isBlocked: false, blockedByMe: false }));
            } else {
                await messageAPI.blockUser(userId);
                toast.success('User blocked');
                setBlockStatus(prev => ({ ...prev!, isBlocked: true, blockedByMe: true }));
                // Optional: Navigate away? User requested to keep unblock option visible.
                // refreshConversations(); // Update list if needed
            }
        } catch (err) {
            console.error('Block toggle error:', err);
            toast.error(isBlocked ? 'Failed to unblock' : 'Failed to block');
        }
    };

    // 8. View Profile
    const handleViewProfile = (userId?: string) => {
        const targetId = userId || activeChat?.otherUser?._id;
        if (targetId) router.push(`/profile/${targetId}`);
    };

    // 9. Pin Message (Placeholder for now)
    const handlePinMessage = (msgId: string) => {
        toast.success('Message pinned');
    };

    if (status === 'loading') return null;

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* Mobile: Show either ChatList OR ChatView */}
            {/* Desktop: Show both side-by-side */}

            {/* Chat List — full width on mobile, fixed width on desktop */}
            <div className={`
                ${mobileShowChat ? 'hidden' : 'flex'}
                md:flex
                w-full md:w-auto
                h-full
            `}>
                <ChatList
                    conversations={conversations}
                    activeChatId={activeChat?._id}
                    onSelectChat={handleSelectChat}
                    isLoading={isLoadingChats}
                    onlineUsers={onlineUsers}
                />
            </div>

            {/* Chat View / Welcome — hidden on mobile when list is showing */}
            <div className={`
                ${!mobileShowChat ? 'hidden' : 'flex'}
                md:flex
                flex-1 h-full min-w-0 bg-[#0B0E11] relative flex-col
            `}>
                {activeChat ? (
                    <ChatView
                        messages={messages}
                        currentUser={session?.user}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoadingMessages}
                        chatTitle={activeChat.otherUser?.name || 'Chat'}
                        chatSubtitle={onlineUsers.includes(activeChat.otherUser?._id) ? 'Online' : ''}
                        chatImage={activeChat.otherUser?.profilePicture}
                        onBack={handleMobileBack}
                        onDeleteMessage={handleDeleteMessage}
                        onBlockUser={handleToggleBlockUser}
                        blockStatus={blockStatus}
                        onViewProfile={() => handleViewProfile()}
                    />
                ) : (
                    // Welcome Screen (desktop only, mobile will never reach here)
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 relative overflow-hidden bg-zinc-950">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative z-10 max-w-md"
                        >
                            <div className="w-24 h-24 bg-gradient-to-tr from-zinc-800 to-zinc-900 rounded-3xl mx-auto mb-6 flex items-center justify-center border border-white/5 shadow-2xl shadow-black/50">
                                <MessageSquareDashed className="w-10 h-10 text-cyan-500" />
                            </div>

                            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                                Welcome to TripSang Talk
                            </h1>
                            <p className="text-zinc-500 mb-8 leading-relaxed">
                                Select a conversation to start chatting, or find new travel buddies in Suggestion.
                            </p>

                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-xs text-zinc-500">
                                <span>🔒</span> End-to-end encrypted
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
