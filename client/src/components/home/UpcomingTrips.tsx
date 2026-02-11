'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { tripAPI } from '@/lib/api';
import TripCard from '@/components/TripCard';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function UpcomingTrips() {
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                // Fetch trips sorted by start date, limit 6
                const response = await tripAPI.search({
                    sortBy: 'startDate',
                    limit: 6
                });

                if (response.success && response.trips) {
                    setTrips(response.trips);
                }
            } catch (error) {
                console.error('Failed to fetch upcoming trips:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrips();
    }, []);

    // Loading Skeleton
    if (loading) {
        return (
            <div className="flex gap-4 overflow-hidden pb-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="min-w-[300px] md:min-w-[350px] h-[400px] glass-card animate-pulse rounded-2xl" />
                ))}
            </div>
        );
    }

    // Empty State (Fallback if no trips)
    if (trips.length === 0) {
        return (
            <div className="text-center py-12 glass-card rounded-2xl border-dashed border-zinc-700">
                <Sparkles className="w-8 h-8 text-teal-500 mx-auto mb-3" />
                <h3 className="text-xl text-white font-medium mb-1">No upcoming trips found</h3>
                <p className="text-zinc-500 mb-4">Be the first to create an adventure!</p>
                <Link href="/create-trip" className="btn-primary inline-flex items-center gap-2">
                    Create Trip <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Horizontal Scroll Container */}
            <div className="overflow-x-auto pb-6 -mx-4 px-4 md:-mx-0 md:px-0 scrollbar-hide">
                <div className="flex gap-4" style={{ width: 'max-content' }}>
                    {trips.map((trip, i) => (
                        <motion.div
                            key={trip._id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="w-[300px] md:w-[350px]"
                        >
                            <TripCard trip={trip} />
                        </motion.div>
                    ))}

                    {/* View All Card */}
                    <Link href="/search" className="min-w-[150px] flex flex-col items-center justify-center glass-card hover:bg-white/5 transition-colors group cursor-pointer border-dashed border-zinc-700">
                        <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <ArrowRight className="w-5 h-5 text-teal-400" />
                        </div>
                        <span className="text-white font-medium">View All</span>
                        <span className="text-xs text-zinc-500">Discover more trips</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
