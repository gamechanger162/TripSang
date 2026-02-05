'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { tripAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import PremiumBadge from '@/components/PremiumBadge';
import { isPremiumUser } from '@/utils/linkify';

interface TripCardProps {
    trip: {
        _id: string;
        tripCode?: string;
        title: string;
        startPoint: { name: string };
        endPoint: { name: string };
        startDate: string;
        endDate: string;
        tags: string[];
        coverPhoto?: string;
        creator: {
            name: string;
            profilePicture?: string;
            badges?: string[];
            gender?: string;
        };
        currentSquadSize?: number;
        maxSquadSize?: number;
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
    };
}

export default function TripCard({ trip }: TripCardProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(trip.stats.likes);

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Check if user is authenticated
        if (status === 'unauthenticated') {
            toast.error('Please login to like trips');
            router.push('/auth/signin');
            return;
        }

        if (status === 'loading') {
            return;
        }

        try {
            await tripAPI.like(trip._id);
            setLiked(!liked);
            setLikes(liked ? likes - 1 : likes + 1);
            toast.success(liked ? 'Removed from favorites' : 'Added to favorites');
        } catch (error: any) {
            toast.error(error.message || 'Failed to like trip');
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const shareUrl = `${window.location.origin}/trips/${trip._id}`;
        const codeText = trip.tripCode ? ` | Code: ${trip.tripCode}` : '';
        const shareText = `Check out this trip: ${trip.title}${codeText}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: trip.title,
                    text: shareText,
                    url: shareUrl,
                });
                return;
            } catch (err) {
                // User cancelled or error
            }
        }

        // Fallback: copy link
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard!');
        } catch (err) {
            toast.error('Failed to copy link');
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const getDifficultyColor = (difficulty?: string) => {
        switch (difficulty) {
            case 'easy':
                return 'bg-green-100 text-green-800';
            case 'moderate':
                return 'bg-yellow-100 text-yellow-800';
            case 'difficult':
                return 'bg-orange-100 text-orange-800';
            case 'extreme':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getGenderIcon = (gender?: string) => {
        switch (gender) {
            case 'male':
                return '♂';
            case 'female':
                return '♀';
            case 'transgender':
                return '⚧';
            default:
                return null;
        }
    };

    const formatGender = (gender?: string) => {
        if (!gender || gender === 'prefer-not-to-say') return null;
        return gender.charAt(0).toUpperCase() + gender.slice(1);
    };

    // Calculate trip duration and categorize
    const getTripDuration = () => {
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days

        return {
            days: diffDays,
            isShort: diffDays <= 2,
            label: diffDays <= 2 ? 'Short Trip' : 'Long Trip',
            icon: diffDays <= 2 ? '⚡' : '🗺️'
        };
    };

    const tripDuration = getTripDuration();

    return (
        <Link href={`/trips/${trip._id}`}>
            <div className="card hover:shadow-trip-hover transition-all duration-300 overflow-hidden group cursor-pointer">
                {/* Cover Image */}
                <div className="relative h-48 w-full overflow-hidden rounded-lg mb-4">
                    {trip.coverPhoto ? (
                        <Image
                            src={trip.coverPhoto}
                            alt={trip.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : null}

                    {/* Fallback Gradient if no image or error */}
                    <div className={`w-full h-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center ${trip.coverPhoto ? 'hidden' : ''}`}>
                        <svg
                            className="w-16 h-16 text-white/50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                        {/* Share Button */}
                        <button
                            onClick={handleShare}
                            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all group/share"
                            title="Share trip"
                        >
                            <svg
                                className="w-5 h-5 text-gray-600 group-hover/share:text-primary-600 transition-colors"
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
                            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all group/like"
                        >
                            <svg
                                className={`w-5 h-5 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-gray-600'
                                    } group-hover/like:text-red-500`}
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

                    {/* Bottom Badges */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        {/* Trip Duration Badge */}
                        <div className={`badge ${tripDuration.isShort ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'} text-xs`}>
                            <span className="mr-1">{tripDuration.icon}</span>
                            {tripDuration.label}
                        </div>

                        {/* Difficulty Badge */}
                        {trip.difficulty && (
                            <div className={`badge ${getDifficultyColor(trip.difficulty)} capitalize text-xs`}>
                                {trip.difficulty}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {trip.title}
                    </h3>

                    {/* Route */}
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="font-medium">{trip.startPoint.name}</span>
                        <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="font-medium">{trip.endPoint.name}</span>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </div>

                    {/* Budget */}
                    {trip.budget && trip.budget.min !== undefined && trip.budget.max !== undefined && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            {trip.budget.currency || 'INR'} {trip.budget.min.toLocaleString()} - {trip.budget.max.toLocaleString()}
                        </div>
                    )}

                    {/* Tags */}
                    {trip.tags && trip.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {trip.tags.slice(0, 3).map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                >
                                    {tag}
                                </span>
                            ))}
                            {trip.tags.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    +{trip.tags.length - 3}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                        {/* Creator */}
                        <div className="flex items-center space-x-2">
                            <div className="relative w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                                {trip.creator?.profilePicture ? (
                                    <Image
                                        src={trip.creator.profilePicture}
                                        alt={trip.creator.name || 'User'}
                                        width={32}
                                        height={32}
                                        className="object-cover"
                                    />
                                ) : (
                                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                                        {trip.creator?.name?.[0] || '?'}
                                    </span>
                                )}
                                {isPremiumUser(trip.creator) && <PremiumBadge size="sm" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                    {trip.creator?.name || 'Unknown User'}
                                    {getGenderIcon(trip.creator?.gender) && (
                                        <span className="text-gray-500 dark:text-gray-400" title={formatGender(trip.creator?.gender) || ''}>
                                            {getGenderIcon(trip.creator?.gender)}
                                        </span>
                                    )}
                                </p>
                                {trip.creator?.badges && trip.creator.badges.length > 0 && (
                                    <p className="text-xs text-gray-500">{trip.creator.badges[0]}</p>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            {/* Squad Size */}
                            {trip.currentSquadSize !== undefined && (
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                    </svg>
                                    {trip.currentSquadSize}/{trip.maxSquadSize}
                                </div>
                            )}

                            {/* Likes */}
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                {likes}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
