'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface MobileMenuProps {
    isOpen: boolean;
    navLinks: { name: string; href: string }[];
    onClose: () => void;
    isAuthenticated: boolean;
    user?: {
        name?: string | null;
        role?: string;
    } | null;
    unreadCount: number;
    pendingFriendsCount: number;
}

export default function MobileMenu({
    isOpen,
    navLinks,
    onClose,
    isAuthenticated,
    user,
    unreadCount,
    pendingFriendsCount
}: MobileMenuProps) {
    if (!isOpen) return null;

    return (
        <div className="md:hidden bg-[#001428]/95 backdrop-blur-xl border-t border-cyan-500/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="px-2 pt-2 pb-3 space-y-1">
                {navLinks.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className="block px-3 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all active:scale-[0.98] border border-transparent hover:border-white/10"
                        onClick={onClose}
                    >
                        {link.name}
                    </Link>
                ))}

                {isAuthenticated ? (
                    <>
                        <Link
                            href="/friends"
                            className="block px-3 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all active:scale-[0.98] border border-transparent hover:border-white/10"
                            onClick={onClose}
                        >
                            <div className="flex items-center justify-between">
                                <span>Friends</span>
                                {pendingFriendsCount > 0 && (
                                    <span className="bg-cyan-500 text-black text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                                        {pendingFriendsCount > 9 ? '9+' : pendingFriendsCount}
                                    </span>
                                )}
                            </div>
                        </Link>
                        <Link
                            href="/app"
                            className="block px-3 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all active:scale-[0.98] border border-transparent hover:border-white/10"
                            onClick={onClose}
                        >
                            <div className="flex items-center justify-between">
                                <span>Messages</span>
                                {unreadCount > 0 && (
                                    <span className="bg-purple-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </div>
                        </Link>
                        <Link
                            href={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                            className="block px-3 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all active:scale-[0.98] border border-transparent hover:border-white/10"
                            onClick={onClose}
                        >
                            {user?.role === 'admin' ? 'Admin Dashboard' : 'My Profile'}
                        </Link>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="block w-full text-left px-3 py-3 rounded-xl text-base font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 mt-2"
                        >
                            Sign out
                        </button>
                    </>
                ) : (
                    <div className="mt-4 space-y-3 px-1 pb-2">
                        <Link
                            href="/auth/signin"
                            className="block w-full text-center px-4 py-3 border border-cyan-500/30 rounded-xl text-base font-bold text-cyan-400 hover:bg-cyan-500/10 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                            onClick={onClose}
                        >
                            Log in
                        </Link>
                        <Link
                            href="/auth/signup"
                            className="block w-full text-center px-4 py-3 border border-transparent rounded-xl text-base font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                            onClick={onClose}
                        >
                            Sign Up
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
