'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function MomentsShowcase() {
    return (
        <section className="py-20 md:py-24 bg-black relative overflow-hidden z-0 mt-12 md:mt-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="md:w-1/2 relative">
                        <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-500 to-pink-500 mb-6 leading-tight">
                            CAPTURE.<br />SHARE.<br />INSPIRE.
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-md">
                            Your trip doesn't end when you return home. Post your favorite shots to the <strong>Trip Moments</strong> gallery and inspire the next wave of travelers.
                        </p>
                        <Link
                            href="/gallery"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Visit Gallery
                        </Link>
                    </div>

                    <div className="md:w-1/2 relative">
                        {/* Floating Cards Effect */}
                        <div className="relative w-full aspect-square md:aspect-[4/3]">
                            <div className="absolute top-0 right-0 w-2/3 h-5/6 bg-gray-800 rounded-2xl rotate-6 overflow-hidden border-4 border-white/5 opacity-60 transform translate-x-4">
                                <Image src="/images/home/moment_hike.png" fill alt="Travel 1" className="object-cover" />
                            </div>
                            <div className="absolute top-10 right-12 w-2/3 h-5/6 bg-gray-800 rounded-2xl -rotate-3 overflow-hidden border-4 border-white/10 shadow-2xl z-10">
                                <Image src="/images/home/moment_bali.png" fill alt="Travel 2" className="object-cover" />
                                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                                    @Sarah in Bali 🌴
                                </div>
                            </div>
                            <div className="absolute -bottom-4 -left-4 bg-primary-600/20 w-32 h-32 rounded-full blur-3xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
