'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { reviewAPI, userAPI } from '@/lib/api';
import ReviewModal from '@/components/reviews/ReviewModal';
import toast from 'react-hot-toast';
import PushNotificationManager from '@/components/common/PushNotificationManager';
import DeleteAccountButton from '@/components/common/DeleteAccountButton';

import { Shield, Smartphone } from 'lucide-react';

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

                // Trip is "upcoming" if endDate hasn't passed yet
                const upcoming = allTrips.filter((t: any) => new Date(t.endDate || t.startDate) >= now);
                const past = allTrips.filter((t: any) => new Date(t.endDate || t.startDate) < now);

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
            <div className="min-h-screen pt-20 flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #001428 0%, #000a14 100%)' }}>
                <div className="animate-spin rounded-full h-12 w-12" style={{ border: '3px solid rgba(0,255,255,0.2)', borderTopColor: '#00ffff' }}></div>
            </div>
        );
    }

    if (!session?.user) return null;

    return (
        <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(180deg, #001428 0%, #000a14 100%)' }}>
            <div className="max-w-7xl mx-auto py-8">
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate" style={{ textShadow: '0 0 20px rgba(0,255,255,0.4)' }}>
                            Welcome back, {session.user.name}
                        </h2>
                        <p className="mt-1 text-sm" style={{ color: 'rgba(0,255,255,0.6)' }}>
                            Manage your trips and account settings
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
                        <Link
                            href="/my-plan"
                            className="inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition-all"
                            style={{ background: 'rgba(0,40,60,0.5)', border: '1px solid rgba(0,255,255,0.3)', color: 'rgba(0,255,255,0.8)' }}
                        >
                            My Plan & Billing
                        </Link>
                        <Link
                            href="/trips/create"
                            className="inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-white transition-all"
                            style={{ background: 'linear-gradient(135deg, #0891b2, #8b5cf6)', boxShadow: '0 0 20px rgba(0,255,255,0.3)' }}
                        >
                            Create New Trip
                        </Link>
                    </div>
                </div>

                {/* Push Notifications */}
                <div className="mb-6">
                    <PushNotificationManager />
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column: Profile Card */}
                    <div className="col-span-1">
                        <div className="overflow-hidden shadow rounded-xl sticky top-24" style={{ background: 'rgba(0,30,50,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,255,255,0.15)' }}>
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="rounded-full p-1 relative h-16 w-16" style={{ background: 'linear-gradient(135deg, rgba(0,255,255,0.3), rgba(139,92,246,0.3))', boxShadow: '0 0 20px rgba(0,255,255,0.3)' }}>
                                        {(session.user.image || (session.user as any)?.profilePicture) ? (
                                            <img
                                                className="h-full w-full rounded-full object-cover"
                                                src={session.user.image || (session.user as any)?.profilePicture}
                                                alt=""
                                            />
                                        ) : (
                                            <span className="inline-block h-full w-full rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0891b2, #8b5cf6)' }}>
                                                <svg className="h-full w-full text-white/50" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                    <div className="ml-5">
                                        <h3 className="text-lg leading-6 font-medium text-white">
                                            {session.user.name}
                                        </h3>
                                        <p className="text-sm" style={{ color: 'rgba(0,255,255,0.6)' }}>{session.user.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${session.user.role === 'admin'
                                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                                }`}>
                                                {session.user.role}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {(session.user as any)?.isMobileVerified && (
                                                    <div
                                                        className="w-5 h-5 rounded-full flex items-center justify-center"
                                                        style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.3)' }}
                                                        title="Phone Verified"
                                                    >
                                                        <Smartphone size={12} style={{ color: '#00ffff' }} />
                                                    </div>
                                                )}
                                                {session.user.verificationStatus === 'verified' ? (
                                                    <div
                                                        className="w-5 h-5 rounded-full flex items-center justify-center"
                                                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
                                                        title="Identity Verified (Aadhaar/PAN)"
                                                    >
                                                        <Shield size={12} style={{ color: '#10b981' }} />
                                                    </div>
                                                ) : (
                                                    <Link href="/verify/id" className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full cursor-pointer" style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.3)', color: '#00ffff' }}>
                                                        {session.user.verificationStatus === 'pending' ? 'Verification Pending' : 'Verify Identity'}
                                                        {session.user.verificationStatus !== 'pending' && <span className="ml-1">→</span>}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-5 py-3 space-y-2" style={{ background: 'rgba(0,40,60,0.4)', borderTop: '1px solid rgba(0,255,255,0.1)' }}>
                                <div className="text-sm pb-2" style={{ borderBottom: '1px solid rgba(0,255,255,0.1)' }}>
                                    <Link href="/profile/edit" className="font-medium block" style={{ color: '#00ffff' }}>
                                        Edit profile
                                    </Link>
                                </div>
                                <div className="text-sm pt-1">
                                    <Link href={`/profile/${session.user.id}`} className="font-medium block" style={{ color: 'rgba(0,255,255,0.7)' }}>
                                        View public profile
                                    </Link>
                                </div>
                                <div className="pt-3 mt-3" style={{ borderTop: '1px solid rgba(0,255,255,0.1)' }}>
                                    <DeleteAccountButton />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pending Reviews & Activity */}
                    <div className="col-span-1 lg:col-span-2 space-y-6">
                        {/* Pending Reviews */}
                        {!loadingReviews && pendingReviews.length > 0 && (
                            <div className="shadow rounded-xl" style={{ background: 'rgba(0,30,50,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,255,255,0.15)', borderLeft: '4px solid #fbbf24' }}>
                                <div className="px-4 py-5 sm:px-6 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,255,255,0.1)' }}>
                                    <div>
                                        <h3 className="text-lg leading-6 font-medium text-white">
                                            Pending Reviews
                                        </h3>
                                        <p className="text-sm" style={{ color: 'rgba(0,255,255,0.6)' }}>
                                            Rate your recent travel companions
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                                        {pendingReviews.length} pending
                                    </span>
                                </div>
                                <div
                                    className="p-4 space-y-3 max-h-96 overflow-y-auto"
                                    style={{
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: '#00ffff transparent'
                                    }}
                                >
                                    {pendingReviews.map((review) => (
                                        <div
                                            key={`${review.trip._id}-${review.traveler._id}`}
                                            className="flex items-center justify-between p-4 rounded-lg transition-all"
                                            style={{ background: 'rgba(0,40,60,0.5)', border: '1px solid rgba(0,255,255,0.1)' }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0891b2, #8b5cf6)', boxShadow: '0 0 15px rgba(0,255,255,0.3)' }}>
                                                    {review.traveler.profilePicture ? (
                                                        <img src={review.traveler.profilePicture} alt={review.traveler.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-white font-semibold text-lg">{review.traveler.name[0]}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{review.traveler.name}</p>
                                                    <p className="text-sm" style={{ color: 'rgba(0,255,255,0.6)' }}>{review.trip.title}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPendingReviews(prev => prev.filter(r =>
                                                            r.trip._id !== review.trip._id || r.traveler._id !== review.traveler._id
                                                        ));
                                                    }}
                                                    className="p-2 rounded-full transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}
                                                    title="Skip this review"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleReviewClick(review)}
                                                    className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-all"
                                                    style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', boxShadow: '0 0 15px rgba(0,255,255,0.3)' }}
                                                >
                                                    Review
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upcoming Trips */}
                        <div className="shadow rounded-xl" style={{ background: 'rgba(0,30,50,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,255,255,0.15)' }}>
                            <div className="px-4 py-5 sm:px-6 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,255,255,0.1)' }}>
                                <h3 className="text-lg leading-6 font-medium text-white">Upcoming Trips</h3>
                                {!loadingTrips && (
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(0,255,255,0.1)', color: '#00ffff', border: '1px solid rgba(0,255,255,0.3)' }}>
                                        {upcomingTrips.length} Upcoming
                                    </span>
                                )}
                            </div>
                            <div className="p-6">
                                {loadingTrips ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8" style={{ border: '3px solid rgba(0,255,255,0.2)', borderTopColor: '#00ffff' }}></div>
                                    </div>
                                ) : upcomingTrips.length > 0 ? (
                                    <div className="space-y-4">
                                        {upcomingTrips.map((trip) => (
                                            <div key={trip._id} className="rounded-lg p-4 transition-all" style={{ background: 'rgba(0,40,60,0.4)', border: '1px solid rgba(0,255,255,0.1)' }}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <Link href={`/trips/${trip._id}`} className="text-lg font-semibold text-white hover:text-cyan-400 transition-colors">
                                                            {trip.title}
                                                        </Link>
                                                        <div className="flex items-center gap-2 text-sm mt-1" style={{ color: 'rgba(0,255,255,0.6)' }}>
                                                            <span>📅 {new Date(trip.startDate).toLocaleDateString()}</span>
                                                            <span>•</span>
                                                            <span>📍 {trip.endPoint.name}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${trip.creator._id === session.user.id
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                                        }`}>
                                                        {trip.creator._id === session.user.id ? 'Creator' : 'Joined'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12" style={{ color: 'rgba(0,255,255,0.4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="mt-2 text-sm" style={{ color: 'rgba(0,255,255,0.5)' }}>No upcoming trips yet.</p>
                                        <div className="mt-6">
                                            <Link
                                                href="/search"
                                                className="inline-flex items-center px-4 py-2 shadow-sm text-sm font-medium rounded-lg text-white transition-all"
                                                style={{ background: 'linear-gradient(135deg, #0891b2, #8b5cf6)', boxShadow: '0 0 20px rgba(0,255,255,0.3)' }}
                                            >
                                                Explore Trips
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Trip History */}
                        {!loadingTrips && pastTrips.length > 0 && (
                            <div className="shadow rounded-xl" style={{ background: 'rgba(0,30,50,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,255,255,0.15)' }}>
                                <div className="px-4 py-5 sm:px-6 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,255,255,0.1)' }}>
                                    <h3 className="text-lg leading-6 font-medium text-white flex items-center gap-2">
                                        <svg className="w-5 h-5" style={{ color: 'rgba(0,255,255,0.6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Trip History
                                    </h3>
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                                        {pastTrips.length} Past
                                    </span>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3">
                                        {pastTrips.slice(0, 5).map((trip) => (
                                            <div key={trip._id} className="flex items-center justify-between p-3 rounded-lg transition-all" style={{ background: 'rgba(0,40,60,0.4)', border: '1px solid rgba(0,255,255,0.1)' }}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: 'rgba(0,255,255,0.1)' }}>
                                                        {trip.coverPhoto ? (
                                                            <img src={trip.coverPhoto} alt={trip.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <svg className="w-5 h-5" style={{ color: 'rgba(0,255,255,0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Link href={`/trips/${trip._id}`} className="font-medium text-white hover:text-cyan-400 text-sm transition-colors">
                                                            {trip.title}
                                                        </Link>
                                                        <p className="text-xs" style={{ color: 'rgba(0,255,255,0.5)' }}>
                                                            {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${trip.creator._id === session.user.id
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                                    }`}>
                                                    {trip.creator._id === session.user.id ? 'Created' : 'Joined'}
                                                </span>
                                            </div>
                                        ))}
                                        {pastTrips.length > 5 && (
                                            <div className="text-center pt-2">
                                                <Link href="/my-trips?tab=history" className="text-sm font-medium" style={{ color: '#00ffff' }}>
                                                    View all {pastTrips.length} past trips →
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
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
