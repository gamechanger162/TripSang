'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; // Missing in imports but used (I should double check next-auth usage in other files, usually it's useSession) - yes
import Image from 'next/image';
import Link from 'next/link';
import { memoryAPI, tripAPI, uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Heart, MessageCircle, Share2, MapPin, Calendar, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ShareMemoryModal from '@/components/ShareMemoryModal';

interface Memory {
    _id: string;
    content: string;
    photos: { url: string; caption?: string }[];
    author: { _id: string; name: string; profilePicture?: string };
    trip: { _id: string; title: string; startPoint: any; endPoint: any };
    likes: string[];
    comments: any[];
    createdAt: string;
    likeCount: number;
    commentCount: number;
}

export default function GalleryPage() {
    const { data: session } = useSession(); // To check if user can post
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);


    const router = useRouter(); // Initialize router

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
                setHasMore(data.memories.length === 20); // Assuming limit 20
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
            // Revert changes could be added here if needed
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pb-24">
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
                                    {(memory.trip || memory.trip) && (
                                        <div className="flex items-center text-xs text-gray-500">
                                            <MapPin size={12} className="mr-1" />
                                            <span>{memory.trip ? memory.trip.title : 'Travel Memory'}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                            <span className="text-xs text-gray-400">
                                {new Date(memory.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        {/* Photos */}
                        {memory.photos.length > 0 && (
                            <div className="relative aspect-square w-full bg-gray-100 dark:bg-dark-900">
                                <Image
                                    src={memory.photos[0].url}
                                    alt="Trip Memory"
                                    fill
                                    className="object-cover"
                                />
                                {memory.photos.length > 1 && (
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
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

                                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors">
                                    <MessageCircle size={20} />
                                    <span>{memory.commentCount}</span>
                                </button>

                                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-500 transition-colors ml-auto">
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
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
