'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { messageAPI } from '@/lib/api';
import {
    Home,
    MessageCircle,
    Users,
    Globe,
    Settings,
    ChevronLeft,
    Compass
} from 'lucide-react';

interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    badge?: number;
}

interface NavRailProps {
    unreadDMs?: number;
    unreadSquads?: number;
}

export default function NavRail({ unreadDMs: propUnreadDMs = 0, unreadSquads = 0 }: NavRailProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [unreadDMs, setUnreadDMs] = useState(propUnreadDMs);

    useEffect(() => {
        const fetchUnread = async () => {
            if (!session) return;
            try {
                const response = await messageAPI.getUnreadCount();
                if (response && typeof response.unreadCount === 'number') {
                    setUnreadDMs(response.unreadCount);
                }
            } catch (error) {
                console.error('Failed to fetch unread count:', error);
            }
        };

        if (session) {
            fetchUnread();
            const interval = setInterval(fetchUnread, 30000);
            return () => clearInterval(interval);
        }
    }, [session]);

    const navItems: NavItem[] = [
        { icon: <MessageCircle size={24} />, label: 'DMs', href: '/app', badge: unreadDMs },
        { icon: <Users size={24} />, label: 'Squads', href: '/app/squads', badge: unreadSquads },
        { icon: <Globe size={24} />, label: 'Communities', href: '/app/communities' },
        { icon: <Settings size={24} />, label: 'Settings', href: '/app/settings' },
    ];

    const isActive = (href: string) => {
        if (href === '/app') return pathname === '/app';
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Desktop Sidebar - WIDER w-20 */}
            <nav className="hidden md:flex flex-col w-20 h-full bg-black/30 backdrop-blur-2xl border-r border-white/10">
                {/* Logo / Home Exit */}
                <Link
                    href="/"
                    className="group flex flex-col items-center justify-center gap-1 py-5 border-b border-white/5 transition-colors hover:bg-white/5"
                >
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: -10 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:text-teal-300"
                    >
                        <ChevronLeft size={20} />
                    </motion.div>
                    <span className="text-[10px] font-medium text-gray-400 group-hover:text-white transition-colors">Home</span>
                </Link>

                {/* Nav Items */}
                <div className="flex-1 flex flex-col items-center gap-1 py-4 px-2">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link key={item.href} href={item.href} className="w-full">
                                <motion.div
                                    className={`
                                        relative flex flex-col items-center justify-center gap-1 py-3 rounded-xl cursor-pointer transition-all duration-200
                                        ${active
                                            ? 'bg-gradient-to-br from-teal-500/20 to-emerald-500/10 text-teal-400 shadow-lg shadow-teal-500/10'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }
                                    `}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {/* Active Pill Indicator */}
                                    <AnimatePresence>
                                        {active && (
                                            <motion.div
                                                layoutId="navPill"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-teal-400 to-emerald-500 rounded-r-full"
                                                initial={{ opacity: 0, scaleY: 0 }}
                                                animate={{ opacity: 1, scaleY: 1 }}
                                                exit={{ opacity: 0, scaleY: 0 }}
                                                transition={{ duration: 0.2 }}
                                            />
                                        )}
                                    </AnimatePresence>

                                    {/* Icon with Badge */}
                                    <div className="relative">
                                        {item.icon}
                                        {item.badge && item.badge > 0 && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-lg shadow-rose-500/30"
                                            >
                                                {item.badge > 99 ? '99+' : item.badge}
                                            </motion.span>
                                        )}
                                    </div>

                                    {/* Label */}
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom Decoration */}
                <div className="p-3 border-t border-white/5">
                    <div className="w-full h-10 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 flex items-center justify-center">
                        <Compass size={18} className="text-orange-400 animate-pulse" />
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-2xl border-t border-white/10 flex items-center z-50">
                {/* Home */}
                <Link href="/" className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-gray-400 hover:text-white">
                    <Home size={22} />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                {navItems.slice(0, 3).map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${active ? 'text-teal-400' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <div className="relative">
                                {item.icon}
                                {item.badge && item.badge > 0 && (
                                    <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
