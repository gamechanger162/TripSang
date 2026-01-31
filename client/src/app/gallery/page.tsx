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

interface Memory {
    _id: string;
    content: string;
    photos: { url: string; caption?: string }[];
    author: { _id: string; name: string; profilePicture?: string };
    trip: { _id: string; title: string; startPoint: any; endPoint: any };
    likes: string[];
    comments: {
        _id: string;
        user: { _id: string; name: string; profilePicture?: string };
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
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pb-24">

            <ImageLightbox
                images={lightboxImages}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />

            {/* Header */}
            <div className="bg-white dark:bg-dark-800 shadow-sm sticky top-0 z-10 transition-all duration-300">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                        Trip Moments
                    </h1>
                    <button
                        onClick={handleCreateClick}
                        className="btn-primary flex items-center gap-2 text-sm px-4 py-2 rounded-full"
                    >
                        <Plus size={18} />
                        <span>Share Photo</span>
                    </button>
                </div>
            </div>

            {/* Feed */}
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
                {memories.map(memory => (
                    <div key={memory._id} className="card overflow-hidden bg-white dark:bg-dark-800 rounded-2xl shadow-lg border border-gray-100 dark:border-dark-700">
                        {/* Author */}
                        <div className="p-4 flex items-center justify-between">
                            <Link href={`/profile/${memory.author._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                                    <Image
                                        src={memory.author.profilePicture || '/default-user.jpg'}
                                        alt={memory.author.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{memory.author.name}</h3>
                                    {(memory.trip) && (
                                        <div className="flex items-center text-xs text-gray-500">
                                            <MapPin size={12} className="mr-1" />
                                            <span>{memory.trip.title}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
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
                                className="relative aspect-square w-full bg-gray-100 dark:bg-dark-900 cursor-pointer group"
                                onClick={() => openLightbox(memory.photos, 0)}
                            >
                                <Image
                                    src={memory.photos[0].url}
                                    alt="Trip Memory"
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                {memory.photos.length > 1 && (
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none">
                                        +{memory.photos.length - 1} more
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-4">
                            <p className="text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-wrap">{memory.content}</p>

                            {/* Actions */}
                            <div className="flex items-center gap-6 border-t border-gray-100 dark:border-dark-700 pt-3">
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
                                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors"
                                >
                                    <MessageCircle size={20} />
                                    <span>{memory.commentCount}</span>
                                </button>

                                <button
                                    onClick={() => handleShare(memory)}
                                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-500 transition-colors ml-auto"
                                >
                                    <Share2 size={20} />
                                </button>
                            </div>

                            {/* Comments Section */}
                            {expandedComments.has(memory._id) && (
                                <div className="mt-4 space-y-3 pt-3 border-t border-gray-100 dark:border-dark-700 animate-fadeIn">
                                    {(memory.comments || []).map((comment) => (
                                        <div key={comment._id} className="flex gap-2">
                                            {comment.user.profilePicture ? (
                                                <Image
                                                    src={comment.user.profilePicture}
                                                    alt={comment.user.name}
                                                    width={28}
                                                    height={28}
                                                    className="w-7 h-7 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-dark-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                                    {comment.user.name[0]}
                                                </div>
                                            )}
                                            <div className="flex-1 bg-gray-50 dark:bg-dark-700 rounded-lg p-2 text-sm">
                                                <p className="font-semibold text-gray-900 dark:text-white text-xs">{comment.user.name}</p>
                                                <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
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
                                                className="flex-1 input-field text-sm py-2"
                                            />
                                            <button
                                                onClick={() => handleAddComment(memory._id)}
                                                className="text-primary-600 font-semibold text-sm hover:text-primary-700 px-2"
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
                                className="btn-secondary text-sm"
                            >
                                Load More
                            </button>
                        ) : (
                            <p className="text-gray-500 text-sm">You've reached the end</p>
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
