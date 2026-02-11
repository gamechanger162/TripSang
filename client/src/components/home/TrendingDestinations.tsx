'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';

const destinations = [
    { name: 'Manali', image: 'https://images.unsplash.com/photo-1571401835393-8c5f35328320?w=400&q=80', trips: 24 },
    { name: 'Goa', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80', trips: 31 },
    { name: 'Rishikesh', image: 'https://images.unsplash.com/photo-1600935585272-2789660c0141?w=400&q=80', trips: 18 },
    { name: 'Ladakh', image: 'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=400&q=80', trips: 12 },
    { name: 'Jaipur', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&q=80', trips: 15 },
    { name: 'Kerala', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=80', trips: 20 },
];

export default function TrendingDestinations() {
    return (
        <div className="relative">
            {/* Horizontal Scroll Container */}
            <div className="overflow-x-auto pb-6 -mx-4 px-4 md:-mx-0 md:px-0 scrollbar-hide">
                <div className="flex gap-4" style={{ width: 'max-content' }}>
                    {destinations.map((dest, i) => (
                        <motion.div
                            key={dest.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="w-[200px] md:w-[240px]"
                        >
                            <Link href={`/search?endPoint=${dest.name}`}>
                                <div className="glass-card overflow-hidden group cursor-pointer p-0 aspect-[3/4] rounded-2xl relative">
                                    <img
                                        src={dest.image}
                                        alt={dest.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                    {/* Content */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h3 className="font-display text-lg font-bold text-white mb-0.5">{dest.name}</h3>
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                                            <span className="text-zinc-300 text-xs">{dest.trips} trips active</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}

                    {/* View All Card */}
                    <Link href="/search" className="w-[120px] md:w-[150px] aspect-[3/4] flex flex-col items-center justify-center glass-card hover:bg-white/5 transition-colors group cursor-pointer border-dashed border-zinc-700 rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <ArrowRight className="w-5 h-5 text-teal-400" />
                        </div>
                        <span className="text-white text-sm font-medium">View All</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
