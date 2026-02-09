'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { friendAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Friend {
    _id: string;
    name: string;
    profilePicture?: string;
    badges?: string[];
    friendsSince?: string;
}

interface FriendRequest {
    _id: string;
    user: {
        _id: string;
        name: string;
        profilePicture?: string;
        badges?: string[];
    };
    createdAt: string;
}

type Tab = 'friends' | 'pending' | 'sent';

export default function FriendsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<Tab>('friends');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchData();
        }
    }, [status]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [friendsRes, pendingRes, sentRes] = await Promise.all([
                friendAPI.getFriends(),
                friendAPI.getPendingRequests(),
                friendAPI.getSentRequests()
            ]);

            if (friendsRes.success) setFriends(friendsRes.friends);
            if (pendingRes.success) setPendingRequests(pendingRes.requests);
            if (sentRes.success) setSentRequests(sentRes.requests);
        } catch (error) {
            console.error('Error fetching friends data:', error);
            toast.error('Failed to load friends');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (userId: string, userName: string) => {
        setActionLoading(userId);
        try {
            const response = await friendAPI.acceptRequest(userId);
            toast.success(response.message || `You are now friends with ${userName}!`);
            // Move from pending to friends
            const accepted = pendingRequests.find(r => r.user._id === userId);
            if (accepted) {
                setFriends(prev => [...prev, {
                    _id: accepted.user._id,
                    name: accepted.user.name,
                    profilePicture: accepted.user.profilePicture,
                    badges: accepted.user.badges,
                    friendsSince: new Date().toISOString()
                }]);
                setPendingRequests(prev => prev.filter(r => r.user._id !== userId));
            }
        } catch (error: any) {
            console.error('Accept error:', error);
            toast.error(error.message || 'Failed to accept request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async (userId: string) => {
        setActionLoading(userId);
        try {
            const response = await friendAPI.declineRequest(userId);
            toast.success(response.message || 'Request declined');
            setPendingRequests(prev => prev.filter(r => r.user._id !== userId));
        } catch (error: any) {
            console.error('Decline error:', error);
            toast.error(error.message || 'Failed to decline request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (userId: string) => {
        setActionLoading(userId);
        try {
            const response = await friendAPI.cancelRequest(userId);
            toast.success(response.message || 'Request cancelled');
            setSentRequests(prev => prev.filter(r => r.user._id !== userId));
        } catch (error: any) {
            console.error('Cancel error:', error);
            toast.error(error.message || 'Failed to cancel request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnfriend = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to unfriend ${userName}?`)) return;

        setActionLoading(userId);
        try {
            const response = await friendAPI.unfriend(userId);
            toast.success(response.message || 'Friend removed');
            setFriends(prev => prev.filter(f => f._id !== userId));
        } catch (error: any) {
            console.error('Unfriend error:', error);
            toast.error(error.message || 'Failed to remove friend');
        } finally {
            setActionLoading(null);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 dark:bg-dark-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 bg-gray-50 dark:bg-dark-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Friends</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your friends and friend requests
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-dark-700">
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={`px-4 py-3 font-medium transition-colors relative ${activeTab === 'friends'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        Friends ({friends.length})
                        {activeTab === 'friends' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-3 font-medium transition-colors relative ${activeTab === 'pending'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        Pending ({pendingRequests.length})
                        {pendingRequests.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                {pendingRequests.length}
                            </span>
                        )}
                        {activeTab === 'pending' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`px-4 py-3 font-medium transition-colors relative ${activeTab === 'sent'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        Sent ({sentRequests.length})
                        {activeTab === 'sent' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                        )}
                    </button>
                </div>

                {/* Friends List */}
                {activeTab === 'friends' && (
                    <div className="space-y-4">
                        {friends.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-xl">
                                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">No friends yet</p>
                                <Link href="/search" className="btn-primary">
                                    Explore Trips & Meet People
                                </Link>
                            </div>
                        ) : (
                            friends.map(friend => (
                                <div
                                    key={friend._id}
                                    className="flex items-center justify-between bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm"
                                >
                                    <Link
                                        href={`/profile/${friend._id}`}
                                        className="flex items-center gap-4 flex-1"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                                            {friend.profilePicture ? (
                                                <Image
                                                    src={friend.profilePicture}
                                                    alt={friend.name}
                                                    width={56}
                                                    height={56}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                                    {friend.name[0]}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                                                {friend.name}
                                            </h3>
                                            {friend.friendsSince && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Friends since {new Date(friend.friendsSince).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/app?userId=${friend._id}`}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                                            title="Message"
                                        >
                                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </Link>
                                        <button
                                            onClick={() => handleUnfriend(friend._id, friend.name)}
                                            disabled={actionLoading === friend._id}
                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
                                            title="Unfriend"
                                        >
                                            {actionLoading === friend._id ? (
                                                <svg className="w-5 h-5 animate-spin text-gray-400" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Pending Requests */}
                {activeTab === 'pending' && (
                    <div className="space-y-4">
                        {pendingRequests.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-xl">
                                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                <p className="text-gray-500 dark:text-gray-400">No pending requests</p>
                            </div>
                        ) : (
                            pendingRequests.map(request => (
                                <div
                                    key={request._id}
                                    className="flex items-center justify-between bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm"
                                >
                                    <Link
                                        href={`/profile/${request.user._id}`}
                                        className="flex items-center gap-4 flex-1"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                                            {request.user.profilePicture ? (
                                                <Image
                                                    src={request.user.profilePicture}
                                                    alt={request.user.name}
                                                    width={56}
                                                    height={56}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                                    {request.user.name[0]}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                                                {request.user.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </Link>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAccept(request.user._id, request.user.name)}
                                            disabled={actionLoading === request.user._id}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm font-medium"
                                        >
                                            {actionLoading === request.user._id ? '...' : 'Accept'}
                                        </button>
                                        <button
                                            onClick={() => handleDecline(request.user._id)}
                                            disabled={actionLoading === request.user._id}
                                            className="px-4 py-2 bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors disabled:opacity-50 text-sm font-medium"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Sent Requests */}
                {activeTab === 'sent' && (
                    <div className="space-y-4">
                        {sentRequests.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-xl">
                                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                <p className="text-gray-500 dark:text-gray-400">No sent requests</p>
                            </div>
                        ) : (
                            sentRequests.map(request => (
                                <div
                                    key={request._id}
                                    className="flex items-center justify-between bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm"
                                >
                                    <Link
                                        href={`/profile/${request.user._id}`}
                                        className="flex items-center gap-4 flex-1"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                                            {request.user.profilePicture ? (
                                                <Image
                                                    src={request.user.profilePicture}
                                                    alt={request.user.name}
                                                    width={56}
                                                    height={56}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                                    {request.user.name[0]}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                                                {request.user.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Sent {new Date(request.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={() => handleCancel(request.user._id)}
                                        disabled={actionLoading === request.user._id}
                                        className="px-4 py-2 bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors disabled:opacity-50 text-sm font-medium"
                                    >
                                        {actionLoading === request.user._id ? '...' : 'Cancel'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
