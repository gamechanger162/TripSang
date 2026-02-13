'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Search, Trash2, MapPin, Users, ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Trip {
    _id: string;
    title: string;
    status: string;
    startDate: string;
    endDate?: string;
    creator?: { _id: string; name: string; email: string };
    squadMembers?: any[];
}

export default function AdminTripsPage() {
    const { data: session } = useSession();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const userRole = (session?.user as any)?.role;

    useEffect(() => {
        if (userRole === 'admin') {
            fetchTrips();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, page, statusFilter]);

    const fetchTrips = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getTrips(page, 20, statusFilter || undefined);
            if (res.success) setTrips(res.trips);
        } catch (err) {
            toast.error('Failed to load trips');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTrip = async (tripId: string) => {
        if (!confirm('Are you sure you want to delete this trip?')) return;
        try {
            const res = await adminAPI.deleteTrip(tripId);
            if (res.success) {
                toast.success('Trip deleted');
                fetchTrips();
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete trip');
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const filtered = searchQuery
        ? trips.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : trips;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Trips</h1>
                <p className="text-sm text-gray-500 mt-1">Manage all trips on the platform</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by trip title..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                >
                    <option value="" className="bg-gray-900">All Status</option>
                    <option value="active" className="bg-gray-900">Active</option>
                    <option value="completed" className="bg-gray-900">Completed</option>
                    <option value="cancelled" className="bg-gray-900">Cancelled</option>
                </select>
            </div>

            {/* Trips Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-44 bg-white/[0.04] rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] py-16 text-center">
                    <MapPin size={32} className="mx-auto text-gray-700 mb-3" />
                    <p className="text-gray-500">No trips found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((trip) => (
                        <div key={trip._id} className="group rounded-xl bg-gray-900/60 border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-sm font-semibold text-white line-clamp-1 flex-1">{trip.title}</h3>
                                <span className={`ml-2 inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${statusColor(trip.status)}`}>
                                    {trip.status}
                                </span>
                            </div>
                            <div className="space-y-2 text-xs text-gray-500 mb-4">
                                <div className="flex items-center gap-2">
                                    <Users size={12} className="text-gray-600 flex-shrink-0" />
                                    <span className="truncate">{trip.creator?.name || 'Unknown'}</span>
                                    <span className="text-gray-700">·</span>
                                    <span>{trip.squadMembers?.length || 0} members</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={12} className="text-gray-600 flex-shrink-0" />
                                    <span>{new Date(trip.startDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteTrip(trip._id)}
                                className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={12} />
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-gray-600 px-3">Page {page}</span>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={trips.length < 20}
                    className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
