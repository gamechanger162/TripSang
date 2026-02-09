'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { tripAPI } from '@/lib/api';


import GoogleAd from '@/components/GoogleAd';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { Map as MapIcon, X, Shield, Smartphone, MessageCircle, ChevronRight } from 'lucide-react';


const EditTripModal = dynamic(() => import('@/components/EditTripModal'), { ssr: false });

// Dynamic import for Map to avoid SSR issues
const CollaborativeMap = dynamic(() => import('@/components/CollaborativeMap'), {
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-dark-800">Loading Map...</div>,
    ssr: false
});

interface TripDetails {
    _id: string;
    tripCode?: string;
    title: string;
    description?: string;
    startPoint: { name: string; coordinates?: any; lat?: number; lng?: number; latitude?: number; longitude?: number };
    endPoint: { name: string; coordinates?: any; lat?: number; lng?: number; latitude?: number; longitude?: number };
    startDate: string;
    endDate: string;
    tags: string[];
    coverPhoto?: string;
    creator: {
        _id: string;
        name: string;
        email: string;
        profilePicture?: string;
        badges?: string[];
        bio?: string;
        isMobileVerified?: boolean;
        verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
    };
    currentSquadSize?: number;
    maxSquadSize: number;
    squadMembers: Array<{
        _id: string;
        name: string;
        profilePicture?: string;
        isMobileVerified?: boolean;
        verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
    }>;
    stats: {
        likes: number;
        views: number;
    };
    difficulty?: string;
    budget?: {
        min: number;
        max: number;
        currency: string;
    };
    isPublic: boolean;
    status: string;
    createdAt: string;
    waypoints?: Array<{
        lat: number;
        lng: number;
        name?: string;
    }>;
}

