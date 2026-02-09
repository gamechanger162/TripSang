'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { DirectMessage, DMNotification } from '@/types/messages';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface UseDMSocketReturn {
    socket: Socket | null;
    messages: DirectMessage[];
    setMessages: React.Dispatch<React.SetStateAction<DirectMessage[]>>;
    sendMessage: (receiverId: string, message: string, type?: 'text' | 'image', imageUrl?: string, replyTo?: { messageId: string; senderName: string; message: string; type?: 'text' | 'image' }) => void;
    isTyping: boolean;
    setIsTyping: (typing: boolean) => void;
    connected: boolean;
}

export const useDMSocket = (conversationId?: string): UseDMSocketReturn => {
    const { data: session } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [connected, setConnected] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!session?.user?.accessToken) return;

        // Initialize socket connection
        const socketInstance = io(SOCKET_URL, {
            auth: {
                token: session.user.accessToken
            },
            transports: ['websocket', 'polling']
        });

        socketInstance.on('connect', () => {
            console.log('💬 DM Socket connected');
            setConnected(true);

            // Join conversation room if conversationId is provided
            if (conversationId) {
                socketInstance.emit('join_dm_conversation', { conversationId });
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('💬 DM Socket disconnected');
            setConnected(false);
        });

        // Listen for incoming messages
        socketInstance.on('receive_dm', (message: DirectMessage) => {
            console.log('📨 Received DM:', message);
            setMessages(prev => [...prev, message]);
        });

        // Listen for message deletion
        socketInstance.on('message_deleted', ({ messageId }: { messageId: string }) => {
            console.log('🗑️ Message deleted:', messageId);
            setMessages(prev => prev.filter(msg => msg._id !== messageId));
        });

        // Listen for typing indicators
        socketInstance.on('user_typing_dm', ({ userName, isTyping }: { userName: string; isTyping: boolean }) => {
            setIsTyping(isTyping);
            if (isTyping) {
                // Auto-clear typing indicator after 3 seconds
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                    setIsTyping(false);
                }, 3000);
            }
        });

        // Listen for errors
        socketInstance.on('error', (error: { message: string }) => {
            console.error('Socket error:', error.message);
        });

        setSocket(socketInstance);

        // Cleanup on unmount or conversationId change
        return () => {
            if (conversationId) {
                socketInstance.emit('leave_dm_conversation', { conversationId });
            }
            socketInstance.disconnect();
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [session?.user?.accessToken, conversationId]);

    const sendMessage = (
        receiverId: string,
        message: string,
        type: 'text' | 'image' = 'text',
        imageUrl?: string,
        replyTo?: { messageId: string; senderName: string; message: string; type?: 'text' | 'image' }
    ) => {
        if (socket && conversationId) {
            console.log('📤 Sending DM:', { conversationId, receiverId, message: message.substring(0, 20), type, hasReplyTo: !!replyTo });
            socket.emit('send_dm', {
                conversationId,
                receiverId,
                message: message.trim(),
                type,
                imageUrl,
                replyTo
            });
        } else {
            console.error('❌ Cannot send DM: socket not connected or no conversationId', { hasSocket: !!socket, conversationId });
        }
    };

    const emitTyping = (typing: boolean) => {
        if (socket && conversationId) {
            socket.emit('typing_dm', { conversationId, isTyping: typing });
        }
    };

    return {
        socket,
        messages,
        setMessages,
        sendMessage,
        isTyping,
        setIsTyping: emitTyping,
        connected
    };
};

export default useDMSocket;
