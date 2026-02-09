'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const Footer = () => {
    const pathname = usePathname();

    // Hide footer on /app routes (standalone chat app)
    if (pathname?.startsWith('/app')) {
        return null;
    }

    return (
        <footer className="relative bg-black border-t border-cyan-500/20 pt-16 pb-8 overflow-hidden">
            {/* Futuristic background effects */}
            <div className="absolute inset-0 z-0">
                {/* Cyber grid */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }} />
                {/* Glow spots */}
                <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1 -ml-2">
                        <Link href="/" className="inline-block mb-4 group">
                            <div className="relative w-32 h-10">
                                <Image
                                    src="/logo-text.png"
                                    alt="TripSang"
                                    fill
                                    className="object-contain object-left drop-shadow-[0_0_10px_rgba(0,255,255,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(0,255,255,0.5)] transition-all"
                                />
                            </div>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6 pl-2">
                            Connect with travelers, find your squad, and experience the world together.
                        </p>
                        <div className="pl-2">
                            <span className="text-xs text-cyan-500/70 block">Tripsang comes under</span>
                            <span className="text-sm font-semibold text-cyan-400">Nandan Enterprises</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="col-span-1">
                        <h4 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
                            Discover
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/search" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2 group"><span className="w-1 h-1 bg-cyan-500/50 rounded-full group-hover:bg-cyan-400 transition-colors" />Find a Trip</Link></li>
                            <li><Link href="/trips/create" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2 group"><span className="w-1 h-1 bg-cyan-500/50 rounded-full group-hover:bg-cyan-400 transition-colors" />Create Trip</Link></li>
                            <li><Link href="/gallery" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2 group"><span className="w-1 h-1 bg-cyan-500/50 rounded-full group-hover:bg-cyan-400 transition-colors" />Moments</Link></li>
                        </ul>
                    </div>

                    {/* Legal & Safety */}
                    <div className="col-span-1">
                        <h4 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
                            Legal & Support
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/legal/about" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2 group"><span className="w-1 h-1 bg-cyan-500/50 rounded-full group-hover:bg-cyan-400 transition-colors" />About Us</Link></li>
                            <li><Link href="/legal/terms" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2 group"><span className="w-1 h-1 bg-cyan-500/50 rounded-full group-hover:bg-cyan-400 transition-colors" />Terms of Service</Link></li>
                            <li><Link href="/legal/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2 group"><span className="w-1 h-1 bg-cyan-500/50 rounded-full group-hover:bg-cyan-400 transition-colors" />Privacy Policy</Link></li>
                            <li><Link href="/legal/community-guidelines" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2 group"><span className="w-1 h-1 bg-cyan-500/50 rounded-full group-hover:bg-cyan-400 transition-colors" />Community Guidelines</Link></li>
                            <li><Link href="/legal/safety-tips" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2 group"><span className="w-1 h-1 bg-cyan-500/50 rounded-full group-hover:bg-cyan-400 transition-colors" />Safety Tips</Link></li>
                        </ul>
                    </div>

                    {/* Social/Contact */}
                    <div className="col-span-1">
                        <h4 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
                            Connect
                        </h4>
                        <div className="flex gap-4 mb-6">
                            {/* Social Icons with glow */}
                            <a href="#" className="w-10 h-10 rounded-lg bg-black/50 border border-cyan-500/30 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-lg bg-black/50 border border-cyan-500/30 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                            </a>
                        </div>
                        <div className="text-xs text-cyan-500/50 border border-cyan-500/20 rounded-lg px-3 py-2 bg-black/30">
                            © {new Date().getFullYear()} TripSang. All rights reserved.
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

