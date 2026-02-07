'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function CallToAction() {
    return (
        <>
            {/* Immersive Parallax Call to Action */}
            <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/home/footer_bg.png"
                        alt="Adventure awaits"
                        fill
                        className="object-cover brightness-50"
                    />
                </div>
                <div className="relative z-10 text-center px-4 max-w-4xl">
                    <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter drop-shadow-2xl">
                        YOUR TRIBE IS<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">WAITING</span>
                    </h2>
                    <p className="text-2xl text-white/90 font-light mb-12">
                        Life is short. The world is wide. Stop waiting for your friends to agree on a date.
                    </p>
                    <Link
                        href="/trips/create"
                        className="inline-block bg-white text-black text-lg font-bold px-10 py-5 rounded-full hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-2xl"
                    >
                        Start a Trip Now
                    </Link>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-24 bg-black text-center border-t border-white/10">
                <div className="max-w-2xl mx-auto px-4">
                    <span className="inline-block py-1 px-4 rounded-full bg-green-500/20 border border-green-500/30 text-sm font-bold text-green-400 mb-4">
                        ✨ Start with 30 Days Free
                    </span>
                    <h3 className="text-3xl font-bold text-white mb-4">Ready to make memories?</h3>
                    <p className="text-gray-400 mb-8">Join 10,000+ travelers. No credit card required to start.</p>
                    <div className="flex justify-center gap-4 mb-4">
                        <Link href="/search" className="btn-outline border-white/30 text-white hover:bg-white hover:text-black hover:border-white">
                            Browse Trips
                        </Link>
                        <Link href="/auth/signup" className="btn-primary">
                            Start Free Trial →
                        </Link>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Quick login? <Link href="/auth/phone-login" className="text-primary-400 hover:text-primary-300">Login with Phone →</Link>
                    </p>
                </div>
            </section>
        </>
    );
}
