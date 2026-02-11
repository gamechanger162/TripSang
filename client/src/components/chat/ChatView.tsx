'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Phone, Video, MoreVertical, X } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

interface ChatViewProps {
    messages: any[];
    currentUser: any;
    onSendMessage: (text: string, file?: File | null, replyToId?: string) => Promise<void>;
    isLoading?: boolean;
    chatTitle: string;
    chatSubtitle?: string;
    chatImage?: string;
    onBack?: () => void;
    isMobile?: boolean;
    conversationId?: string;
    conversationType?: string;
    onDeleteMessage?: (msgId: string) => void;
    onBlockUser?: () => void;
    onViewProfile?: () => void;
    blockStatus?: { isBlocked: boolean; blockedByMe: boolean } | null;
}

export default function ChatView({
    messages,
    currentUser,
    onSendMessage,
    isLoading,
    chatTitle,
    chatSubtitle,
    chatImage,
    onBack,
    isMobile,
    onDeleteMessage,
    onBlockUser,
    onViewProfile,
    blockStatus
}: ChatViewProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [replyTo, setReplyTo] = useState<any>(null);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Determine if a message is from the current user
    // Backend can send sender as: string ID, { _id: string }, or provide senderId separately
    const isMyMessage = useCallback((msg: any) => {
        const myId = currentUser?.id || currentUser?._id;
        if (!myId) return false;

        // Check senderId (added by backend transformer)
        if (msg.senderId) return msg.senderId.toString() === myId.toString();

        // Check sender as object
        if (typeof msg.sender === 'object' && msg.sender?._id) {
            return msg.sender._id.toString() === myId.toString();
        }

        // Check sender as string
        if (typeof msg.sender === 'string') {
            return msg.sender === myId.toString();
        }

        return false;
    }, [currentUser]);

    const handleReply = (msg: any) => {
        setReplyTo({
            _id: msg._id,
            message: msg.message || msg.content || '',
            senderName: msg.senderName || (typeof msg.sender === 'object' ? msg.sender?.name : 'User')
        });
    };

    const handleSend = async (text: string, file?: File | null) => {
        await onSendMessage(text, file, replyTo?._id);
        setReplyTo(null);
    };

    const handleDelete = (msgId: string) => {
        onDeleteMessage?.(msgId);
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="h-14 sm:h-16 px-3 sm:px-6 border-b border-white/5 flex items-center gap-3 bg-zinc-900/30 backdrop-blur-md z-50 shrink-0">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-1.5 -ml-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors md:hidden"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-tr from-violet-500 to-fuchsia-500 p-0.5 shrink-0">
                    {chatImage ? (
                        <img src={chatImage} alt={chatTitle} className="w-full h-full object-cover rounded-full border-2 border-zinc-900" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-bold text-white text-sm">
                            {chatTitle?.[0] || '?'}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-white text-sm sm:text-base truncate">{chatTitle}</h2>
                    {chatSubtitle && (
                        <p className="text-[11px] sm:text-xs text-emerald-400 truncate flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                            {chatSubtitle}
                        </p>
                    )}
                </div>

                {/* Header actions */}
                <div className="flex items-center gap-1 relative">
                    <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden sm:flex">
                        <Phone size={18} />
                    </button>
                    <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden sm:flex">
                        <Video size={18} />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <MoreVertical size={18} />
                        </button>

                        <AnimatePresence>
                            {showHeaderMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowHeaderMenu(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="absolute right-0 top-full mt-2 w-48 bg-zinc-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => {
                                                onViewProfile?.();
                                                setShowHeaderMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 transition-colors"
                                        >
                                            View Profile
                                        </button>
                                        <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 transition-colors">
                                            Mute Notifications
                                        </button>
                                        <div className="h-px bg-white/5 my-1" />
                                        <button
                                            onClick={() => {
                                                onBlockUser?.();
                                                setShowHeaderMenu(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${blockStatus?.blockedByMe
                                                ? 'text-zinc-200 hover:bg-white/5'
                                                : 'text-red-400 hover:bg-red-500/10'
                                                }`}
                                        >
                                            {blockStatus?.blockedByMe ? 'Unblock User' : 'Block User'}
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 sm:px-6 sm:py-4 relative">
                {isLoading && messages.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2 opacity-50">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-2">
                                    <span className="text-2xl">👋</span>
                                </div>
                                <p className="text-sm">No messages yet. Start the conversation!</p>
                            </div>
                        )}

                        {messages.map((msg, index) => {
                            const isMe = isMyMessage(msg);

                            return (
                                <MessageBubble
                                    key={msg._id || index}
                                    message={msg}
                                    isMe={isMe}
                                    isGroup={false}
                                    onReply={handleReply}
                                    onDelete={handleDelete}
                                    onImageClick={setSelectedImage}
                                />
                            );
                        })}
                        <div ref={bottomRef} className="h-1" />
                    </>
                )}
            </div>

            {/* Input Area */}
            <ChatInput
                onSend={handleSend}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
            />

            {/* Image Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
                        onClick={() => { setSelectedImage(null); setZoomLevel(1); }}
                        style={{ touchAction: 'none' }}
                    >
                        <button
                            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-[60]"
                            onClick={() => { setSelectedImage(null); setZoomLevel(1); }}
                        >
                            <X size={28} />
                        </button>

                        <div className="absolute bottom-24 right-4 z-[60] flex flex-col items-center gap-3 bg-zinc-900/80 backdrop-blur-md p-3 rounded-full border border-white/10 shadow-2xl">
                            <button
                                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-all"
                                onClick={(e) => { e.stopPropagation(); setZoomLevel(Math.min(5, zoomLevel + 0.5)); }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                            </button>

                            <div className="relative h-32 w-2 bg-zinc-700/50 rounded-full overflow-hidden">
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-teal-500 rounded-full w-full"
                                    style={{ height: `${((zoomLevel - 1) / 4) * 100}%` }}
                                />
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    step="0.1"
                                    value={zoomLevel}
                                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                                />
                            </div>

                            <button
                                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-all"
                                onClick={(e) => { e.stopPropagation(); setZoomLevel(Math.max(1, zoomLevel - 0.5)); }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                            </button>

                            <span className="text-white/90 text-[10px] font-medium w-full text-center">{Math.round(zoomLevel)}x</span>
                        </div>

                        <motion.div
                            className="w-full h-full flex items-center justify-center overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.img
                                src={selectedImage}
                                alt="Full size"
                                className="max-w-full max-h-full object-contain"
                                style={{
                                    cursor: zoomLevel > 1 ? 'grab' : 'default',
                                    touchAction: 'none'
                                }}
                                animate={{ scale: zoomLevel }}
                                drag={zoomLevel > 1}
                                dragConstraints={{ left: -100 * zoomLevel, right: 100 * zoomLevel, top: -100 * zoomLevel, bottom: 100 * zoomLevel }}
                                dragElastic={0.1}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
