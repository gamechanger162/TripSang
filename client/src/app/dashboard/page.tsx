'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { reviewAPI, userAPI } from '@/lib/api';
import ReviewModal from '@/components/reviews/ReviewModal';
import toast from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function UserDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [pendingReviews, setPendingReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
    const [pastTrips, setPastTrips] = useState<any[]>([]);
    const [loadingTrips, setLoadingTrips] = useState(true);

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState<any>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchPendingReviews();
            fetchMyTrips();
        }
    }, [status]);

    const fetchPendingReviews = async () => {
        try {
            setLoadingReviews(true);
            const response = await reviewAPI.getPending();
            if (response.success) {
                setPendingReviews(response.pendingReviews || []);
            }
        } catch (error) {
            console.error('Error fetching pending reviews:', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    const fetchMyTrips = async () => {
        try {
            setLoadingTrips(true);
            const response = await userAPI.getTrips();
            if (response.success) {
                const now = new Date();
                const allTrips = response.trips || [];

                const upcoming = allTrips.filter((t: any) => new Date(t.startDate) >= now);
                const past = allTrips.filter((t: any) => new Date(t.startDate) < now);

                setUpcomingTrips(upcoming);
                setPastTrips(past);
            }
        } catch (error) {
            console.error('Error fetching trips:', error);
        } finally {
            setLoadingTrips(false);
        }
    };

    const handleReviewClick = (review: any) => {
        setSelectedReview(review);
        setReviewModalOpen(true);
    };

    const handleReviewSubmitted = () => {
        fetchPendingReviews(); // Refresh the list
        toast.success('Thank you for your review!');
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!session?.user) return null;

    return (
        <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto py-8">
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
                            Welcome back, {session.user.name}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage your trips and account settings
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
                        <Link
                            href="/my-plan"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            My Plan & Billing
                        </Link>
                        <Link
                            href="/trips/create"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Create New Trip
                        </Link>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column: Profile Card */}
                    <div className="col-span-1">
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg sticky top-24">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="bg-primary-100 rounded-full p-2 relative h-16 w-16">
                                        {session.user.image ? (
                                            <img
                                                className="h-full w-full rounded-full object-cover"
                                                src={session.user.image}
                                                alt=""
                                            />
                                        ) : (
                                            <span className="inline-block h-full w-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                    <div className="ml-5">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                            {session.user.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{session.user.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${session.user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {session.user.role}
                                            </span>
                                            {session.user.isMobileVerified && (
                                                <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 space-y-2">
                                <div className="text-sm border-b border-gray-200 dark:border-gray-600 pb-2">
                                    <Link href="/profile/edit" className="font-medium text-primary-600 hover:text-primary-500 block">
                                        Edit profile
                                    </Link>
                                </div>
                                <div className="text-sm pt-1">
                                    <Link href={`/profile/${session.user.id}`} className="font-medium text-gray-600 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 block">
                                        View public profile
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pending Reviews & Activity */}
                    <div className="col-span-1 lg:col-span-2 space-y-6">
                        {/* Pending Reviews */}
                        {!loadingReviews && pendingReviews.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg border-l-4 border-yellow-400">
                                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                            Pending Reviews
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Rate your recent travel companions
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                                        {pendingReviews.length} pending
                                    </span>
                                </div>
                                <div className="p-4 space-y-3">
                                    {pendingReviews.slice(0, 5).map((review) => (
                                        <div
                                            key={`${review.trip._id}-${review.traveler._id}`}
                                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center overflow-hidden">
                                                    {review.traveler.profilePicture ? (
                                                        <img src={review.traveler.profilePicture} alt={review.traveler.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-white font-semibold text-lg">{review.traveler.name[0]}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{review.traveler.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{review.trip.title}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleReviewClick(review)}
                                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                Review
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upcoming Trips */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">My Trips</h3>
                                {!loadingTrips && (
                                    <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-primary-900 dark:text-primary-300">
                                        {upcomingTrips.length} Upcoming
                                    </span>
                                )}
                            </div>
                            <div className="p-6">
                                {loadingTrips ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                    </div>
                                ) : upcomingTrips.length > 0 ? (
                                    <div className="space-y-4">
                                        {upcomingTrips.map((trip) => (
                                            <div key={trip._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <Link href={`/trips/${trip._id}`} className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600">
                                                            {trip.title}
                                                        </Link>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                            <span>📅 {new Date(trip.startDate).toLocaleDateString()}</span>
                                                            <span>•</span>
                                                            <span>📍 {trip.endPoint.name}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${trip.creator._id === session.user.id
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {trip.creator._id === session.user.id ? 'Creator' : 'Joined'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">You haven't joined any trips yet.</p>
                                        <div className="mt-6">
                                            <Link
                                                href="/search"
                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                                            >
                                                Explore Trips
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {selectedReview && (
                <ReviewModal
                    isOpen={reviewModalOpen}
                    onClose={() => {
                        setReviewModalOpen(false);
                        setSelectedReview(null);
                    }}
                    tripId={selectedReview.trip._id}
                    tripTitle={selectedReview.trip.title}
                    revieweeId={selectedReview.traveler._id}
                    revieweeName={selectedReview.traveler.name}
                    onReviewSubmitted={handleReviewSubmitted}
                />
            )}
        </div>
    );
}
