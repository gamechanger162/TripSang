'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import { useEnv } from '@/hooks/useEnv';
import toast from 'react-hot-toast';

interface Message {
    _id?: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: string;
}

interface ChatRoomProps {
    tripId: string;
    isSquadMember: boolean;
}

export default function ChatRoom({ tripId, isSquadMember }: ChatRoomProps) {
    const { data: session } = useSession();
    const { socketUrl } = useEnv();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [connected, setConnected] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
            toast.success('Connected to chat!');

            // Join the trip room
            newSocket.emit('join_room', { tripId });
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            toast.error('Failed to connect to chat');
        });

        // Listen for messages
        newSocket.on('receive_message', (message: Message) => {
            console.log('Received message:', message);
            setMessages((prev) => [...prev, message]);
        });

        // Listen for message history
        newSocket.on('message_history', (history: Message[]) => {
            console.log('Received history:', history);
            setMessages(history);
        });

        // Listen for user joined
        newSocket.on('user_joined', (data: { userName: string }) => {
            toast(`${data.userName} joined the chat`, { icon: '👋' });
        });

        // Listen for user left
        newSocket.on('user_left', (data: { userName: string }) => {
            toast(`${data.userName} left the chat`, { icon: '👋' });
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            newSocket.emit('leave_room', { tripId });
            newSocket.disconnect();
        };
    }, [tripId, isSquadMember, session, socketUrl]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || !socket || !session) {
            return;
        }

        const messageData = {
            tripId,
            message: newMessage.trim(),
            senderName: session.user.name || 'Anonymous',
        };

        socket.emit('send_message', messageData);
        setNewMessage('');
    };

    if (!isSquadMember) {
        return (
            <div className="card text-center py-12">
                <svg
                    className="w-16 h-16 mx-auto text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Join Squad to Access Chat
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Connect with other travelers by joining this trip
                </p>
            </div>
        );
    }

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-dark-700">
                <div className="flex items-center">
                    <svg
                        className="w-6 h-6 text-primary-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trip Chat</h3>
                </div>
                <div className="flex items-center text-sm">
                    {connected ? (
                        <span className="flex items-center text-green-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                            Connected
                        </span>
                    ) : (
                        <span className="flex items-center text-gray-500">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                            Connecting...
                        </span>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto mb-4 space-y-4 bg-gray-50 dark:bg-dark-800 rounded-lg p-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                            <svg
                                className="w-12 h-12 mx-auto mb-2 opacity-50"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                            No messages yet. Start the conversation!
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isOwnMessage = msg.senderName === session?.user?.name;
                        return (
                            <div
                                key={msg._id || index}
                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwnMessage
                                            ? 'bg-primary-600 text-white rounded-br-none'
                                            : 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white rounded-bl-none'
                                        }`}
                                >
                                    {!isOwnMessage && (
                                        <p className="text-xs font-semibold mb-1 opacity-75">{msg.senderName}</p>
                                    )}
                                    <p className="text-sm break-words">{msg.message}</p>
                                    <p
                                        className={`text-xs mt-1 ${isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                    >
                                        {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="flex items-center space-x-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 input-field"
                    disabled={!connected}
                />
                <button
                    type="submit"
                    disabled={!connected || !newMessage.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                    </svg>
                </button>
            </form>
        </div>
    );
}
