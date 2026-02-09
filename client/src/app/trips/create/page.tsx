'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { tripAPI, friendAPI, uploadAPI } from '@/lib/api';
import { geocodeCity } from '@/lib/geocoding';
import toast from 'react-hot-toast';
import Image from 'next/image';
import CityAutocomplete from '@/components/CityAutocomplete';
import MeshBackground from '@/components/app/ui/MeshBackground';
import { INDIAN_CITIES } from '@/data/cities';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Friend {
    _id: string;
    name: string;
    profilePicture?: string;
}

const POPULAR_TAGS = [
    '#Trekking',
    '#Foodie',
    '#Adventure',
    '#Beach',
    '#Mountains',
    '#Culture',
    '#Photography',
    '#Wildlife',
    '#Backpacking',
    '#Luxury',
    '#Solo',
    '#Family',
    '#Weekend',
    '#Camping',
    '#RoadTrip',
    '#Spiritual',
    '#History',
    '#Nature',
    '#Budget',
    '#Nightlife',
];

const DIFFICULTY_LEVELS = [
    { value: 'easy', label: 'Easy', description: 'Suitable for beginners' },
    { value: 'moderate', label: 'Moderate', description: 'Some experience needed' },
    { value: 'difficult', label: 'Difficult', description: 'Experienced travelers' },
    { value: 'extreme', label: 'Extreme', description: 'Expert level only' },
];

