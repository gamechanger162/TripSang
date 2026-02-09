'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function FeaturesGrid() {
    return (
        <section className="py-24 relative bg-[#0a0a0a] z-20 overflow-hidden">
            {/* Premium Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20" />
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/3 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <span className="premium-badge mb-6">Features</span>
                    <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-6 leading-tight">
                        Everything you need <br />
                        <span className="text-premium-gold">to travel together.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Stats - Premium Card */}
                    <div className="md:col-span-3 premium-card rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between group hover:border-amber-500/20 transition-all border border-white/5">
                        <div className="flex flex-col gap-1">
                            <h4 className="text-amber-400/70 uppercase text-xs font-semibold tracking-widest">Community Stats</h4>
                            <div className="flex items-center gap-2 text-3xl font-bold text-white">
                                Growing Strong
                                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex gap-12 mt-6 md:mt-0">
                            <div className="text-center">
                                <div className="text-4xl font-black text-premium-gold">1.2k+</div>
                                <div className="text-xs text-gray-400/70 uppercase mt-1 tracking-wider">Trips Planned</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-black text-premium-gold">15k+</div>
                                <div className="text-xs text-gray-400/70 uppercase mt-1 tracking-wider">Happy Travelers</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-black text-premium-gold">₹2Cr+</div>
                                <div className="text-xs text-gray-400/70 uppercase mt-1 tracking-wider">Expenses Split</div>
                            </div>
                        </div>
                    </div>

                    {/* Shared Gallery - Premium Full Width */}
                    <div className="md:col-span-3 h-[400px] premium-card rounded-2xl p-8 relative overflow-hidden group hover:border-amber-500/20 transition-all duration-500 border border-white/5">
                        <Link href="/gallery" className="absolute inset-0 z-20" />
                        <div className="relative z-10 h-full flex flex-col justify-end">
                            <span className="text-amber-400/60 text-xs font-semibold tracking-widest uppercase mb-2">Shared Gallery</span>
                            <h3 className="text-3xl font-bold text-white mb-2">Shared Gallery</h3>
                            <p className="text-lg text-gray-300/80 max-w-lg font-light">
                                Relive the best moments. High-res photos, collected automatically from everyone in the group.
                            </p>
                        </div>
                        <div className="absolute inset-0 z-0 opacity-30 group-hover:opacity-50 transition-opacity duration-700">
                            <Image src="/images/home/gallery_cover.png" alt="Gallery" fill className="object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#030308] via-[#030308]/70 to-transparent" />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
