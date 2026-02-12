'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Menu, X, Zap } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { socketManager } from '@/lib/socketManager';
import { notificationAPI } from '@/lib/api';
import NotificationDropdown from '@/components/navbar/NotificationDropdown';
import { signOut } from 'next-auth/react';
import { Users, LogOut, LayoutDashboard, ChevronDown, Compass, Globe } from 'lucide-react';

export default function Header() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);


    const [menuOpen, setMenuOpen] = useState(false);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Socket & Notifications Logic
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.accessToken) {
            // Initial fetch
            notificationAPI.getUnreadCount().then(res => {
                if (res.success) setUnreadNotifCount(res.count);
            }).catch(console.error);

            const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            socketManager.connect(socketUrl, session.user.accessToken);

            const handleNewNotification = (data: any) => {
                setUnreadNotifCount(prev => prev + 1);
                setNotifications(prev => [data, ...prev]);
            };

            socketManager.on('new_notification', handleNewNotification);

            return () => {
                socketManager.off('new_notification', handleNewNotification);
            };
        }
    }, [status, session?.user?.accessToken]);

    const handleNotificationClick = async () => {
        setNotificationsOpen(!notificationsOpen);
        if (!notificationsOpen) {
            try {
                const response = await notificationAPI.getAll(1, 10);
                if (response.success) {
                    setNotifications(response.notifications);
                    // Do not auto-mark read on open, let user click the button or mark individually if preferred, 
                    // OR keep existing behavior but fix the button. 
                    // User asked to fix the button, so I will separate the logic.
                }
            } catch (error) {
                console.error('Failed to load notifications:', error);
            }
        }
    };

    const handleMarkAllRead = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault(); // Prevent any default button behavior

        // Optimistic update
        const previousCount = unreadNotifCount;
        setUnreadNotifCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true }))); // Set both to be safe

        try {
            console.log('Marking all notifications as read...');
            const response = await notificationAPI.markAllRead();

            if (!response.success) {
                console.error('Failed to mark all read (API response false):', response);
                // Revert on failure
                setUnreadNotifCount(previousCount);
                // Refresh to be safe
                const listRes = await notificationAPI.getAll(1, 10);
                if (listRes.success) setNotifications(listRes.notifications);
            } else {
                console.log('Successfully marked all read');
            }
        } catch (error) {
            console.error('Exception marking all read:', error);
            // Revert on error
            setUnreadNotifCount(previousCount);
        }
    };

    // Hide Header on Chat App
    if (pathname?.startsWith('/app')) return null;

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? 'py-4' : 'py-6'
                } pointer-events-none`}
        >
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-start">

                {/* 1. Animated Brand Icon & System Menu (Left) */}
                <div className="relative pointer-events-auto z-50">
                    <motion.button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="group relative flex items-center gap-3 focus:outline-none"
                    >
                        <motion.div
                            className="w-12 h-12 rounded-2xl bg-zinc-900/50 backdrop-blur-xl border border-white/10 flex items-center justify-center overflow-hidden relative shadow-2xl transition-all group-hover:border-white/20"
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {/* Inner animated gradient */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* New Icon Logo (Globe) */}
                            <div className="relative z-10 text-white group-hover:text-cyan-400 transition-colors">
                                <Globe size={24} strokeWidth={1.5} />
                            </div>
                        </motion.div>

                        {/* Label with Dropdown Indicator */}
                        <div className="hidden sm:flex flex-col items-start text-left">
                            <span className="text-white font-bold text-sm tracking-wide flex items-center gap-1.5">
                                TripSang
                                <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} />
                            </span>
                            <span className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Menu</span>
                        </div>
                    </motion.button>

                    {/* System Menu Dropdown */}
                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, x: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, x: -10, scale: 0.95 }}
                                className="absolute left-0 top-16 w-56 origin-top-left bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/5"
                            >
                                <div className="p-1.5 flex flex-col gap-0.5">
                                    <Link
                                        href="/search"
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-all font-medium group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                                            <Compass size={14} />
                                        </div>
                                        Explore
                                    </Link>

                                    {status === 'authenticated' && !pathname?.startsWith('/auth') ? (
                                        <>
                                            <Link
                                                href="/friends"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-all font-medium group"
                                            >
                                                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                                                    <Users size={14} />
                                                </div>
                                                Friends
                                            </Link>

                                            {session?.user?.role === 'admin' && (
                                                <Link
                                                    href="/admin/dashboard"
                                                    onClick={() => setMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-all font-medium group"
                                                >
                                                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                                                        <LayoutDashboard size={14} />
                                                    </div>
                                                    Admin Dashboard
                                                </Link>
                                            )}

                                            <div className="h-px bg-white/5 my-1" />
                                            <button
                                                onClick={() => signOut({ callbackUrl: '/' })}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all font-medium w-full text-left group"
                                            >
                                                <div className="p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                                                    <LogOut size={14} />
                                                </div>
                                                Sign Out
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-px bg-white/5 my-1" />
                                            <Link
                                                href="/auth/signin"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all font-medium group"
                                            >
                                                <div className="p-1.5 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                                                    <LogOut size={14} className="rotate-180" />
                                                </div>
                                                Sign In
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 2. Top Right Icons (Notifications, Search) */}
                <div className="flex items-center gap-3 pointer-events-auto">



                    {status === 'authenticated' && (
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleNotificationClick}
                                className={`w-10 h-10 rounded-full backdrop-blur-md border border-white/5 flex items-center justify-center transition-all ${notificationsOpen ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-zinc-900/30 text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                    }`}
                            >
                                <Bell className="w-4 h-4" />
                                {unreadNotifCount > 0 && (
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
                                )}
                            </motion.button>

                            {/* Dropdown */}
                            <AnimatePresence>
                                {notificationsOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-14 w-80 z-50 origin-top-right bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                                    >
                                        <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                                            <h3 className="font-semibold text-white text-sm">Notifications</h3>
                                            {unreadNotifCount > 0 && (
                                                <button onClick={handleMarkAllRead} className="text-[10px] text-cyan-400 hover:text-cyan-300 tracking-wide uppercase font-bold">
                                                    Mark read
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-zinc-500 text-sm">
                                                    No notifications
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    {notifications.map((notif: any) => (
                                                        <Link
                                                            key={notif._id}
                                                            href={notif.link || '#'}
                                                            onClick={() => setNotificationsOpen(false)}
                                                            className={`px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 relative group flex gap-3 ${(notif.isRead || notif.read) ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${(notif.isRead || notif.read) ? 'bg-zinc-800 text-zinc-500' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                                                <Bell className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div>
                                                                <p className={`text-sm leading-snug transition-colors ${(notif.isRead || notif.read) ? 'text-zinc-500' : 'text-zinc-200 group-hover:text-white'}`}>
                                                                    {notif.message}
                                                                </p>
                                                                <p className="text-[10px] text-zinc-600 mt-1">
                                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div >
                    )
                    }


                </div >

            </div >
        </header >
    );
}
