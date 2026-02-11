'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserReviews from '@/components/reviews/UserReviews';
import ReportUserModal from '@/components/ReportUserModal';
import Link from 'next/link';
import { userAPI, friendAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Flag, Shield, Smartphone, MapPin, Star, ArrowLeft, UserPlus, UserCheck, Clock, MessageCircle, Edit3, Users } from 'lucide-react';
import PremiumBadge from '@/components/PremiumBadge';
import { isPremiumUser } from '@/utils/linkify';
import { motion } from 'framer-motion';
import GlassCard from '@/components/app/ui/GlassCard';

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
            case 'friends': return 'Friends';
            case 'pending_sent': return 'Request Sent';
            case 'pending_received': return 'Accept Request';
            default: return 'Add Friend';
        }
    };

    const getFriendButtonIcon = () => {
        switch (friendStatus) {
            case 'friends': return <UserCheck className="w-4 h-4" />;
            case 'pending_sent': return <Clock className="w-4 h-4" />;
            case 'pending_received': return <UserPlus className="w-4 h-4" />;
            default: return <UserPlus className="w-4 h-4" />;
        }
    };

    const getFriendButtonStyle = () => {
        switch (friendStatus) {
            case 'friends':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20';
            case 'pending_sent':
                return 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50';
            case 'pending_received':
                return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/25';
            default:
                return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/25';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
                <GlassCard className="max-w-sm w-full text-center p-8">
                    <h2 className="text-2xl font-bold text-white mb-3">Profile Not Found</h2>
                    <p className="text-zinc-500 text-sm mb-6">{error || 'User profile could not be loaded'}</p>
                    <Link href="/app/explore" className="inline-block px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-colors text-sm font-medium">
                        Explore Travelers
                    </Link>
                </GlassCard>
            </div>
        );
    }

    const isOwnProfile = session?.user?.id === userId;

    return (
        <div className="flex-1 w-full h-full overflow-y-auto bg-gradient-to-b from-[#0B0E11] to-[#0f1216]">
            {/* Background mesh */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[10%] left-[30%] w-[500px] h-[500px] bg-cyan-500/[0.04] blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-purple-500/[0.03] blur-[100px] rounded-full" />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <GlassCard padding="none" className="overflow-hidden mb-6">
                        {/* Cover gradient */}
                        <div className="h-32 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/15 to-orange-500/10" />
                            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-5" />
                        </div>

                        {/* Profile info */}
                        <div className="px-6 pb-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-14">
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center overflow-hidden border-4 border-[#0e1115] ring-2 ring-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 shadow-xl">
                                        {profile.profilePicture ? (
                                            <img
                                                src={profile.profilePicture}
                                                alt={profile.name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-white text-3xl font-bold">
                                                {profile.name[0]}
                                            </span>
                                        )}
                                    </div>
                                    {isPremiumUser(profile) && (
                                        <div className="absolute -bottom-1 -right-1">
                                            <PremiumBadge size="md" />
                                        </div>
                                    )}
                                </div>

                                {/* Name & Info */}
                                <div className="flex-1 min-w-0 pt-2 sm:pt-0">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 flex-wrap">
                                        {profile.name}
                                        <div className="flex items-center gap-1.5">
                                            {profile.isMobileVerified && (
                                                <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20" title="Phone Verified">
                                                    <Smartphone size={13} className="text-blue-400" />
                                                </div>
                                            )}
                                            {profile.verificationStatus === 'verified' && (
                                                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20" title="Identity Verified">
                                                    <Shield size={13} className="text-emerald-400" />
                                                </div>
                                            )}
                                        </div>
                                    </h1>
                                    {profile.location && (profile.location.city || profile.location.country) && (
                                        <p className="flex items-center gap-1.5 mt-1 text-zinc-500 text-sm">
                                            <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                                            {[profile.location.city, profile.location.country].filter(Boolean).join(', ')}
                                        </p>
                                    )}

                                    {/* Badges */}
                                    {profile.badges.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {profile.badges
                                                .filter(badge => badge !== 'Premium')
                                                .map((badge) => (
                                                    <span
                                                        key={badge}
                                                        className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/15"
                                                    >
                                                        {badge}
                                                    </span>
                                                ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 flex-wrap mt-4 sm:mt-0 w-full sm:w-auto">
                                    {isOwnProfile ? (
                                        <>
                                            <Link
                                                href="/friends"
                                                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                                            >
                                                <Users className="w-4 h-4" />
                                                Friends
                                            </Link>
                                            <Link
                                                href="/profile/edit"
                                                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                Edit
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleFriendAction}
                                                disabled={friendLoading}
                                                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${getFriendButtonStyle()}`}
                                            >
                                                {friendLoading ? (
                                                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                                ) : (
                                                    getFriendButtonIcon()
                                                )}
                                                {getFriendButtonText()}
                                            </button>

                                            <Link // Using Link for message
                                                href={`/app?userId=${userId}`}
                                                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                Message
                                            </Link>

                                            <button
                                                onClick={() => setShowReportModal(true)}
                                                className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-red-400 hover:border-red-500/20 transition-all"
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
                                <div className="mt-6 p-4 bg-zinc-900/30 rounded-2xl border border-white/5">
                                    <p className="text-zinc-300 text-sm leading-relaxed">{profile.bio}</p>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/[0.06]">
                                {[
                                    { value: profile.stats?.tripsCreated || 0, label: 'Trips Created', color: 'text-cyan-400' },
                                    { value: profile.stats?.tripsJoined || 0, label: 'Trips Joined', color: 'text-cyan-400' },
                                    { value: friendsCount, label: 'Friends', color: 'text-cyan-400' },
                                    { value: new Date(profile.createdAt).getFullYear(), label: 'Member Since', color: 'text-purple-400' },
                                ].map((stat) => (
                                    <div key={stat.label} className="text-center p-3 bg-white/[0.02] rounded-2xl border border-white/5">
                                        <div className={`text-xl font-bold ${stat.color}`}>
                                            {stat.value}
                                        </div>
                                        <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassCard>

                    {/* Reviews Section */}
                    <GlassCard className="mb-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                <Star className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Traveler Reviews</h2>
                        </div>
                        <UserReviews userId={userId} />
                    </GlassCard>
                </motion.div>

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
        </div>
    );
}