export function TripDetailsClient() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const tripId = params.id as string;

    const [trip, setTrip] = useState<TripDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [liked, setLiked] = useState(false);
    const [showAllMembers, setShowAllMembers] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showMap, setShowMap] = useState(false);

    const userId = session?.user?.id;

    // Debug logging
    useEffect(() => {
        if (trip && session) {
            console.log('--- Debug Squad Membership ---');
            console.log('Current User ID:', userId);
            console.log('Trip Creator ID:', trip.creator._id);
            console.log('Squad Members:', trip.squadMembers);
            console.log('Is Creator:', trip.creator._id.toString() === userId?.toString());
        }
    }, [trip, session?.user?.id, userId]);

    const isCreator = Boolean(userId && trip?.creator?._id && trip.creator._id.toString() === userId?.toString());

    const isSquadMember = isCreator || (trip?.squadMembers?.some((member) => {
        const memberId = (member as any)._id || member; // Handle populated or unpopulated
        return memberId && memberId.toString() === userId?.toString();
    })) || false;
    const isSquadFull = (trip?.currentSquadSize || 0) >= (trip?.maxSquadSize || 0);

    // Fetch trip details
    useEffect(() => {
        const fetchTrip = async () => {
            try {
                const response = await tripAPI.getById(tripId);
                if (response.success) {
                    setTrip(response.trip);
                }
            } catch (error: any) {
                console.error('Error fetching trip:', error);

                // Check for auth/premium errors
                const errorMessage = error.message?.toLowerCase() || '';
                if (errorMessage.includes('premium') || errorMessage.includes('subscription required')) {
                    toast.error('Premium membership required to view full trip details');
                    router.push('/payment/signup');
                    return;
                }
                if (errorMessage.includes('login required') || errorMessage.includes('access denied')) {
                    toast.error('Please login to view trip details');
                    router.push(`/auth/signin?callbackUrl=/trips/${tripId}`);
                    return;
                }

                toast.error(error.message || 'Failed to load trip');
                router.push('/search');
            } finally {
                setLoading(false);
            }
        };

        if (tripId) {
            fetchTrip();
        }
    }, [tripId, router]);

    const [showSafetyModal, setShowSafetyModal] = useState(false);

    // Initial check handler - opens modal
    const handleJoinSquad = () => {
        if (!session) {
            toast.error('Please login to join');
            router.push('/auth/signin');
            return;
        }
        setShowSafetyModal(true);
    };

    // Actual join action - called after safety modal confirmation
    const executeJoinSquad = async () => {
        setJoining(true);
        setShowSafetyModal(false);

        try {
            const response = await tripAPI.join(tripId);

            if (response.success) {
                toast.success('Successfully joined the squad!');
                // Refresh trip data
                const updatedTrip = await tripAPI.getById(tripId);
                if (updatedTrip.success) {
                    setTrip(updatedTrip.trip);
                }
            }
        } catch (error: any) {
            console.error('Error joining squad:', error);
            // Check if premium is required
            if (error.requiresPremium || error.redirectUrl) {
                toast.error('Premium membership required to join trips!');
                router.push(error.redirectUrl || '/payment/signup');
            } else {
                toast.error(error.message || 'Failed to join squad');
            }
        } finally {
            setJoining(false);
        }
    };

    const handleLeaveSquad = async () => {
        setJoining(true);

        try {
            const response = await tripAPI.leave(tripId);

            if (response.success) {
                toast.success('Left the squad');
                const updatedTrip = await tripAPI.getById(tripId);
                if (updatedTrip.success) {
                    setTrip(updatedTrip.trip);
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to leave squad');
        } finally {
            setJoining(false);
        }
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (!confirm(`Are you sure you want to remove ${memberName} from the squad?`)) {
            return;
        }

        try {
            const response = await tripAPI.removeMember(tripId, memberId);

            if (response.success) {
                toast.success(`${memberName} removed from squad`);
                // Refresh trip data
                const updatedTrip = await tripAPI.getById(tripId);
                if (updatedTrip.success) {
                    setTrip(updatedTrip.trip);
                }
            }
        } catch (error: any) {
            console.error('Error removing member:', error);
            toast.error(error.message || 'Failed to remove member');
        }
    };

    const handleLike = async () => {
        if (!session) {
            toast.error('Please login to like');
            return;
        }

        try {
            await tripAPI.like(tripId);
            setLiked(!liked);

            if (trip) {
                setTrip({
                    ...trip,
                    stats: {
                        ...trip.stats,
                        likes: liked ? trip.stats.likes - 1 : trip.stats.likes + 1,
                    },
                });
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to like trip');
        }
    };

    // Share trip handler
    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/trips/${tripId}`;
        const codeText = trip?.tripCode ? ` | Code: ${trip.tripCode}` : '';
        const shareText = `Check out this trip: ${trip?.title}${codeText} - ${trip?.startPoint.name} to ${trip?.endPoint.name}`;

        // Try native Web Share API first (works great on mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: trip?.title || 'Tripसंग Trip',
                    text: shareText,
                    url: shareUrl,
                });
                return;
            } catch (err) {
                // User cancelled or error, fall back to modal
            }
        }

        // Show share modal for desktop
        setShowShareModal(true);
    };

    const copyToClipboard = async () => {
        const shareUrl = `${window.location.origin}/trips/${tripId}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard!');
            setShowShareModal(false);
        } catch (err) {
            toast.error('Failed to copy link');
        }
    };

    const copyTripCode = async () => {
        if (trip?.tripCode) {
            try {
                await navigator.clipboard.writeText(trip.tripCode);
                toast.success(`Trip code "${trip.tripCode}" copied!`);
            } catch (err) {
                toast.error('Failed to copy code');
            }
        }
    };

    const shareToSocial = (platform: string) => {
        const shareUrl = encodeURIComponent(`${window.location.origin}/trips/${tripId}`);
        const codeText = trip?.tripCode ? ` | Code: ${trip.tripCode}` : '';
        const shareText = encodeURIComponent(`Check out this trip: ${trip?.title}${codeText}`);

        const urls: Record<string, string> = {
            whatsapp: `https://wa.me/?text=${shareText}%20${shareUrl}`,
            twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
            telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
        };

        window.open(urls[platform], '_blank', 'width=600,height=400');
        setShowShareModal(false);
    };

    const handleDeleteTrip = async () => {
        if (!confirm('Are you sure you want to delete this trip? This action cannot be undone!')) {
            return;
        }

        try {
            const response = await tripAPI.delete(tripId);
            if (response.success) {
                toast.success('Trip deleted successfully');
                router.push('/search');
            } else {
                toast.error(response.message || 'Failed to delete trip');
            }
        } catch (error: any) {
            console.error('Error deleting trip:', error);
            toast.error(error.message || 'Failed to delete trip');
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getDifficultyColor = (difficulty?: string) => {
        switch (difficulty) {
            case 'easy':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'moderate':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'difficult':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
            case 'extreme':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading trip...</p>
                </div>
            </div>
        );
    }

    if (!trip) {
        return null;
    }

    return (
        <div className="min-h-screen relative bg-[#001428]">
            {/* Background Layers */}
            <div
                className="fixed inset-0 z-0"
                style={{ background: 'linear-gradient(180deg, #001428 0%, #000a14 100%)' }}
            />
            <div
                className="fixed inset-0 z-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"
            />

            {/* Content Wrapper */}
            <div className="relative z-10">
                {/* Cover Image */}
                <div className="relative h-96 w-full">
                    {trip.coverPhoto ? (
                        <Image
                            src={trip.coverPhoto}
                            alt={trip.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-400 to-secondary-400" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Action Buttons (Share & Like) */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        {/* Edit Button (Creator Only) */}
                        {isCreator && (
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors group"
                                title="Edit Trip"
                            >
                                <svg className="w-6 h-6 text-gray-900 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        )}
                        {/* Delete Button (Creator Only) */}
                        {isCreator && (
                            <button
                                onClick={handleDeleteTrip}
                                className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors group"
                                title="Delete Trip"
                            >
                                <svg className="w-6 h-6 text-gray-900 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                        {/* Share Button */}
                        <button
                            onClick={handleShare}
                            className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors group"
                            title="Share Trip"
                        >
                            <svg
                                className="w-6 h-6 text-gray-900 group-hover:text-primary-600 transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                />
                            </svg>
                        </button>

                        {/* Like Button */}
                        <button
                            onClick={handleLike}
                            className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors group"
                            title="Like Trip"
                        >
                            <svg
                                className={`w-6 h-6 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-gray-900 group-hover:text-red-500'
                                    }`}
                                fill={liked ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#001428] via-[#001428]/80 to-transparent pt-32">
                        <div className="max-w-6xl mx-auto">
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-[0_0_25px_rgba(0,255,255,0.5)] tracking-tight">
                                {trip.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-white">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    {trip.startPoint.name} → {trip.endPoint.name}
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                </div>
                                {trip.difficulty && (
                                    <span className={`badge ${getDifficultyColor(trip.difficulty)} capitalize`}>
                                        {trip.difficulty}
                                    </span>
                                )}
                                {/* Map Button */}
                                <button
                                    onClick={() => setShowMap(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all border border-white/30 hover:border-white/50"
                                    title="View Route Map"
                                >
                                    <MapIcon size={16} className="text-white" />
                                    <span className="text-sm font-medium text-white">View Map</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Description */}
                            {trip.description && (
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
                                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                        <span className="w-1 h-8 bg-cyan-500 rounded-full"></span>
                                        About This Trip
                                    </h2>
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{trip.description}</p>
                                </div>
                            )}

                            {/* Tags */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                                    Vibes
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {trip.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 rounded-full text-sm font-medium bg-cyan-900/30 text-cyan-200 border border-cyan-500/30 shadow-[0_0_10px_rgba(8,145,178,0.2)]"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Budget */}
                            {trip.budget && trip.budget.min !== undefined && trip.budget.max !== undefined && (
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                                        Budget
                                    </h3>
                                    <p className="text-3xl font-bold text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
                                        {trip.budget.currency || 'INR'} {trip.budget.min.toLocaleString()} - {trip.budget.max.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">Per person (estimated)</p>
                                </div>
                            )}

                            {/* Google Ad */}
                            <GoogleAd className="min-h-[250px]" />

                            {/* Chat Room */}
                            {/* Squad Chat CTA */}
                            <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 backdrop-blur-xl">
                                {/* Background Patterns */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-32 -mb-32 animate-pulse" style={{ animationDelay: '1s' }}></div>

                                <div className="relative z-10 flex flex-col items-center text-center p-8">
                                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,255,255,0.2)] icon-glow">
                                        <MessageCircle size={32} className="text-cyan-400" />
                                    </div>

                                    <h3 className="text-2xl font-bold mb-3 text-white">Squad Command Center</h3>
                                    <p className="text-gray-300 mb-8 max-w-md">
                                        Connect with your squad, strategize your mission, and coordinate details before launch!
                                    </p>

                                    {isSquadMember ? (
                                        <Link
                                            href={`/app/squads/${tripId}`}
                                            className="group flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_rgba(8,145,178,0.6)] hover:scale-105 transition-all duration-300"
                                        >
                                            Enter Squad Chat
                                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={handleJoinSquad}
                                            className="group flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] hover:scale-105 transition-all duration-300"
                                        >
                                            Join Squad to Chat
                                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    )}

                                    <div className="mt-8 flex items-center gap-4 text-sm text-cyan-200/60">
                                        <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                                            Live Uplink
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                                        <div className="px-3 py-1 rounded-full bg-black/20 border border-white/5">
                                            {trip.squadMembers.length} Agents Assigned
                                        </div>
                                    </div>
                                </div>
                            </div>


                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Host Info */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-pink-500 rounded-full"></span>
                                    Host
                                </h3>
                                <Link
                                    href={`/profile/${trip.creator._id}`}
                                    className="flex items-start space-x-4 hover:bg-white/5 p-3 -m-3 rounded-xl transition-all group"
                                >
                                    <div className="relative w-16 h-16 rounded-full bg-pink-900/30 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-pink-500/30 group-hover:border-pink-500/50 transition-colors shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                                        {trip.creator.profilePicture ? (
                                            <Image
                                                src={trip.creator.profilePicture}
                                                alt={trip.creator.name}
                                                width={64}
                                                height={64}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span className="text-2xl font-semibold text-pink-400">
                                                {trip.creator.name[0]}
                                            </span>
                                        )}

                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-white group-hover:text-pink-400 transition-colors flex items-center gap-1">
                                            {trip.creator.name}
                                            {(trip.creator as any)?.isMobileVerified && (
                                                <div
                                                    className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30"
                                                    title="Phone Verified"
                                                >
                                                    <Smartphone size={10} className="text-blue-400" />
                                                </div>
                                            )}
                                            {trip.creator.verificationStatus === 'verified' && (
                                                <div
                                                    className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"
                                                    title="Identity Verified"
                                                >
                                                    <Shield size={10} className="text-emerald-400" />
                                                </div>
                                            )}
                                        </h4>
                                        {trip.creator.badges && trip.creator.badges.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {trip.creator.badges
                                                    .filter(badge => badge !== 'Premium')
                                                    .map((badge, index) => (
                                                        <span key={index} className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-gray-300 border border-white/10">
                                                            {badge}
                                                        </span>
                                                    ))}
                                            </div>
                                        )}
                                        {trip.creator.bio && (
                                            <p className="text-sm text-gray-400 mt-2 line-clamp-2">{trip.creator.bio}</p>
                                        )}
                                    </div>
                                </Link>

                                {/* Send Message Button (only if not the creator) */}
                                {session && !isCreator && (
                                    <Link
                                        href={`/app?userId=${trip.creator._id}`}
                                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white transition-all text-sm font-medium"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                            />
                                        </svg>
                                        Send Message
                                    </Link>
                                )}
                            </div>

                            {/* Squad Info */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                                    Squad
                                </h3>
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-400">Members</span>
                                        <span className="text-sm font-semibold text-white">
                                            {trip.currentSquadSize || 0} / {trip.maxSquadSize}
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                            style={{
                                                width: `${((trip.currentSquadSize || 0) / trip.maxSquadSize) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Squad Members List */}
                                {trip.squadMembers.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {trip.squadMembers.slice(0, 5).map((member) => (
                                            <div
                                                key={member._id}
                                                className="flex items-center justify-between hover:bg-white/5 p-2 rounded-lg transition-colors group"
                                            >
                                                <Link
                                                    href={`/profile/${member._id}`}
                                                    className="flex items-center space-x-2 flex-1"
                                                >
                                                    <div className="relative w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center overflow-hidden border border-purple-500/20">
                                                        {member.profilePicture ? (
                                                            <Image
                                                                src={member.profilePicture}
                                                                alt={member.name}
                                                                width={32}
                                                                height={32}
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-xs font-semibold text-purple-400">
                                                                {member.name[0]}
                                                            </span>
                                                        )}

                                                    </div>
                                                    <span className="text-sm text-gray-300 group-hover:text-purple-300 flex items-center gap-1 transition-colors">
                                                        {member.name}
                                                        {(member as any)?.isMobileVerified && (
                                                            <div
                                                                className="w-3.5 h-3.5 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30"
                                                                title="Phone Verified"
                                                            >
                                                                <Smartphone size={8} className="text-blue-400" />
                                                            </div>
                                                        )}
                                                        {(member as any)?.verificationStatus === 'verified' && (
                                                            <div
                                                                className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"
                                                                title="Identity Verified"
                                                            >
                                                                <Shield size={8} className="text-emerald-400" />
                                                            </div>
                                                        )}
                                                    </span>
                                                </Link>
                                                {/* Actions */}
                                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {/* Message button (only if not self) */}
                                                    {session && member._id !== userId && (
                                                        <Link
                                                            href={`/app?userId=${member._id}`}
                                                            className="p-1.5 hover:bg-purple-900/30 rounded-full transition-colors"
                                                            title={`Message ${member.name}`}
                                                        >
                                                            <svg className="w-4 h-4 text-gray-400 hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                                />
                                                            </svg>
                                                        </Link>
                                                    )}

                                                    {/* Remove button (only for creator, cannot remove self) */}
                                                    {isCreator && member._id !== userId && (
                                                        <button
                                                            onClick={() => handleRemoveMember(member._id, member.name)}
                                                            className="p-1.5 hover:bg-red-900/30 rounded-full transition-colors"
                                                            title="Remove from squad"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {trip.squadMembers.length > 5 && (
                                            <button
                                                onClick={() => setShowAllMembers(true)}
                                                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium hover:underline pl-2"
                                            >
                                                +{trip.squadMembers.length - 5} more
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Join/Leave Button */}
                                {!isCreator && (
                                    <div>
                                        {isSquadMember ? (
                                            <button
                                                onClick={handleLeaveSquad}
                                                disabled={joining}
                                                className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-900/20 transition-all font-medium text-sm"
                                            >
                                                {joining ? 'Leaving...' : 'Leave Squad'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleJoinSquad}
                                                disabled={joining || isSquadFull}
                                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all font-bold text-sm"
                                            >
                                                {joining ? 'Joining...' : isSquadFull ? 'Squad Full' : 'Join Squad'}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {isCreator && (
                                    <div className="bg-cyan-900/20 rounded-xl p-3 border border-cyan-500/20">
                                        <p className="text-sm text-cyan-300 text-center flex items-center justify-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                            You're the host of this trip
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Trip Code */}
                            {trip.tripCode && (
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <span className="w-1 h-5 bg-yellow-500 rounded-full"></span>
                                        Trip Code
                                    </h3>
                                    <div className="flex items-center justify-between bg-black/20 border border-white/10 rounded-xl p-4">
                                        <div>
                                            <p className="text-2xl font-mono font-bold text-yellow-400 tracking-wider">
                                                {trip.tripCode}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Share this code to invite others
                                            </p>
                                        </div>
                                        <button
                                            onClick={copyTripCode}
                                            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/10"
                                            title="Copy code"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 rounded-xl bg-white/5">
                                        <p className="text-3xl font-bold text-cyan-400">{trip.stats.likes}</p>
                                        <p className="text-sm text-gray-400">Likes</p>
                                    </div>
                                    <div className="text-center p-3 rounded-xl bg-white/5">
                                        <p className="text-3xl font-bold text-purple-400">{trip.stats.views}</p>
                                        <p className="text-sm text-gray-400">Views</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* All Members Modal */}
                {showAllMembers && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Squad Members</h3>
                                <button
                                    onClick={() => setShowAllMembers(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto">
                                <div className="space-y-3">
                                    {trip.squadMembers.map((member) => (
                                        <div
                                            key={member._id}
                                            className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                                        >
                                            <Link
                                                href={`/profile/${member._id}`}
                                                className="flex items-center space-x-3 flex-1"
                                                onClick={() => setShowAllMembers(false)}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                                                    {member.profilePicture ? (
                                                        <Image
                                                            src={member.profilePicture}
                                                            alt={member.name}
                                                            width={40}
                                                            height={40}
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                                                            {member.name[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1">
                                                        <p className="font-medium text-gray-900 dark:text-white hover:text-primary-600">
                                                            {member.name}
                                                        </p>
                                                        {(member as any)?.isMobileVerified && (
                                                            <div
                                                                className="w-4 h-4 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center border border-blue-500/20"
                                                                title="Phone Verified"
                                                            >
                                                                <Smartphone size={10} className="text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                        )}
                                                        {(member as any)?.verificationStatus === 'verified' && (
                                                            <div
                                                                className="w-4 h-4 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20"
                                                                title="Identity Verified"
                                                            >
                                                                <Shield size={10} className="text-emerald-600 dark:text-emerald-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {member._id === trip.creator._id && (
                                                        <span className="text-xs bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 px-2 py-0.5 rounded-full">
                                                            Host
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                            {/* Actions */}
                                            <div className="flex items-center space-x-1">
                                                {/* Message button (only if not self) */}
                                                {session && member._id !== userId && (
                                                    <Link
                                                        href={`/app?userId=${member._id}`}
                                                        className="p-2 hover:bg-primary-100 dark:hover:bg-primary-900 rounded-full transition-colors text-gray-500 hover:text-primary-600"
                                                        title={`Message ${member.name}`}
                                                        onClick={() => setShowAllMembers(false)}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                            />
                                                        </svg>
                                                    </Link>
                                                )}

                                                {/* Remove button (only for creator, cannot remove self) */}
                                                {isCreator && member._id !== userId && (
                                                    <button
                                                        onClick={() => {
                                                            setShowAllMembers(false);
                                                            handleRemoveMember(member._id, member.name);
                                                        }}
                                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors group"
                                                        title="Remove from squad"
                                                    >
                                                        <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Trip Modal */}
                {showEditModal && trip && (
                    <EditTripModal
                        trip={trip}
                        onClose={() => setShowEditModal(false)}
                        onUpdate={(updatedTrip) => {
                            setTrip(prev => prev ? { ...prev, ...updatedTrip } : updatedTrip);
                            toast.success('Trip updated!');
                        }}
                    />
                )}

                {/* Share Modal */}
                {showShareModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
                            {/* Modal Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Share This Trip</h3>
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Share Options */}
                            <div className="p-6">
                                <div className="grid grid-cols-4 gap-4 mb-6">
                                    {/* WhatsApp */}
                                    <button
                                        onClick={() => shareToSocial('whatsapp')}
                                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                    >
                                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">WhatsApp</span>
                                    </button>

                                    {/* Twitter/X */}
                                    <button
                                        onClick={() => shareToSocial('twitter')}
                                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                    >
                                        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">X</span>
                                    </button>

                                    {/* Facebook */}
                                    <button
                                        onClick={() => shareToSocial('facebook')}
                                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                    >
                                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Facebook</span>
                                    </button>

                                    {/* Telegram */}
                                    <button
                                        onClick={() => shareToSocial('telegram')}
                                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                    >
                                        <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Telegram</span>
                                    </button>
                                </div>

                                {/* Copy Link Button */}
                                <button
                                    onClick={copyToClipboard}
                                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-xl transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Copy Link</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Safety Tips Modal */}
                {showSafetyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <span className="text-3xl">🛡️</span> Safety First
                                    </h3>
                                    <button
                                        onClick={() => setShowSafetyModal(false)}
                                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <p className="text-gray-600 dark:text-gray-300 font-medium text-center mb-6">
                                        Before you join this squad, please review these safety reminders to ensure a great experience.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="flex gap-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                                            <div className="text-2xl">📱</div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">Verify Your Profile</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Trust starts with verification. Ensure your profile is verified and look for verified badges on others.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                            <div className="text-2xl">🤝</div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">Meet in Public</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">For the first meetup, always choose a public, well-lit location. Let someone know where you are.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                                            <div className="text-2xl">💰</div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">Money Safety</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Be cautious with financial details. Never share passwords or send money to unverified sources.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                            <div className="text-2xl">🛑</div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">Trust Your Instincts</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">If something feels off, it probably is. You have the right to leave any situation that feels unsafe.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setShowSafetyModal(false)}
                                        className="btn-outline flex-1 py-3"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={executeJoinSquad}
                                        disabled={joining}
                                        className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                                    >
                                        {joining ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Joining...
                                            </>
                                        ) : (
                                            'I Understand, Join Squad'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Map Overlay */}
                {showMap && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="relative w-full max-w-6xl h-[80vh] bg-white dark:bg-dark-800 rounded-2xl shadow-2xl overflow-hidden">
                            <div className="absolute top-4 right-4 z-[1000]">
                                <button
                                    onClick={() => setShowMap(false)}
                                    className="p-3 bg-white/90 dark:bg-dark-700/90 backdrop-blur rounded-full shadow-lg hover:bg-white dark:hover:bg-dark-600 transition-colors"
                                >
                                    <X size={24} className="text-gray-700 dark:text-gray-200" />
                                </button>
                            </div>
                            <CollaborativeMap
                                tripId={tripId}
                                initialWaypoints={trip?.waypoints || []}
                                startPoint={{
                                    lat: trip?.startPoint?.coordinates?.latitude || trip?.startPoint?.coordinates?.lat || trip?.startPoint?.lat || 20.5937,
                                    lng: trip?.startPoint?.coordinates?.longitude || trip?.startPoint?.coordinates?.lng || trip?.startPoint?.lng || 78.9629,
                                    name: trip?.startPoint?.name || 'Start (Nagpur)'
                                }}
                                endPoint={trip?.endPoint ? {
                                    lat: trip.endPoint.coordinates?.latitude || trip.endPoint.coordinates?.lat || trip.endPoint.lat || 28.6139,
                                    lng: trip.endPoint.coordinates?.longitude || trip.endPoint.coordinates?.lng || trip.endPoint.lng || 77.2090,
                                    name: trip.endPoint.name || 'End (New Delhi)'
                                } : undefined}
                                isReadOnly={!isSquadMember}
                                shouldJoinRoom={true}
                            />
                            {/* Warning for missing coordinates */}
                            {((!trip?.startPoint?.coordinates?.latitude && !trip?.startPoint?.lat) || (!trip?.endPoint?.coordinates?.latitude && !trip?.endPoint?.lat)) && (
                                <div className="absolute bottom-4 left-4 z-[1000] bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg max-w-sm">
                                    <p className="font-bold">⚠️ Map Data Missing</p>
                                    <p className="text-sm mt-1">
                                        This trip doesn't have precise location data saved. accurately.
                                        Showing default view.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
