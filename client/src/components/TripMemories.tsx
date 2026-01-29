'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { memoryAPI, uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Memory {
    _id: string;
    author: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    content?: string;
    photos: Array<{
        url: string;
        caption?: string;
    }>;
    likes: string[];
    comments: Array<{
        _id: string;
        user: {
            _id: string;
            name: string;
            profilePicture?: string;
        };
        text: string;
        createdAt: string;
    }>;
    createdAt: string;
    likeCount: number;
    commentCount: number;
}

interface TripMemoriesProps {
    tripId: string;
    isSquadMember: boolean;
    tripEnded: boolean;
}

export default function TripMemories({ tripId, isSquadMember, tripEnded }: TripMemoriesProps) {
    const { data: session } = useSession();
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newMemoryContent, setNewMemoryContent] = useState('');
    const [newMemoryPhotos, setNewMemoryPhotos] = useState<File[]>([]);
    const [photoPreview, setPhotoPreview] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchMemories();
    }, [tripId]);

    const fetchMemories = async () => {
        try {
            setLoading(true);
            const response = await memoryAPI.getTripMemories(tripId);
            if (response.success) {
                setMemories(response.memories || []);
            }
        } catch (error) {
            console.error('Failed to fetch memories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (files.length + newMemoryPhotos.length > 5) {
            toast.error('Maximum 5 photos allowed');
            return;
        }

        setNewMemoryPhotos([...newMemoryPhotos, ...files]);

        // Create previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleCreateMemory = async () => {
        if (!newMemoryContent.trim() && newMemoryPhotos.length === 0) {
            toast.error('Add some content or photos to your memory');
            return;
        }

        setUploading(true);
        try {
            // Upload photos first
            const uploadedPhotos = [];
            for (const photo of newMemoryPhotos) {
                const uploadResponse = await uploadAPI.uploadFile(photo);
                if (uploadResponse.success) {
                    uploadedPhotos.push({ url: uploadResponse.url });
                }
            }

            // Create memory
            const response = await memoryAPI.create(tripId, {
                content: newMemoryContent.trim() || undefined,
                photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined
            });

            if (response.success) {
                toast.success('Memory posted!');
                setShowCreateModal(false);
                setNewMemoryContent('');
                setNewMemoryPhotos([]);
                setPhotoPreview([]);
                fetchMemories();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to post memory');
        } finally {
            setUploading(false);
        }
    };

    const handleLike = async (memoryId: string) => {
        try {
            const response = await memoryAPI.toggleLike(memoryId);
            if (response.success) {
                setMemories(prev => prev.map(m =>
                    m._id === memoryId
                        ? { ...m, likes: response.liked ? [...m.likes, session?.user?.id || ''] : m.likes.filter(id => id !== session?.user?.id), likeCount: response.likeCount }
                        : m
                ));
            }
        } catch (error) {
            toast.error('Failed to like memory');
        }
    };

    const handleAddComment = async (memoryId: string) => {
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
            }
        } catch (error) {
            toast.error('Failed to add comment');
        }
    };

    const handleDeleteMemory = async (memoryId: string) => {
        if (!confirm('Delete this memory?')) return;

        try {
            const response = await memoryAPI.deleteMemory(memoryId);
            if (response.success) {
                toast.success('Memory deleted');
                setMemories(prev => prev.filter(m => m._id !== memoryId));
            }
        } catch (error) {
            toast.error('Failed to delete memory');
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

    if (!tripEnded) {
        return (
            <div className="card text-center py-8">
                <p className="text-gray-500">Memories will be available after the trip ends</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trip Memories</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Share your favorite moments from this trip</p>
                </div>
                {isSquadMember && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary"
                    >
                        + Add Memory
                    </button>
                )}
            </div>

            {/* Memories List */}
            {loading ? (
                <div className="text-center py-8">Loading memories...</div>
            ) : memories.length === 0 ? (
                <div className="card text-center py-12">
                    <p className="text-gray-500">No memories yet. {isSquadMember && 'Be the first to share!'}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {memories.map((memory) => (
                        <div key={memory._id} className="card">
                            {/* Author Info */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {memory.author.profilePicture ? (
                                        <Image
                                            src={memory.author.profilePicture}
                                            alt={memory.author.name}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                                            {memory.author.name[0]}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{memory.author.name}</p>
                                        <p className="text-xs text-gray-500">{new Date(memory.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {session?.user?.id === memory.author._id && (
                                    <button
                                        onClick={() => handleDeleteMemory(memory._id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            {memory.content && (
                                <p className="text-gray-700 dark:text-gray-300 mb-4">{memory.content}</p>
                            )}

                            {/* Photos */}
                            {memory.photos.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                                    {memory.photos.map((photo, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                                            <Image
                                                src={photo.url}
                                                alt={photo.caption || 'Memory photo'}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => handleLike(memory._id)}
                                    className={`flex items-center gap-2 ${memory.likes.includes(session?.user?.id || '') ? 'text-red-500' : 'text-gray-600'}`}
                                >
                                    <svg className="w-5 h-5" fill={memory.likes.includes(session?.user?.id || '') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    {memory.likeCount}
                                </button>
                                <button
                                    onClick={() => toggleComments(memory._id)}
                                    className="flex items-center gap-2 text-gray-600"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    {memory.commentCount}
                                </button>
                            </div>

                            {/* Comments Section */}
                            {expandedComments.has(memory._id) && (
                                <div className="mt-4 space-y-3">
                                    {memory.comments.map((comment) => (
                                        <div key={comment._id} className="flex gap-2">
                                            {comment.user.profilePicture ? (
                                                <Image
                                                    src={comment.user.profilePicture}
                                                    alt={comment.user.name}
                                                    width={32}
                                                    height={32}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                                                    {comment.user.name[0]}
                                                </div>
                                            )}
                                            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                                                <p className="text-xs font-semibold">{comment.user.name}</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Comment Input */}
                                    {session && (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={commentText[memory._id] || ''}
                                                onChange={(e) => setCommentText({ ...commentText, [memory._id]: e.target.value })}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment(memory._id)}
                                                placeholder="Add a comment..."
                                                className="flex-1 input-field"
                                            />
                                            <button
                                                onClick={() => handleAddComment(memory._id)}
                                                className="btn-primary"
                                            >
                                                Post
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Memory Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-2xl font-bold mb-4">Share a Memory</h3>

                            <textarea
                                value={newMemoryContent}
                                onChange={(e) => setNewMemoryContent(e.target.value)}
                                placeholder="What made this trip special?"
                                className="input-field w-full h-32 resize-none mb-4"
                            />

                            {/* Photo Previews */}
                            {photoPreview.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    {photoPreview.map((preview, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                                            <Image src={preview} alt="Preview" fill className="object-cover" />
                                            <button
                                                onClick={() => {
                                                    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
                                                    setNewMemoryPhotos(prev => prev.filter((_, i) => i !== index));
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Photos */}
                            <label className="btn-secondary cursor-pointer inline-block mb-4">
                                📷 Add Photos ({newMemoryPhotos.length}/5)
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                />
                            </label>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCreateMemory}
                                    disabled={uploading}
                                    className="btn-primary flex-1"
                                >
                                    {uploading ? 'Posting...' : 'Post Memory'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewMemoryContent('');
                                        setNewMemoryPhotos([]);
                                        setPhotoPreview([]);
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
