'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { tripAPI } from '@/lib/api';
import ChatRoom from '@/components/ChatRoom';
import GoogleAd from '@/components/GoogleAd';
import toast from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface TripDetails {
    _id: string;
    title: string;
    description?: string;
    startPoint: { name: string; coordinates?: any };
    endPoint: { name: string; coordinates?: any };
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
    };
    currentSquadSize?: number;
    maxSquadSize: number;
    squadMembers: Array<{
        _id: string;
        name: string;
        profilePicture?: string;
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
}

export default function TripDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const tripId = params.id as string;

    const [trip, setTrip] = useState<TripDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [liked, setLiked] = useState(false);

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
    }, [trip, session, userId]);

    const isCreator = Boolean(userId && trip?.creator?._id && trip.creator._id.toString() === userId?.toString());

    const isSquadMember = isCreator || (Boolean(userId && trip?.squadMembers) && trip.squadMembers.some((member) => {
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

    const handleJoinSquad = async () => {
        if (!session) {
            toast.error('Please login to join');
            router.push('/auth/signin');
            return;
        }

        setJoining(true);

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
            toast.error(error.message || 'Failed to join squad');
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
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
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

                {/* Like Button */}
                <button
                    onClick={handleLike}
                    className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors group"
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

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{trip.title}</h1>
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
                            <div className="card">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About This Trip</h2>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{trip.description}</p>
                            </div>
                        )}

                        {/* Tags */}
                        <div className="card">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Vibes</h3>
                            <div className="flex flex-wrap gap-2">
                                {trip.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="badge badge-primary text-sm"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Budget */}
                        {trip.budget && (
                            <div className="card">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Budget</h3>
                                <p className="text-2xl font-bold text-primary-600">
                                    {trip.budget.currency} {trip.budget.min.toLocaleString()} - {trip.budget.max.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Per person (estimated)</p>
                            </div>
                        )}

                        {/* Google Ad */}
                        <GoogleAd className="min-h-[250px]" />

                        {/* Chat Room */}
                        <ChatRoom tripId={tripId} isSquadMember={isSquadMember} />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Host Info */}
                        <div className="card">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Host</h3>
                            <Link
                                href={`/profile/${trip.creator._id}`}
                                className="flex items-start space-x-4 hover:bg-gray-50 dark:hover:bg-gray-700 p-3 -m-3 rounded-lg transition-colors"
                            >
                                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {trip.creator.profilePicture ? (
                                        <Image
                                            src={trip.creator.profilePicture}
                                            alt={trip.creator.name}
                                            width={64}
                                            height={64}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="text-2xl font-semibold text-primary-600 dark:text-primary-400">
                                            {trip.creator.name[0]}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                        {trip.creator.name}
                                    </h4>
                                    {trip.creator.badges && trip.creator.badges.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {trip.creator.badges.map((badge, index) => (
                                                <span key={index} className="badge badge-secondary text-xs">
                                                    {badge}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {trip.creator.bio && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{trip.creator.bio}</p>
                                    )}
                                </div>
                            </Link>
                        </div>

                        {/* Squad Info */}
                        <div className="card">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Squad</h3>
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Members</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {trip.currentSquadSize || 0} / {trip.maxSquadSize}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                                    <div
                                        className="bg-primary-600 h-2 rounded-full transition-all"
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
                                        <Link
                                            key={member._id}
                                            href={`/profile/${member._id}`}
                                            className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                                                {member.profilePicture ? (
                                                    <Image
                                                        src={member.profilePicture}
                                                        alt={member.name}
                                                        width={32}
                                                        height={32}
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                                                        {member.name[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                                                {member.name}
                                            </span>
                                        </Link>
                                    ))}
                                    {trip.squadMembers.length > 5 && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            +{trip.squadMembers.length - 5} more
                                        </p>
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
                                            className="btn-outline w-full"
                                        >
                                            {joining ? 'Leaving...' : 'Leave Squad'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleJoinSquad}
                                            disabled={joining || isSquadFull}
                                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {joining ? 'Joining...' : isSquadFull ? 'Squad Full' : 'Join Squad'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {isCreator && (
                                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3">
                                    <p className="text-sm text-primary-700 dark:text-primary-300 text-center">
                                        You're the host of this trip
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="card">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-primary-600">{trip.stats.likes}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Likes</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-secondary-600">{trip.stats.views}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Views</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
