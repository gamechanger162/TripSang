'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function CallToAction() {
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';

    return (
        <>
            {/* Immersive Premium Call to Action */}
            <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/home/footer_bg.png"
                        alt="Adventure awaits"
                        fill
                        loading="lazy"
                        className="object-cover brightness-[0.35]"
                    />
                    {/* Premium overlay */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/50" />
                </div>
                <div className="relative z-10 text-center px-4 max-w-4xl">
                    <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter">
                        YOUR TRIBE IS<br />
                        <span className="text-premium-gold">WAITING</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-300/80 font-light mb-12">
                        Life is short. The world is wide. Stop waiting for your friends to agree on a date.
                    </p>
                    <Link
                        href={isAuthenticated ? "/trips/create" : "/auth/signup"}
                        className="btn-luxury inline-flex items-center gap-2 text-lg"
                    >
                        {isAuthenticated ? 'Create a Trip' : 'Start a Trip Now'}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </section>

            {/* Footer CTA with premium styling */}
            <section className="py-24 bg-[#0a0a0a] text-center border-t border-white/5 relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 bg-grid-pattern opacity-15" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-2xl mx-auto px-4 relative z-10">
                    {isAuthenticated ? (
                        <>
                            {/* Logged-in user view */}
                            <span className="premium-badge mb-6">Welcome Back</span>
                            <h3 className="text-3xl font-bold text-white mb-4">Ready to <span className="text-premium-gold">explore</span>?</h3>
                            <p className="text-gray-400 mb-8 font-light">Your next adventure is just a click away.</p>
                            <div className="flex justify-center gap-4 mb-6">
                                <Link href="/search" className="btn-luxury-outline">
                                    Browse Trips
                                </Link>
                                <Link href="/trips/create" className="btn-luxury">
                                    Create Trip →
                                </Link>
                            </div>
                            <p className="text-gray-500/60 text-sm font-light">
                                <Link href="/dashboard" className="text-amber-400/70 hover:text-amber-400 transition-colors">View your profile →</Link>
                            </p>
                        </>
                    ) : (
                        <>
                            {/* Guest user view */}
                            <span className="premium-badge mb-6">30 Days Free</span>
                            <h3 className="text-3xl font-bold text-white mb-4">Ready to make <span className="text-premium-gold">memories</span>?</h3>
                            <p className="text-gray-400 mb-8 font-light">Join 10,000+ travelers. No credit card required.</p>
                            <div className="flex justify-center gap-4 mb-6">
                                <Link href="/search" className="btn-luxury-outline">
                                    Browse Trips
                                </Link>
                                <Link href="/auth/signup" className="btn-luxury">
                                    Start Free Trial →
                                </Link>
                            </div>
                            <p className="text-gray-500/60 text-sm font-light">
                                Quick login? <Link href="/auth/phone-login" className="text-amber-400/70 hover:text-amber-400 transition-colors">Login with Phone →</Link>
                            </p>
                        </>
                    )}
                </div>
            </section>
        </>
    );
}
