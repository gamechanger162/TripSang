'use client';

import { io, Socket } from 'socket.io-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SocketCallback = (...args: any[]) => void;

/**
 * Socket Manager Singleton
 * Maintains a single socket connection shared across all components.
 * Components join/leave rooms on this single connection instead of creating new sockets.
 */
class SocketManager {
    private static instance: SocketManager | null = null;
    private socket: Socket | null = null;
    private socketUrl: string = '';
    private isConnected: boolean = false;
    private listeners: Map<string, Set<SocketCallback>> = new Map();
    private currentRooms: Set<string> = new Set();
    private reconnectTimer: NodeJS.Timeout | null = null;

    private constructor() { }

    static getInstance(): SocketManager {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }

    /**
     * Initialize the socket connection (call once on app load)
     */
    connect(socketUrl: string): Socket | null {
        // Already connected to same URL
        if (this.socket?.connected && this.socketUrl === socketUrl) {
            return this.socket;
        }

        // Different URL or not connected - reconnect
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socketUrl = socketUrl;
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('SocketManager: No auth token');
            return null;
        }

        this.socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 5000
        });

        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('SocketManager: Connected');

            // Rejoin any rooms we were in
            this.currentRooms.forEach(room => {
                if (room.startsWith('dm_')) {
                    this.socket?.emit('join_dm_conversation', { conversationId: room.replace('dm_', '') });
                } else if (room.startsWith('community_')) {
                    this.socket?.emit('join_community', { communityId: room.replace('community_', '') });
                } else {
                    this.socket?.emit('join_room', { tripId: room });
                }
            });
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            console.log('SocketManager: Disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('SocketManager: Connection error', error.message);
        });

        return this.socket;
    }

    getSocket(): Socket | null {
        return this.socket;
    }

    isSocketConnected(): boolean {
        return this.isConnected && this.socket?.connected === true;
    }

    /**
     * Join a room (DM, Squad, or Community)
     */
    joinRoom(roomId: string, type: 'dm' | 'squad' | 'community') {
        if (!this.socket) return;

        const roomKey = type === 'dm' ? `dm_${roomId}` :
            type === 'community' ? `community_${roomId}` : roomId;

        if (this.currentRooms.has(roomKey)) return; // Already in room

        if (type === 'dm') {
            this.socket.emit('join_dm_conversation', { conversationId: roomId });
        } else if (type === 'community') {
            this.socket.emit('join_community', { communityId: roomId });
        } else {
            this.socket.emit('join_room', { tripId: roomId });
        }

        this.currentRooms.add(roomKey);
    }

    /**
     * Leave a room
     */
    leaveRoom(roomId: string, type: 'dm' | 'squad' | 'community') {
        if (!this.socket) return;

        const roomKey = type === 'dm' ? `dm_${roomId}` :
            type === 'community' ? `community_${roomId}` : roomId;

        if (!this.currentRooms.has(roomKey)) return; // Not in room

        if (type === 'dm') {
            this.socket.emit('leave_dm_conversation', { conversationId: roomId });
        } else if (type === 'community') {
            this.socket.emit('leave_community', { communityId: roomId });
        } else {
            this.socket.emit('leave_room', { tripId: roomId });
        }

        this.currentRooms.delete(roomKey);
    }

    /**
     * Add event listener (with deduplication)
     */
    on(event: string, callback: SocketCallback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)?.add(callback);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.socket?.on(event, callback as any);
    }

    /**
     * Remove event listener
     */
    off(event: string, callback: SocketCallback) {
        this.listeners.get(event)?.delete(callback);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.socket?.off(event, callback as any);
    }

    /**
     * Emit event
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit(event: string, data: any) {
        this.socket?.emit(event, data);
    }

    /**
     * Disconnect socket (call on app unmount)
     */
    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.currentRooms.clear();
        this.listeners.clear();
        this.socket?.disconnect();
        this.socket = null;
        this.isConnected = false;
    }
}

export const socketManager = SocketManager.getInstance();
export default socketManager;
