'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { messageAPI, userAPI, communityAPI, paymentAPI } from '@/lib/api';
import { Conversation } from '@/types/messages';
import ConversationList from '@/components/messages/ConversationList';
import SquadChatList from '@/components/messages/SquadChatList';
import CommunityList from '@/components/messages/CommunityList';
import PremiumGateModal from '@/components/community/PremiumGateModal';
import CreateCommunityModal from '@/components/community/CreateCommunityModal';
import toast from 'react-hot-toast';
import { MessageSquare, Users, Globe, Plus, Compass, Crown } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';

interface Trip {
    _id: string;
    title: string;
    coverPhoto?: string;
    squadMembers: any[];
    creator: {
        _id: string;
        name: string;
    };
    lastMessage?: {
        senderName: string;
        message: string;
        timestamp: string;
    };
}

interface Community {
    _id: string;
    name: string;
    description: string;
    category: string;
    isPrivate: boolean;
    coverImage?: string;
    memberCount: number;
    creator: any;
    lastMessage?: any;
}

export default function MessagesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loadingDMs, setLoadingDMs] = useState(true);
    const [loadingTrips, setLoadingTrips] = useState(true);
    const [loadingCommunities, setLoadingCommunities] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'dm' | 'squad' | 'community'>('dm');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchConversations();
            fetchTrips();
            checkPremiumStatus();
            initializeSocket();
        }

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [status]);

    const checkPremiumStatus = async () => {
        try {
            const response = await paymentAPI.getStatus();
            if (response.success) {
                const hasActive = response.subscription?.status === 'active' ||
                    (response.subscription?.trialEndDate && new Date(response.subscription.trialEndDate) > new Date());
                setIsPremium(hasActive);
                if (hasActive) {
                    fetchCommunities();
                }
            }
        } catch (error) {
            console.error('Error checking premium status:', error);
        }
    };

    const fetchCommunities = async () => {
        try {
            setLoadingCommunities(true);
            const response = await communityAPI.getMyCommunities();
            if (response.success) {
                setCommunities(response.communities || []);
            }
        } catch (error: any) {
            // Premium-required error expected for non-premium users
            if (error.message?.includes('Premium')) {
                setIsPremium(false);
            } else {
                console.error('Error fetching communities:', error);
            }
        } finally {
            setLoadingCommunities(false);
        }
    };

    const initializeSocket = useCallback(() => {
        const token = (session?.user as any)?.accessToken || localStorage.getItem('token');
        if (!token) return;

        const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
            auth: { token }
        });

        newSocket.on('connect', () => {
            console.log('📡 Messages page socket connected');
            // Join rooms for all trips to get real-time squad messages
            trips.forEach(trip => {
                newSocket.emit('join_room', { tripId: trip._id });
            });
        });

        // Listen for squad messages
        newSocket.on('receive_message', (message: any) => {
            // Update the trip's last message
            setTrips(prevTrips =>
                prevTrips.map(trip => {
                    if (trip._id === message.tripId) {
                        return {
                            ...trip,
                            lastMessage: {
                                senderName: message.senderName,
                                message: message.message || (message.type === 'image' ? '📷 Sent an image' : ''),
                                timestamp: message.timestamp
                            }
                        };
                    }
                    return trip;
                }).sort((a, b) => {
                    // Sort by most recent message
                    const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
                    const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
                    return bTime - aTime;
                })
            );
        });

        // Listen for DM notifications
        newSocket.on('new_dm_notification', (data: any) => {
            // Refresh conversations to get updated unread count
            fetchConversations();
        });

        // Listen for community messages
        newSocket.on('receive_community_message', (message: any) => {
            setCommunities(prev =>
                prev.map(c => {
                    if (c._id === message.communityId) {
                        return {
                            ...c,
                            lastMessage: {
                                message: message.message,
                                senderName: message.senderName,
                                timestamp: message.timestamp,
                                type: message.type
                            }
                        };
                    }
                    return c;
                }).sort((a, b) => {
                    const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
                    const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
                    return bTime - aTime;
                })
            );
        });

        setSocket(newSocket);
    }, [session, trips.length]);

    // Join trip rooms when trips are loaded
    useEffect(() => {
        if (socket && trips.length > 0) {
            trips.forEach(trip => {
                socket.emit('join_room', { tripId: trip._id });
            });
        }
    }, [socket, trips.length]);

    // Join community rooms when communities are loaded
    useEffect(() => {
        if (socket && communities.length > 0) {
            communities.forEach(c => {
                socket.emit('join_community', { communityId: c._id });
            });
        }
    }, [socket, communities.length]);

    const fetchConversations = async () => {
        try {
            setLoadingDMs(true);
            const response = await messageAPI.getConversations();
            if (response.success) {
                setConversations(response.conversations);
            }
        } catch (error: any) {
            console.error('Error fetching conversations:', error);
            toast.error(error.message || 'Failed to load conversations');
        } finally {
            setLoadingDMs(false);
        }
    };

    const fetchTrips = async () => {
        try {
            setLoadingTrips(true);
            const response = await userAPI.getTrips();
            if (response.success) {
                // Sort trips by most recent message
                const sortedTrips = (response.trips || []).sort((a: Trip, b: Trip) => {
                    const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
                    const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
                    return bTime - aTime;
                });
                setTrips(sortedTrips);
            }
        } catch (error: any) {
            console.error('Error fetching trips:', error);
        } finally {
            setLoadingTrips(false);
        }
    };

    const handleCommunityTabClick = () => {
        if (!isPremium) {
            setShowPremiumModal(true);
        } else {
            setActiveTab('community');
        }
    };

    const handleCommunityCreated = (community: Community) => {
        setCommunities(prev => [community, ...prev]);
    };

    const filteredConversations = conversations.filter(conv =>
        conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTrips = trips.filter(trip =>
        trip.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCommunities = communities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-8 pt-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Messages
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Stay connected with your travel buddies
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveTab('dm')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'dm'
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Direct Messages
                        {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                {conversations.filter(c => c.unreadCount > 0).length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('squad')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'squad'
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Squad Chats
                        {trips.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full">
                                {trips.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={handleCommunityTabClick}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'community'
                            ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg shadow-primary-500/25'
                            : isPremium
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : 'bg-gray-800/50 text-gray-500 cursor-pointer'
                            }`}
                    >
                        <Globe className="w-4 h-4" />
                        Communities
                        {!isPremium && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                        {isPremium && communities.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-500/30 text-purple-200 rounded-full">
                                {communities.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search bar */}
                <div className="mb-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder={
                                activeTab === 'dm'
                                    ? 'Search conversations...'
                                    : activeTab === 'squad'
                                        ? 'Search squad chats...'
                                        : 'Search communities...'
                            }
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Content based on active tab */}
                {activeTab === 'dm' ? (
                    <>
                        <ConversationList conversations={filteredConversations} loading={loadingDMs} />
                        {!loadingDMs && searchQuery && filteredConversations.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-600 dark:text-gray-400">
                                    No conversations found for "{searchQuery}"
                                </p>
                            </div>
                        )}
                    </>
                ) : activeTab === 'squad' ? (
                    <>
                        <SquadChatList trips={filteredTrips} loading={loadingTrips} />
                        {!loadingTrips && searchQuery && filteredTrips.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-600 dark:text-gray-400">
                                    No squad chats found for "{searchQuery}"
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* Community Actions */}
                        <div className="flex gap-3 mb-6">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Create Community
                            </button>
                            <Link
                                href="/community/discover"
                                className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-all"
                            >
                                <Compass className="w-4 h-4" />
                                Discover
                            </Link>
                        </div>

                        <CommunityList communities={filteredCommunities} loading={loadingCommunities} />
                        {!loadingCommunities && searchQuery && filteredCommunities.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-600 dark:text-gray-400">
                                    No communities found for "{searchQuery}"
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Premium Gate Modal */}
            <PremiumGateModal
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
            />

            {/* Create Community Modal */}
            <CreateCommunityModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCommunityCreated}
            />
        </div>
    );
}
