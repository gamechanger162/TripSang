'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { memoryAPI, uploadAPI, userAPI } from '@/lib/api';

interface Trip {
    _id: string;
    title: string;
    startDate: string;
}

interface ShareMemoryModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function ShareMemoryModal({ onClose, onSuccess }: ShareMemoryModalProps) {
    const [content, setContent] = useState('');
    const [selectedTripId, setSelectedTripId] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loadingTrips, setLoadingTrips] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchUserTrips();
    }, []);

    const fetchUserTrips = async () => {
        try {
            const response = await userAPI.getTrips();
            if (response.success) {
                setTrips(response.trips);
                if (response.trips.length > 0) {
                    setSelectedTripId(response.trips[0]._id);
                }
            }
        } catch (error) {
            console.error('Error fetching trips:', error);
            toast.error('Failed to load your trips');
        } finally {
            setLoadingTrips(false);
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + photos.length > 5) {
            toast.error('Maximum 5 photos allowed');
            return;
        }

        setPhotos([...photos, ...files]);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedTripId) {
            toast.error('Please select a trip');
            return;
        }
        if (!content.trim() && photos.length === 0) {
            toast.error('Please add some content or photos');
            return;
        }

        setUploading(true);
        try {
            // Upload photos first (in parallel)
            let uploadedPhotos: { url: string }[] = [];
            if (photos.length > 0) {
                const uploadPromises = photos.map(photo => uploadAPI.uploadFile(photo));
                const uploadResults = await Promise.all(uploadPromises);

                uploadedPhotos = uploadResults
                    .filter(res => res.success && res.url)
                    .map(res => ({ url: res.url }));

                if (uploadedPhotos.length !== photos.length) {
                    throw new Error('Some photos failed to upload. Please try again.');
                }
            }

            // Create memory
            const response = await memoryAPI.create(selectedTripId, {
                content: content.trim(),
                photos: uploadedPhotos,
            });

            if (response.success) {
                toast.success('Memory shared successfully!');
                onSuccess();
                onClose();
            } else {
                throw new Error(response.message || 'Failed to share memory');
            }
        } catch (error: any) {
            console.error('Error sharing memory:', error);
            toast.error(error.message || 'Failed to share memory');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                        Share Memory
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Trip Selector */}
                    <div>
                        <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1.5 spacing-x-1">
                            Select Trip
                        </label>
                        {loadingTrips ? (
                            <div className="animate-pulse h-10 bg-gray-100 dark:bg-dark-700 rounded-xl" />
                        ) : trips.length > 0 ? (
                            <select
                                value={selectedTripId}
                                onChange={(e) => setSelectedTripId(e.target.value)}
                                className="w-full p-3 border border-gray-200 dark:border-dark-700 rounded-xl bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                            >
                                {trips.map(trip => (
                                    <option key={trip._id} value={trip._id} className="text-gray-900 dark:text-white bg-white dark:bg-dark-800">
                                        {trip.title}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                                You need to join a trip to share memories.
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full h-32 p-3 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 border border-transparent transition-all"
                    />

                    {/* Photo Previews */}
                    {photoPreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {photoPreviews.map((preview, index) => (
                                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                                    <Image
                                        src={preview}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        onClick={() => handleRemovePhoto(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-dark-700">
                        <label className="cursor-pointer p-3 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full text-primary-600 transition-colors">
                            <ImageIcon size={24} />
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handlePhotoSelect}
                            />
                        </label>

                        <button
                            onClick={handleSubmit}
                            disabled={uploading || (trips.length === 0) || (!content && photos.length === 0)}
                            className="btn-primary px-6 py-2.5 rounded-full flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Posting...</span>
                                </>
                            ) : (
                                <span>Share Memory</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
