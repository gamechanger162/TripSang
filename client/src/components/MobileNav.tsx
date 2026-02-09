'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();

    // Hide mobile nav on /app routes (standalone chat app has its own nav)
    if (pathname?.startsWith('/app')) {
        return null;
    }

    // Active state helper
    const isActive = (path: string) => pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            {/* Futuristic top glow line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl border-t border-cyan-500/20" />

            {/* Scan line effect */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,255,0.03)_2px,rgba(0,255,255,0.03)_4px)] pointer-events-none" />

            <div className="relative flex justify-around items-center h-16 pb-safe">
                {/* Home */}
                <Link
                    href="/"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${isActive('/') ? 'text-cyan-400' : 'text-gray-500'}`}
                >
                    <div className={`relative ${isActive('/') ? 'drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]' : ''}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/') ? 2.5 : 1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <span className={`text-[10px] font-medium tracking-wide ${isActive('/') ? 'text-cyan-400' : ''}`}>Home</span>
                </Link>

                {/* Explore */}
                <Link
                    href="/search"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${isActive('/search') ? 'text-cyan-400' : 'text-gray-500'}`}
                >
                    <div className={`relative ${isActive('/search') ? 'drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]' : ''}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/search') ? 2.5 : 1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <span className={`text-[10px] font-medium tracking-wide ${isActive('/search') ? 'text-cyan-400' : ''}`}>Explore</span>
                </Link>

                {/* Chat */}
                <Link
                    href="/app"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${isActive('/app') ? 'text-cyan-400' : 'text-gray-500'}`}
                >
                    <div className={`relative ${isActive('/app') ? 'drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]' : ''}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/app') ? 2.5 : 1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <span className={`text-[10px] font-medium tracking-wide ${isActive('/app') ? 'text-cyan-400' : ''}`}>Chat</span>
                </Link>

                {/* Create Trip - Futuristic Glowing Button */}
                <Link
                    href="/trips/create"
                    className="flex flex-col items-center justify-center w-full h-full -mt-6"
                >
                    <div className="relative">
                        {/* Outer glow rings */}
                        <div className="absolute -inset-2 bg-cyan-500/20 rounded-full blur-md animate-pulse" />
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/40 to-purple-500/40 rounded-full blur-sm" />
                        {/* Main button */}
                        <div className="relative w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.5)] border border-cyan-400/50 transform active:scale-95 transition-transform">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                    </div>
                    <span className="text-[10px] font-medium mt-2 text-cyan-400 tracking-wide">Create</span>
                </Link>

                {/* Gallery */}
                <Link
                    href="/gallery"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${isActive('/gallery') ? 'text-cyan-400' : 'text-gray-500'}`}
                >
                    <div className={`relative ${isActive('/gallery') ? 'drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]' : ''}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/gallery') ? 2.5 : 1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className={`text-[10px] font-medium tracking-wide ${isActive('/gallery') ? 'text-cyan-400' : ''}`}>Moments</span>
                </Link>

                {/* My Plan */}
                <Link
                    href="/my-plan"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${isActive('/my-plan') ? 'text-cyan-400' : 'text-gray-500'}`}
                >
                    <div className={`relative ${isActive('/my-plan') ? 'drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]' : ''}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/my-plan') ? 2.5 : 1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className={`text-[10px] font-medium tracking-wide ${isActive('/my-plan') ? 'text-cyan-400' : ''}`}>My Plan</span>
                </Link>

                {/* Profile/Login */}
                <Link
                    href={session ? '/dashboard' : '/auth/signin'}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${isActive('/dashboard') ? 'text-cyan-400' : 'text-gray-500'}`}
                >
                    {session?.user?.image ? (
                        <div className={`relative ${isActive('/dashboard') ? 'drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]' : ''}`}>
                            <img
                                src={session.user.image}
                                alt="Profile"
                                className={`w-6 h-6 rounded-full object-cover ring-2 ${isActive('/dashboard') ? 'ring-cyan-400' : 'ring-gray-600'}`}
                            />
                        </div>
                    ) : (
                        <div className={`relative ${isActive('/dashboard') ? 'drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]' : ''}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/dashboard') ? 2.5 : 1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}
                    <span className={`text-[10px] font-medium tracking-wide ${isActive('/dashboard') ? 'text-cyan-400' : ''}`}>Profile</span>
                </Link>
            </div>
        </div>
    );
}
