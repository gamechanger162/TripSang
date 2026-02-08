'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { tripAPI } from '@/lib/api';
import FuturisticSquadChat from '@/components/FuturisticSquadChat';
import toast from 'react-hot-toast';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Trip {
    _id: string;
    title: string;
    coverPhoto?: string;
    creator: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    squadMembers: Array<{
        _id: string;
        name: string;
        profilePicture?: string;
    }>;
    startPoint: {
        name: string;
        coordinates?: { latitude: number; longitude: number };
    };
    endPoint?: {
        name: string;
        coordinates?: { latitude: number; longitude: number };
    };
    waypoints?: any[];
}

export default function TripChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const tripId = params?.id as string;

    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSquadMember, setIsSquadMember] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
            return;
        }

        if (status === 'authenticated' && tripId) {
            fetchTrip();
        }
    }, [status, tripId]);

    const fetchTrip = async () => {
        try {
            setLoading(true);
            const response = await tripAPI.getById(tripId);
            if (response.success && response.trip) {
                setTrip(response.trip);

                // Check if user is squad member (creator or joined)
                const userId = (session?.user as any)?.id;
                const isCreator = response.trip.creator._id === userId;
                const isMember = response.trip.squadMembers.some(
                    (m: any) => m._id === userId
                );
                setIsSquadMember(isCreator || isMember);
            } else {
                toast.error('Trip not found');
                router.push('/messages');
            }
        } catch (error) {
            console.error('Error fetching trip:', error);
            toast.error('Failed to load trip');
            router.push('/messages');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Trip not found</h2>
                    <Link href="/app" className="text-primary-600 hover:underline">
                        Back to Messages
                    </Link>
                </div>
            </div>
        );
    }

    if (!isSquadMember) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        You must be a squad member to access this chat.
                    </p>
                    <Link href={`/trips/${tripId}`} className="text-primary-600 hover:underline">
                        View Trip Details
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-50 dark:bg-dark-900 pt-16 pb-20 md:pb-0">
            {/* Chat Room - Full height */}
            <div className="w-full h-full">
                <FuturisticSquadChat
                    tripId={tripId}
                    isSquadMember={isSquadMember}
                    squadMembers={trip.squadMembers}
                    startPoint={{
                        lat: trip.startPoint.coordinates?.latitude || 20.5937,
                        lng: trip.startPoint.coordinates?.longitude || 78.9629,
                        name: trip.startPoint.name
                    }}
                    endPoint={trip.endPoint ? {
                        lat: trip.endPoint.coordinates?.latitude || 20.5937,
                        lng: trip.endPoint.coordinates?.longitude || 78.9629,
                        name: trip.endPoint.name
                    } : undefined}
                    initialWaypoints={trip.waypoints}
                />
            </div>
        </div>
    );
}
