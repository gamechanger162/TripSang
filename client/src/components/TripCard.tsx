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
import { Heart, Share2, MapPin, Calendar, Users, IndianRupee, ArrowRight } from 'lucide-react';

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
                return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
            case 'moderate':
                return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
            case 'difficult':
                return 'bg-orange-500/15 text-orange-400 border-orange-500/20';
            case 'extreme':
                return 'bg-red-500/15 text-red-400 border-red-500/20';
            default:
                return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20';
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
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

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
            <div className="glass-card overflow-hidden group cursor-pointer p-0 hover:border-teal-500/20 transition-all duration-300">
                {/* Cover Image */}
                <div className="relative h-52 w-full overflow-hidden">
                    {trip.coverPhoto ? (
                        <Image
                            src={trip.coverPhoto}
                            alt={trip.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : null}

                    {/* Fallback Gradient */}
                    <div className={`w-full h-full bg-gradient-to-br from-teal-500/30 to-orange-500/20 flex items-center justify-center ${trip.coverPhoto ? 'hidden' : ''}`}>
                        <MapPin className="w-12 h-12 text-white/20" />
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />

                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 transition-all"
                            title="Share trip"
                        >
                            <Share2 className="w-4 h-4 text-white/80" />
                        </button>

                        <button
                            onClick={handleLike}
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 transition-all"
                        >
                            <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'text-white/80'} transition-colors`} />
                        </button>
                    </div>

                    {/* Bottom Badges */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <div className={`text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-sm border ${tripDuration.isShort ? 'bg-teal-500/20 text-teal-300 border-teal-500/20' : 'bg-purple-500/20 text-purple-300 border-purple-500/20'}`}>
                            <span className="mr-1">{tripDuration.icon}</span>
                            {tripDuration.days}D
                        </div>

                        {trip.difficulty && (
                            <div className={`text-[11px] font-medium capitalize px-2.5 py-1 rounded-full backdrop-blur-sm border ${getDifficultyColor(trip.difficulty)}`}>
                                {trip.difficulty}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-white line-clamp-1 group-hover:text-teal-400 transition-colors font-display">
                        {trip.title}
                    </h3>

                    {/* Route */}
                    <div className="flex items-center text-sm text-zinc-400">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-teal-500" />
                        <span className="text-zinc-200 font-medium">{trip.startPoint.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 mx-1.5 text-zinc-600" />
                        <span className="text-zinc-200 font-medium">{trip.endPoint.name}</span>
                    </div>

                    {/* Date & Budget row */}
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <div className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-600" />
                            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                        </div>

                        {trip.budget && trip.budget.min !== undefined && trip.budget.max !== undefined && (
                            <div className="flex items-center">
                                <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-zinc-600" />
                                {trip.budget.min.toLocaleString()} - {trip.budget.max.toLocaleString()}
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    {trip.tags && trip.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {trip.tags.slice(0, 3).map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-500/10 text-teal-400 border border-teal-500/10"
                                >
                                    {tag}
                                </span>
                            ))}
                            {trip.tags.length > 3 && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/5 text-zinc-500 border border-white/5">
                                    +{trip.tags.length - 3}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                        {/* Creator */}
                        <div className="flex items-center space-x-2">
                            <div className="relative w-7 h-7 rounded-full bg-teal-500/10 flex items-center justify-center overflow-hidden border border-teal-500/20">
                                {trip.creator?.profilePicture ? (
                                    <Image
                                        src={trip.creator.profilePicture}
                                        alt={trip.creator.name || 'User'}
                                        width={28}
                                        height={28}
                                        className="object-cover"
                                    />
                                ) : (
                                    <span className="text-xs font-semibold text-teal-400">
                                        {trip.creator?.name?.[0] || '?'}
                                    </span>
                                )}
                                {isPremiumUser(trip.creator) && <PremiumBadge size="sm" />}
                            </div>
                            <div>
                                <p className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                                    {trip.creator?.name || 'Unknown User'}
                                    {getGenderIcon(trip.creator?.gender) && (
                                        <span className="text-zinc-600 text-[10px]" title={formatGender(trip.creator?.gender) || ''}>
                                            {getGenderIcon(trip.creator?.gender)}
                                        </span>
                                    )}
                                </p>
                                {trip.creator?.badges && trip.creator.badges.length > 0 && (
                                    <p className="text-[10px] text-zinc-600">{trip.creator.badges[0]}</p>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center space-x-3 text-xs text-zinc-500">
                            {trip.currentSquadSize !== undefined && (
                                <div className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-zinc-600" />
                                    <span>{trip.currentSquadSize}/{trip.maxSquadSize}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-1">
                                <Heart className={`w-3.5 h-3.5 ${liked ? 'text-red-500 fill-red-500' : 'text-zinc-600'}`} />
                                <span>{likes}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
