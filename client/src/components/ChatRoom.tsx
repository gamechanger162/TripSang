'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import { useEnv } from '@/hooks/useEnv';
import toast from 'react-hot-toast';
import { uploadAPI } from '@/lib/api';
import Image from 'next/image';

interface Message {
    _id?: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: string;
    type?: 'text' | 'image' | 'system';
    imageUrl?: string;
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
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

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

            // Join the trip room
            newSocket.emit('join_room', { tripId });
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            // toast.error('Failed to connect to chat'); // Suppress to avoid spam
        });

        // Listen for messages
        newSocket.on('receive_message', (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        // Listen for message history
        newSocket.on('message_history', (history: Message[]) => {
            setMessages(history);
        });

        // Listen for user joined
        newSocket.on('user_joined', (data: { userName: string }) => {
            setMessages(prev => [...prev, {
                senderId: 'system',
                senderName: 'System',
                message: `${data.userName} joined the squad`,
                timestamp: new Date().toISOString(),
                type: 'system'
            }]);
        });

        // Listen for user left
        newSocket.on('user_left', (data: { userName: string }) => {
            setMessages(prev => [...prev, {
                senderId: 'system',
                senderName: 'System',
                message: `${data.userName} left the squad`,
                timestamp: new Date().toISOString(),
                type: 'system'
            }]);
        });

        // Listen for typing events
        newSocket.on('user_typing_squad', (data: { userId: string, userName: string, isTyping: boolean }) => {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                if (data.isTyping) {
                    newSet.add(data.userName);
                } else {
                    newSet.delete(data.userName);
                }
                return newSet;
            });
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            newSocket.emit('leave_room', { tripId });
            newSocket.disconnect();
        };
    }, [tripId, isSquadMember, session, socketUrl]);

    const handleTyping = () => {
        if (!socket) return;

        socket.emit('typing_squad', { tripId, isTyping: true });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_squad', { tripId, isTyping: false });
        }, 2000);
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || !socket || !session) {
            return;
        }

        const messageData = {
            tripId,
            message: newMessage.trim(),
            senderName: session.user.name || 'Anonymous',
            type: 'text'
        };

        socket.emit('send_message', messageData);
        setNewMessage('');
        socket.emit('typing_squad', { tripId, isTyping: false });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !socket || !session) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        try {
            setIsUploading(true);
            const response = await uploadAPI.uploadFile(file);

            if (response.success) {
                const messageData = {
                    tripId,
                    message: 'Shared an image',
                    imageUrl: response.url,
                    senderName: session.user.name || 'Anonymous',
                    type: 'image'
                };
                socket.emit('send_message', messageData);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to send image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (!isSquadMember) {
        return (
            <div className="card text-center py-12 bg-gray-50 dark:bg-dark-800 border-dashed border-2 border-gray-300 dark:border-gray-700">
                <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Join Squad to Access Chat
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                    Connect with other travelers, share plans, and get excited together by joining this trip!
                </p>
            </div>
        );
    }

    return (
        <div className="card flex flex-col h-[600px] p-0 overflow-hidden bg-white dark:bg-dark-800 border-0 shadow-lg">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-dark-800 sticky top-0 z-10">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Squad Chat</h3>
                        <div className="flex items-center text-xs">
                            {connected ? (
                                <span className="flex items-center text-green-600 font-medium">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                                    Online
                                </span>
                            ) : (
                                <span className="flex items-center text-orange-500 font-medium">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-1.5 animate-pulse" />
                                    Connecting...
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-center font-medium">No messages yet.</p>
                        <p className="text-sm text-gray-500">Be the first to say hello! 👋</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        // System message
                        if (msg.type === 'system') {
                            return (
                                <div key={index} className="flex justify-center my-2">
                                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs py-1 px-3 rounded-full">
                                        {msg.message}
                                    </span>
                                </div>
                            );
                        }

                        const isOwnMessage = msg.senderName === session?.user?.name;
                        const showAvatar = index === 0 || messages[index - 1].senderName !== msg.senderName || messages[index - 1].type === 'system';

                        return (
                            <div key={msg._id || index} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
                                {/* Avatar (only for others) */}
                                {!isOwnMessage && (
                                    <div className={`mr-2 w-8 h-8 flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                            {msg.senderName[0]}
                                        </div>
                                    </div>
                                )}

                                <div className={`flex flex-col max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                                    {/* Sender Name (only if first in group) */}
                                    {!isOwnMessage && showAvatar && (
                                        <span className="text-xs text-gray-500 ml-1 mb-1">{msg.senderName}</span>
                                    )}

                                    {/* Message Bubble */}
                                    <div
                                        className={`px-4 py-2 shadow-sm relative ${isOwnMessage
                                            ? 'bg-primary-600 text-white rounded-2xl rounded-tr-sm'
                                            : 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white rounded-2xl rounded-tl-sm'
                                            }`}
                                    >
                                        {msg.type === 'image' && msg.imageUrl ? (
                                            <div className="mb-1 rounded-lg overflow-hidden">
                                                <Image
                                                    src={msg.imageUrl}
                                                    alt="Shared image"
                                                    width={250}
                                                    height={200}
                                                    className="w-full h-auto object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                        )}

                                        <div className={`text-[10px] mt-1 flex justify-end opacity-70 ${isOwnMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Typing Indicator */}
                {typingUsers.size > 0 && (
                    <div className="flex items-center ml-10 space-x-2">
                        <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-2 rounded-xl rounded-tl-none">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-xs text-gray-500">
                            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                        </span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-dark-800 border-t border-gray-100 dark:border-gray-700">
                <form onSubmit={sendMessage} className="flex items-end gap-2">
                    {/* Image Upload Button */}
                    <div className="relative">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                            disabled={!connected || isUploading}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!connected || isUploading}
                            className="p-3 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
                            title="Send image"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping();
                            }}
                            placeholder={isUploading ? "Uploading image..." : "Type your message..."}
                            className="w-full pl-4 pr-10 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-full focus:ring-2 focus:ring-primary-500 dark:text-white transition-all"
                            disabled={!connected || isUploading}
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={!connected || (!newMessage.trim() && !isUploading)}
                        className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                    >
                        {isUploading ? (
                            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
