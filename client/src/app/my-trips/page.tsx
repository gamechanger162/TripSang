'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { tripAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Loader2 } from 'lucide-react';

interface Trip {
    _id: string;
    title: string;
    tripCode: string;
    startPoint: { name: string };
    endPoint: { name: string };
    startDate: string;
    endDate: string;
    status: string;
    coverPhoto?: string;
    squadMembers: any[];
    creator: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
}

function MyTripsContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'upcoming';

    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>(initialTab as 'upcoming' | 'history');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchTrips();
        }
    }, [status, activeTab]);

    const fetchTrips = async () => {
        try {
            setLoading(true);
            const response = await tripAPI.getMyTrips();
            if (response.success) {
                const now = new Date();
                const allTrips = response.trips || [];

                if (activeTab === 'history') {
                    // Past trips - end date before today
                    setTrips(allTrips.filter((trip: Trip) => new Date(trip.endDate) < now));
                } else {
                    // Upcoming trips - end date today or later
                    setTrips(allTrips.filter((trip: Trip) => new Date(trip.endDate) >= now));
                }
            }
        } catch (error) {
            toast.error('Failed to load trips');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Trips</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Manage your upcoming and past trips
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${activeTab === 'upcoming'
                                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${activeTab === 'history'
                                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        History
                    </button>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    </div>
                ) : trips.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {activeTab === 'history' ? 'No past trips yet' : 'No upcoming trips'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {activeTab === 'history'
                                ? 'Your completed trips will appear here'
                                : 'Start planning your next adventure!'
                            }
                        </p>
                        {activeTab === 'upcoming' && (
                            <Link
                                href="/trips/create"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                            >
                                Create a Trip
                            </Link>
                        )}
                    </div>
                ) : (
                    /* Trips List */
                    <div className="space-y-4">
                        {trips.map((trip) => (
                            <Link
                                key={trip._id}
                                href={`/trips/${trip._id}`}
                                className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-primary-500/50 hover:shadow-lg transition-all"
                            >
                                <div className="flex">
                                    {/* Cover Photo */}
                                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
                                        {trip.coverPhoto ? (
                                            <Image
                                                src={trip.coverPhoto}
                                                alt={trip.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-indigo-500/20 flex items-center justify-center">
                                                <MapPin className="w-8 h-8 text-primary-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Trip Details */}
                                    <div className="flex-1 p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                                                    {trip.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 font-mono">
                                                    #{trip.tripCode}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${trip.creator._id === (session?.user as any)?.id
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                {trip.creator._id === (session?.user as any)?.id ? 'Created' : 'Joined'}
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span className="line-clamp-1">
                                                    {trip.startPoint.name} → {trip.endPoint.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                <span>{trip.squadMembers?.length || 0} members</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MyTripsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        }>
            <MyTripsContent />
        </Suspense>
    );
}
