'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { messageAPI, userAPI } from '@/lib/api';
import { Conversation } from '@/types/messages';
import ConversationList from '@/components/messages/ConversationList';
import SquadChatList from '@/components/messages/SquadChatList';
import toast from 'react-hot-toast';
import { MessageSquare, Users } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

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

export default function MessagesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loadingDMs, setLoadingDMs] = useState(true);
    const [loadingTrips, setLoadingTrips] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'dm' | 'squad'>('dm');
    const [socket, setSocket] = useState<Socket | null>(null);

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
            initializeSocket();
        }

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [status]);

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
                // The API returns trips where user is creator OR squad member
                setTrips(response.trips || []);
            }
        } catch (error: any) {
            console.error('Error fetching trips:', error);
        } finally {
            setLoadingTrips(false);
        }
    };

    const filteredConversations = conversations.filter(conv =>
        conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTrips = trips.filter(trip =>
        trip.title.toLowerCase().includes(searchQuery.toLowerCase())
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
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('dm')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'dm'
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
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'squad'
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
                            placeholder={activeTab === 'dm' ? 'Search conversations...' : 'Search squad chats...'}
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
                ) : (
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
                )}
            </div>
        </div>
    );
}
