'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useEnv } from './useEnv';

interface UseSocketOptions {
    roomId?: string;
    onMessage?: (message: any) => void;
    onTyping?: (data: { userId: string; userName: string }) => void;
    onUserJoined?: (data: any) => void;
    onUserLeft?: (data: any) => void;
    onPinnedMessage?: (message: any) => void;
    onMessageUnpinned?: () => void;
}

export function useSocket(options: UseSocketOptions = {}) {
    const { socketUrl } = useEnv();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    // Initialize socket connection
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setConnectionError('No auth token');
            return;
        }

        socketRef.current = io(socketUrl, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current.on('connect', () => {
            setIsConnected(true);
            setConnectionError(null);

            // Join room if specified
            if (options.roomId) {
                socketRef.current?.emit('join_room', { tripId: options.roomId });
            }
        });

        socketRef.current.on('disconnect', () => {
            setIsConnected(false);
        });

        socketRef.current.on('connect_error', (error) => {
            setConnectionError(error.message);
        });

        // Message handlers
        if (options.onMessage) {
            socketRef.current.on('receive_message', options.onMessage);
        }

        if (options.onTyping) {
            socketRef.current.on('typing_squad', options.onTyping);
        }

        if (options.onUserJoined) {
            socketRef.current.on('user_joined', options.onUserJoined);
        }

        if (options.onUserLeft) {
            socketRef.current.on('user_left', options.onUserLeft);
        }

        if (options.onPinnedMessage) {
            socketRef.current.on('pinned_message', options.onPinnedMessage);
        }

        if (options.onMessageUnpinned) {
            socketRef.current.on('message_unpinned', options.onMessageUnpinned);
        }

        return () => {
            if (options.roomId) {
                socketRef.current?.emit('leave_room', { tripId: options.roomId });
            }
            socketRef.current?.disconnect();
        };
    }, [socketUrl, options.roomId]);

    // Send message
    const sendMessage = useCallback((data: {
        tripId: string;
        message: string;
        type: 'text' | 'image';
        imageUrl?: string;
        replyTo?: { senderName: string; message: string };
    }) => {
        socketRef.current?.emit('send_message', data);
    }, []);

    // Send typing indicator
    const sendTyping = useCallback((tripId: string) => {
        socketRef.current?.emit('typing', { tripId });
    }, []);

    // Pin message
    const pinMessage = useCallback((tripId: string, messageId: string) => {
        socketRef.current?.emit('pin_message', { tripId, messageId });
    }, []);

    // Unpin message
    const unpinMessage = useCallback((tripId: string) => {
        socketRef.current?.emit('unpin_message', { tripId });
    }, []);

    // Join room
    const joinRoom = useCallback((roomId: string) => {
        socketRef.current?.emit('join_room', { tripId: roomId });
    }, []);

    // Leave room
    const leaveRoom = useCallback((roomId: string) => {
        socketRef.current?.emit('leave_room', { tripId: roomId });
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        connectionError,
        sendMessage,
        sendTyping,
        pinMessage,
        unpinMessage,
        joinRoom,
        leaveRoom,
    };
}
