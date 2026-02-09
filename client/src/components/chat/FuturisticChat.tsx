'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import { useEnv } from '@/hooks/useEnv';
import toast from 'react-hot-toast';
import { uploadAPI } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { Mic, Camera, BarChart2, Send, X, Play, Pause } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface Message {
    _id?: string;
    senderId: string;
    senderName: string;
    senderProfilePicture?: string;
    message: string;
    timestamp: string;
    type?: 'text' | 'image' | 'voice' | 'system';
    imageUrl?: string;
    voiceUrl?: string;
    voiceDuration?: number;
    reactions?: { emoji: string; userId: string }[];
    replyTo?: {
        senderName: string;
        message: string;
        type?: string;
    };
}

interface FuturisticChatProps {
    tripId?: string;
    conversationId?: string;
    receiverId?: string;
    receiverName?: string;
    isSquadChat?: boolean;
    isSquadMember?: boolean;
}

// ============================================================================
// SPRING PHYSICS CONFIGS
// ============================================================================
const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
    mass: 0.8
};

const jellyBounce = {
    type: "spring" as const,
    stiffness: 400,
    damping: 15,
    mass: 0.6
};

// ============================================================================
// ANIMATED MESH GRADIENT BACKGROUND
// ============================================================================
function AnimatedMeshBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden -z-10">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#001a1a] via-[#0d2d2d] to-[#1a0a00]" />

            {/* Animated mesh blobs */}
            <motion.div
                className="absolute w-[600px] h-[600px] rounded-full opacity-30"
                style={{
                    background: 'radial-gradient(circle, #008080 0%, transparent 70%)',
                    filter: 'blur(80px)',
                }}
                animate={{
                    x: ['-20%', '30%', '-10%'],
                    y: ['-10%', '40%', '0%'],
                    scale: [1, 1.2, 0.9, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute right-0 bottom-0 w-[500px] h-[500px] rounded-full opacity-25"
                style={{
                    background: 'radial-gradient(circle, #FF8C00 0%, transparent 70%)',
                    filter: 'blur(80px)',
                }}
                animate={{
                    x: ['10%', '-30%', '20%'],
                    y: ['20%', '-20%', '10%'],
                    scale: [1, 0.8, 1.1, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute left-1/3 top-1/4 w-[400px] h-[400px] rounded-full opacity-20"
                style={{
                    background: 'radial-gradient(circle, #00CED1 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
                animate={{
                    x: ['0%', '20%', '-15%', '0%'],
                    y: ['0%', '-30%', '20%', '0%'],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Noise overlay for texture */}
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
interface LiquidGlassBubbleProps {
    message: Message;
    isOwn: boolean;
    onReply: () => void;
    onReact: (emoji: string) => void;
    index: number;
    isSelectionMode: boolean;
    isSelected: boolean;
    onSelect: () => void;
    onPin?: () => void;
}

function LiquidGlassBubble({ message, isOwn, onReply, onReact, index, isSelectionMode, isSelected, onSelect, onPin }: LiquidGlassBubbleProps) {
    const x = useMotionValue(0);
    const [showReactions, setShowReactions] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Transform swipe distance to opacity for reply indicator
    const replyOpacity = useTransform(x, isOwn ? [-100, -50, 0] : [0, 50, 100], isOwn ? [1, 0.5, 0] : [0, 0.5, 1]);
    const replyScale = useTransform(x, isOwn ? [-100, -50, 0] : [0, 50, 100], isOwn ? [1, 0.8, 0.5] : [0.5, 0.8, 1]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        const threshold = 80;
        const longThreshold = 150;

        if (Math.abs(info.offset.x) > longThreshold) {
            // Long swipe -> show reactions
            setShowReactions(true);
            triggerHaptic('medium');
        } else if (Math.abs(info.offset.x) > threshold) {
            // Short swipe -> reply
            onReply();
            triggerHaptic('light');
        }
        setIsDragging(false);
    };

    const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy') => {
        if ('vibrate' in navigator) {
            const patterns = {
                light: [10],
                medium: [20, 10, 20],
                heavy: [50, 30, 50]
            };
            navigator.vibrate(patterns[intensity]);
        }
    };

    const emojis = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...jellyBounce, delay: index * 0.05 }}
            className={`relative flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 px-4`}
        >
            {/* Reply indicator */}
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

            <motion.div
                drag={!isSelectionMode ? "x" : false}
                dragConstraints={{ left: isOwn ? -150 : 0, right: isOwn ? 0 : 150 }}
                dragElastic={0.3}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                style={{ x }}
                whileDrag={{ scale: 1.02 }}
                className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} ${isSelectionMode ? 'cursor-pointer' : ''}`}
                onClick={() => {
                    if (isSelectionMode) onSelect();
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    if (!isSelectionMode && onPin) {
                        // Trigger pin context menu - handled parent side or basic confirm for now?
                        // Actually, let's keep it simple: Long press triggers selection in mobile, Context menu in desktop?
                        // For now, let's make selection mode manual via header, or long press here.
                        // Let's rely on parent to pass "onLongPress" which toggles selection.
                        onSelect(); // Enters selection mode if not active? No, specific actions.
                    }
                }}
            >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? '-left-8' : '-right-8'} z-20`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-teal-500 border-teal-500' : 'border-white/30'}`}>
                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                    </div>
                )}
                {/* Sender name for squad chat */}
                {!isOwn && (
                    <Link href={`/profile/${message.senderId}`}>
                        <p className="text-xs font-medium text-white/50 mb-1 ml-3 hover:text-white/70 transition-colors"
                            style={{ fontVariationSettings: '"wght" 450' }}>
                            {message.senderName}
                        </p>
                    </Link>
                )}

                {/* Reply preview */}
                {message.replyTo && (
                    <div className={`mb-1 px-3 py-1.5 rounded-xl ${isOwn ? 'mr-2' : 'ml-2'}`}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderLeft: '2px solid rgba(255,255,255,0.3)'
                        }}>
                        <p className="text-[10px] text-white/40">{message.replyTo.senderName}</p>
                        <p className="text-xs text-white/50 truncate">{message.replyTo.message}</p>
                    </div>
                )}

                {/* Liquid Glass Bubble */}
                <div
                    className={`relative px-4 py-3 rounded-3xl ${isOwn ? 'rounded-br-lg' : 'rounded-bl-lg'}`}
                    style={{
                        background: isOwn
                            ? 'linear-gradient(135deg, rgba(0,128,128,0.4) 0%, rgba(0,128,128,0.2) 100%)'
                            : 'rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(15px)',
                        WebkitBackdropFilter: 'blur(15px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: `
                            inset 0 0 20px rgba(255,255,255,0.05),
                            0 8px 32px rgba(0,0,0,0.3),
                            ${isOwn ? '0 0 20px rgba(0,128,128,0.2)' : ''}
                        `,
                    }}
                >
                    {/* Message content */}
                    {message.type === 'image' && message.imageUrl && (
                        <div className="mb-2 -mx-2 -mt-1">
                            <Image
                                src={message.imageUrl}
                                alt="Shared"
                                width={250}
                                height={180}
                                className="rounded-2xl object-cover"
                            />
                        </div>
                    )}

                    {message.type === 'voice' && (
                        <VoiceWaveform duration={message.voiceDuration || 0} url={message.voiceUrl} />
                    )}

                    {(message.type === 'text' || !message.type) && (
                        <p className="text-white/90 text-[15px] leading-relaxed"
                            style={{ fontVariationSettings: isDragging ? '"wght" 500' : '"wght" 400' }}>
                            {message.message}
                        </p>
                    )}

                    {/* Timestamp */}
                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/40' : 'text-white/30'}`}
                        style={{ fontVariationSettings: '"wght" 350' }}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    {/* Reactions display */}
                    {message.reactions && message.reactions.length > 0 && (
                        <div className="absolute -bottom-2 right-2 flex bg-black/30 backdrop-blur-md rounded-full px-1.5 py-0.5 border border-white/10">
                            {message.reactions.slice(0, 3).map((r, i) => (
                                <span key={i} className="text-xs">{r.emoji}</span>
                            ))}
                            {message.reactions.length > 3 && (
                                <span className="text-[10px] text-white/50 ml-1">+{message.reactions.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* 3D Emoji Reaction Menu */}
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
                                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
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
                                        onReact(emoji);
                                        setShowReactions(false);
                                        triggerHaptic('medium');
                                    }}
                                    className="text-2xl p-1 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    {emoji}
                                </motion.button>
                            ))}
                        </div>
                        {/* Close on outside click */}
                        <div
                            className="fixed inset-0 -z-10"
                            onClick={() => setShowReactions(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================================================
// VOICE WAVEFORM VISUALIZATION
// ============================================================================
function VoiceWaveform({ duration, url }: { duration: number; url?: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const bars = 20;

    // Generate random bar heights
    const heights = useRef(Array.from({ length: bars }, () => 20 + Math.random() * 60));

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3 min-w-[180px]">
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                style={{
                    boxShadow: isPlaying ? '0 0 20px rgba(0,206,209,0.4)' : 'none'
                }}
            >
                {isPlaying ? (
                    <Pause className="w-4 h-4 text-white" />
                ) : (
                    <Play className="w-4 h-4 text-white ml-0.5" />
                )}
            </motion.button>

            <div className="flex items-center gap-[2px] h-8 flex-1">
                {heights.current.map((h, i) => (
                    <motion.div
                        key={i}
                        className="w-1 rounded-full"
                        style={{
                            height: `${h}%`,
                            background: i / bars <= progress
                                ? 'linear-gradient(to top, #008080, #00CED1)'
                                : 'rgba(255,255,255,0.2)',
                        }}
                        animate={isPlaying ? {
                            scaleY: [1, 0.5 + Math.random() * 0.5, 1],
                            opacity: [0.8, 1, 0.8],
                        } : {}}
                        transition={{
                            duration: 0.3,
                            repeat: Infinity,
                            delay: i * 0.02,
                        }}
                    />
                ))}
            </div>

            <span className="text-xs text-white/40 min-w-[32px]">
                {formatTime(duration)}
            </span>
        </div>
    );
}

// ============================================================================
// DYNAMIC FLOATING INPUT BAR
// ============================================================================
interface DynamicInputBarProps {
    onSend: (message: string, type: 'text' | 'image' | 'voice') => void;
    onTyping: () => void;
    replyingTo: Message | null;
    onCancelReply: () => void;
    disabled?: boolean;
}

function DynamicInputBar({ onSend, onTyping, replyingTo, onCancelReply, disabled }: DynamicInputBarProps) {
    const [message, setMessage] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [mode, setMode] = useState<'text' | 'voice' | 'camera' | 'poll'>('text');
    const [ghostText, setGhostText] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Ghost text predictions (simulated AI suggestions)
    const predictions: Record<string, string> = {
        'hey': ' there! How are you?',
        'what': ' time should we meet?',
        'let\'s': ' go to the mountains!',
        'see': ' you there!',
        'thanks': ' for organizing this trip!',
        'sounds': ' great, I\'m in!',
    };

    useEffect(() => {
        const lastWord = message.toLowerCase().split(' ').pop() || '';
        if (lastWord.length >= 2 && predictions[lastWord]) {
            setGhostText(predictions[lastWord]);
        } else {
            setGhostText('');
        }
    }, [message]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab' && ghostText) {
            e.preventDefault();
            setMessage(prev => prev + ghostText);
            setGhostText('');
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        if (message.trim()) {
            onSend(message, 'text');
            setMessage('');
            setGhostText('');
        }
    };

    const modes = [
        { id: 'voice', icon: Mic, label: 'Voice' },
        { id: 'camera', icon: Camera, label: 'Photo' },
        { id: 'poll', icon: BarChart2, label: 'Poll' },
    ];

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-8">
            {/* Reply preview */}
            <AnimatePresence>
                {replyingTo && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 20, height: 0 }}
                        className="mb-3 mx-2"
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
                                    {replyingTo.message}
                                </p>
                            </div>
                            <button
                                onClick={onCancelReply}
                                className="p-1.5 hover:bg-white/10 rounded-full ml-2"
                            >
                                <X className="w-4 h-4 text-white/50" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main input container */}
            <motion.div
                layout
                className="relative"
                style={{
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: isExpanded ? '24px' : '28px',
                    boxShadow: `
                        0 8px 32px rgba(0,0,0,0.4),
                        inset 0 0 20px rgba(255,255,255,0.03),
                        0 0 0 1px rgba(255,255,255,0.05)
                    `,
                }}
            >
                {/* Expanded multimodal options */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={springConfig}
                            className="px-4 pt-4 pb-2 border-b border-white/10"
                        >
                            <div className="flex justify-around">
                                {modes.map((m, i) => (
                                    <motion.button
                                        key={m.id}
                                        initial={{ scale: 0, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        transition={{ ...jellyBounce, delay: i * 0.05 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setMode(m.id as any)}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-colors ${mode === m.id ? 'bg-white/10' : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <m.icon className={`w-6 h-6 ${mode === m.id ? 'text-teal-400' : 'text-white/50'}`} />
                                        <span className="text-xs text-white/50">{m.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input row */}
                <div className="flex items-end gap-2 p-2">
                    {/* Expand button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <motion.div
                            animate={{ rotate: isExpanded ? 45 : 0 }}
                            transition={springConfig}
                        >
                            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </motion.div>
                    </motion.button>

                    {/* Text input with ghost text */}
                    <div className="flex-1 relative">
                        <div className="relative">
                            {/* Ghost text overlay */}
                            {ghostText && (
                                <div className="absolute inset-0 flex items-center pointer-events-none px-4 py-2">
                                    <span className="text-transparent">{message}</span>
                                    <span className="text-white/20 italic">{ghostText}</span>
                                </div>
                            )}
                            <textarea
                                ref={inputRef}
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                    onTyping();
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Message..."
                                disabled={disabled}
                                rows={1}
                                className="w-full bg-transparent text-white placeholder-white/30 px-4 py-2 outline-none resize-none max-h-32"
                                style={{
                                    fontVariationSettings: '"wght" 400',
                                }}
                            />
                        </div>
                        {ghostText && (
                            <p className="text-[10px] text-white/30 px-4 -mt-1">
                                Press Tab to accept
                            </p>
                        )}
                    </div>

                    {/* Send button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSend}
                        disabled={!message.trim() || disabled}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${message.trim()
                            ? 'bg-gradient-to-r from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30'
                            : 'bg-white/10'
                            }`}
                    >
                        <Send className={`w-4 h-4 ${message.trim() ? 'text-white' : 'text-white/30'}`} />
                    </motion.button>
                </div>
            </motion.div>

            {/* Haptic feedback hint */}
            <p className="text-center text-[10px] text-white/20 mt-3">
                Swipe messages to reply • Long swipe for reactions
            </p>
        </div>
    );
}

// ============================================================================
// TYPING INDICATOR
// ============================================================================
function TypingIndicator({ names }: { names: string[] }) {
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
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                        }}
                    />
                ))}
            </div>
            <span className="text-xs text-white/40">{text}</span>
        </motion.div>
    );
}

// ============================================================================
// MAIN FUTURISTIC CHAT COMPONENT
// ============================================================================
export default function FuturisticChat({
    tripId,
    conversationId,
    receiverId,
    receiverName,
    isSquadChat = false,
    isSquadMember = true,
}: FuturisticChatProps) {
    const { data: session } = useSession();
    const { socketUrl } = useEnv();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [connected, setConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    // New Features
    const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsers]);

    // Socket connection (simplified for demo)
    useEffect(() => {
        if (!session?.user || !socketUrl) return;

        const newSocket = io(socketUrl, {
            auth: { token: session.user.token },
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => setConnected(true));
        newSocket.on('disconnect', () => setConnected(false));

        if (tripId) {
            newSocket.emit('join_room', { tripId });
        }

        newSocket.on('receive_message', (data: Message) => {
            setMessages(prev => [...prev, data]);
            // Haptic for incoming message
            if (data.senderId !== session.user.id && 'vibrate' in navigator) {
                navigator.vibrate([20, 10, 20]);
            }
        });

        // Pin Events
        newSocket.on('pinned_message', (msg: Message) => {
            console.log('📌 Initial Pinned Message:', msg);
            setPinnedMessage(msg);
        });

        newSocket.on('message_pinned', (data: any) => {
            console.log('📌 Message Pinned Event:', data);
            setPinnedMessage({
                _id: data.messageId,
                message: data.message,
                senderName: data.senderName,
                type: data.type,
                imageUrl: data.imageUrl,
                senderId: '', // Ideally backend should send this too
                timestamp: new Date().toISOString()
            });
            toast.success(`${data.pinnedBy} pinned a message`);
        });

        newSocket.on('message_unpinned', (data: any) => {
            console.log('📌 Message Unpinned');
            setPinnedMessage(null);
            if (data.unpinnedBy) toast.success(`Message unpinned by ${data.unpinnedBy}`);
        });

        // Delete Events
        newSocket.on('message_deleted', ({ messageId }: { messageId: string }) => {
            setMessages(prev => prev.filter(m => m._id !== messageId));
            // Also check if pinned message was deleted
            setPinnedMessage(prev => prev && prev._id === messageId ? null : prev);
        });

        newSocket.on('user_typing', ({ userName }) => {
            setTypingUsers(prev => [...new Set([...prev, userName])]);
            setTimeout(() => {
                setTypingUsers(prev => prev.filter(n => n !== userName));
            }, 3000);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [session?.user?.id, socketUrl, tripId]);

    const handleSend = (message: string, type: 'text' | 'image' | 'voice') => {
        if (!socket || !session) return;

        const newMessage: Message = {
            senderId: session.user.id,
            senderName: session.user.name || 'You',
            message,
            type,
            timestamp: new Date().toISOString(),
            replyTo: replyingTo ? {
                senderName: replyingTo.senderName,
                message: replyingTo.message,
                type: replyingTo.type,
            } : undefined,
        };

        socket.emit('send_message', {
            tripId,
            ...newMessage,
        });

        setMessages(prev => [...prev, newMessage]);
        setReplyingTo(null);

        // Haptic for sent message
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const handleTyping = () => {
        if (!socket) return;
        socket.emit('typing', { tripId, userName: session?.user?.name });
    };

    const handleReact = (messageId: string, emoji: string) => {
        // Would emit to socket in real implementation
        setMessages(prev => prev.map(m => {
            if (m._id === messageId) {
                const reactions = m.reactions || [];
                return {
                    ...m,
                    reactions: [...reactions, { emoji, userId: session?.user?.id || '' }]
                };
            }
            return m;
        }));
    };

    // Selection Logic
    const toggleSelection = (messageId: string) => {
        setSelectedMessageIds(prev =>
            prev.includes(messageId)
                ? prev.filter(id => id !== messageId)
                : [...prev, messageId]
        );
    };

    const handleDeleteSelected = () => {
        if (!selectedMessageIds.length || !socket) return;

        // Loop deletions (or bulk if backend supported)
        selectedMessageIds.forEach(id => {
            socket.emit('delete_message', { tripId, messageId: id });
        });

        setIsSelectionMode(false);
        setSelectedMessageIds([]);
        toast.success(`Deleted ${selectedMessageIds.length} messages`);
    };

    const handlePinMessage = (messageId: string) => {
        if (!socket) return;
        socket.emit('pin_message', { tripId, messageId });
    };

    const handleUnpinMessage = () => {
        if (!socket) return;
        socket.emit('unpin_message', { tripId });
    };

    if (!isSquadMember) {
        return (
            <div className="relative h-[600px] rounded-3xl overflow-hidden">
                <AnimatedMeshBackground />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="text-center p-8 rounded-3xl max-w-sm mx-4"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-orange-500 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Join to Chat</h3>
                        <p className="text-white/60 text-sm">
                            Become a squad member to access the chat and connect with fellow travelers.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-[600px] rounded-3xl overflow-hidden flex flex-col">
            {/* Animated background */}
            <AnimatedMeshBackground />

            {/* Header */}
            <div
                className="relative z-10 px-4 py-3 flex items-center justify-between shrink-0"
                style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
                    backdropFilter: 'blur(5px)'
                }}
            >
                {isSelectionMode ? (
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <button onClick={() => { setIsSelectionMode(false); setSelectedMessageIds([]); }} className="p-2 hover:bg-white/10 rounded-full text-white/70">
                                <X size={20} />
                            </button>
                            <span className="text-white font-medium">{selectedMessageIds.length} Selected</span>
                        </div>
                        <button
                            onClick={handleDeleteSelected}
                            disabled={!selectedMessageIds.length}
                            className="text-red-400 font-medium px-4 py-1 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
                        >
                            Delete
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-400 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-black/50 backdrop-blur-sm overflow-hidden p-0.5">
                                        <Image
                                            src={receiverName ? `https://ui-avatars.com/api/?name=${receiverName}&background=random` : '/assets/trip-cover-1.jpg'}
                                            alt="Chat"
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    </div>
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm tracking-wide">
                                    {isSquadChat ? 'Squad Chat' : receiverName}
                                </h3>
                                <div className="flex items-center gap-1.5 h-4">
                                    {typingUsers.length > 0 ? (
                                        <span className="text-teal-400 text-xs animate-pulse">typing...</span>
                                    ) : (
                                        <div className="flex items-center gap-1 text-white/40 text-xs">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>
                                            online
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsSelectionMode(true)}
                                className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"
                                title="Select Messages"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </button>
                            {/* Other existing buttons like video/call could go here */}
                        </div>
                    </>
                )}
            </div>

            {/* Pinned Message Banner */}
            <AnimatePresence>
                {pinnedMessage && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="relative z-10 px-4 pb-2 shrink-0"
                    >
                        <div className="bg-teal-900/40 backdrop-blur-md border-l-2 border-teal-500 rounded-r-lg p-2 flex items-center justify-between">
                            <div className="flex-1 min-w-0" onClick={() => {
                                // Scroll to message?
                                const el = document.getElementById(`msg-${pinnedMessage._id}`);
                                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}>
                                <p className="text-[10px] text-teal-300 font-semibold mb-0.5">Pinned Message</p>
                                <p className="text-xs text-white/90 truncate">{pinnedMessage.message}</p>
                            </div>
                            <button
                                onClick={handleUnpinMessage}
                                className="p-1.5 hover:bg-white/10 rounded-full text-white/50 hover:text-white"
                                title="Unpin"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                <div className="space-y-4 pb-4">
                    {messages.map((msg, idx) => (
                        <div id={`msg-${msg._id}`} key={msg._id || idx}>
                            <LiquidGlassBubble
                                message={msg}
                                isOwn={msg.senderId === session?.user?.id}
                                onReply={() => setReplyingTo(msg)}
                                onReact={(emoji) => handleReact(msg._id!, emoji)}
                                index={idx}
                                isSelectionMode={isSelectionMode}
                                isSelected={msg._id ? selectedMessageIds.includes(msg._id) : false}
                                onSelect={() => msg._id && toggleSelection(msg._id)}
                                onPin={() => msg._id && handlePinMessage(msg._id)}
                            />
                        </div>
                    ))}
                    <div ref={messagesEndRef} />

                    {/* Typing Indicator at bottom of list */}
                    <TypingIndicator names={typingUsers} />
                </div>
            </div>

            {/* Input Area (Hidden in Selection Mode) */}
            {!isSelectionMode && (
                <div className="relative z-20 shrink-0">
                    <DynamicInputBar
                        onSend={handleSend}
                        onTyping={handleTyping}
                        replyingTo={replyingTo}
                        onCancelReply={() => setReplyingTo(null)}
                        disabled={!connected}
                    />
                </div>
            )}
        </div>
    );

}
