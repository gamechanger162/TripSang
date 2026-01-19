'use client';

import { useState, useEffect, useRef } from 'react';
import { useDMSocket } from '@/hooks/useDMSocket';
import MessageBubble from './MessageBubble';
import { DirectMessage } from '@/types/messages';
import { messageAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface DirectMessageBoxProps {
    conversationId: string;
    receiverId: string;
    receiverName: string;
    initialMessages?: DirectMessage[];
}

export default function DirectMessageBox({
    conversationId,
    receiverId,
    receiverName,
    initialMessages = []
}: DirectMessageBoxProps) {
    const { messages, setMessages, sendMessage, isTyping, setIsTyping, connected } = useDMSocket(conversationId);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
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
    }, [messages]);

    const handleSendMessage = () => {
        if (messageInput.trim() && !loading) {
            sendMessage(receiverId, messageInput);
            setMessageInput('');
            setIsTyping(false); // Stop typing indicator
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
        <div className="flex flex-col h-full bg-white dark:bg-dark-800">
            {/* Connection status */}
            {!connected && (
                <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-sm text-center">
                    Reconnecting...
                </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
                            <MessageBubble key={message._id} message={message} />
                        ))}
                        {isTyping && (
                            <div className="flex justify-start mb-4">
                                <div className="bg-gray-100 dark:bg-dark-700 rounded-2xl px-4 py-2 rounded-bl-sm">
                                    <div className="flex space-x-2">
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
            <div className="border-t border-gray-200 dark:border-dark-700 p-4">
                <div className="flex items-end space-x-2">
                    <textarea
                        value={messageInput}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder={`Message ${receiverName}...`}
                        className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 max-h-32"
                        rows={1}
                        disabled={!connected}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || loading || !connected}
                        className="btn-primary flex-shrink-0 h-10 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
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
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
