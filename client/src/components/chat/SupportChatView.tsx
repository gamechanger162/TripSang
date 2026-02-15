'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Headphones, Send, Loader2 } from 'lucide-react';

interface SupportChatViewProps {
    chat: any;
    messages: any[];
    currentUser: any;
    onSendMessage: (text: string) => void;
    onBack: () => void;
    isLoading?: boolean;
}

export default function SupportChatView({
    chat,
    messages,
    currentUser,
    onSendMessage,
    onBack,
    isLoading
}: SupportChatViewProps) {
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;
        setSending(true);
        const text = newMessage.trim();
        setNewMessage('');
        try {
            await onSendMessage(text);
        } catch {
            // Error handled upstream
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-zinc-950">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">Connecting to support...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl">
                <button
                    onClick={onBack}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20">
                    <Headphones size={18} className="text-emerald-400" />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white">TripSang Support</h3>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        We typically reply within minutes
                    </p>
                </div>

                {chat?.status === 'closed' && (
                    <span className="px-2 py-1 text-[10px] font-medium bg-zinc-800 text-zinc-400 rounded-full border border-white/5">
                        Closed
                    </span>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                {messages.map((msg, idx) => {
                    const isMe = msg.sender === currentUser?.id || msg.senderRole === 'user';
                    const isSystem = msg.type === 'system';

                    if (isSystem) {
                        return (
                            <div key={msg._id || idx} className="flex justify-center my-3">
                                <span className="px-3 py-1.5 text-[11px] text-zinc-500 bg-zinc-800/50 rounded-full border border-white/5">
                                    {msg.message}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <motion.div
                            key={msg._id || idx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] ${isMe ? 'order-2' : 'order-1'}`}>
                                {/* Sender name for admin messages */}
                                {!isMe && (
                                    <div className="flex items-center gap-1.5 mb-1 ml-1">
                                        <span className="text-[10px] font-medium text-emerald-400">
                                            {msg.senderName || 'Support'}
                                        </span>
                                        {msg.senderRole === 'admin' && (
                                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                                                Staff
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div
                                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                                        ? 'bg-cyan-600/80 text-white rounded-br-md'
                                        : 'bg-zinc-800/80 text-zinc-200 rounded-bl-md border border-white/5'
                                        } ${msg._id?.startsWith('temp-') ? 'opacity-70' : ''}`}
                                >
                                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                </div>

                                <p className={`text-[10px] mt-1 ${isMe ? 'text-right mr-1' : 'ml-1'} text-zinc-600`}>
                                    {msg.timestamp ? formatTime(msg.timestamp) : ''}
                                    {msg._id?.startsWith('temp-') && (
                                        <span className="ml-1 text-zinc-600">Sending...</span>
                                    )}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {chat?.status !== 'closed' ? (
                <div className="px-4 py-3 border-t border-white/5 bg-zinc-900/30">
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="flex-1 bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                            disabled={sending}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!newMessage.trim() || sending}
                            className={`p-2.5 rounded-xl transition-all ${newMessage.trim()
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-600'
                                }`}
                        >
                            {sending ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="px-4 py-4 border-t border-white/5 bg-zinc-900/30 text-center">
                    <p className="text-sm text-zinc-500">This support ticket has been closed.</p>
                    <p className="text-xs text-zinc-600 mt-1">Start a new chat from the + button if you need more help.</p>
                </div>
            )}
        </div>
    );
}
