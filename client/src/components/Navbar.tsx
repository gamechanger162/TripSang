'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { messageAPI, notificationAPI, friendAPI } from '@/lib/api';
import { io } from 'socket.io-client';

export default function Navbar() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [pendingFriendsCount, setPendingFriendsCount] = useState(0);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    // Check if we are on the homepage
    const isHomePage = pathname === '/';

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);



    const fetchUnreadCount = async () => {
        try {
            const response = await messageAPI.getUnreadCount();
            if (response.success) {
                setUnreadCount(response.unreadCount);
            }
        } catch (error) {
            // Silently fail - unread count is not critical
            console.error('Failed to fetch unread count:', error);
        }
    };

    // Determine nav classes based on route and scroll
    const navBackground = scrolled || !isHomePage
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-100 dark:border-gray-800'
        : 'bg-transparent';

    const linkColor = scrolled || !isHomePage
        ? 'text-gray-700 dark:text-gray-200 hover:text-primary-600'
        : 'text-gray-200 hover:text-white';

    const logoClass = scrolled || !isHomePage
        ? 'text-transparent bg-gradient-to-r from-primary-600 to-indigo-600'
        : 'text-white';

    const menuIconColor = scrolled || !isHomePage ? 'text-gray-700 dark:text-gray-200' : 'text-white';

    const navLinks = [
        { name: 'Explore', href: '/search' },
        { name: 'Create Trip', href: '/trips/create' },
    ];

    // Fetch notification unread count
    const fetchUnreadNotifCount = async () => {
        try {
            const response = await notificationAPI.getUnreadCount();
            if (response.success) {
                setUnreadNotifCount(response.count);
            }
        } catch (error) {
            console.error('Failed to fetch notification count:', error);
        }
    };

    // Fetch pending friend requests count
    const fetchPendingFriendsCount = async () => {
        try {
            const response = await friendAPI.getPendingRequestsCount();
            if (response.success) {
                setPendingFriendsCount(response.count);
            }
        } catch (error) {
            console.error('Failed to fetch pending friends count:', error);
        }
    };

    // Real-time Notification listener
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.accessToken) {
            const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const newSocket = io(socketUrl, {
                auth: { token: session.user.accessToken },
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                console.log('🔔 Notification Socket connected');
            });

            newSocket.on('new_notification', (data: any) => {
                console.log('🔔 New Notification received:', data);
                setUnreadNotifCount(prev => prev + 1);
                // Prepend to list if loaded
                setNotifications(prev => [data, ...prev]);
            });

            return () => {
                newSocket.disconnect();
            };
        }
    }, [status, session]);

    // Combine fetches
    useEffect(() => {
        if (status === 'authenticated') {
            fetchUnreadCount(); // Messages
            fetchUnreadNotifCount(); // Notifications
            fetchPendingFriendsCount(); // Friend requests

            // Poll every 30s
            const interval = setInterval(() => {
                fetchUnreadCount();
                fetchUnreadNotifCount();
                fetchPendingFriendsCount();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [status]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Check if click is outside notification dropdown
            if (!target.closest('[data-notification-dropdown]')) {
                setNotificationsOpen(false);
            }
            if (!target.closest('[data-profile-dropdown]')) {
                setProfileMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleNotificationClick = async () => {
        setNotificationsOpen(!notificationsOpen);
        if (!notificationsOpen) {
            // Fetch latest notifications when opening
            try {
                const response = await notificationAPI.getAll(1, 10);
                if (response.success) {
                    setNotifications(response.notifications);
                    // Mark all as read visual clearing
                    setUnreadNotifCount(0);
                    // Ideally call mark-all-read API here or on close
                    await notificationAPI.markAllRead();
                }
            } catch (error) {
                console.error('Failed to load notifications:', error);
            }
        }
    };

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${navBackground}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src="/logo.png"
                                alt="Tripसंग Logo"
                                width={55}
                                height={55}
                                className="object-contain"
                            />
                            <span className={`text-2xl font-bold bg-clip-text ${logoClass}`}>
                                Tripसंग
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`text-sm font-medium transition-colors ${linkColor}`}
                            >
                                {link.name}
                            </Link>
                        ))}




                        {/* Notifications Bell */}
                        {status === 'authenticated' && (
                            <div className="relative" data-notification-dropdown>
                                <button
                                    onClick={handleNotificationClick}
                                    className={`p-2 rounded-full hover:bg-white/10 transition-colors ${linkColor}`}
                                >
                                    <div className="relative">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        {unreadNotifCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-bounce">
                                                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                                            </span>
                                        )}
                                    </div>
                                </button>

                                {/* Dropdown */}
                                {notificationsOpen && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 border border-gray-100 dark:border-gray-700 max-h-96 overflow-y-auto">
                                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                                        </div>
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-gray-500">
                                                No notifications
                                            </div>
                                        ) : (
                                            notifications.map((notif: any) => (
                                                <Link
                                                    key={notif._id}
                                                    href={notif.link || '#'}
                                                    className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                                                >
                                                    <div className="flex gap-3">
                                                        {notif.sender?.profilePicture ? (
                                                            <Image src={notif.sender.profilePicture} alt="" width={32} height={32} className="rounded-full flex-shrink-0 object-cover w-8 h-8" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600 flex-shrink-0">
                                                                {notif.sender?.name?.[0] || '!'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm text-gray-900 dark:text-gray-100 leading-tight mb-1">
                                                                {notif.message}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(notif.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Friends Icon (only if authenticated) */}
                        {status === 'authenticated' && (
                            <Link
                                href="/friends"
                                className={`p-2 rounded-full hover:bg-white/10 transition-colors ${linkColor} relative`}
                                title="Friends"
                                onClick={() => setNotificationsOpen(false)}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {pendingFriendsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                        {pendingFriendsCount > 9 ? '9+' : pendingFriendsCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Messages Icon (only if authenticated) */}
                        {status === 'authenticated' && (
                            <Link
                                href="/messages"
                                className={`p-2 rounded-full hover:bg-white/10 transition-colors ${linkColor} relative`}
                                title="Messages"
                                onClick={() => setNotificationsOpen(false)}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {status === 'authenticated' ? (
                            <div className="relative ml-4" data-profile-dropdown>
                                <button
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="flex items-center gap-2 focus:outline-none"
                                >
                                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden ring-2 ring-primary-500">
                                        {session.user?.image ? (
                                            <Image
                                                src={session.user.image}
                                                alt="Profile"
                                                width={32}
                                                height={32}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span className="text-primary-700 font-bold">
                                                {session.user?.name?.[0] || 'U'}
                                            </span>
                                        )}
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 border border-gray-100 dark:border-gray-700">
                                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                                            <p className="text-xs text-gray-500">Signed in as</p>
                                            <p className="text-sm font-medium truncate">{session.user?.name}</p>
                                        </div>

                                        <Link
                                            href="/friends"
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            onClick={() => setProfileMenuOpen(false)}
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
                                            onClick={() => setProfileMenuOpen(false)}
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
                                            href={session.user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            onClick={() => setProfileMenuOpen(false)}
                                        >
                                            {session.user.role === 'admin' ? 'Admin Dashboard' : 'My Profile'}
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
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/auth/signin"
                                    className={`text-sm font-medium ${linkColor}`}
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-full shadow-lg transition-transform hover:scale-105"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile header icons + menu button */}
                    <div className="md:hidden flex items-center gap-1">
                        {/* Mobile Icons - Only for authenticated users */}
                        {status === 'authenticated' && (
                            <>
                                {/* Notifications Bell - Mobile */}
                                <div className="relative" data-notification-dropdown>
                                    <button
                                        onClick={handleNotificationClick}
                                        className={`p-2 rounded-full hover:bg-white/10 transition-colors ${menuIconColor}`}
                                    >
                                        <div className="relative">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                            </svg>
                                            {unreadNotifCount > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                                                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {/* Mobile Notifications Dropdown - Fixed position for mobile */}
                                    {notificationsOpen && (
                                        <div className="fixed top-16 left-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 border border-gray-100 dark:border-gray-700 max-h-80 overflow-y-auto z-50">
                                            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</h3>
                                            </div>
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-gray-500 text-sm">
                                                    No notifications
                                                </div>
                                            ) : (
                                                notifications.slice(0, 5).map((notif: any) => (
                                                    <Link
                                                        key={notif._id}
                                                        href={notif.link || '#'}
                                                        className="block px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                                                        onClick={() => setNotificationsOpen(false)}
                                                    >
                                                        <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                                                            {notif.message}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {new Date(notif.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Friends Icon - Mobile */}
                                <Link
                                    href="/friends"
                                    className={`p-2 rounded-full hover:bg-white/10 transition-colors ${menuIconColor} relative`}
                                    onClick={() => setNotificationsOpen(false)}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    {pendingFriendsCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                                            {pendingFriendsCount > 9 ? '9+' : pendingFriendsCount}
                                        </span>
                                    )}
                                </Link>

                                {/* Messages Icon - Mobile */}
                                <Link
                                    href="/messages"
                                    className={`p-2 rounded-full hover:bg-white/10 transition-colors ${menuIconColor} relative`}
                                    onClick={() => setNotificationsOpen(false)}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            </>
                        )}

                        {/* Hamburger Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className={`p-2 rounded-md ${menuIconColor}`}
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-gray-900 shadow-xl border-t border-gray-200 dark:border-gray-800">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        {status === 'authenticated' ? (
                            <>
                                <Link
                                    href="/friends"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => setMobileMenuOpen(false)}
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
                                    onClick={() => setMobileMenuOpen(false)}
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
                                    href={session.user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {session.user.role === 'admin' ? 'Admin Dashboard' : 'My Profile'}
                                </Link>
                                <button
                                    onClick={() => signOut()}
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
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="block w-full text-center px-4 py-2 border border-transparent rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
