'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { tripAPI } from '@/lib/api';
import GoogleAd from '@/components/GoogleAd';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { Map as MapIcon, X, Shield, Smartphone, MessageCircle, ChevronRight, Share2, Heart, Edit3, Trash2, Calendar, MapPin, Users, DollarSign, ArrowRight, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EditTripModal = dynamic(() => import('@/components/EditTripModal'), { ssr: false });

// Dynamic import for Map to avoid SSR issues
const CollaborativeMap = dynamic(() => import('@/components/CollaborativeMap'), {
    loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-900/50 text-zinc-500">Loading Map...</div>,
    ssr: false
});

interface TripDetails {
    _id: string;
    tripCode?: string;
    title: string;
    description?: string;
    startPoint: { name: string; coordinates?: any; lat?: number; lng?: number; latitude?: number; longitude?: number };
    endPoint: { name: string; coordinates?: any; lat?: number; lng?: number; latitude?: number; longitude?: number };
    startDate: string;
    endDate: string;
    tags: string[];
    coverPhoto?: string;
    creator: {
        _id: string;
        name: string;
        email: string;
        profilePicture?: string;
        badges?: string[];
        bio?: string;
        isMobileVerified?: boolean;
        verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
    };
    currentSquadSize?: number;
    maxSquadSize: number;
    squadMembers: Array<{
        _id: string;
        name: string;
        profilePicture?: string;
        isMobileVerified?: boolean;
        verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
    }>;
    stats: {
        likes: number;
        views: number;
    };
    difficulty?: string;
    budget?: {
        min: number;
        max: number;
        currency: string;
    };
    isPublic: boolean;
    status: string;
    createdAt: string;
    waypoints?: Array<{
        lat: number;
        lng: number;
        name?: string;
    }>;
}

export function TripDetailsClient() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const tripId = params.id as string;

    const [trip, setTrip] = useState<TripDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [liked, setLiked] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showMap, setShowMap] = useState(false);

    const userId = session?.user?.id;
    const isCreator = Boolean(userId && trip?.creator?._id && trip.creator._id.toString() === userId?.toString());

    const isSquadMember = isCreator || (trip?.squadMembers?.some((member) => {
        const memberId = (member as any)._id || member;
        return memberId && memberId.toString() === userId?.toString();
    })) || false;

    useEffect(() => {
        const fetchTrip = async () => {
            try {
                const response = await tripAPI.getById(tripId);
                if (response.success) {
                    setTrip(response.trip);
                    // Check if user has liked: API implementation dependent
                }
            } catch (error: any) {
                console.error('Error fetching trip:', error);
                const errorMessage = error.message?.toLowerCase() || '';
                if (errorMessage.includes('premium')) {
                    toast.error('Premium membership required');
                    router.push('/payment/signup');
                    return;
                }
                toast.error(error.message || 'Failed to load trip');
                router.push('/search');
            } finally {
                setLoading(false);
            }
        };

        if (tripId) fetchTrip();
    }, [tripId, router]);

    const handleJoinSquad = async () => {
        if (!session) {
            toast.error('Please login to join');
            router.push('/auth/signin');
            return;
        }
        if (!confirm('Are you ready to join this adventure?')) return;

        setJoining(true);
        try {
            const response = await tripAPI.join(tripId);
            if (response.success) {
                toast.success('Welcome to the squad!');
                const updatedTrip = await tripAPI.getById(tripId);
                if (updatedTrip.success) setTrip(updatedTrip.trip);
            }
        } catch (error: any) {
            if (error.requiresPremium || error.redirectUrl) {
                toast.error('Premium membership required!');
                router.push('/payment/signup');
            } else {
                toast.error(error.message || 'Failed to join');
            }
        } finally {
            setJoining(false);
        }
    };

    const handleLeaveSquad = async () => {
        if (!confirm('Are you sure you want to leave the squad?')) return;
        setJoining(true);
        try {
            const response = await tripAPI.leave(tripId);
            if (response.success) {
                toast.success('Left the squad');
                const updatedTrip = await tripAPI.getById(tripId);
                if (updatedTrip.success) setTrip(updatedTrip.trip);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to leave');
        } finally {
            setJoining(false);
        }
    };


    const handleLike = async () => {
        if (!session) {
            toast.error('Login to like trips');
            return;
        }
        try {
            await tripAPI.like(tripId);
            setLiked(!liked);
            if (trip) {
                setTrip({
                    ...trip,
                    stats: {
                        ...trip.stats,
                        likes: liked ? trip.stats.likes - 1 : trip.stats.likes + 1,
                    },
                });
            }
        } catch {
            toast.error('Failed to like');
        }
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/trips/${tripId}`;
        const text = `Check out this trip: ${trip?.title}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: trip?.title, text, url: shareUrl });
            } catch { }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                toast.success('Link copied!');
            } catch {
                toast.error('Failed to copy');
            }
        }
    };

    const handleDeleteTrip = async () => {
        if (!confirm('Delete this trip? This cannot be undone.')) return;
        try {
            const response = await tripAPI.delete(tripId);
            if (response.success) {
                toast.success('Trip deleted');
                router.push('/search');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete');
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Helper to Normalize Point for Map
    const normalizePoint = (point: TripDetails['startPoint']) => {
        return {
            name: point.name,
            lat: point.lat || point.latitude || point.coordinates?.latitude || 0,
            lng: point.lng || point.longitude || point.coordinates?.longitude || 0
        };
    };

    if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-10 h-10 border-2 border-teal-500 rounded-full animate-spin border-t-transparent"></div></div>;
    if (!trip) return null;

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-teal-500/30 font-sans pb-24">
            {/* Immersive Hero Header */}
            <div className="relative h-[60vh] w-full group">
                {trip.coverPhoto ? (
                    <Image src={trip.coverPhoto} alt={trip.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-900 to-zinc-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

                {/* Navbar Placeholders */}
                <button onClick={() => router.back()} className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/40 transition-all z-10">
                    <ChevronRight className="w-5 h-5 text-white rotate-180" />
                </button>

                <div className="absolute top-6 right-6 flex gap-3 z-10">
                    {isCreator && (
                        <>
                            <button onClick={() => setShowEditModal(true)} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                                <Edit3 className="w-4 h-4 text-white" />
                            </button>
                            <button onClick={handleDeleteTrip} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                    <button onClick={handleShare} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                        <Share2 className="w-4 h-4 text-white" />
                    </button>
                    <button onClick={handleLike} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                        <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                </div>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 z-10">
                    <div className="max-w-5xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {trip.tags.map((tag, i) => (
                                    <span key={i} className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-medium border border-teal-500/20 backdrop-blur-sm">
                                        {tag}
                                    </span>
                                ))}
                                {trip.difficulty && (
                                    <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium border border-white/10 backdrop-blur-sm capitalize">
                                        {trip.difficulty}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-2 leading-tight font-display tracking-tight drop-shadow-lg">
                                {trip.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-zinc-300 font-medium text-sm sm:text-base">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-teal-400" />
                                    {trip.startPoint.name} <ArrowRight className="w-3 h-3 opacity-50" /> {trip.endPoint.name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-teal-400" />
                                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                </div>
                                {trip.budget && (
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-teal-400" />
                                        ₹{trip.budget.min.toLocaleString()} - {trip.budget.max.toLocaleString()}
                                    </div>
                                )}
                            </div>
                            {trip.tripCode && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(trip.tripCode!);
                                            toast.success('Trip code copied!');
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/20 transition-all group"
                                    >
                                        <span className="text-xs text-zinc-400 font-medium">Trip Code</span>
                                        <span className="text-base font-bold text-white tracking-widest font-mono">{trip.tripCode}</span>
                                        <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 -mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Details) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        {trip.description && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="glass-card p-6 sm:p-8"
                            >
                                <h2 className="text-xl font-bold font-display text-white mb-4">The Plan</h2>
                                <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">{trip.description}</p>
                            </motion.div>
                        )}

                        {/* Map Preview */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="glass-card p-0 overflow-hidden relative h-64 group"
                        >
                            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                                <MapIcon className="w-12 h-12 text-zinc-700" />
                            </div>
                            {/* Interactive Map Overlay/Button */}
                            <div className="absolute inset-0 bg-black/40 hover:bg-black/30 transition-all flex items-center justify-center z-10">
                                <button
                                    onClick={() => setShowMap(true)}
                                    className="px-6 py-2.5 bg-white text-zinc-900 rounded-full font-bold shadow-lg transform group-hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <MapIcon className="w-4 h-4" /> View Route Map
                                </button>
                            </div>
                        </motion.div>

                        {/* Squad Members */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="glass-card p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold font-display text-white">Squad</h2>
                                <span className="text-sm font-medium text-zinc-400">
                                    {trip.currentSquadSize || 0} / {trip.maxSquadSize} joined
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-6 overflow-hidden">
                                <div
                                    className="bg-teal-500 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(100, ((trip.currentSquadSize || 0) / trip.maxSquadSize) * 100)}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {trip.squadMembers.slice(0, 6).map((member) => (
                                    <Link key={member._id} href={`/profile/${member._id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative">
                                            {member.profilePicture ? (
                                                <Image src={member.profilePicture} alt={member.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">{member.name[0]}</div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white group-hover:text-teal-400 transition-colors flex items-center gap-1">
                                                {member.name}
                                                {(member as any)?.verificationStatus === 'verified' && <Shield className="w-3 h-3 text-emerald-500" />}
                                            </div>
                                            <div className="text-xs text-zinc-500">Member</div>
                                        </div>
                                    </Link>
                                ))}
                                {trip.squadMembers.length === 0 && (
                                    <div className="col-span-2 text-center py-6 text-zinc-500 text-sm">No squad members yet. Be the first!</div>
                                )}
                            </div>
                        </motion.div>
                        <GoogleAd className="min-h-[250px] w-full" />
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="space-y-6">
                        {/* Host Info */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                            className="glass-card p-6"
                        >
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Hosted By</h3>
                            <Link href={`/profile/${trip.creator._id}`} className="flex items-center gap-4 group">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500/20 to-purple-500/20 p-0.5">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 border-2 border-zinc-900 relative">
                                        {trip.creator.profilePicture ? (
                                            <Image src={trip.creator.profilePicture} alt={trip.creator.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-lg">{trip.creator.name[0]}</div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-bold text-white text-lg group-hover:text-teal-400 transition-colors flex items-center gap-1.5">
                                        {trip.creator.name}
                                        {(trip.creator as any)?.isMobileVerified && <div className="w-4 h-4 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><Smartphone size={10} className="text-blue-400" /></div>}
                                    </div>
                                    <div className="text-sm text-zinc-400">Trip Organizer</div>
                                </div>
                            </Link>

                            {!isCreator && (
                                <Link
                                    href={`/app?userId=${trip.creator._id}`}
                                    className="mt-6 w-full py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white flex items-center justify-center gap-2 text-sm font-medium transition-all"
                                >
                                    <MessageCircle className="w-4 h-4" /> Message Host
                                </Link>
                            )}
                        </motion.div>

                        {/* Sticky CTA Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                            className="glass-card p-6 sticky top-24"
                        >
                            <div className="mb-6">
                                <span className="text-sm text-zinc-400 block mb-1">Status</span>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${trip.status === 'open' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`}></span>
                                    <span className="font-medium text-white capitalize">{trip.status} for joining</span>
                                </div>
                            </div>

                            {isSquadMember ? (
                                <Link
                                    href={`/app/squads/${tripId}`}
                                    className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-teal-400 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] transition-all flex items-center justify-center gap-2 group"
                                >
                                    Open Squad Chat <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </Link>
                            ) : (
                                <button
                                    onClick={handleJoinSquad}
                                    disabled={joining || (trip.currentSquadSize || 0) >= trip.maxSquadSize}
                                    className="w-full py-3.5 bg-white text-black font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {joining ? 'Joining...' : 'Join Squad'} <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </button>
                            )}

                            {isSquadMember && !isCreator && (
                                <button
                                    onClick={handleLeaveSquad}
                                    className="w-full mt-3 py-2.5 text-zinc-500 hover:text-red-400 text-sm font-medium transition-colors"
                                >
                                    Leave Squad
                                </button>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Map Modal */}
            <AnimatePresence>
                {showMap && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <div className="bg-zinc-900 w-full max-w-5xl h-[80vh] rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl">
                            <button
                                onClick={() => setShowMap(false)}
                                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <CollaborativeMap
                                tripId={tripId}
                                startPoint={normalizePoint(trip.startPoint)}
                                endPoint={normalizePoint(trip.endPoint)}
                                initialWaypoints={trip.waypoints}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isCreator && showEditModal && (
                <EditTripModal
                    trip={trip}
                    onClose={() => setShowEditModal(false)}
                    onUpdate={(updatedTrip: TripDetails) => setTrip(updatedTrip)}
                />
            )}
        </div>
    );
}

export default TripDetailsClient;
