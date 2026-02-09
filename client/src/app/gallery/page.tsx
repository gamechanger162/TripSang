'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { memoryAPI, tripAPI, uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Heart, MessageCircle, Share2, MapPin, Plus, X, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ShareMemoryModal from '@/components/ShareMemoryModal';
import ImageLightbox from '@/components/ImageLightbox';
import { Shield, Smartphone } from 'lucide-react';


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

export default function GalleryPage() {
    const { data: session } = useSession();
    const router = useRouter();

    // Data State
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Lightbox State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState<{ url: string; caption?: string }[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Interaction State
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchMemories();
    }, []);

    const fetchMemories = async () => {
        try {
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
            toast.error('Failed to load gallery');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClick = () => {
        if (!session) {
            toast.error('Please login to post photos');
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
            // Optimistic update
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
            console.error('Error toggling like:', error);
            toast.error('Failed to like post');
        }
    };

    const toggleComments = (memoryId: string) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(memoryId)) {
                newSet.delete(memoryId);
            } else {
                newSet.add(memoryId);
            }
            return newSet;
        });
    };

    const handleAddComment = async (memoryId: string) => {
        if (!session) return;

        const text = commentText[memoryId]?.trim();
        if (!text) return;

        try {
            const response = await memoryAPI.addComment(memoryId, text);
            if (response.success) {
                setMemories(prev => prev.map(m =>
                    m._id === memoryId
                        ? { ...m, comments: [...m.comments, response.comment], commentCount: m.commentCount + 1 }
                        : m
                ));
                setCommentText({ ...commentText, [memoryId]: '' });
                toast.success('Comment added');
            }
        } catch (error) {
            toast.error('Failed to add comment');
        }
    };

    const handleDelete = async (memoryId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await memoryAPI.deleteMemory(memoryId);
            if (response.success) {
                setMemories(prev => prev.filter(m => m._id !== memoryId));
                toast.success('Post deleted successfully');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete post');
        }
    };

    const handleShare = (memory: Memory) => {
        if (navigator.share) {
            navigator.share({
                title: `Trip Memory by ${memory.author.name}`,
                text: memory.content,
                url: window.location.href // Ideally link to specific memory if possible
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard');
        }
    };

    const openLightbox = (images: { url: string; caption?: string }[], index: number) => {
        setLightboxImages(images);
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#001428] via-[#001020] to-[#000a14] pb-24">

            <ImageLightbox
                images={lightboxImages}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />

            {/* Header */}
            <div className="sticky top-0 z-10 transition-all duration-300" style={{ background: 'linear-gradient(180deg, rgba(0,20,40,0.95) 0%, rgba(0,16,32,0.9) 100%)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,255,255,0.15)', boxShadow: '0 4px 30px rgba(0,255,255,0.1)' }}>
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white" style={{ textShadow: '0 0 30px rgba(0,255,255,0.5)' }}>
                        Trip Moments
                    </h1>
                    <button
                        onClick={handleCreateClick}
                        className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-full font-semibold transition-all"
                        style={{ background: 'linear-gradient(135deg, rgba(0,255,255,0.2) 0%, rgba(139,92,246,0.2) 100%)', border: '1px solid rgba(0,255,255,0.4)', color: '#00ffff', boxShadow: '0 0 20px rgba(0,255,255,0.2)' }}
                    >
                        <Plus size={18} />
                        <span>Share Photo</span>
                    </button>
                </div>
            </div>

            {/* Feed */}
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
                {memories.map(memory => (
                    <div key={memory._id} className="overflow-hidden rounded-2xl" style={{ background: 'rgba(0,30,50,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(0,255,255,0.05)' }}>
                        {/* Author */}
                        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,255,255,0.1)' }}>
                            <Link href={`/profile/${memory.author._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden" style={{ border: '2px solid rgba(0,255,255,0.4)', boxShadow: '0 0 15px rgba(0,255,255,0.3)' }}>
                                    <Image
                                        src={memory.author.profilePicture || '/default-user.jpg'}
                                        alt={memory.author.name}
                                        fill
                                        className="object-cover"
                                    />

                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-sm flex items-center gap-1" style={{ textShadow: '0 0 10px rgba(0,255,255,0.3)' }}>
                                        {memory.author.name}
                                        {(memory.author as any)?.isMobileVerified && (
                                            <div
                                                className="w-3.5 h-3.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center border border-blue-500/20"
                                                title="Phone Verified"
                                            >
                                                <Smartphone size={8} className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                        )}
                                        {memory.author.verificationStatus === 'verified' && (
                                            <div
                                                className="w-3.5 h-3.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20"
                                                title="Identity Verified"
                                            >
                                                <Shield size={8} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                        )}
                                    </h3>
                                    {(memory.trip) && (
                                        <div className="flex items-center text-xs" style={{ color: 'rgba(0,255,255,0.6)' }}>
                                            <MapPin size={12} className="mr-1" />
                                            <span>{memory.trip.title}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>

                            <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: 'rgba(0,255,255,0.5)' }}>
                                    {new Date(memory.createdAt).toLocaleDateString()}
                                </span>
                                {(session?.user?.role === 'admin' || session?.user?.id === memory.author._id) && (
                                    <button
                                        onClick={() => handleDelete(memory._id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        title="Delete Post"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Photos */}
                        {memory.photos.length > 0 && (
                            <div
                                className="relative aspect-square w-full cursor-pointer group"
                                style={{ background: 'rgba(0,20,40,0.5)' }}
                                onClick={() => openLightbox(memory.photos, 0)}
                            >
                                <Image
                                    src={memory.photos[0].url}
                                    alt="Trip Memory"
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                {memory.photos.length > 1 && (
                                    <div className="absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none" style={{ background: 'rgba(0,255,255,0.2)', border: '1px solid rgba(0,255,255,0.3)' }}>
                                        +{memory.photos.length - 1} more
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-4">
                            <p className="text-gray-200 mb-3 whitespace-pre-wrap">{memory.content}</p>

                            {/* Actions */}
                            <div className="flex items-center gap-6 pt-3" style={{ borderTop: '1px solid rgba(0,255,255,0.1)' }}>
                                <button
                                    onClick={() => handleLike(memory._id)}
                                    className={`flex items-center gap-2 text-sm transition-colors ${session && memory.likes.includes(session.user.id)
                                        ? 'text-red-500'
                                        : 'text-gray-500 hover:text-red-500'
                                        }`}
                                >
                                    <Heart size={20} fill={session && memory.likes.includes(session.user.id) ? "currentColor" : "none"} />
                                    <span>{memory.likeCount}</span>
                                </button>

                                <button
                                    onClick={() => toggleComments(memory._id)}
                                    className="flex items-center gap-2 text-sm transition-colors"
                                    style={{ color: 'rgba(0,255,255,0.6)' }}
                                >
                                    <MessageCircle size={20} />
                                    <span>{memory.commentCount}</span>
                                </button>

                                <button
                                    onClick={() => handleShare(memory)}
                                    className="flex items-center gap-2 text-sm transition-colors ml-auto"
                                    style={{ color: 'rgba(139,92,246,0.7)' }}
                                >
                                    <Share2 size={20} />
                                </button>
                            </div>

                            {/* Comments Section */}
                            {expandedComments.has(memory._id) && (
                                <div className="mt-4 space-y-3 pt-3 animate-fadeIn" style={{ borderTop: '1px solid rgba(0,255,255,0.1)' }}>
                                    {(memory.comments || []).map((comment) => (
                                        <div key={comment._id} className="flex gap-2">
                                            <div className="relative flex-shrink-0">
                                                {comment.user?.profilePicture ? (
                                                    <Image
                                                        src={comment.user.profilePicture}
                                                        alt={comment.user.name || 'User'}
                                                        width={28}
                                                        height={28}
                                                        className="w-7 h-7 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #0891b2, #8b5cf6)', color: 'white' }}>
                                                        {(comment.user?.name?.[0]) || '?'}
                                                    </div>
                                                )}

                                            </div>
                                            <div className="flex-1 rounded-lg p-2 text-sm" style={{ background: 'rgba(0,40,60,0.5)' }}>
                                                <p className="font-semibold text-white text-xs flex items-center gap-1">
                                                    {comment.user?.name || 'Unknown User'}
                                                    {(comment.user as any)?.isMobileVerified && (
                                                        <div
                                                            className="w-3 h-3 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center border border-blue-500/20"
                                                            title="Phone Verified"
                                                        >
                                                            <Smartphone size={7} className="text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                    )}
                                                    {(comment.user as any)?.verificationStatus === 'verified' && (
                                                        <div
                                                            className="w-3 h-3 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20"
                                                            title="Identity Verified"
                                                        >
                                                            <Shield size={7} className="text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                    )}
                                                </p>
                                                <p className="text-gray-300">{comment.text}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Comment Input */}
                                    {session && (
                                        <div className="flex gap-2 mt-2">
                                            <input
                                                type="text"
                                                value={commentText[memory._id] || ''}
                                                onChange={(e) => setCommentText({ ...commentText, [memory._id]: e.target.value })}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment(memory._id)}
                                                placeholder="Add a comment..."
                                                className="flex-1 text-sm py-2 px-3 rounded-lg transition-all"
                                                style={{ background: 'rgba(0,40,60,0.5)', border: '1px solid rgba(0,255,255,0.2)', color: 'white', outline: 'none' }}
                                            />
                                            <button
                                                onClick={() => handleAddComment(memory._id)}
                                                className="font-semibold text-sm px-3" style={{ color: '#00ffff' }}
                                            >
                                                Post
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {memories.length > 0 && (
                    <div className="text-center pt-4">
                        {hasMore ? (
                            <button
                                onClick={() => setPage(p => p + 1)}
                                className="text-sm px-6 py-2 rounded-full font-medium transition-all"
                                style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.3)', color: '#00ffff' }}
                            >
                                Load More
                            </button>
                        ) : (
                            <p className="text-sm" style={{ color: 'rgba(0,255,255,0.4)' }}>You've reached the end</p>
                        )}
                    </div>
                )}
            </div>

            {/* Share Memory Modal */}
            {showCreateModal && (
                <ShareMemoryModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setPage(1);
                        fetchMemories();
                    }}
                />
            )}
        </div>
    );
}
