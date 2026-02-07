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
        <div className="md:hidden bg-white dark:bg-gray-900 shadow-xl border-t border-gray-200 dark:border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
                {navLinks.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={onClose}
                    >
                        {link.name}
                    </Link>
                ))}

                {isAuthenticated ? (
                    <>
                        <Link
                            href="/friends"
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                            href={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={onClose}
                        >
                            {user?.role === 'admin' ? 'Admin Dashboard' : 'My Profile'}
                        </Link>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                        >
                            Sign out
                        </button>
                    </>
                ) : (
                    <div className="mt-4 space-y-2 px-3">
                        <Link
                            href="/auth/signin"
                            className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                            onClick={onClose}
                        >
                            Log in
                        </Link>
                        <Link
                            href="/auth/signup"
                            className="block w-full text-center px-4 py-2 border border-transparent rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700"
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
