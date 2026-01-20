'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserReviews from '@/components/reviews/UserReviews';
import Link from 'next/link';
import { userAPI, friendAPI } from '@/lib/api';
import toast from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface UserProfile {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    bio?: string;
    location?: {
        city?: string;
        country?: string;
    };
    badges: string[];
    createdAt: string;
    isMobileVerified?: boolean;
    stats?: {
        tripsCreated: number;
        tripsJoined: number;
    };
}

type FriendshipStatus = 'none' | 'friends' | 'pending_sent' | 'pending_received' | 'self';

export default function UserProfilePage() {
    const params = useParams();
    const userId = params.id as string;
    const router = useRouter();
    const { data: session } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [friendStatus, setFriendStatus] = useState<FriendshipStatus>('none');
    const [friendsCount, setFriendsCount] = useState(0);
    const [friendLoading, setFriendLoading] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchUserProfile();
            fetchFriendsCount();
        }
    }, [userId]);

    useEffect(() => {
        if (userId && session) {
            fetchFriendStatus();
        }
    }, [userId, session]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getUserById(userId);

            if (response.success) {
                setProfile(response.user);
            } else {
                setError(response.message || 'Failed to load profile');
            }
        } catch (err: any) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchFriendStatus = async () => {
        try {
            const response = await friendAPI.getStatus(userId);
            if (response.success) {
                setFriendStatus(response.status);
            }
        } catch (err) {
            console.error('Error fetching friend status:', err);
        }
    };

    const fetchFriendsCount = async () => {
        try {
            const response = await friendAPI.getFriendsCount(userId);
            if (response.success) {
                setFriendsCount(response.count);
            }
        } catch (err) {
            console.error('Error fetching friends count:', err);
        }
    };

    const handleFriendAction = async () => {
        if (!session) {
            toast.error('Please login to add friends');
            router.push('/auth/signin');
            return;
        }

        setFriendLoading(true);
        try {
            let response;
            switch (friendStatus) {
                case 'none':
                    response = await friendAPI.sendRequest(userId);
                    if (response.success) {
                        toast.success('Friend request sent!');
                        setFriendStatus('pending_sent');
                    }
                    break;
                case 'pending_sent':
                    response = await friendAPI.cancelRequest(userId);
                    if (response.success) {
                        toast.success('Friend request cancelled');
                        setFriendStatus('none');
                    }
                    break;
                case 'pending_received':
                    response = await friendAPI.acceptRequest(userId);
                    if (response.success) {
                        toast.success(`You are now friends with ${profile?.name}!`);
                        setFriendStatus('friends');
                        setFriendsCount(prev => prev + 1);
                    }
                    break;
                case 'friends':
                    if (confirm(`Are you sure you want to unfriend ${profile?.name}?`)) {
                        response = await friendAPI.unfriend(userId);
                        if (response.success) {
                            toast.success('Friend removed');
                            setFriendStatus('none');
                            setFriendsCount(prev => Math.max(0, prev - 1));
                        }
                    }
                    break;
            }
        } catch (err: any) {
            toast.error(err.message || 'Something went wrong');
        } finally {
            setFriendLoading(false);
        }
    };

    const getFriendButtonText = () => {
        switch (friendStatus) {
            case 'friends':
                return '✓ Friends';
            case 'pending_sent':
                return 'Request Sent';
            case 'pending_received':
                return 'Accept Request';
            default:
                return 'Add Friend';
        }
    };

    const getFriendButtonStyle = () => {
        switch (friendStatus) {
            case 'friends':
                return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400';
            case 'pending_sent':
                return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
            case 'pending_received':
                return 'bg-primary-600 text-white hover:bg-primary-700';
            default:
                return 'bg-primary-600 text-white hover:bg-primary-700';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profile Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'User profile could not be loaded'}</p>
                    <Link href="/search" className="btn-primary">
                        Explore Trips
                    </Link>
                </div>
            </div>
        );
    }

    const isOwnProfile = session?.user?.id === userId;

    return (
        <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6">
                    {/* Cover Image */}
                    <div className="h-32 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600"></div>

                    {/* Profile Info */}
                    <div className="px-6 pb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 sm:-mt-12">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center shadow-xl">
                                    {profile.profilePicture ? (
                                        <img
                                            src={profile.profilePicture}
                                            alt={profile.name}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-white text-4xl font-bold">
                                            {profile.name[0]}
                                        </span>
                                    )}
                                </div>
                                {profile.isMobileVerified && (
                                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Name & Info */}
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                    {profile.name}
                                </h1>
                                {profile.location && (profile.location.city || profile.location.country) && (
                                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {[profile.location.city, profile.location.country].filter(Boolean).join(', ')}
                                    </p>
                                )}

                                {/* Badges */}
                                {profile.badges.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {profile.badges.map((badge) => (
                                            <span
                                                key={badge}
                                                className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 dark:from-primary-900/30 dark:to-secondary-900/30 dark:text-primary-400 rounded-full border border-primary-200 dark:border-primary-800"
                                            >
                                                {badge}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                {isOwnProfile ? (
                                    <>
                                        <Link
                                            href="/friends"
                                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
                                        >
                                            Friends ({friendsCount})
                                        </Link>
                                        <Link
                                            href="/profile/edit"
                                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
                                        >
                                            Edit Profile
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleFriendAction}
                                            disabled={friendLoading}
                                            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 ${getFriendButtonStyle()}`}
                                        >
                                            {friendLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    ...
                                                </span>
                                            ) : (
                                                getFriendButtonText()
                                            )}
                                        </button>
                                        <Link
                                            href={`/messages/${userId}`}
                                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
                                        >
                                            Message
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <div className="mt-6">
                                <p className="text-gray-700 dark:text-gray-300">
                                    {profile.bio}
                                </p>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {profile.stats?.tripsCreated || 0}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Trips Created</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {profile.stats?.tripsJoined || 0}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Trips Joined</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {friendsCount}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Friends</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {new Date(profile.createdAt).getFullYear()}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Member Since</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Traveler Reviews
                        </h2>
                    </div>

                    <UserReviews userId={userId} />
                </div>

                {/* Back Button */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.back()}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                    >
                        ← Back
                    </button>
                </div>
            </div>
        </div>
    );
}