export default function CreateTripPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startPoint: '',
        endPoint: '',
        startDate: '',
        endDate: '',
        minBudget: '',
        maxBudget: '',
        maxSquadSize: '10',
        difficulty: 'moderate',
        isPublic: true,
    });

    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTagInput, setCustomTagInput] = useState('');
    const [coverPhoto, setCoverPhoto] = useState<File | null>(null);

    // Friend invitation state
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [friendSearchQuery, setFriendSearchQuery] = useState('');
    const [loadingFriends, setLoadingFriends] = useState(false);

    // Auth checks
    useEffect(() => {
        if (status === 'loading') return;

        // Check if user is logged in
        if (status === 'unauthenticated') {
            toast.error('Please login to create a trip');
            router.push('/auth/signin?callbackUrl=/trips/create');
            return;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    // Fetch friends list
    useEffect(() => {
        const fetchFriends = async () => {
            if (status !== 'authenticated') return;

            setLoadingFriends(true);
            try {
                const response = await friendAPI.getFriends();
                if (response.success && response.friends) {
                    setFriends(response.friends);
                }
            } catch (error) {
                console.error('Failed to fetch friends:', error);
            } finally {
                setLoadingFriends(false);
            }
        };

        fetchFriends();
    }, [status]);

    // Toggle friend selection
    const toggleFriendSelection = (friendId: string) => {
        setSelectedFriends((prev) =>
            prev.includes(friendId)
                ? prev.filter((id) => id !== friendId)
                : [...prev, friendId]
        );
    };

    // Filter friends by search query
    const filteredFriends = friends.filter((friend) =>
        friend.name.toLowerCase().includes(friendSearchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const target = e.target as HTMLInputElement;
            setFormData((prev) => ({
                ...prev,
                [name]: target.checked,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const addCustomTag = () => {
        if (!customTagInput.trim()) return;

        // Format the tag: remove spaces, add # if not present
        let tag = customTagInput.trim();
        // Remove all spaces
        tag = tag.replace(/\s+/g, '');
        // Add # if not present
        if (!tag.startsWith('#')) {
            tag = '#' + tag;
        }
        // Capitalize first letter after #
        tag = '#' + tag.slice(1).charAt(0).toUpperCase() + tag.slice(2);

        // Check if tag already exists
        if (selectedTags.includes(tag)) {
            toast.error('This tag is already added');
            return;
        }

        // Validate tag format (alphanumeric only after #)
        if (!/^#[a-zA-Z0-9_]+$/.test(tag)) {
            toast.error('Tags can only contain letters, numbers, and underscores');
            return;
        }

        setSelectedTags((prev) => [...prev, tag]);
        setCustomTagInput('');
    };

    const handleCustomTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomTag();
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }

            setCoverPhoto(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        try {
            const response = await uploadAPI.uploadFile(file);
            console.log('Upload response:', response);
            return response.url || response.imageUrl;
        } catch (error) {
            console.error('Upload failed:', error);
            throw new Error('Failed to upload image');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title.trim()) {
            toast.error('Please enter a trip title');
            return;
        }

        if (!formData.startPoint.trim() || !formData.endPoint.trim()) {
            toast.error('Please enter start and end points');
            return;
        }

        if (!formData.startDate || !formData.endDate) {
            toast.error('Please select start and end dates');
            return;
        }

        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            toast.error('End date must be after start date');
            return;
        }

        if (selectedTags.length === 0) {
            toast.error('Please select at least one vibe tag');
            return;
        }

        setLoading(true);

        try {
            // Upload image if selected
            let coverPhotoUrl = '';
            if (coverPhoto) {
                toast.loading('Uploading image...', { id: 'upload' });
                coverPhotoUrl = await uploadImage(coverPhoto);
                toast.success('Image uploaded!', { id: 'upload' });
            }

            // Geocode Start and End Points
            const startCoords = await geocodeCity(formData.startPoint);
            const endCoords = await geocodeCity(formData.endPoint);

            // Prepare trip data
            const tripData = {
                title: formData.title,
                description: formData.description || undefined,
                startPoint: {
                    name: formData.startPoint,
                    coordinates: startCoords ? {
                        latitude: startCoords.lat,
                        longitude: startCoords.lng
                    } : undefined
                },
                endPoint: {
                    name: formData.endPoint,
                    coordinates: endCoords ? {
                        latitude: endCoords.lat,
                        longitude: endCoords.lng
                    } : undefined
                },
                startDate: formData.startDate,
                endDate: formData.endDate,
                tags: selectedTags,
                coverPhoto: coverPhotoUrl || undefined,
                maxSquadSize: parseInt(formData.maxSquadSize) || 10,
                budget: formData.minBudget && formData.maxBudget ? {
                    min: parseFloat(formData.minBudget),
                    max: parseFloat(formData.maxBudget),
                    currency: 'INR',
                } : undefined,
                difficulty: formData.difficulty as 'easy' | 'moderate' | 'difficult' | 'extreme',
                isPublic: formData.isPublic,
                inviteFriends: selectedFriends.length > 0 ? selectedFriends : undefined,
            };

            // Create trip via API
            const response = await tripAPI.create(tripData);

            if (response.success) {
                const friendCount = selectedFriends.length;
                if (friendCount > 0) {
                    toast.success(`Trip created! ${friendCount} friend${friendCount > 1 ? 's' : ''} added to squad.`);
                } else {
                    toast.success('Trip created successfully!');
                }
                // Redirect to the new trip page
                router.push(`/trips/${response.trip._id}`);
            }
        } catch (error: any) {
            console.error('Error creating trip:', error);

            // Check for premium-related errors and redirect
            const errorMessage = error.message?.toLowerCase() || '';
            if (errorMessage.includes('premium') || errorMessage.includes('subscription required')) {
                toast.error('Premium membership required to create trips');
                router.push('/payment/signup');
                return;
            }
            if (errorMessage.includes('login required') || errorMessage.includes('access denied')) {
                toast.error('Please login first');
                router.push('/auth/signin?callbackUrl=/trips/create');
                return;
            }

            toast.error(error.message || 'Failed to create trip');
        } finally {
            setLoading(false);
        }
    };

    // Show loading while checking auth
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render form if not authenticated
    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#000a1f] relative overflow-hidden selection:bg-cyan-500/30">
            <MeshBackground />

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="group flex items-center text-cyan-400 hover:text-cyan-300 mb-6 transition-colors"
                    >
                        <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 mr-3 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </div>
                        <span className="font-medium">Back to Dashboard</span>
                    </button>

                    <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 mb-4 filter drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                        Create New Trip
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl font-light">
                        Design your next adventure. Invite your squad. <span className="text-cyan-400 font-medium">Make it legendary.</span>
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info Card */}
                    <div className="bg-[#001428]/80 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(8,145,178,0.1)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                                <span className="w-1 h-8 bg-cyan-500 rounded-full shadow-[0_0_10px_#22d3ee]"></span>
                                Basic Information
                            </h2>

                            {/* Title */}
                            <div className="mb-8">
                                <label htmlFor="title" className="block text-sm font-medium text-cyan-400 mb-2 uppercase tracking-wider">
                                    Trip Title *
                                </label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Neon Nights in Tokyo"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-lg"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="mb-8">
                                <label htmlFor="description" className="block text-sm font-medium text-cyan-400 mb-2 uppercase tracking-wider">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    placeholder="Tell the world what this adventure is about..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none"
                                />
                            </div>

                            {/* Route */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label htmlFor="startPoint" className="block text-sm font-medium text-cyan-400 mb-2 uppercase tracking-wider">
                                        Starting Point *
                                    </label>
                                    <CityAutocomplete
                                        id="startPoint"
                                        name="startPoint"
                                        value={formData.startPoint}
                                        onChange={(value) => setFormData({ ...formData, startPoint: value })}
                                        placeholder="e.g., Delhi"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                                        required
                                        cities={INDIAN_CITIES}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="endPoint" className="block text-sm font-medium text-cyan-400 mb-2 uppercase tracking-wider">
                                        Destination *
                                    </label>
                                    <CityAutocomplete
                                        id="endPoint"
                                        name="endPoint"
                                        value={formData.endPoint}
                                        onChange={(value) => setFormData({ ...formData, endPoint: value })}
                                        placeholder="e.g., Manali"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                                        required
                                        cities={INDIAN_CITIES}
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-cyan-400 mb-2 uppercase tracking-wider">
                                        Start Date *
                                    </label>
                                    <input
                                        id="startDate"
                                        name="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all [color-scheme:dark]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-cyan-400 mb-2 uppercase tracking-wider">
                                        End Date *
                                    </label>
                                    <input
                                        id="endDate"
                                        name="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all [color-scheme:dark]"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Budget & Details Card */}
                    <div className="bg-[#001428]/80 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(8,145,178,0.1)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                                <span className="w-1 h-8 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]"></span>
                                Budget & Details
                            </h2>

                            {/* Budget */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label htmlFor="minBudget" className="block text-sm font-medium text-purple-400 mb-2 uppercase tracking-wider">
                                        Min Budget (₹)
                                    </label>
                                    <input
                                        id="minBudget"
                                        name="minBudget"
                                        type="number"
                                        value={formData.minBudget}
                                        onChange={handleInputChange}
                                        placeholder="5000"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="maxBudget" className="block text-sm font-medium text-purple-400 mb-2 uppercase tracking-wider">
                                        Max Budget (₹)
                                    </label>
                                    <input
                                        id="maxBudget"
                                        name="maxBudget"
                                        type="number"
                                        value={formData.maxBudget}
                                        onChange={handleInputChange}
                                        placeholder="15000"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Squad Size & Difficulty */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="maxSquadSize" className="block text-sm font-medium text-purple-400 mb-2 uppercase tracking-wider">
                                        Max Squad Size
                                    </label>
                                    <input
                                        id="maxSquadSize"
                                        name="maxSquadSize"
                                        type="number"
                                        value={formData.maxSquadSize}
                                        onChange={handleInputChange}
                                        min="2"
                                        max="50"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="difficulty" className="block text-sm font-medium text-purple-400 mb-2 uppercase tracking-wider">
                                        Difficulty Level
                                    </label>
                                    <select
                                        id="difficulty"
                                        name="difficulty"
                                        value={formData.difficulty}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all appearance-none"
                                    >
                                        {DIFFICULTY_LEVELS.map((level) => (
                                            <option key={level.value} value={level.value} className="bg-dark-900 text-white">
                                                {level.label} - {level.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vibe Tags Card */}
                    <div className="bg-[#001428]/80 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(8,145,178,0.1)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                <span className="w-1 h-8 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399]"></span>
                                Vibe Tags *
                            </h2>
                            <p className="text-sm text-gray-400 mb-6 ml-4">
                                Select tags or add your own custom tags (Select at least 1)
                            </p>

                            {/* Custom Tag Input */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-emerald-400 mb-2 uppercase tracking-wider">
                                    Add Custom Tag
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={customTagInput}
                                        onChange={(e) => setCustomTagInput(e.target.value)}
                                        onKeyDown={handleCustomTagKeyDown}
                                        placeholder="e.g., Hiking or #Hiking"
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                        maxLength={30}
                                    />
                                    <button
                                        type="button"
                                        onClick={addCustomTag}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                                    >
                                        Add
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Press Enter or click Add. Spaces will be removed automatically.</p>
                            </div>

                            {/* Popular Tags */}
                            <p className="text-sm font-medium text-gray-300 mb-4 uppercase tracking-wider">Popular Tags:</p>
                            <div className="flex flex-wrap gap-3">
                                {POPULAR_TAGS.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${selectedTags.includes(tag)
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            {selectedTags.length > 0 && (
                                <div className="mt-8 p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-xl">
                                    <p className="text-sm text-emerald-400 mb-3 font-medium">
                                        Selected Tags ({selectedTags.length}):
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 rounded-full text-sm"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleTag(tag)}
                                                    className="text-emerald-500 hover:text-emerald-300 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cover Photo Card */}
                    <div className="bg-[#001428]/80 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(8,145,178,0.1)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                <span className="w-1 h-8 bg-pink-500 rounded-full shadow-[0_0_10px_#ec4899]"></span>
                                Cover Photo
                            </h2>
                            <p className="text-sm text-gray-400 mb-6 ml-4">
                                Upload a beautiful image for your trip (Max 5MB)
                            </p>

                            <div className="space-y-4">
                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                        <Image
                                            src={imagePreview}
                                            alt="Cover preview"
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCoverPhoto(null);
                                                setImagePreview(null);
                                            }}
                                            className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg transform hover:scale-110"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {/* Upload Input */}
                                <div className="flex items-center justify-center w-full">
                                    <label
                                        htmlFor="coverPhoto"
                                        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 group/upload ${imagePreview
                                            ? 'border-cyan-500/30 bg-cyan-500/5'
                                            : 'border-white/10 bg-black/20 hover:bg-black/40 hover:border-cyan-400/50'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <div className={`p-4 rounded-full mb-4 transition-all ${imagePreview ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400 group-hover/upload:bg-cyan-500/20 group-hover/upload:text-cyan-400'}`}>
                                                <svg
                                                    className="w-8 h-8"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                    />
                                                </svg>
                                            </div>
                                            <p className="mb-2 text-sm text-gray-300 group-hover/upload:text-white transition-colors">
                                                <span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                PNG, JPG or JPEG (MAX. 5MB)
                                            </p>
                                        </div>
                                        <input
                                            id="coverPhoto"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invite Friends Card */}
                    {friends.length > 0 && (
                        <div className="bg-[#001428]/80 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(8,145,178,0.1)] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                    <span className="w-1 h-8 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b]"></span>
                                    Invite Friends to Squad
                                </h2>
                                <p className="text-sm text-gray-400 mb-6 ml-4">
                                    Add friends directly to your trip squad (optional)
                                </p>

                                {/* Search Friends */}
                                <div className="mb-6">
                                    <input
                                        type="text"
                                        value={friendSearchQuery}
                                        onChange={(e) => setFriendSearchQuery(e.target.value)}
                                        placeholder="Search friends..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                                    />
                                </div>

                                {/* Friends List */}
                                {loadingFriends ? (
                                    <div className="text-center py-8 text-gray-500 animate-pulse">Scanning friend network...</div>
                                ) : filteredFriends.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                        {friendSearchQuery ? 'No friends match your search' : 'No friends to invite'}
                                    </div>
                                ) : (
                                    <div className="max-h-80 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {filteredFriends.map((friend) => (
                                            <label
                                                key={friend._id}
                                                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${selectedFriends.includes(friend._id)
                                                    ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                                                    : 'bg-white/5 border-transparent hover:bg-white/10'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFriends.includes(friend._id)}
                                                    onChange={() => toggleFriendSelection(friend._id)}
                                                    className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500 bg-black/40 border-white/20"
                                                />
                                                {friend.profilePicture ? (
                                                    <Image
                                                        src={friend.profilePicture}
                                                        alt={friend.name}
                                                        width={48}
                                                        height={48}
                                                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold ring-2 ring-white/10">
                                                        {friend.name[0]}
                                                    </div>
                                                )}
                                                <span className="font-medium text-gray-200 text-lg">
                                                    {friend.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {/* Selected Friends Summary */}
                                {selectedFriends.length > 0 && (
                                    <div className="mt-6 p-4 bg-amber-900/10 border border-amber-500/20 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-amber-400">
                                                <span className="font-bold text-lg mr-1">{selectedFriends.length}</span> friend{selectedFriends.length > 1 ? 's' : ''} added to squad
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedFriends([])}
                                                className="text-xs text-amber-500/70 hover:text-amber-400 uppercase tracking-wider font-semibold"
                                            >
                                                Clear all
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Visibility Toggle */}
                    <div className="bg-[#001428]/80 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(8,145,178,0.1)] relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Make Trip Public</h3>
                                <p className="text-sm text-gray-400">
                                    Allow other travelers to see and join your trip
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isPublic}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-8">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 px-12 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg w-full md:w-auto relative overflow-hidden group"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Trip...
                                    </>
                                ) : (
                                    <>
                                        Create Trip
                                        <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
