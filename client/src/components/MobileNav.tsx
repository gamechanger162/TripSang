'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();

    // Active state helper
    const isActive = (path: string) => pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16">
                {/* Home */}
                <Link
                    href="/"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/') ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/') ? 2.5 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                {/* Explore */}
                <Link
                    href="/search"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/search') ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/search') ? 2.5 : 2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-[10px] font-medium">Explore</span>
                </Link>

                {/* Chat */}
                <Link
                    href="/messages"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/messages') ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/messages') ? 2.5 : 2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-[10px] font-medium">Chat</span>
                </Link>

                {/* Create Trip - Highlighted */}
                <Link
                    href="/trips/create"
                    className="flex flex-col items-center justify-center w-full h-full -mt-5"
                >
                    <div className="w-12 h-12 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-medium mt-1 text-gray-500 dark:text-gray-400">Create</span>
                </Link>

                {/* Gallery */}
                <Link
                    href="/gallery"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/gallery') ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/gallery') ? 2.5 : 2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] font-medium">Moments</span>
                </Link>

                {/* My Plan */}
                <Link
                    href="/my-plan"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/my-plan') ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/my-plan') ? 2.5 : 2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] font-medium">My Plan</span>
                </Link>

                {/* Profile/Login */}
                <Link
                    href={session ? '/dashboard' : '/auth/signin'}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/dashboard') ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    {session?.user?.image ? (
                        <img
                            src={session.user.image}
                            alt="Profile"
                            className={`w-6 h-6 rounded-full object-cover border-2 ${isActive('/dashboard') ? 'border-primary-600' : 'border-transparent'}`}
                        />
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/dashboard') ? 2.5 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    )}
                    <span className="text-[10px] font-medium">Profile</span>
                </Link>
            </div>
        </div>
    );
}
