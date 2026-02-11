'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Image as ImageIcon, Smile, Paperclip, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Common emoji categories for a simple built-in picker
const EMOJI_LIST = [
    '😀', '😂', '😍', '🥰', '😎', '🤩', '🥳', '😢', '😤', '🤔',
    '👍', '👎', '❤️', '🔥', '💯', '🎉', '✨', '🙏', '💪', '👋',
    '🌍', '✈️', '🏔️', '🏖️', '🗺️', '🚗', '🏕️', '🌄', '🎒', '📸',
    '😊', '😅', '🤣', '😜', '🤗', '😇', '🥺', '😱', '🤡', '💀',
    '👀', '🙌', '🤝', '✌️', '🤞', '🫡', '💕', '💔', '🌟', '⭐',
];

interface ChatInputProps {
    onSend: (message: string, file?: File | null) => Promise<void>;
    isLoading?: boolean;
    replyTo?: { _id: string; message?: string; content?: string; senderName?: string } | null;
    onCancelReply?: () => void;
}

export default function ChatInput({ onSend, isLoading, replyTo, onCancelReply }: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = '0';
            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
        }
    }, [message]);

    // Close emoji on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
                setShowEmoji(false);
            }
        };
        if (showEmoji) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showEmoji]);

    // Focus textarea when reply starts
    useEffect(() => {
        if (replyTo) textareaRef.current?.focus();
    }, [replyTo]);

    const handleSend = async () => {
        if ((!message.trim() && !attachment) || isLoading) return;
        await onSend(message, attachment);
        setMessage('');
        removeAttachment();
        setShowEmoji(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAttachment(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeAttachment = () => {
        setAttachment(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const insertEmoji = (emoji: string) => {
        setMessage(prev => prev + emoji);
        textareaRef.current?.focus();
    };

    return (
        <div className="bg-zinc-900/50 backdrop-blur-md border-t border-white/5 relative z-20 shrink-0">
            {/* Reply bar */}
            <AnimatePresence>
                {replyTo && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-2 px-4 pt-2.5 pb-1">
                            <div className="flex-1 border-l-2 border-cyan-500 pl-3 py-1">
                                <p className="text-[11px] font-semibold text-cyan-400">
                                    Replying to {replyTo.senderName || 'User'}
                                </p>
                                <p className="text-xs text-zinc-400 truncate">
                                    {replyTo.message || replyTo.content || ''}
                                </p>
                            </div>
                            <button
                                onClick={onCancelReply}
                                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Attachment Preview */}
            <AnimatePresence>
                {previewUrl && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pt-2 overflow-hidden"
                    >
                        <div className="relative inline-block">
                            <img src={previewUrl} alt="Preview" className="h-20 w-auto rounded-lg object-cover border border-white/10" />
                            <button
                                onClick={removeAttachment}
                                className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 rounded-full text-white shadow-md hover:bg-red-600 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Row */}
            <div className="px-3 py-2 sm:px-4 sm:py-3">
                <div className="flex items-end gap-1.5 bg-zinc-950/50 p-1.5 sm:p-2 rounded-2xl border border-white/5 ring-1 ring-white/5 focus-within:ring-cyan-500/30 transition-all">
                    {/* File actions */}
                    <div className="flex items-center gap-0.5 pb-1 pl-0.5">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 sm:p-2 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Upload Image"
                        >
                            <ImageIcon size={18} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*,video/*"
                            className="hidden"
                        />
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm resize-none focus:outline-none py-2 px-1.5 custom-scrollbar leading-5"
                        rows={1}
                        style={{ minHeight: '36px', maxHeight: '120px' }}
                    />

                    {/* Emoji + Send */}
                    <div className="flex items-center gap-0.5 pb-1" ref={emojiRef}>
                        <div className="relative">
                            <button
                                onClick={() => setShowEmoji(!showEmoji)}
                                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${showEmoji ? 'text-yellow-400 bg-yellow-500/10' : 'text-zinc-400 hover:text-yellow-400 hover:bg-yellow-500/10'}`}
                            >
                                <Smile size={18} />
                            </button>

                            {/* Emoji Picker */}
                            <AnimatePresence>
                                {showEmoji && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                        className="absolute bottom-full right-0 mb-2 bg-zinc-800 border border-white/10 rounded-xl shadow-2xl shadow-black/50 p-3 w-[260px] sm:w-[300px] z-50"
                                    >
                                        <div className="grid grid-cols-8 sm:grid-cols-10 gap-0.5">
                                            {EMOJI_LIST.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => insertEmoji(emoji)}
                                                    className="p-1 text-xl hover:bg-white/10 rounded-lg transition-colors aspect-square flex items-center justify-center"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleSend}
                            disabled={(!message.trim() && !attachment) || isLoading}
                            className={`p-2.5 rounded-xl transition-all shadow-lg ${(message.trim() || attachment)
                                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-500/20'
                                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                }`}
                        >
                            <Send size={16} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}
