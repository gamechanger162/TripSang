'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserReviews from '@/components/reviews/UserReviews';
import ReportUserModal from '@/components/ReportUserModal';
import Link from 'next/link';
import { userAPI, friendAPI, tripAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Flag, Shield, Smartphone } from 'lucide-react';
import PremiumBadge from '@/components/PremiumBadge';
import { isPremiumUser } from '@/utils/linkify';

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
    verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
    subscription?: any;
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
    const [showReportModal, setShowReportModal] = useState(false);
    const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
    const [loadingTrips, setLoadingTrips] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchUserProfile();
            fetchFriendsCount();
            fetchUpcomingTrips();
        }
    }, [userId]);

    useEffect(() => {
        if (userId && session) {
            fetchFriendStatus();
        }
    }, [userId, session?.user?.id]);

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

    const fetchUpcomingTrips = async () => {
        try {
            setLoadingTrips(true);
            // Use tripAPI to get user's trips by their ID
            const response = await userAPI.getTrips();
            if (response.success) {
                const now = new Date();
                const upcoming = (response.trips || []).filter(
                    (t: any) => new Date(t.startDate) >= now
                ).slice(0, 5); // Get first 5 upcoming trips
                setUpcomingTrips(upcoming);
            }
        } catch (error) {
            console.error('Error fetching trips:', error);
        } finally {
            setLoadingTrips(false);
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
                    toast.success(response.message || 'Friend request sent!');
                    setFriendStatus('pending_sent');
                    break;
                case 'pending_sent':
                    response = await friendAPI.cancelRequest(userId);
                    toast.success(response.message || 'Friend request cancelled');
                    setFriendStatus('none');
                    break;
                case 'pending_received':
                    response = await friendAPI.acceptRequest(userId);
                    toast.success(response.message || `You are now friends with ${profile?.name}!`);
                    setFriendStatus('friends');
                    setFriendsCount(prev => prev + 1);
                    break;
                case 'friends':
                    if (confirm(`Are you sure you want to unfriend ${profile?.name}?`)) {
                        response = await friendAPI.unfriend(userId);
                        toast.success(response.message || 'Friend removed');
                        setFriendStatus('none');
                        setFriendsCount(prev => Math.max(0, prev - 1));
                    }
                    break;
            }
        } catch (err: any) {
            console.error('Friend action error:', err);
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
            <div className="min-h-screen pt-20 flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #001428 0%, #000a14 100%)' }}>
                <div className="animate-spin rounded-full h-12 w-12" style={{ border: '3px solid rgba(0,255,255,0.2)', borderTopColor: '#00ffff' }}></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #001428 0%, #000a14 100%)' }}>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4" style={{ textShadow: '0 0 20px rgba(0,255,255,0.3)' }}>Profile Not Found</h2>
                    <p className="text-gray-400 mb-6">{error || 'User profile could not be loaded'}</p>
                    <Link href="/search" className="px-6 py-3 rounded-full font-medium" style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.4)', color: '#00ffff' }}>
                        Explore Trips
                    </Link>
                </div>
            </div>
        );
    }

    const isOwnProfile = session?.user?.id === userId;

    return (
        <div className="min-h-screen pt-20" style={{ background: 'linear-gradient(180deg, #001428 0%, #000a14 100%)' }}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header */}
                <div className="rounded-2xl shadow-lg overflow-hidden mb-6" style={{ background: 'rgba(0,30,50,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,255,255,0.15)' }}>
                    {/* Cover Image */}
                    <div className="h-32" style={{ background: 'linear-gradient(135deg, rgba(0,255,255,0.3) 0%, rgba(139,92,246,0.3) 50%, rgba(0,255,255,0.2) 100%)' }}></div>

                    {/* Profile Info */}
                    <div className="px-6 pb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 sm:-mt-12">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center shadow-xl" style={{ border: '4px solid rgba(0,255,255,0.5)', background: 'linear-gradient(135deg, #0891b2, #8b5cf6)', boxShadow: '0 0 30px rgba(0,255,255,0.4)' }}>
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
                            </div>

                            {/* Name & Info */}
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2" style={{ textShadow: '0 0 20px rgba(0,255,255,0.4)' }}>
                                    {profile.name}
                                    <div className="flex items-center gap-1">
                                        {profile.isMobileVerified && (
                                            <div
                                                className="w-6 h-6 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center border border-blue-500/20"
                                                title="Phone Verified"
                                            >
                                                <Smartphone size={14} className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                        )}
                                        {profile.verificationStatus === 'verified' && (
                                            <div
                                                className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20"
                                                title="Identity Verified (Aadhaar/PAN)"
                                            >
                                                <Shield size={14} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                        )}
                                    </div>
                                </h1>
                                {profile.location && (profile.location.city || profile.location.country) && (
                                    <p className="flex items-center gap-1 mt-1" style={{ color: 'rgba(0,255,255,0.7)' }}>
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
                                        {profile.badges
                                            .filter(badge => badge !== 'Premium') // Filter out Premium badge
                                            .map((badge) => (
                                                <span
                                                    key={badge}
                                                    className="px-3 py-1 text-xs font-semibold rounded-full"
                                                    style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.3)', color: '#00ffff' }}
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
                                            className="px-4 py-2 rounded-lg transition-all text-sm font-medium"
                                            style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.3)', color: '#00ffff' }}
                                        >
                                            Friends ({friendsCount})
                                        </Link>
                                        <Link
                                            href="/profile/edit"
                                            className="px-4 py-2 rounded-lg transition-all text-sm font-medium"
                                            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}
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
                                            href={`/app?userId=${userId}`}
                                            className="px-4 py-2 rounded-lg transition-all text-sm font-medium"
                                            style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.3)', color: '#00ffff' }}
                                        >
                                            Message
                                        </Link>
                                        <button
                                            onClick={() => setShowReportModal(true)}
                                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                                            title="Report User"
                                        >
                                            <Flag className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <div className="mt-6">
                                <p className="text-gray-300">
                                    {profile.bio}
                                </p>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-4 mt-6 pt-6" style={{ borderTop: '1px solid rgba(0,255,255,0.15)' }}>
                            <div className="text-center">
                                <div className="text-2xl font-bold" style={{ color: '#00ffff', textShadow: '0 0 15px rgba(0,255,255,0.4)' }}>
                                    {profile.stats?.tripsCreated || 0}
                                </div>
                                <div className="text-sm text-gray-400">Trips Created</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold" style={{ color: '#00ffff', textShadow: '0 0 15px rgba(0,255,255,0.4)' }}>
                                    {profile.stats?.tripsJoined || 0}
                                </div>
                                <div className="text-sm text-gray-400">Trips Joined</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold" style={{ color: '#00ffff', textShadow: '0 0 15px rgba(0,255,255,0.4)' }}>
                                    {friendsCount}
                                </div>
                                <div className="text-sm text-gray-400">Friends</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold" style={{ color: '#a78bfa', textShadow: '0 0 15px rgba(139,92,246,0.4)' }}>
                                    {new Date(profile.createdAt).getFullYear()}
                                </div>
                                <div className="text-sm text-gray-400">Member Since</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="rounded-2xl shadow-lg p-6" style={{ background: 'rgba(0,30,50,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,255,255,0.15)' }}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ textShadow: '0 0 15px rgba(0,255,255,0.3)' }}>
                            <svg className="w-6 h-6" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' }} fill="currentColor" viewBox="0 0 20 20">
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
                        className="font-medium" style={{ color: '#00ffff' }}
                    >
                        ← Back
                    </button>
                </div>
            </div>

            {/* Report User Modal */}
            {!isOwnProfile && profile && (
                <ReportUserModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    reportedUserId={userId}
                    reportedUserName={profile.name}
                />
            )}
        </div>
    );
}


