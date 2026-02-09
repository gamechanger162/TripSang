'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { messageAPI, notificationAPI, friendAPI } from '@/lib/api';
import { io } from 'socket.io-client';

// Sub-components
import NavLinks from '@/components/navbar/NavLinks';
import NotificationDropdown from '@/components/navbar/NotificationDropdown';
import UserDropdown from '@/components/navbar/UserDropdown';
import MobileMenu from '@/components/navbar/MobileMenu';

// Icon buttons for friends/messages links
const IconLink = ({ href, iconPath, count, linkColor, onClick }: {
    href: string;
    iconPath: string;
    count: number;
    linkColor: string;
    onClick?: () => void;
}) => (
    <Link
        href={href}
        className={`p-2 rounded-full hover:bg-white/10 transition-colors ${linkColor} relative`}
        onClick={onClick}
    >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
        {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {count > 9 ? '9+' : count}
            </span>
        )}
    </Link>
);

// Mobile icon variant
const MobileIconLink = ({ href, iconPath, count, menuIconColor, onClick }: {
    href: string;
    iconPath: string;
    count: number;
    menuIconColor: string;
    onClick?: () => void;
}) => (
    <Link
        href={href}
        className={`p-2 rounded-full hover:bg-white/10 transition-colors ${menuIconColor} relative`}
        onClick={onClick}
    >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
        {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                {count > 9 ? '9+' : count}
            </span>
        )}
    </Link>
);

// SVG paths
const ICONS = {
    friends: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    messages: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
};

const NAV_LINKS = [
    { name: 'Explore', href: '/search' },
    { name: 'Moments', href: '/gallery' },
    { name: 'Create Trip', href: '/trips/create' },
];

