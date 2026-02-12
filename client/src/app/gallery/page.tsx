'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { memoryAPI, uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Heart,
    MessageCircle,
    Share2,
    MapPin,
    Plus,
    Trash2,
    Camera,
    Bookmark,
    BookmarkCheck,
    Send,
    ChevronDown,
    Sparkles,
    Clock,
    ImageIcon,
    ArrowUp,
    Shield,
    Smartphone,
    Loader2,
    X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ShareMemoryModal from '@/components/ShareMemoryModal';
import ImageLightbox from '@/components/ImageLightbox';
import { motion, AnimatePresence, useInView } from 'framer-motion';

interface Memory {
    _id: string;
    content: string;
    photos: { url: string; caption?: string }[];
    author: {
        _id: string;
        name: string;
        profilePicture?: string;
        subscription?: any;
        isMobileVerified?: boolean;
        verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
    };
    trip: { _id: string; title: string; startPoint: any; endPoint: any };
    likes: string[];
    comments: {
        _id: string;
        user: {
            _id: string;
            name: string;
            profilePicture?: string;
            subscription?: any;
            isMobileVerified?: boolean;
            verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
        };
        text: string;
        createdAt: string;
    }[];
    createdAt: string;
    likeCount: number;
    commentCount: number;
}

// Relative time helper
function timeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ────────────────────────────────────────────────────────────
// Animated Memory Card
// ────────────────────────────────────────────────────────────
function MemoryCard({
    memory,
    index,
    session,
    onLike,
    onComment,
    onDelete,
    onShare,
    onOpenLightbox,
}: {
    memory: Memory;
    index: number;
    session: any;
    onLike: (id: string) => void;
    onComment: (id: string, text: string) => Promise<void>;
    onDelete: (id: string) => void;
    onShare: (m: Memory) => void;
    onOpenLightbox: (images: { url: string; caption?: string }[], idx: number) => void;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    const [showComments, setShowComments] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const lastTap = useRef(0);

    const isLiked = session?.user?.id && memory.likes.includes(session.user.id);
    const isOwner = session?.user?.id === memory.author._id || session?.user?.role === 'admin';

    // Double-tap to like
    const handleDoubleTap = () => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            if (!isLiked) {
                onLike(memory._id);
            }
            setShowHeartAnimation(true);
            setTimeout(() => setShowHeartAnimation(false), 900);
        }
        lastTap.current = now;
    };

    const handleSubmitComment = async () => {
        if (!commentInput.trim() || submitting) return;
        setSubmitting(true);
        await onComment(memory._id, commentInput.trim());
        setCommentInput('');
        setSubmitting(false);
    };

    return (
        <motion.article
            ref={ref}
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{
                duration: 0.6,
                delay: Math.min(index * 0.1, 0.4),
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="group relative rounded-3xl overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(8,15,30,0.9) 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
        >
            {/* ── Author Header ── */}
            <div className="flex items-center justify-between p-4 pb-3">
                <Link href={`/profile/${memory.author._id}`} className="flex items-center gap-3 group/author">
                    <motion.div
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative"
                    >
                        <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-cyan-500/30 ring-offset-2 ring-offset-zinc-900">
                            <Image
                                src={memory.author.profilePicture || '/default-user.jpg'}
                                alt={memory.author.name}
                                width={44}
                                height={44}
                                className="object-cover w-full h-full"
                            />
                        </div>
                        {memory.author.verificationStatus === 'verified' && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-zinc-900">
                                <Shield size={8} className="text-white" />
                            </div>
                        )}
                    </motion.div>
                    <div>
                        <h3 className="font-semibold text-white text-sm flex items-center gap-1.5 group-hover/author:text-cyan-300 transition-colors">
                            {memory.author.name}
                            {memory.author.isMobileVerified && (
                                <span className="inline-flex w-3.5 h-3.5 rounded-full bg-blue-500/20 items-center justify-center border border-blue-500/30">
                                    <Smartphone size={7} className="text-blue-400" />
                                </span>
                            )}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Clock size={10} />
                            <span>{timeAgo(memory.createdAt)}</span>
                            {memory.trip && (
                                <>
                                    <span className="text-zinc-600">·</span>
                                    <MapPin size={10} className="text-cyan-500/60" />
                                    <span className="text-cyan-500/60 truncate max-w-[140px]">{memory.trip.title}</span>
                                </>
                            )}
                        </div>
                    </div>
                </Link>

                <div className="flex items-center gap-1">
                    {isOwner && (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onDelete(memory._id)}
                            className="p-2 rounded-full text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                            <Trash2 size={16} />
                        </motion.button>
                    )}
                </div>
            </div>

            {/* ── Content Text ── */}
            {memory.content && (
                <div className="px-4 pb-3">
                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{memory.content}</p>
                </div>
            )}

            {/* ── Photo Gallery ── */}
            {memory.photos.length > 0 && (
                <div
                    className="relative w-full cursor-pointer"
                    onClick={handleDoubleTap}
                >
                    {/* Single Photo */}
                    {memory.photos.length === 1 && (
                        <div
                            className="relative aspect-[4/3] w-full overflow-hidden"
                            onClick={(e) => { e.stopPropagation(); handleDoubleTap(); }}
                        >
                            <Image
                                src={memory.photos[0].url}
                                alt="Trip Memory"
                                fill
                                sizes="(max-width: 672px) 100vw, 672px"
                                priority={index === 0}
                                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                                onClick={() => onOpenLightbox(memory.photos, 0)}
                            />
                        </div>
                    )}

                    {/* Two Photos — Side by Side */}
                    {memory.photos.length === 2 && (
                        <div className="grid grid-cols-2 gap-0.5">
                            {memory.photos.slice(0, 2).map((photo, i) => (
                                <div key={i} className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => onOpenLightbox(memory.photos, i)}>
                                    <Image src={photo.url} alt="" fill sizes="(max-width: 672px) 50vw, 336px" className="object-cover hover:scale-105 transition-transform duration-500" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Three+ Photos — Grid Layout */}
                    {memory.photos.length >= 3 && (
                        <div className="grid grid-cols-2 gap-0.5 h-full">
                            <div className="relative row-span-2 h-full overflow-hidden cursor-pointer" onClick={() => onOpenLightbox(memory.photos, 0)}>
                                <Image
                                    src={memory.photos[0].url}
                                    alt=""
                                    fill
                                    sizes="(max-width: 672px) 100vw, 672px"
                                    priority={index === 0}
                                    className="object-cover hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => onOpenLightbox(memory.photos, 1)}>
                                <Image src={memory.photos[1].url} alt="" fill sizes="(max-width: 672px) 50vw, 336px" className="object-cover hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => onOpenLightbox(memory.photos, 2)}>
                                <Image src={memory.photos[2].url} alt="" fill sizes="(max-width: 672px) 50vw, 336px" className="object-cover hover:scale-105 transition-transform duration-500" />
                                {memory.photos.length > 3 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                        <span className="text-white text-xl font-bold">+{memory.photos.length - 3}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Double-Tap Heart Animation */}
                    <AnimatePresence>
                        {showHeartAnimation && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                            >
                                <Heart size={80} className="text-red-500 drop-shadow-2xl" fill="currentColor" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ── Action Bar ── */}
            <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    {/* Like */}
                    <motion.button
                        whileTap={{ scale: 0.75 }}
                        onClick={() => onLike(memory._id)}
                        className="flex items-center gap-1.5 group/like"
                    >
                        <motion.div
                            animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            <Heart
                                size={22}
                                className={`transition-colors ${isLiked ? 'text-red-500' : 'text-zinc-500 group-hover/like:text-red-400'}`}
                                fill={isLiked ? 'currentColor' : 'none'}
                            />
                        </motion.div>
                        <span className={`text-sm font-medium ${isLiked ? 'text-red-400' : 'text-zinc-500'}`}>
                            {memory.likeCount > 0 ? memory.likeCount : ''}
                        </span>
                    </motion.button>

                    {/* Comment */}
                    <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-1.5 group/comment"
                    >
                        <MessageCircle
                            size={21}
                            className={`transition-colors ${showComments ? 'text-cyan-400' : 'text-zinc-500 group-hover/comment:text-cyan-400'}`}
                        />
                        <span className={`text-sm font-medium ${showComments ? 'text-cyan-400' : 'text-zinc-500'}`}>
                            {memory.commentCount > 0 ? memory.commentCount : ''}
                        </span>
                    </motion.button>

                    {/* Share */}
                    <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => onShare(memory)}
                        className="text-zinc-500 hover:text-violet-400 transition-colors"
                    >
                        <Share2 size={20} />
                    </motion.button>
                </div>

                {/* Bookmark */}
                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setSaved(!saved)}
                    className="transition-colors"
                >
                    {saved ? (
                        <BookmarkCheck size={22} className="text-amber-400" />
                    ) : (
                        <Bookmark size={22} className="text-zinc-500 hover:text-amber-400 transition-colors" />
                    )}
                </motion.button>
            </div>

            {/* ── Comments Section ── */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 border-t border-white/[0.05] pt-3">
                            {/* Existing Comments */}
                            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                                {(memory.comments || []).length === 0 && (
                                    <p className="text-zinc-600 text-sm text-center py-2">No comments yet. Be the first!</p>
                                )}
                                {(memory.comments || []).map((comment, ci) => (
                                    <motion.div
                                        key={comment._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: ci * 0.05 }}
                                        className="flex gap-2.5"
                                    >
                                        <Link href={`/profile/${comment.user?._id}`} className="flex-shrink-0">
                                            {comment.user?.profilePicture ? (
                                                <Image
                                                    src={comment.user.profilePicture}
                                                    alt={comment.user.name || 'User'}
                                                    width={28}
                                                    height={28}
                                                    className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10"
                                                />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-600 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                    {comment.user?.name?.[0] || '?'}
                                                </div>
                                            )}
                                        </Link>
                                        <div className="flex-1 rounded-2xl px-3 py-2 bg-white/[0.04]">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-semibold text-white">{comment.user?.name || 'Unknown'}</span>
                                                {(comment.user as any)?.verificationStatus === 'verified' && (
                                                    <Shield size={9} className="text-emerald-400" />
                                                )}
                                                <span className="text-[10px] text-zinc-600 ml-auto">{timeAgo(comment.createdAt)}</span>
                                            </div>
                                            <p className="text-zinc-400 text-sm mt-0.5">{comment.text}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Comment Input */}
                            {session && (
                                <div className="flex items-center gap-2 mt-3">
                                    <input
                                        type="text"
                                        value={commentInput}
                                        onChange={(e) => setCommentInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                                        placeholder="Write a comment..."
                                        className="flex-1 text-sm py-2.5 px-4 rounded-full bg-white/[0.04] border border-white/[0.06] text-white placeholder-zinc-600 outline-none focus:border-cyan-500/30 focus:bg-white/[0.06] transition-all"
                                    />
                                    <motion.button
                                        whileTap={{ scale: 0.85 }}
                                        onClick={handleSubmitComment}
                                        disabled={!commentInput.trim() || submitting}
                                        className="p-2.5 rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-30 disabled:hover:bg-cyan-500/20 transition-all"
                                    >
                                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.article>
    );
}

// ────────────────────────────────────────────────────────────
// Main Gallery Page
// ────────────────────────────────────────────────────────────
export default function GalleryPage() {
    const { data: session } = useSession();
    const router = useRouter();

    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState<{ url: string; caption?: string }[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const [showScrollTop, setShowScrollTop] = useState(false);
    const feedRef = useRef<HTMLDivElement>(null);

    // Fetch memories (guarded against strict mode double-fire)
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const data = await memoryAPI.getFeed(1);
                if (!cancelled && data.success) {
                    setMemories(data.memories);
                    setHasMore(data.memories.length === 20);
                }
            } catch (error) {
                console.error('Error fetching gallery:', error);
                if (!cancelled) toast.error('Failed to load moments');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    // Load more when page changes
    useEffect(() => {
        if (page > 1) {
            fetchMemories();
        }
    }, [page]);

    // Scroll to top button visibility
    useEffect(() => {
        const container = feedRef.current;
        if (!container) return;
        const handleScroll = () => {
            setShowScrollTop(container.scrollTop > 600);
        };
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchMemories = async () => {
        try {
            if (page > 1) setLoadingMore(true);
            const data = await memoryAPI.getFeed(page);
            if (data.success) {
                if (page === 1) {
                    setMemories(data.memories);
                } else {
                    setMemories(prev => [...prev, ...data.memories]);
                }
                setHasMore(data.memories.length === 20);
            }
        } catch (error) {
            console.error('Error fetching gallery:', error);
            toast.error('Failed to load moments');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleCreateClick = () => {
        if (!session) {
            toast.error('Please login to share a moment');
            return router.push('/auth/signin');
        }
        setShowCreateModal(true);
    };

    const handleLike = async (memoryId: string) => {
        if (!session) {
            toast.error('Please login to like');
            return;
        }
        try {
            setMemories(prev => prev.map(m => {
                if (m._id === memoryId) {
                    const isLiked = m.likes.includes(session.user.id);
                    return {
                        ...m,
                        likes: isLiked
                            ? m.likes.filter(id => id !== session.user.id)
                            : [...m.likes, session.user.id],
                        likeCount: isLiked ? m.likeCount - 1 : m.likeCount + 1
                    };
                }
                return m;
            }));
            await memoryAPI.toggleLike(memoryId);
        } catch (error) {
            toast.error('Failed to like');
        }
    };

    const handleComment = async (memoryId: string, text: string) => {
        if (!session) return;
        try {
            const response = await memoryAPI.addComment(memoryId, text);
            if (response.success) {
                setMemories(prev => prev.map(m =>
                    m._id === memoryId
                        ? { ...m, comments: [...m.comments, response.comment], commentCount: m.commentCount + 1 }
                        : m
                ));
                toast.success('Comment added');
            }
        } catch (error) {
            toast.error('Failed to add comment');
        }
    };

    const handleDelete = async (memoryId: string) => {
        if (!confirm('Delete this moment?')) return;
        try {
            const response = await memoryAPI.deleteMemory(memoryId);
            if (response.success) {
                setMemories(prev => prev.filter(m => m._id !== memoryId));
                toast.success('Moment deleted');
            }
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleShare = (memory: Memory) => {
        if (navigator.share) {
            navigator.share({
                title: `Trip Moment by ${memory.author.name}`,
                text: memory.content,
                url: window.location.href,
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied!');
        }
    };

    const openLightbox = (images: { url: string; caption?: string }[], index: number) => {
        setLightboxImages(images);
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const scrollToTop = () => {
        feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── Loading skeleton ──
    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col pt-20">
                {/* Header Skeleton */}
                <div className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-2xl border-b border-white/[0.04]">
                    <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/[0.06] animate-pulse" />
                            <div className="h-6 w-32 bg-white/[0.06] rounded-lg animate-pulse" />
                        </div>
                        <div className="h-10 w-28 bg-white/[0.06] rounded-full animate-pulse" />
                    </div>
                </div>
                {/* Cards Skeleton */}
                <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 w-full">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-3xl overflow-hidden animate-pulse" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div className="p-4 flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-white/[0.06]" />
                                <div className="space-y-2">
                                    <div className="h-3 w-24 bg-white/[0.06] rounded" />
                                    <div className="h-2 w-16 bg-white/[0.04] rounded" />
                                </div>
                            </div>
                            <div className="aspect-[4/3] bg-white/[0.04]" />
                            <div className="p-4">
                                <div className="h-3 w-3/4 bg-white/[0.04] rounded mb-3" />
                                <div className="flex gap-5">
                                    <div className="h-5 w-12 bg-white/[0.04] rounded" />
                                    <div className="h-5 w-12 bg-white/[0.04] rounded" />
                                    <div className="h-5 w-12 bg-white/[0.04] rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col relative pt-20">
            {/* ── Image Lightbox ── */}
            <ImageLightbox
                images={lightboxImages}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />

            {/* ── Sticky Header ── */}
            <motion.header
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="sticky top-0 z-20 bg-zinc-950/70 backdrop-blur-2xl border-b border-white/[0.04]"
            >
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center border border-white/[0.06]">
                            <Camera size={18} className="text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight">Trip Moments</h1>
                            <p className="text-[10px] text-zinc-500 -mt-0.5">{memories.length} memories shared</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={handleCreateClick}
                        className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-full font-semibold bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 text-cyan-300 hover:border-cyan-500/40 transition-all"
                    >
                        <Plus size={16} />
                        <span>Share</span>
                    </motion.button>
                </div>
            </motion.header>

            {/* ── Feed ── */}
            <div ref={feedRef} className="flex-1 overflow-y-auto pb-24">
                <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                    {/* Empty State */}
                    {memories.length === 0 && !loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20"
                        >
                            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 flex items-center justify-center border border-white/[0.06] mb-6">
                                <ImageIcon size={36} className="text-cyan-500/40" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No moments yet</h3>
                            <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto">
                                Be the first to share a photo from your trip!
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={handleCreateClick}
                                className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20"
                            >
                                Share Your First Moment
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Memory Cards */}
                    {memories.map((memory, index) => (
                        <MemoryCard
                            key={memory._id}
                            memory={memory}
                            index={index}
                            session={session}
                            onLike={handleLike}
                            onComment={handleComment}
                            onDelete={handleDelete}
                            onShare={handleShare}
                            onOpenLightbox={openLightbox}
                        />
                    ))}

                    {/* Load More */}
                    {memories.length > 0 && (
                        <div className="text-center pt-2 pb-4">
                            {hasMore ? (
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={loadingMore}
                                    className="text-sm px-8 py-3 rounded-full font-medium bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.1] transition-all disabled:opacity-50"
                                >
                                    {loadingMore ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 size={14} className="animate-spin" />
                                            Loading...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <ChevronDown size={14} />
                                            Load More Moments
                                        </span>
                                    )}
                                </motion.button>
                            ) : (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-xs text-zinc-600 flex items-center justify-center gap-1.5"
                                >
                                    <Sparkles size={12} />
                                    You&apos;ve seen all moments
                                </motion.p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Scroll to Top ── */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={scrollToTop}
                        className="fixed bottom-20 left-5 md:bottom-8 md:left-8 w-10 h-10 rounded-full bg-zinc-800/80 backdrop-blur-sm border border-white/[0.08] text-zinc-400 flex items-center justify-center z-30 hover:text-white transition-colors"
                    >
                        <ArrowUp size={18} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ── Share Memory Modal ── */}
            <AnimatePresence>
                {showCreateModal && (
                    <ShareMemoryModal
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={() => {
                            setPage(1);
                            fetchMemories();
                        }}
                    />
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
            `}</style>
        </div>
    );
}
