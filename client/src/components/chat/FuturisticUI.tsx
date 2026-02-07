'use client';

import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform, animate } from 'framer-motion';
import { useState, useRef, forwardRef, ReactNode } from 'react';
import { X, Camera, Pin, Send, Play, Pause } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// ============================================================================
// DESIGN TOKENS
// ============================================================================
export const glassStyles = {
    bubble: {
        own: {
            background: 'linear-gradient(135deg, rgba(0,128,128,0.4) 0%, rgba(0,128,128,0.2) 100%)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(0,128,128,0.2)',
        },
        other: {
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.3)',
        },
    },
    input: {
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.03)',
    },
};

export const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
    mass: 0.8
};

export const jellyBounce = {
    type: "spring" as const,
    stiffness: 400,
    damping: 15,
    mass: 0.6
};

// ============================================================================
// ANIMATED MESH GRADIENT BACKGROUND
// ============================================================================
export function AnimatedMeshBackground({ className = '' }: { className?: string }) {
    return (
        <div className={`absolute inset-0 overflow-hidden z-0 ${className}`}>
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#001a1a] via-[#0d2d2d] to-[#1a0a00]" />

            {/* Animated mesh blobs */}
            <motion.div
                className="absolute w-[600px] h-[600px] rounded-full opacity-30 will-change-transform"
                style={{
                    background: 'radial-gradient(circle, #008080 0%, transparent 70%)',
                    filter: 'blur(80px)',
                }}
                animate={{
                    x: ['-20%', '30%', '-10%'],
                    y: ['-10%', '40%', '0%'],
                    scale: [1, 1.2, 0.9, 1],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute right-0 bottom-0 w-[500px] h-[500px] rounded-full opacity-25 will-change-transform"
                style={{
                    background: 'radial-gradient(circle, #FF8C00 0%, transparent 70%)',
                    filter: 'blur(80px)',
                }}
                animate={{
                    x: ['10%', '-30%', '20%'],
                    y: ['20%', '-20%', '10%'],
                    scale: [1, 0.8, 1.1, 1],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute left-1/3 top-1/4 w-[400px] h-[400px] rounded-full opacity-20 will-change-transform"
                style={{
                    background: 'radial-gradient(circle, #00CED1 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
                animate={{
                    x: ['0%', '20%', '-15%', '0%'],
                    y: ['0%', '-30%', '20%', '0%'],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Noise overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                }}
            />
        </div>
    );
}

// ============================================================================
// LIQUID GLASS MESSAGE BUBBLE
// ============================================================================
interface GlassBubbleProps {
    isOwn: boolean;
    senderId?: string;
    senderName?: string;
    senderProfilePicture?: string;
    message: string;
    timestamp: string;
    type?: 'text' | 'image' | 'voice' | 'system';
    imageUrl?: string;
    voiceUrl?: string;
    voiceDuration?: number;
    replyTo?: {
        senderName: string;
        message: string;
        type?: string;
    };
    reactions?: { emoji: string; userId: string }[];
    isPinned?: boolean;
    showAvatar?: boolean;
    onReply?: () => void;
    onPin?: () => void;
    onReact?: (emoji: string) => void;
    onImageClick?: (url: string) => void;
    enableSwipeGestures?: boolean;
    index?: number;
    renderMessage?: (text: string) => ReactNode;
    children?: ReactNode;
}

export function GlassBubble({
    isOwn,
    senderId,
    senderName,
    senderProfilePicture,
    message,
    timestamp,
    type = 'text',
    imageUrl,
    voiceUrl,
    voiceDuration,
    replyTo,
    reactions,
    isPinned,
    showAvatar = true,
    onReply,
    onPin,
    onReact,
    onImageClick,
    enableSwipeGestures = true,
    index = 0,
    renderMessage,
    children,
}: GlassBubbleProps) {
    const x = useMotionValue(0);
    const [showReactions, setShowReactions] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const replyOpacity = useTransform(x, isOwn ? [-100, -50, 0] : [0, 50, 100], isOwn ? [1, 0.5, 0] : [0, 0.5, 1]);
    const replyScale = useTransform(x, isOwn ? [-100, -50, 0] : [0, 50, 100], isOwn ? [1, 0.8, 0.5] : [0.5, 0.8, 1]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (!enableSwipeGestures) return;
        const threshold = 80;
        const longThreshold = 150;

        if (Math.abs(info.offset.x) > longThreshold && onReact) {
            setShowReactions(true);
            triggerHaptic('medium');
        } else if (Math.abs(info.offset.x) > threshold && onReply) {
            onReply();
            triggerHaptic('light');
        }

        // Snap back to original position with spring animation
        animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
        setIsDragging(false);
    };

    const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy') => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            const patterns = { light: [10], medium: [20, 10, 20], heavy: [50, 30, 50] };
            navigator.vibrate(patterns[intensity]);
        }
    };

    const emojis = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

    // System message style
    if (type === 'system') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center my-4"
            >
                <span
                    className="text-[11px] font-medium py-2 px-4 rounded-full"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.5)',
                    }}
                >
                    {message}
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...jellyBounce, delay: index * 0.03 }}
            className={`relative flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 px-4 group`}
        >
            {/* Reply indicator */}
            {enableSwipeGestures && (
                <motion.div
                    className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? 'left-2' : 'right-2'}`}
                    style={{ opacity: replyOpacity, scale: replyScale }}
                >
                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </div>
                </motion.div>
            )}

            {/* Avatar for other users */}
            {!isOwn && showAvatar && senderId && (
                <Link href={`/profile/${senderId}`} className="mr-2 flex-shrink-0 self-end mb-1">
                    {senderProfilePicture ? (
                        <Image
                            src={senderProfilePicture}
                            alt={senderName || 'User'}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold">
                            {senderName?.[0] || '?'}
                        </div>
                    )}
                </Link>
            )}

            <motion.div
                drag={enableSwipeGestures ? "x" : false}
                dragConstraints={{ left: isOwn ? -150 : 0, right: isOwn ? 0 : 150 }}
                dragElastic={0.3}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                style={{ x }}
                whileDrag={{ scale: 1.02 }}
                className={`max-w-[80%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
            >
                {/* Sender name */}
                {!isOwn && showAvatar && senderName && (
                    <p className="text-xs font-medium text-white/50 mb-1 ml-3">
                        {senderName}
                    </p>
                )}

                {/* Reply preview */}
                {replyTo && (
                    <div
                        className={`mb-1 px-3 py-1.5 rounded-xl ${isOwn ? 'mr-2' : 'ml-2'}`}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderLeft: '2px solid rgba(255,255,255,0.3)',
                        }}
                    >
                        <p className="text-[10px] text-white/40">{replyTo.senderName}</p>
                        <p className="text-xs text-white/50 truncate">
                            {replyTo.type === 'image' ? '📷 Image' : replyTo.message}
                        </p>
                    </div>
                )}

                {/* Glass Bubble */}
                <div
                    className={`relative px-4 py-3 rounded-3xl ${isOwn ? 'rounded-br-lg' : 'rounded-bl-lg'}`}
                    style={isOwn ? glassStyles.bubble.own : glassStyles.bubble.other}
                >
                    {/* Pinned indicator */}
                    {isPinned && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                            <Pin className="w-3 h-3 text-white" />
                        </div>
                    )}

                    {/* Image content */}
                    {type === 'image' && imageUrl && (
                        <div
                            className="mb-2 -mx-2 -mt-1 cursor-pointer rounded-2xl overflow-hidden"
                            onClick={() => onImageClick?.(imageUrl)}
                        >
                            <Image
                                src={imageUrl}
                                alt="Shared"
                                width={250}
                                height={180}
                                className="w-full h-auto object-cover hover:scale-105 transition-transform"
                            />
                        </div>
                    )}

                    {/* Voice content */}
                    {type === 'voice' && (
                        <VoiceWaveform duration={voiceDuration || 0} />
                    )}

                    {/* Text content */}
                    {(type === 'text' || !type) && (
                        <p className="text-white/90 text-[15px] leading-relaxed">
                            {renderMessage ? renderMessage(message) : message}
                        </p>
                    )}

                    {/* Timestamp */}
                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/40' : 'text-white/30'}`}>
                        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    {/* Reactions */}
                    {reactions && reactions.length > 0 && (
                        <div className="absolute -bottom-2 right-2 flex bg-black/30 backdrop-blur-md rounded-full px-1.5 py-0.5 border border-white/10">
                            {reactions.slice(0, 3).map((r, i) => (
                                <span key={i} className="text-xs">{r.emoji}</span>
                            ))}
                            {reactions.length > 3 && (
                                <span className="text-[10px] text-white/50 ml-1">+{reactions.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Action buttons (visible on hover) */}
                <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'mr-2' : 'ml-2'}`}>
                    {onReply && (
                        <button
                            onClick={onReply}
                            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                            title="Reply"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                        </button>
                    )}
                    {onPin && (
                        <button
                            onClick={onPin}
                            className={`p-1.5 rounded-full transition-colors ${isPinned ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70'}`}
                            title={isPinned ? 'Pinned' : 'Pin'}
                        >
                            <Pin className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {children}
            </motion.div>

            {/* Emoji Reaction Menu */}
            <AnimatePresence>
                {showReactions && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 20 }}
                        transition={springConfig}
                        className={`absolute ${isOwn ? 'right-4' : 'left-4'} -top-14 z-50`}
                    >
                        <div
                            className="flex gap-1 p-2 rounded-2xl"
                            style={{
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            {emojis.map((emoji, i) => (
                                <motion.button
                                    key={emoji}
                                    initial={{ scale: 0, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    transition={{ ...springConfig, delay: i * 0.05 }}
                                    whileHover={{ scale: 1.3, y: -5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        onReact?.(emoji);
                                        setShowReactions(false);
                                        triggerHaptic('medium');
                                    }}
                                    className="text-2xl p-1 hover:bg-white/10 rounded-xl"
                                >
                                    {emoji}
                                </motion.button>
                            ))}
                        </div>
                        <div className="fixed inset-0 -z-10" onClick={() => setShowReactions(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================================================
// VOICE WAVEFORM
// ============================================================================
export function VoiceWaveform({ duration, url }: { duration: number; url?: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const bars = 20;
    const heights = useRef(Array.from({ length: bars }, () => 20 + Math.random() * 60));

    return (
        <div className="flex items-center gap-3 min-w-[180px]">
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                style={{ boxShadow: isPlaying ? '0 0 20px rgba(0,206,209,0.4)' : 'none' }}
            >
                {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
            </motion.button>

            <div className="flex items-center gap-[2px] h-8 flex-1">
                {heights.current.map((h, i) => (
                    <motion.div
                        key={i}
                        className="w-1 rounded-full bg-gradient-to-t from-teal-500 to-cyan-400"
                        style={{ height: `${h}%`, opacity: 0.6 }}
                        animate={isPlaying ? { scaleY: [1, 0.5 + Math.random() * 0.5, 1] } : {}}
                        transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.02 }}
                    />
                ))}
            </div>

            <span className="text-xs text-white/40 min-w-[32px]">
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </span>
        </div>
    );
}

// ============================================================================
// GLASS INPUT BAR
// ============================================================================
interface GlassInputBarProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onFileUpload?: (file: File) => void;
    placeholder?: string;
    disabled?: boolean;
    isUploading?: boolean;
    replyingTo?: { senderName: string; message: string; type?: string } | null;
    onCancelReply?: () => void;
    showGhostText?: boolean;
    children?: ReactNode;
}

export const GlassInputBar = forwardRef<HTMLTextAreaElement, GlassInputBarProps>(({
    value,
    onChange,
    onSend,
    onFileUpload,
    placeholder = 'Message...',
    disabled,
    isUploading,
    replyingTo,
    onCancelReply,
    showGhostText = true,
    children,
}, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [ghostText, setGhostText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const predictions: Record<string, string> = {
        'hey': ' there! How are you?',
        'what': ' time should we meet?',
        'let\'s': ' go explore!',
        'see': ' you there!',
        'thanks': ' for organizing this trip!',
        'sounds': ' great, I\'m in!',
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        onChange(val);

        if (showGhostText) {
            const lastWord = val.toLowerCase().split(' ').pop() || '';
            setGhostText(predictions[lastWord] || '');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab' && ghostText) {
            e.preventDefault();
            onChange(value + ghostText);
            setGhostText('');
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onFileUpload) {
            onFileUpload(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="p-4 pb-6">
            {/* Reply preview */}
            <AnimatePresence>
                {replyingTo && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 20, height: 0 }}
                        className="mb-3"
                    >
                        <div
                            className="flex items-center justify-between px-4 py-2 rounded-2xl"
                            style={{
                                background: 'rgba(0,128,128,0.2)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-teal-300 font-medium">
                                    Replying to {replyingTo.senderName}
                                </p>
                                <p className="text-sm text-white/60 truncate">
                                    {replyingTo.type === 'image' ? '📷 Image' : replyingTo.message}
                                </p>
                            </div>
                            <button onClick={onCancelReply} className="p-1.5 hover:bg-white/10 rounded-full ml-2">
                                <X className="w-4 h-4 text-white/50" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Children (mention dropdown, etc.) */}
            {children}

            {/* Input container */}
            <motion.div
                layout
                className="relative rounded-[28px]"
                style={glassStyles.input}
            >
                {/* Expanded options */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={springConfig}
                            className="px-4 pt-4 pb-2 border-b border-white/10"
                        >
                            <div className="flex justify-center">
                                {[
                                    { icon: Camera, label: 'Photo', action: () => fileInputRef.current?.click() },
                                ].map((item, i) => (
                                    <motion.button
                                        key={item.label}
                                        initial={{ scale: 0, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        transition={{ ...jellyBounce, delay: i * 0.05 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={item.action}
                                        className="flex flex-col items-center gap-1 p-3 rounded-2xl hover:bg-white/5 transition-colors"
                                    >
                                        <item.icon className="w-6 h-6 text-white/50" />
                                        <span className="text-xs text-white/50">{item.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input row */}
                <div className="flex items-end gap-2 p-2">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <motion.div animate={{ rotate: isExpanded ? 45 : 0 }} transition={springConfig}>
                            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </motion.div>
                    </motion.button>

                    <div className="flex-1 relative">
                        {ghostText && (
                            <div className="absolute inset-0 flex items-center pointer-events-none px-4 py-2">
                                <span className="text-transparent">{value}</span>
                                <span className="text-white/20 italic">{ghostText}</span>
                            </div>
                        )}
                        <textarea
                            ref={ref}
                            value={value}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder={isUploading ? 'Uploading...' : placeholder}
                            disabled={disabled || isUploading}
                            rows={1}
                            className="w-full bg-transparent text-white placeholder-white/30 px-4 py-2 outline-none resize-none max-h-32"
                        />
                        {ghostText && (
                            <p className="text-[10px] text-white/30 px-4 -mt-1">Press Tab to accept</p>
                        )}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onSend}
                        disabled={(!value.trim() && !isUploading) || disabled}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${value.trim()
                            ? 'bg-gradient-to-r from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30'
                            : 'bg-white/10'
                            }`}
                    >
                        {isUploading ? (
                            <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <Send className={`w-4 h-4 ${value.trim() ? 'text-white' : 'text-white/30'}`} />
                        )}
                    </motion.button>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
            </motion.div>

            {/* Gesture hint */}
            <p className="text-center text-[10px] text-white/20 mt-3">
                Swipe messages to reply • Long swipe for reactions
            </p>
        </div>
    );
});

GlassInputBar.displayName = 'GlassInputBar';

// ============================================================================
// TYPING INDICATOR
// ============================================================================
export function GlassTypingIndicator({ names }: { names: string[] }) {
    if (names.length === 0) return null;

    const text = names.length === 1
        ? `${names[0]} is typing...`
        : `${names.slice(0, 2).join(', ')}${names.length > 2 ? ` +${names.length - 2}` : ''} are typing...`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 px-6 py-2"
        >
            <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-white/30"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                ))}
            </div>
            <span className="text-xs text-white/40">{text}</span>
        </motion.div>
    );
}

// ============================================================================
// GLASS HEADER
// ============================================================================
interface GlassHeaderProps {
    title: string;
    subtitle?: string;
    avatarIcon?: ReactNode;
    avatarImage?: string;
    isConnected?: boolean;
    rightContent?: ReactNode;
}

export function GlassHeader({ title, subtitle, avatarIcon, avatarImage, isConnected, rightContent }: GlassHeaderProps) {
    return (
        <div
            className="relative z-10 px-4 py-4 flex items-center justify-between"
            style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
            }}
        >
            <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-orange-400 flex items-center justify-center overflow-hidden">
                    {avatarImage ? (
                        <Image src={avatarImage} alt={title} fill className="object-cover" />
                    ) : (
                        avatarIcon || <span className="text-white font-bold">{title[0]}</span>
                    )}
                </div>
                <div>
                    <h3 className="text-white font-semibold">{title}</h3>
                    <p className="text-xs text-white/50 flex items-center gap-1">
                        {isConnected !== undefined && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                        )}
                        {subtitle || (isConnected ? 'Connected' : 'Connecting...')}
                    </p>
                </div>
            </div>
            {rightContent}
        </div>
    );
}

// ============================================================================
// PINNED MESSAGE BANNER
// ============================================================================
interface PinnedBannerProps {
    senderName: string;
    message: string;
    type?: string;
    onUnpin?: () => void;
}

export function PinnedBanner({ senderName, message, type, onUnpin }: PinnedBannerProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-0 z-10 mx-4 my-2"
        >
            <div
                className="flex items-center justify-between gap-3 px-4 py-2 rounded-2xl"
                style={{
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.1) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(251,191,36,0.3)',
                }}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <Pin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-amber-300">{senderName}</p>
                        <p className="text-sm text-amber-100/80 truncate">
                            {type === 'image' ? '📷 Image' : message}
                        </p>
                    </div>
                </div>
                {onUnpin && (
                    <button
                        onClick={onUnpin}
                        className="p-1 text-amber-400 hover:text-amber-200 hover:bg-amber-500/20 rounded-full transition-colors flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}
