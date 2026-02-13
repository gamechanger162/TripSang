'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle,
    Users,
    Globe,
    Settings,
    ChevronLeft,
    Compass,
    Home,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEnv } from '@/hooks/useEnv';

interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    badge?: number;
}

interface NavRailProps {
    unreadDMs?: number;
}

export default function NavRail({ unreadDMs: propUnreadDMs = 0 }: NavRailProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { apiUrl } = useEnv();
    const [unreadDMs, setUnreadDMs] = useState(propUnreadDMs);
    const [unreadSquads, setUnreadSquads] = useState(0);

    // Fetch unread counts
    useEffect(() => {
        const fetchUnreadCounts = async () => {
            try {
                const token = session?.user?.accessToken || localStorage.getItem('token');
                if (!token || !apiUrl) return;

                const response = await fetch(`${apiUrl}/api/messages/unread-count`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUnreadDMs(data.unreadCount || 0);
                }
            } catch {
                // Silent fail
            }
        };

        if (session?.user) {
            fetchUnreadCounts();
            const interval = setInterval(fetchUnreadCounts, 30000);
            return () => clearInterval(interval);
        }
    }, [session, apiUrl]);

    const isActive = useCallback((href: string) => {
        if (href === '/app') return pathname === '/app';
        return pathname.startsWith(href);
    }, [pathname]);

    const navItems: NavItem[] = [
        { icon: <MessageCircle size={20} />, label: 'Chats', href: '/app', badge: unreadDMs },
        { icon: <Users size={20} />, label: 'Squads', href: '/app/squads', badge: unreadSquads },
        { icon: <Globe size={20} />, label: 'Communities', href: '/app/communities' },
        { icon: <Compass size={20} />, label: 'Explore', href: '/app/explore' },
        { icon: <Settings size={20} />, label: 'Settings', href: '/app/settings' },
    ];

    // Desktop pill items (exclude settings)
    const desktopPillItems = navItems.slice(0, 4);
    const desktopActiveIndex = desktopPillItems.findIndex(item => isActive(item.href));

    // Mobile bottom bar items: Home + all nav items
    const mobileItems: (NavItem & { badge?: number })[] = [
        { icon: <Home size={20} />, label: 'Home', href: '/' },
        ...navItems,
    ];

    return (
        <>
            {/* ===== Desktop: Slim Sidebar ===== */}
            <nav className="hidden md:flex flex-col w-[72px] h-full bg-transparent relative z-20">
                {/* Logo / Home */}
                <Link
                    href="/"
                    className="group flex flex-col items-center justify-center gap-1 py-5 transition-colors hover:bg-white/[0.03]"
                >
                    <motion.div
                        whileHover={{ scale: 1.08, rotate: -8 }}
                        whileTap={{ scale: 0.92 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/15 to-emerald-500/15 border border-white/[0.06] flex items-center justify-center text-white/40 group-hover:text-white/70 transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </motion.div>
                    <span className="text-[9px] font-medium text-white/30 group-hover:text-white/60 transition-colors tracking-wide">Home</span>
                </Link>

                {/* Floating Segmented Pill */}
                <div className="flex-1 flex flex-col items-center pt-4">
                    <div className="relative flex flex-col items-center gap-0.5 p-1.5 rounded-[22px] bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm">
                        {/* Animated Active Pill Background */}
                        <AnimatePresence>
                            {desktopActiveIndex >= 0 && (
                                <motion.div
                                    className="absolute left-1 w-[calc(100%-8px)] h-[52px] rounded-[18px] bg-gradient-to-br from-cyan-500/[0.1] to-blue-500/[0.06] border border-cyan-500/[0.12]"
                                    initial={false}
                                    animate={{
                                        top: 6 + desktopActiveIndex * 54,
                                    }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 350,
                                        damping: 28,
                                        mass: 0.8,
                                    }}
                                />
                            )}
                        </AnimatePresence>

                        {desktopPillItems.map((item, index) => {
                            const active = isActive(item.href);
                            return (
                                <Link key={item.href} href={item.href} prefetch={false}>
                                    <motion.div
                                        className={`
                                            relative flex flex-col items-center justify-center w-[52px] h-[52px] rounded-[18px] cursor-pointer z-10
                                            ${active ? 'text-white' : 'text-white/35 hover:text-white/60'}
                                        `}
                                        whileHover={{ scale: 1.06 }}
                                        whileTap={{ scale: 0.94 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                    >
                                        <motion.div
                                            className="relative"
                                            animate={{ y: active ? -1 : 0 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        >
                                            {item.icon}
                                            {typeof item.badge === 'number' && item.badge > 0 && (
                                                <motion.span
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                                    className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-lg shadow-rose-500/30"
                                                >
                                                    {item.badge > 99 ? '99+' : item.badge}
                                                </motion.span>
                                            )}
                                        </motion.div>
                                        <motion.span
                                            className="text-[9px] font-medium mt-0.5 tracking-wide"
                                            animate={{
                                                fontWeight: active ? 600 : 500,
                                                opacity: active ? 1 : 0.7,
                                            }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {item.label}
                                        </motion.span>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom: Settings */}
                <div className="flex flex-col items-center gap-3 pb-4">
                    <Link href="/app/settings" prefetch={false}>
                        <motion.div
                            className={`
                                flex flex-col items-center justify-center w-[52px] h-[52px] rounded-[18px] cursor-pointer transition-colors duration-200
                                ${isActive('/app/settings') ? 'text-white bg-white/[0.06]' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03]'}
                            `}
                            whileHover={{ scale: 1.06, rotate: 15 }}
                            whileTap={{ scale: 0.94 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                            <motion.div
                                animate={{
                                    rotate: isActive('/app/settings') ? 90 : 0,
                                }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            >
                                <Settings size={20} />
                            </motion.div>
                            <span className="text-[9px] font-medium mt-0.5 tracking-wide">Settings</span>
                        </motion.div>
                    </Link>
                </div>
            </nav>

            {/* ===== Mobile: Bottom Floating Pill ===== */}
            <nav className="md:hidden fixed bottom-4 left-3 right-3 z-50">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
                    className="relative flex items-center h-[64px] px-1 rounded-[24px] bg-zinc-950/85 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
                >
                    {mobileItems.map((item) => {
                        const active = item.href === '/' ? pathname === '/' : isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={item.href !== '/'}
                                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
                            >
                                {/* Active background pill */}
                                {active && (
                                    <motion.div
                                        layoutId="mobileNavPill"
                                        className="absolute inset-1 rounded-2xl bg-gradient-to-b from-cyan-500/[0.12] to-blue-500/[0.06] border border-cyan-500/[0.1]"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 30,
                                            mass: 0.8,
                                        }}
                                    />
                                )}

                                {/* Icon with transition */}
                                <motion.div
                                    className="relative z-10"
                                    initial={false}
                                    animate={{
                                        y: active ? -2 : 0,
                                        scale: active ? 1.08 : 1,
                                    }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.6 }}
                                >
                                    <div
                                        className={`transition-colors duration-200 ${active ? 'text-cyan-400' : 'text-white/30'}`}
                                    >
                                        {item.icon}
                                    </div>
                                    {typeof item.badge === 'number' && item.badge > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-0.5 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full shadow-sm shadow-rose-500/40"
                                        />
                                    )}
                                </motion.div>

                                {/* Label with transition */}
                                <span
                                    className={`relative z-10 text-[9px] transition-colors duration-200 ${active ? 'text-cyan-400 font-semibold' : 'text-white/30 font-medium'}`}
                                >
                                    {item.label}
                                </span>

                                {/* Active dot indicator */}
                                <AnimatePresence>
                                    {active && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                            className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-cyan-400 z-10"
                                        />
                                    )}
                                </AnimatePresence>
                            </Link>
                        );
                    })}
                </motion.div>
            </nav>
        </>
    );
}
