'use client';

import { useState, useEffect, useRef } from 'react';
import { useDMSocket } from '@/hooks/useDMSocket';
import { DirectMessage } from '@/types/messages';
import { messageAPI, uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ImageViewer from '../ImageViewer';
import {
    AnimatedMeshBackground,
    GlassBubble,
    GlassInputBar,
    GlassTypingIndicator,
    GlassHeader,
} from '../chat/FuturisticUI';

interface FuturisticDirectMessageProps {
    conversationId: string;
    receiverId: string;
    receiverName: string;
    receiverImage?: string;
    initialMessages?: DirectMessage[];
    isBlocked?: boolean;
}

export default function FuturisticDirectMessage({
    conversationId,
    receiverId,
    receiverName,
    receiverImage,
    initialMessages = [],
    isBlocked = false
}: FuturisticDirectMessageProps) {
    const { messages, setMessages, sendMessage, isTyping, setIsTyping, connected } = useDMSocket(conversationId);
    const [messageInput, setMessageInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<DirectMessage | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load initial messages
    useEffect(() => {
        if (initialMessages.length > 0) {
            setMessages(initialMessages);
        }
    }, [initialMessages, setMessages]);

    // Mark conversation as read
    useEffect(() => {
        messageAPI.markAsRead(conversationId).catch(console.error);
    }, [conversationId]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, replyingTo]);

    const handleSendMessage = () => {
        if (messageInput.trim()) {
            const replyToData = replyingTo ? {
                messageId: replyingTo._id,
                senderName: replyingTo.senderName || 'Unknown',
                message: replyingTo.message,
                type: replyingTo.type
            } : undefined;

            sendMessage(receiverId, messageInput, 'text', undefined, replyToData);
            setMessageInput('');
            setReplyingTo(null);
            setIsTyping(false);
        }
    };

    const handleReply = (message: DirectMessage) => {
        setReplyingTo(message);
        inputRef.current?.focus();
    };

    const handleFileUpload = async (file: File) => {
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
            toast.error('Failed to send image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleInputChange = (value: string) => {
        setMessageInput(value);

        if (!isTyping && value.trim()) {
            setIsTyping(true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 3000);
    };

    // Blocked state
    if (isBlocked) {
        return (
            <div className="relative w-full h-[calc(100vh-200px)] min-h-[300px] rounded-2xl overflow-hidden">
                <AnimatedMeshBackground />
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center p-8 rounded-3xl max-w-sm mx-4"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500/30 to-orange-500/30 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Can't Message</h3>
                        <p className="text-white/60 text-sm">
                            You cannot send messages to this user.
                        </p>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[calc(100vh-200px)] min-h-[300px] rounded-2xl overflow-hidden flex flex-col">
            <AnimatedMeshBackground />

            {/* Header */}
            <GlassHeader
                title={receiverName}
                avatarImage={receiverImage}
                isConnected={connected}
                backHref="/messages"
            />

            {/* Connection warning */}
            <AnimatePresence>
                {!connected && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative z-10"
                    >
                        <div
                            className="mx-4 px-4 py-2 rounded-xl text-center text-sm"
                            style={{
                                background: 'rgba(251,191,36,0.2)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(251,191,36,0.3)',
                                color: 'rgba(251,191,36,0.9)',
                            }}
                        >
                            Reconnecting...
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages */}
            <div
                className="relative z-10 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 px-0 py-4"
                style={{
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)',
                }}
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/20 to-orange-500/20 flex items-center justify-center mb-4 backdrop-blur"
                        >
                            <span className="text-4xl">👋</span>
                        </motion.div>
                        <p className="text-lg font-semibold text-white/80 mb-1">Start a conversation</p>
                        <p className="text-sm text-white/40">Say hello to {receiverName}!</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msg, index) => {
                            const isOwnMessage = msg.sender === receiverId ? false : true; // If sender is not receiver, it's our message
                            const showAvatar = index === 0 || messages[index - 1]?.sender !== msg.sender;

                            return (
                                <GlassBubble
                                    key={msg._id || index}
                                    isOwn={isOwnMessage}
                                    senderId={msg.sender}
                                    senderName={msg.senderName}
                                    senderProfilePicture={!isOwnMessage ? receiverImage : undefined}
                                    message={msg.message}
                                    timestamp={msg.timestamp}
                                    type={msg.type as any}
                                    imageUrl={msg.imageUrl}
                                    replyTo={msg.replyTo ? {
                                        senderName: msg.replyTo.senderName || '',
                                        message: msg.replyTo.message || '',
                                        type: msg.replyTo.type,
                                    } : undefined}
                                    showAvatar={showAvatar}
                                    onReply={() => handleReply(msg)}
                                    onImageClick={setViewingImage}
                                    enableSwipeGestures={true}
                                    index={index}
                                />
                            );
                        })}
                    </AnimatePresence>
                )}

                {/* Typing indicator */}
                <AnimatePresence>
                    {isTyping && (
                        <GlassTypingIndicator names={[receiverName]} />
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="relative z-10">
                <GlassInputBar
                    ref={inputRef}
                    value={messageInput}
                    onChange={handleInputChange}
                    onSend={handleSendMessage}
                    onFileUpload={handleFileUpload}
                    placeholder={`Message ${receiverName}...`}
                    disabled={!connected}
                    isUploading={isUploading}
                    replyingTo={replyingTo ? {
                        senderName: replyingTo.senderName || 'Unknown',
                        message: replyingTo.message,
                        type: replyingTo.type
                    } : null}
                    onCancelReply={() => setReplyingTo(null)}
                />
            </div>

            {/* Image Viewer */}
            <ImageViewer
                imageUrl={viewingImage || ''}
                isOpen={!!viewingImage}
                onClose={() => setViewingImage(null)}
                alt="Message image"
            />
        </div>
    );
}
