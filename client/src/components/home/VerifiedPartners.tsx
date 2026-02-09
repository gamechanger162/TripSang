'use client';

import Link from 'next/link';

export default function VerifiedPartners() {
    return (
        <section className="py-20 bg-[#0a0a0a] border-y border-white/5 relative overflow-hidden z-20">
            {/* Premium Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/3 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="md:w-1/2">
                        <span className="premium-badge mb-6">Verified & Trusted</span>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                            Travel with Real People.<br />
                            <span className="text-premium-gold">Not Bots.</span>
                        </h2>
                        <p className="text-gray-300/80 text-lg mb-8 leading-relaxed max-w-xl font-light">
                            Your safety is non-negotiable. We verify identities using <strong className="text-amber-400/90">Government ID (Aadhaar or PAN)</strong> so you can focus on the adventure, not the anxiety.
                        </p>

                        <div className="flex flex-col gap-4 mb-8">
                            {[
                                'Government ID verification (Aadhaar/PAN)',
                                'Verified traveler reviews & ratings',
                                'Safe & secure travel community'
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </div>
                                    <span className="text-gray-300/80 font-light">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <Link href="/verify/id" className="btn-luxury inline-flex items-center gap-2">
                            Get Verified Now
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                    </div>

                    <div className="md:w-1/2 relative">
                        {/* Premium Visual */}
                        <div className="relative w-full aspect-square md:aspect-video premium-card rounded-2xl border border-white/5 p-6 flex items-center justify-center group overflow-hidden">
                            <div className="absolute inset-0 bg-grid-pattern opacity-30" />

                            {/* Floating Badge with gold glow */}
                            <div className="relative z-10 w-48 h-48 bg-gradient-to-br from-amber-500/15 to-orange-500/10 rounded-full flex items-center justify-center animate-elegant-float border border-amber-500/20">
                                <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl" />
                                <svg className="w-24 h-24 text-amber-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>

                            {/* Decorative circles */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-amber-500/10 rounded-full" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-amber-500/5 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
