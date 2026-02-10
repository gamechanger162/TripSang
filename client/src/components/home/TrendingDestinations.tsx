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
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-orange-500/[0.03] blur-[120px] rounded-full" />

            <div className="max-w-6xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="flex items-end justify-between mb-12"
                >
                    <div>
                        <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-3">
                            Trending Destinations
                        </h2>
                        <p className="text-zinc-500 text-lg">
                            Where everyone&apos;s heading next.
                        </p>
                    </div>
                    <Link href="/search" className="hidden md:flex items-center gap-1 text-teal-400 hover:text-teal-300 transition-colors text-sm font-medium">
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>

                {/* Cards grid - horizontal scroll on mobile */}
                <div className="overflow-x-auto md:overflow-visible scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                    <div className="flex md:grid md:grid-cols-3 gap-4" style={{ width: 'max-content' }}>
                        {destinations.map((dest, i) => (
                            <motion.div
                                key={dest.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08, duration: 0.5 }}
                                className="w-[260px] md:w-auto"
                            >
                                <Link href={`/search?endPoint=${dest.name}`}>
                                    <div className="glass-card overflow-hidden group cursor-pointer p-0 aspect-[4/5]">
                                        <div className="relative w-full h-full">
                                            <img
                                                src={dest.image}
                                                alt={dest.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                            {/* Content */}
                                            <div className="absolute bottom-0 left-0 right-0 p-5">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <MapPin className="w-4 h-4 text-teal-400" />
                                                    <h3 className="font-display text-xl font-semibold text-white">{dest.name}</h3>
                                                </div>
                                                <p className="text-zinc-400 text-sm">{dest.trips} active trips</p>
                                            </div>

                                            {/* Hover arrow */}
                                            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 -translate-x-2">
                                                <ArrowRight className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Mobile view all link */}
                <div className="md:hidden flex justify-center mt-8">
                    <Link href="/search" className="btn-glass flex items-center gap-2 text-sm">
                        View All Destinations <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
