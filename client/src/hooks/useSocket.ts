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

    const optionsRef = useRef(options);

    // Update ref when options change
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

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
            if (optionsRef.current.roomId) {
                socketRef.current?.emit('join_room', { tripId: optionsRef.current.roomId });
            }
        });

        socketRef.current.on('disconnect', () => {
            setIsConnected(false);
        });

        socketRef.current.on('connect_error', (error) => {
            setConnectionError(error.message);
        });

        // Message handlers - use ref to access latest handlers
        // We create wrapper functions to ensure we always call the latest handler from ref
        const handleReceiveMessage = (message: any) => {
            optionsRef.current.onMessage?.(message);
        };

        const handleTyping = (data: { userId: string; userName: string }) => {
            optionsRef.current.onTyping?.(data);
        };

        const handleUserJoined = (data: any) => {
            optionsRef.current.onUserJoined?.(data);
        };

        const handleUserLeft = (data: any) => {
            optionsRef.current.onUserLeft?.(data);
        };

        const handlePinnedMessage = (message: any) => {
            optionsRef.current.onPinnedMessage?.(message);
        };

        const handleMessageUnpinned = () => {
            optionsRef.current.onMessageUnpinned?.();
        };

        socketRef.current.on('receive_message', handleReceiveMessage);
        socketRef.current.on('typing_squad', handleTyping);
        socketRef.current.on('user_joined', handleUserJoined);
        socketRef.current.on('user_left', handleUserLeft);
        socketRef.current.on('pinned_message', handlePinnedMessage);
        socketRef.current.on('message_unpinned', handleMessageUnpinned);

        return () => {
            if (optionsRef.current.roomId) {
                socketRef.current?.emit('leave_room', { tripId: optionsRef.current.roomId });
            }
            socketRef.current?.off('receive_message', handleReceiveMessage);
            socketRef.current?.off('typing_squad', handleTyping);
            socketRef.current?.off('user_joined', handleUserJoined);
            socketRef.current?.off('user_left', handleUserLeft);
            socketRef.current?.off('pinned_message', handlePinnedMessage);
            socketRef.current?.off('message_unpinned', handleMessageUnpinned);
            socketRef.current?.disconnect();
        };
    }, [socketUrl, options.roomId]); // Only re-connect if socketUrl or roomId changes

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
