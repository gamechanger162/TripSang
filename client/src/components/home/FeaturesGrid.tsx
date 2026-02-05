'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function FeaturesGrid() {
    const [stats, setStats] = useState({ trips: 0, travelers: 0 });

    // Simulate counting up stats
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                trips: prev.trips < 1200 ? prev.trips + 11 : 1243,
                travelers: prev.travelers < 5000 ? prev.travelers + 45 : 5892
            }));
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-24 relative bg-dark-900 z-20">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="mb-16 md:flex items-end justify-between">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                            Why <span className="inline-block relative top-4"><Image src="/logo-text.png" alt="Tripसंग" width={140} height={47} className="object-contain" /></span><br />
                            is Different.
                        </h2>
                        <p className="text-gray-400 max-w-md text-lg">
                            We built the platform we wished we had. No more messy group chats or awkward money talks.
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <div className="flex gap-8">
                            <div>
                                <div className="text-3xl font-bold text-white">{stats.trips.toLocaleString()}+</div>
                                <div className="text-sm text-gray-500 uppercase tracking-widest">Trips Created</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white">{stats.travelers.toLocaleString()}+</div>
                                <div className="text-sm text-gray-500 uppercase tracking-widest">Travelers</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Integrated Chat & Map - Large Block */}
                    <div className="md:col-span-2 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm rounded-3xl p-8 border border-white/10 relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-500 min-h-[400px]">
                        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/30 rounded-full blur-3xl group-hover:bg-indigo-600/50 transition-all duration-500" />
                        <div className="relative z-10">
                            <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/20">
                                NEW: LIVE MAPS 📍
                            </span>
                            <h3 className="text-3xl font-bold text-white mb-4">Plan & Track Together</h3>
                            <p className="text-indigo-200 mb-8 max-w-sm">
                                Real-time chat meets collaborative maps. Drop pins, plan routes, and see where your squad is—all in one place.
                            </p>
                        </div>

                        {/* Mock UI for Chat/Map */}
                        <div className="relative z-10 bg-black/40 rounded-xl p-4 max-w-md border border-white/5 backdrop-blur-md transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500 hover:shadow-2xl">
                            <div className="absolute top-4 right-4 text-green-400 animate-pulse">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" /></svg>
                            </div>
                            <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center p-1">
                                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 01-1.447-.894L15 7m0 13V7" /></svg>
                                </div>
                                <div className="text-sm">
                                    <div className="text-white font-bold">Trip Map</div>
                                    <div className="text-gray-400 text-xs">Akshay added "Cafe 1947"</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 justify-end">
                                <div className="bg-primary-600 rounded-2xl rounded-tr-sm p-3 text-sm text-white shadow-lg">
                                    Map updated! Meet there at 5? 🗺️
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-400 to-purple-500 border border-white/20"></div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Trip Gallery */}
                    <div className="space-y-6">
                        <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-8 border border-white/10 relative overflow-hidden group hover:bg-gray-900/80 transition-all duration-300 h-full flex flex-col justify-center">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-0"></div>
                            <Image
                                src="/images/home/gallery_cover.png"
                                fill
                                alt="Gallery"
                                className="object-cover absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 scale-100 group-hover:scale-105"
                            />
                            <div className="relative z-10 mt-auto">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 text-white border border-white/30">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">Trip Moments</h3>
                                <p className="text-gray-300 text-sm mb-4">
                                    Share your travel memories with the community gallery.
                                </p>
                                <Link href="/gallery" className="text-primary-400 text-sm font-bold hover:text-primary-300 flex items-center gap-1">
                                    View Gallery <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
