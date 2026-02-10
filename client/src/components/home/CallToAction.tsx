'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CallToAction() {
    return (
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.7 }}
                    className="glass-strong rounded-3xl p-10 md:p-16 text-center relative overflow-hidden"
                >
                    {/* Background mesh glows */}
                    <div className="absolute top-0 left-0 w-60 h-60 bg-teal-500/10 blur-[80px] rounded-full" />
                    <div className="absolute bottom-0 right-0 w-60 h-60 bg-orange-500/10 blur-[80px] rounded-full" />

                    <div className="relative z-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 glass-pill text-sm mb-6 text-teal-400"
                        >
                            <Sparkles className="w-4 h-4" />
                            Start your journey today
                        </motion.div>

                        <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 leading-tight">
                            <span className="text-white">Ready to Find Your </span>
                            <span className="text-gradient-teal">Travel Tribe?</span>
                        </h2>

                        <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10">
                            Join thousands of travelers who've found their perfect squad on TripSang.
                            Your next adventure is one click away.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/auth/signup"
                                className="btn-primary flex items-center gap-2 text-lg px-8 py-4 rounded-xl"
                            >
                                Get Started Free
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/search"
                                className="btn-glass flex items-center gap-2 text-lg px-8 py-4 rounded-xl"
                            >
                                Browse Trips
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
