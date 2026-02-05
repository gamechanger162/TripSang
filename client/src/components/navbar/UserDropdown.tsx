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
                className="flex items-center gap-2 focus:outline-none"
            >
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden ring-2 ring-primary-500">
                    {user?.image ? (
                        <Image
                            src={user.image}
                            alt="Profile"
                            width={32}
                            height={32}
                            className="object-cover"
                        />
                    ) : (
                        <span className="text-primary-700 font-bold">
                            {user?.name?.[0] || 'U'}
                        </span>
                    )}
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 border border-gray-100 dark:border-gray-700">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="text-sm font-medium truncate">{user?.name}</p>
                    </div>

                    <Link
                        href="/friends"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={onClose}
                    >
                        <div className="flex items-center justify-between">
                            <span>Friends</span>
                            {pendingFriendsCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                                    {pendingFriendsCount > 9 ? '9+' : pendingFriendsCount}
                                </span>
                            )}
                        </div>
                    </Link>

                    <Link
                        href="/messages"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={onClose}
                    >
                        <div className="flex items-center justify-between">
                            <span>Messages</span>
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>
                    </Link>

                    <Link
                        href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={onClose}
                    >
                        {user.role === 'admin' ? 'Admin Dashboard' : 'My Profile'}
                    </Link>

                    <Link
                        href="/contact"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={onClose}
                    >
                        Help & Support
                    </Link>

                    <button
                        onClick={() => signOut()}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
}
