'use client';

import { useState, useEffect, useRef } from 'react';
import { useDMSocket } from '@/hooks/useDMSocket';
import MessageBubble from './MessageBubble';
import { DirectMessage } from '@/types/messages';
import { messageAPI, uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface DirectMessageBoxProps {
    conversationId: string;
    receiverId: string;
    receiverName: string;
    initialMessages?: DirectMessage[];
    isBlocked?: boolean;
}

export default function DirectMessageBox({
    conversationId,
    receiverId,
    receiverName,
    initialMessages = [],
    isBlocked = false
}: DirectMessageBoxProps) {
    const { messages, setMessages, sendMessage, isTyping, setIsTyping, connected } = useDMSocket(conversationId);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [replyingTo, setReplyingTo] = useState<DirectMessage | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load initial messages
    useEffect(() => {
        if (initialMessages.length > 0) {
            setMessages(initialMessages);
        }
    }, [initialMessages, setMessages]);

    // Mark conversation as read when opened
    useEffect(() => {
        messageAPI.markAsRead(conversationId).catch(console.error);
    }, [conversationId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, replyingTo]);

    const handleSendMessage = () => {
        if (messageInput.trim() && !loading) {
            sendMessage(receiverId, messageInput, 'text', undefined);
            setMessageInput('');
            setReplyingTo(null);
            setIsTyping(false); // Stop typing indicator
        }
    };

    // Need to pass this down or use context, but MessageBubble is separate.
    // We can pass onReply prop to MessageBubble if we modify it
    const handleReply = (message: DirectMessage) => {
        setReplyingTo(message);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        try {
            setIsUploading(true);
            const response = await uploadAPI.uploadFile(file);

            if (response.success) {
                sendMessage(receiverId, 'Shared an image', 'image', response.url);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to send image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessageInput(e.target.value);

        // Emit typing indicator
        if (!isTyping && e.target.value.trim()) {
            setIsTyping(true);
        }

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 3000);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Connection status */}
            {!connected && (
                <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-sm text-center">
                    Reconnecting...
                </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-900">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                            Send a message to start the conversation with {receiverName}!
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <MessageBubble
                                key={message._id}
                                message={message}
                                onReply={handleReply}
                            />
                        ))}
                        {isTyping && (
                            <div className="flex justify-start mb-4 px-4">
                                <div className="bg-gray-200 dark:bg-dark-700 rounded-2xl px-4 py-2 rounded-bl-none">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input area */}
            {isBlocked ? (
                <div className="border-t border-gray-700 p-4 bg-gray-800">
                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                        You cannot send messages to this user.
                    </p>
                </div>
            ) : (
                <div className="border-t border-gray-700 p-2 sm:p-4 bg-gray-800 relative">
                    {/* Replying To UI */}
                    {replyingTo && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 p-3 bg-white dark:bg-dark-700 rounded-xl shadow-lg border-l-4 border-primary-500 flex items-center justify-between animate-fade-in-up z-40">
                            <div className="flex-1 min-w-0 mr-2">
                                <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mb-0.5">
                                    Replying to {replyingTo.senderName}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                    {replyingTo.type === 'image' ? '📷 Image' : replyingTo.message}
                                </p>
                            </div>
                            <button
                                onClick={() => setReplyingTo(null)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                    )}

                    <div className="flex items-end space-x-2">
                        {/* Image Upload Button */}
                        <div className="relative pb-1">
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
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors disabled:opacity-50"
                                title="Send image"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>

                        <textarea
                            value={messageInput}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder={isUploading ? "Uploading image..." : `Message ${receiverName}...`}
                            className="flex-1 resize-none rounded-2xl border border-gray-300 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 max-h-32 transition-colors disabled:opacity-50"
                            rows={1}
                            disabled={!connected || isUploading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={(!messageInput.trim() && !isUploading) || loading || !connected}
                            className="btn-primary flex-shrink-0 h-11 w-11 rounded-full p-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                        >
                            {isUploading ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
