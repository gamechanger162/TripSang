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
}

function LiquidGlassBubble({ message, isOwn, onReply, onReact, index }: LiquidGlassBubbleProps) {
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
                drag="x"
                dragConstraints={{ left: isOwn ? -150 : 0, right: isOwn ? 0 : 150 }}
                dragElastic={0.3}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                style={{ x }}
                whileDrag={{ scale: 1.02 }}
                className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}
            >
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
    }, [session, socketUrl, tripId]);

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
        <div className="relative h-[600px] rounded-3xl overflow-hidden">
            {/* Animated background */}
            <AnimatedMeshBackground />

            {/* Header */}
            <div
                className="relative z-10 px-4 py-4 flex items-center justify-between"
                style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
                }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-orange-400 flex items-center justify-center">
                        <span className="text-white font-bold">
                            {isSquadChat ? '🎯' : receiverName?.[0] || '?'}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold" style={{ fontVariationSettings: '"wght" 600' }}>
                            {isSquadChat ? 'Squad Chat' : receiverName}
                        </h3>
                        <p className="text-xs text-white/50">
                            {connected ? (
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Connected
                                </span>
                            ) : 'Connecting...'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
                className="relative z-10 h-[calc(100%-180px)] overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-white/10"
                style={{
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
                }}
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg, index) => (
                        <LiquidGlassBubble
                            key={msg._id || index}
                            message={msg}
                            isOwn={msg.senderId === session?.user?.id}
                            onReply={() => setReplyingTo(msg)}
                            onReact={(emoji) => handleReact(msg._id || '', emoji)}
                            index={index}
                        />
                    ))}
                </AnimatePresence>

                <AnimatePresence>
                    {typingUsers.length > 0 && <TypingIndicator names={typingUsers} />}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <DynamicInputBar
                onSend={handleSend}
                onTyping={handleTyping}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                disabled={!connected}
            />
        </div>
    );
}
