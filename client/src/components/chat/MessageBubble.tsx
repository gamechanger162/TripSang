'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Check, CheckCheck, Reply, Copy, Pin, Trash2, MoreVertical } from 'lucide-react';

interface MessageBubbleProps {
    message: {
        _id: string;
        // Backend may send 'message' or 'content' for text
        message?: string;
        content?: string;
        // Backend may send sender as string ID or object
        sender: string | { _id: string; name?: string; profilePicture?: string };
        senderId?: string;
        senderName?: string;
        senderProfilePicture?: string;
        type?: 'text' | 'image' | 'video';
        imageUrl?: string;
        mediaUrl?: string;
        // Backend may send 'timestamp' or 'createdAt'
        timestamp?: string;
        createdAt?: string;
        read?: boolean;
        replyTo?: {
            _id: string;
            message?: string;
            senderName?: string;
            sender?: { name?: string; _id?: string } | string;
        };
    };
    isMe: boolean;
    isGroup?: boolean;
    onReply?: (msg: any) => void;
    onDelete?: (msgId: string) => void;
    onPin?: (msgId: string) => void;
    onViewProfile?: (userId: string) => void;
    onImageClick?: (url: string) => void;
}

export default function MessageBubble({ message, isMe, isGroup, onReply, onDelete, onPin, onViewProfile, onImageClick }: MessageBubbleProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [mounted, setMounted] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Normalize text: backend uses 'message', optimistic UI uses 'content'
    const text = message.message || message.content || '';

    // Normalize sender info
    const senderObj = typeof message.sender === 'object' && message.sender !== null ? message.sender : null;
    const senderId = message.senderId || (senderObj ? senderObj._id : (typeof message.sender === 'string' ? message.sender : ''));
    const senderName = message.senderName || senderObj?.name || 'User';
    const senderPic = message.senderProfilePicture || senderObj?.profilePicture || null;

    // Resolve reply sender name: check flat name, then nested object
    const replySenderName = message.replyTo?.senderName ||
        (message.replyTo?.sender && typeof message.replyTo.sender === 'object' ? (message.replyTo.sender as any).name : null) ||
        'User';

    // Normalize timestamp
    const timeStr = message.timestamp || message.createdAt;

    // Normalize image
    const imgUrl = message.imageUrl || message.mediaUrl;

    const handleCopy = () => {
        if (text) navigator.clipboard.writeText(text);
        setShowMenu(false);
    };

    const handleReply = () => {
        onReply?.(message);
        setShowMenu(false);
    };

    const handleDelete = () => {
        onDelete?.(message._id);
        setShowMenu(false);
    };

    const handlePin = () => {
        onPin?.(message._id);
        setShowMenu(false);
    };

    const [menuPosition, setMenuPosition] = useState<{ top?: number, bottom?: number, left: number, transformOrigin: string } | null>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;
        const menuWidth = 170;
        const menuHeight = 200;
        const distanceToBottom = window.innerHeight - y;
        const distanceToRight = window.innerWidth - x;

        const left = distanceToRight < menuWidth ? Math.max(8, x - menuWidth) : x;

        if (distanceToBottom < menuHeight) {
            setMenuPosition({ bottom: window.innerHeight - y, left, transformOrigin: 'bottom right' });
        } else {
            setMenuPosition({ top: y, left, transformOrigin: 'top right' });
        }
        setShowMenu(true);
    };

    const handleButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('[DEBUG] 3-dots clicked');
        const rect = e.currentTarget.getBoundingClientRect();
        const menuWidth = 170;
        const menuHeight = 200;
        const distanceToBottom = window.innerHeight - rect.bottom;
        const distanceToRight = window.innerWidth - rect.right;

        // Horizontal: if menu would overflow right, anchor to the left of the button
        const left = distanceToRight < menuWidth
            ? Math.max(8, rect.right - menuWidth)
            : rect.left;

        // Vertical: if near bottom, position above
        if (distanceToBottom < menuHeight) {
            setMenuPosition({ bottom: window.innerHeight - rect.top + 4, left, transformOrigin: 'bottom right' });
        } else {
            setMenuPosition({ top: rect.bottom + 4, left, transformOrigin: 'top right' });
        }
        setShowMenu(!showMenu);
    };



    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3 group relative ${showMenu ? 'z-50' : 'z-10'}`}
        >
            <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar (other user only) */}
                {!isMe && (
                    <div
                        onClick={() => onViewProfile?.(senderId)}
                        className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800 border border-white/5 mb-1 ${onViewProfile ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                    >
                        {senderPic ? (
                            <img src={senderPic} alt={senderName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                {senderName[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col">
                    {/* Sender name in group */}
                    {!isMe && isGroup && (
                        <span className="text-[11px] text-zinc-500 mb-0.5 ml-1 font-medium">
                            {senderName}
                        </span>
                    )}

                    {/* Bubble */}
                    <div
                        className={`relative px-3.5 py-2 shadow-sm ${isMe
                            ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-2xl rounded-br-md'
                            : 'bg-zinc-800/80 backdrop-blur-sm border border-white/5 text-zinc-100 rounded-2xl rounded-bl-md'
                            }`}
                        onContextMenu={handleContextMenu}
                    >
                        {/* Reply reference */}
                        {message.replyTo && (
                            <div className={`mb-1.5 px-2.5 py-1.5 rounded-lg text-xs border-l-2 ${isMe ? 'bg-white/10 border-white/30' : 'bg-white/5 border-cyan-500/50'}`}>
                                <span className="font-semibold text-cyan-400 text-[10px]">
                                    {replySenderName}
                                </span>
                                <p className="text-zinc-300 truncate mt-0.5">
                                    {message.replyTo.message || ''}
                                </p>
                            </div>
                        )}

                        {/* Image */}
                        {message.type === 'image' && imgUrl && (
                            <div
                                className="mb-1.5 rounded-lg overflow-hidden max-w-[260px] border border-white/10 cursor-pointer"
                                onClick={() => onImageClick?.(imgUrl)}
                            >
                                <Image
                                    src={imgUrl}
                                    alt="Shared"
                                    width={400}
                                    height={300}
                                    className="w-full h-auto object-cover"
                                    sizes="(max-width: 640px) 100vw, 300px" // Optimized sizes
                                />
                            </div>
                        )}

                        {/* Text */}
                        {text && (
                            <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                                {text}
                            </p>
                        )}

                        {/* Time, read & options */}
                        <div className={`flex items-center gap-1 mt-0.5 select-none ${isMe ? 'justify-end' : ''}`}>
                            <span className={`text-[10px] ${isMe ? 'text-cyan-100/60' : 'text-zinc-500'}`}>
                                {timeStr ? new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            {isMe && (
                                <span className={message.read ? 'text-cyan-200' : 'text-cyan-100/40'}>
                                    {message.read ? <CheckCheck size={12} /> : <Check size={12} />}
                                </span>
                            )}
                            {/* Options button - inside bubble */}
                            <button
                                onClick={handleButtonClick}
                                className={`p-0.5 rounded-full hover:bg-white/20 transition-all ml-1 ${isMe ? 'text-white/60 hover:text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                            >
                                <MoreVertical size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Context Menu Portal */}
            {showMenu && menuPosition && mounted && createPortal(
                <div className="fixed inset-0 z-[99998]" onClick={() => setShowMenu(false)}>
                    <AnimatePresence>
                        <motion.div
                            key="context-menu"
                            ref={menuRef}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{
                                position: 'fixed',
                                top: menuPosition.top,
                                bottom: menuPosition.bottom,
                                left: menuPosition.left,
                                transformOrigin: menuPosition.transformOrigin
                            }}
                            className="bg-zinc-800 border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-1.5 min-w-[160px] overflow-hidden z-[99999]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleReply}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
                            >
                                <Reply size={15} className="text-cyan-400" />
                                Reply
                            </button>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
                            >
                                <Copy size={15} className="text-zinc-400" />
                                Copy
                            </button>
                            <button
                                onClick={handlePin}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
                            >
                                <Pin size={15} className="text-yellow-400" />
                                Pin
                            </button>
                            {isMe && (
                                <>
                                    <div className="border-t border-white/5 my-1" />
                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={15} />
                                        Delete
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </motion.div>
    );
}
