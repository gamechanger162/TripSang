'use client';

import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';

interface UserDropdownProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    user: {
        name?: string | null;
        image?: string | null;
        role?: string;
    };
    unreadCount: number;
    pendingFriendsCount: number;
}

export default function UserDropdown({
    isOpen,
    onToggle,
    onClose,
    user,
    unreadCount,
    pendingFriendsCount
}: UserDropdownProps) {
    return (
        <div className="relative ml-4" data-profile-dropdown>
            <button
                onClick={onToggle}
                className="flex items-center gap-2 focus:outline-none group"
            >
                <div className="h-9 w-9 rounded-full bg-cyan-900/30 flex items-center justify-center overflow-hidden ring-2 ring-cyan-500/50 group-hover:ring-cyan-400 transition-all shadow-[0_0_10px_rgba(8,145,178,0.3)]">
                    {user?.image ? (
                        <Image
                            src={user.image}
                            alt="Profile"
                            width={36}
                            height={36}
                            className="object-cover h-full w-full"
                        />
                    ) : (
                        <span className="text-cyan-400 font-bold">
                            {user?.name?.[0] || 'U'}
                        </span>
                    )}
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-[#001428]/95 backdrop-blur-xl rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] py-2 border border-cyan-500/20 z-50 overflow-hidden ring-1 ring-white/5">
                    <div className="px-4 py-3 border-b border-white/10 mb-1 bg-white/5">
                        <p className="text-xs text-cyan-400/80 uppercase tracking-wider font-semibold">Signed in as</p>
                        <p className="text-sm font-bold text-white truncate mt-0.5">{user?.name}</p>
                    </div>

                    <div className="py-1">
                        <Link
                            href="/friends"
                            className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
                            onClick={onClose}
                        >
                            <div className="flex items-center justify-between">
                                <span className="group-hover:translate-x-1 transition-transform">Friends</span>
                                {pendingFriendsCount > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center shadow-lg">
                                        {pendingFriendsCount > 9 ? '9+' : pendingFriendsCount}
                                    </span>
                                )}
                            </div>
                        </Link>

                        <Link
                            href="/app"
                            className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
                            onClick={onClose}
                        >
                            <div className="flex items-center justify-between">
                                <span className="group-hover:translate-x-1 transition-transform">Messages</span>
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center shadow-lg">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </div>
                        </Link>

                        <Link
                            href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                            className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
                            onClick={onClose}
                        >
                            <span className="group-hover:translate-x-1 transition-transform block">
                                {user.role === 'admin' ? 'Admin Dashboard' : 'My Profile'}
                            </span>
                        </Link>

                        <Link
                            href="/contact"
                            className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
                            onClick={onClose}
                        >
                            <span className="group-hover:translate-x-1 transition-transform block">Help & Support</span>
                        </Link>
                    </div>

                    <div className="pt-1 mt-1 border-t border-white/10">
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="block w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
