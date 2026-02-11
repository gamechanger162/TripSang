'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CallToAction() {
    return (
        <section className="relative py-24 overflow-hidden">
            {/* Background Effects - Lighter & Vibrant */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-teal-500/20 via-purple-500/10 to-transparent blur-3xl opacity-60" />
                <div className="absolute inset-0 bg-grid opacity-[0.05]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="glass-card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden group border-white/10 bg-white/5">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 via-purple-500/20 to-orange-500/20 blur opacity-75 group-hover:opacity-100 transition duration-1000" />

                        <div className="relative space-y-8">
                            <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
                                Ready to start your
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-300">
                                    next adventure?
                                </span>
                            </h2>

                            <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto">
                                Join thousands of travelers who are discovering the world together.
                                Create your trip or join one today.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href="/create-trip"
                                    className="w-full sm:w-auto px-8 py-4 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group shadow-lg shadow-teal-500/20"
                                >
                                    Start a Trip
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/search"
                                    className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                                >
                                    <Sparkles className="w-5 h-5 text-teal-300" />
                                    Browse Trips
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