export default function Navbar() {
    const { data: session, status, update } = useSession();
    const pathname = usePathname();

    // State
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [pendingFriendsCount, setPendingFriendsCount] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);

    const isHomePage = pathname === '/';
    const isAppRoute = pathname?.startsWith('/app');

    // Scroll handler
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch counts
    const fetchUnreadCount = async () => {
        try {
            const response = await messageAPI.getUnreadCount();
            if (response.success) setUnreadCount(response.unreadCount);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const fetchUnreadNotifCount = async () => {
        try {
            const response = await notificationAPI.getUnreadCount();
            if (response.success) setUnreadNotifCount(response.count);
        } catch (error) {
            console.error('Failed to fetch notification count:', error);
        }
    };

    const fetchPendingFriendsCount = async () => {
        try {
            const response = await friendAPI.getPendingRequestsCount();
            if (response.success) setPendingFriendsCount(response.count);
        } catch (error) {
            console.error('Failed to fetch pending friends count:', error);
        }
    };

    // Socket for real-time notifications
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.accessToken) {
            const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const newSocket = io(socketUrl, {
                auth: { token: session.user.accessToken },
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => console.log('🔔 Notification Socket connected'));

            newSocket.on('new_notification', async (data: any) => {
                setUnreadNotifCount(prev => prev + 1);
                setNotifications(prev => [data, ...prev]);

                if (data.type === 'system' && (data.title?.includes('Verification Approved') || data.title?.includes('Verification Rejected'))) {
                    try { await update(); } catch (error) { console.error('Failed to refresh session:', error); }
                }
            });

            return () => { newSocket.disconnect(); };
        }
    }, [status, session?.user?.accessToken, update]);

    // Polling for counts (only on main site, not in chat app)
    useEffect(() => {
        if (status === 'authenticated' && !isAppRoute) {
            fetchUnreadCount();
            fetchUnreadNotifCount();
            fetchPendingFriendsCount();

            const interval = setInterval(() => {
                fetchUnreadCount();
                fetchUnreadNotifCount();
                fetchPendingFriendsCount();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [status, isAppRoute]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-notification-dropdown]')) setNotificationsOpen(false);
            if (!target.closest('[data-profile-dropdown]')) setProfileMenuOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Handle notification click
    const handleNotificationClick = async () => {
        setNotificationsOpen(!notificationsOpen);
        if (!notificationsOpen) {
            try {
                const response = await notificationAPI.getAll(1, 10);
                if (response.success) {
                    setNotifications(response.notifications);
                    setUnreadNotifCount(0);
                    await notificationAPI.markAllRead();
                }
            } catch (error) {
                console.error('Failed to load notifications:', error);
            }
        }
    };

    // Futuristic styling
    const navBackground = scrolled || !isHomePage
        ? 'bg-black/80 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_0_20px_rgba(0,255,255,0.1)]'
        : 'bg-black/30 backdrop-blur-md border-b border-white/5';
    const linkColor = scrolled || !isHomePage
        ? 'text-gray-200 hover:text-cyan-400 transition-colors'
        : 'text-gray-200 hover:text-white';
    const menuIconColor = scrolled || !isHomePage ? 'text-cyan-400' : 'text-white';

    // Hide navbar on /app routes (standalone chat app)
    if (isAppRoute) {
        return null;
    }

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${navBackground}`}>
            {/* Futuristic top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo with glow */}
                    <div className="flex-shrink-0 flex items-center -ml-2">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Image src="/logo-new.png" alt="Tripसंग Logo" width={140} height={45} className="object-contain drop-shadow-[0_0_10px_rgba(0,255,255,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(0,255,255,0.5)] transition-all" />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <NavLinks links={NAV_LINKS} linkColor={linkColor} />

                        {status === 'authenticated' && (
                            <>
                                <NotificationDropdown
                                    isOpen={notificationsOpen}
                                    notifications={notifications}
                                    unreadCount={unreadNotifCount}
                                    linkColor={linkColor}
                                    onToggle={handleNotificationClick}
                                    onClose={() => setNotificationsOpen(false)}
                                />
                                <IconLink href="/friends" iconPath={ICONS.friends} count={pendingFriendsCount} linkColor={linkColor} onClick={() => setNotificationsOpen(false)} />
                                <IconLink href="/app" iconPath={ICONS.messages} count={unreadCount} linkColor={linkColor} onClick={() => setNotificationsOpen(false)} />
                            </>
                        )}

                        {status === 'authenticated' ? (
                            <UserDropdown
                                isOpen={profileMenuOpen}
                                onToggle={() => setProfileMenuOpen(!profileMenuOpen)}
                                onClose={() => setProfileMenuOpen(false)}
                                user={session.user}
                                unreadCount={unreadCount}
                                pendingFriendsCount={pendingFriendsCount}
                            />
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href="/auth/signin" className={`text-sm font-medium ${linkColor}`}>Log in</Link>
                                <Link href="/auth/signup" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-full shadow-lg transition-transform hover:scale-105">Sign Up</Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile header icons + menu button */}
                    <div className="md:hidden flex items-center gap-1">
                        {status === 'authenticated' && (
                            <>
                                <NotificationDropdown
                                    isOpen={notificationsOpen}
                                    notifications={notifications}
                                    unreadCount={unreadNotifCount}
                                    linkColor={menuIconColor}
                                    onToggle={handleNotificationClick}
                                    onClose={() => setNotificationsOpen(false)}
                                    isMobile
                                />
                                <MobileIconLink href="/friends" iconPath={ICONS.friends} count={pendingFriendsCount} menuIconColor={menuIconColor} onClick={() => setNotificationsOpen(false)} />
                                <MobileIconLink href="/app" iconPath={ICONS.messages} count={unreadCount} menuIconColor={menuIconColor} onClick={() => setNotificationsOpen(false)} />
                            </>
                        )}

                        {/* Hamburger */}
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`p-2 rounded-md ${menuIconColor}`}>
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
            <MobileMenu
                isOpen={mobileMenuOpen}
                navLinks={NAV_LINKS}
                onClose={() => setMobileMenuOpen(false)}
                isAuthenticated={status === 'authenticated'}
                user={session?.user}
                unreadCount={unreadCount}
                pendingFriendsCount={pendingFriendsCount}
            />
        </nav>
    );
}
