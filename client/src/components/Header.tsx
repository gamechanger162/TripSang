'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { Bell, Search, Menu, X, Zap } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { socketManager } from '@/lib/socketManager';
import { notificationAPI } from '@/lib/api';
import NotificationDropdown from '@/components/navbar/NotificationDropdown';
import { signOut } from 'next-auth/react';
import { Users, LogOut, LayoutDashboard, ChevronDown, Compass, Globe, GripVertical } from 'lucide-react';

const STORAGE_KEY = 'tripsang_fab_position';
const BUTTON_SIZE = 52; // px
const EDGE_PADDING = 12; // px from screen edge
const DRAG_THRESHOLD = 8; // px movement before considering it a drag

function getInitialPosition(): { x: number; y: number } {
    if (typeof window === 'undefined') return { x: EDGE_PADDING, y: 120 };
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Validate saved position is still within viewport
            const maxX = window.innerWidth - BUTTON_SIZE - EDGE_PADDING;
            const maxY = window.innerHeight - BUTTON_SIZE - EDGE_PADDING;
            return {
                x: Math.max(EDGE_PADDING, Math.min(parsed.x, maxX)),
                y: Math.max(EDGE_PADDING, Math.min(parsed.y, maxY)),
            };
        }
    } catch { }
    return { x: EDGE_PADDING, y: 120 };
}

function snapToEdge(x: number, y: number): { x: number; y: number } {
    if (typeof window === 'undefined') return { x, y };
    const midX = window.innerWidth / 2;
    const maxX = window.innerWidth - BUTTON_SIZE - EDGE_PADDING;
    const maxY = window.innerHeight - BUTTON_SIZE - EDGE_PADDING;

    return {
        x: x < midX ? EDGE_PADDING : maxX,
        y: Math.max(EDGE_PADDING, Math.min(y, maxY)),
    };
}

export default function Header() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);

    // Draggable FAB state
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: EDGE_PADDING, y: 120 });
    const [isDragging, setIsDragging] = useState(false);
    const [isIdle, setIsIdle] = useState(false); // semi-transparent when idle
    const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const wasDraggedRef = useRef(false);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pointerDownPos = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
    const fabRef = useRef<HTMLDivElement>(null);

    // Initialize position from localStorage on mount
    useEffect(() => {
        setPosition(getInitialPosition());
    }, []);

    // Idle timer — fade to semi-transparent after 4 seconds of no interaction
    const resetIdleTimer = useCallback(() => {
        setIsIdle(false);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            if (!menuOpen) setIsIdle(true);
        }, 4000);
    }, [menuOpen]);

    useEffect(() => {
        resetIdleTimer();
        return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
    }, [resetIdleTimer]);

    // Close menu when clicking anywhere outside the FAB
    useEffect(() => {
        if (!menuOpen) return;
        const handleOutsideClick = (e: MouseEvent) => {
            if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
                setNotificationsOpen(false);
            }
        };
        // Use mousedown so it fires before drag starts, with a small delay to not catch the opening tap
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleOutsideClick, true);
        }, 50);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleOutsideClick, true);
        };
    }, [menuOpen]);

    // Socket & Notifications Logic
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.accessToken) {
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
            return () => { socketManager.off('new_notification', handleNewNotification); };
        }
    }, [status, session?.user?.accessToken]);

    const handleNotificationClick = async () => {
        setNotificationsOpen(!notificationsOpen);
        if (!notificationsOpen) {
            try {
                const response = await notificationAPI.getAll(1, 10);
                if (response.success) {
                    setNotifications(response.notifications);
                }
            } catch (error) {
                console.error('Failed to load notifications:', error);
            }
        }
    };

    const handleMarkAllRead = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const previousCount = unreadNotifCount;
        setUnreadNotifCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));

        try {
            const response = await notificationAPI.markAllRead();
            if (!response.success) {
                setUnreadNotifCount(previousCount);
                const listRes = await notificationAPI.getAll(1, 10);
                if (listRes.success) setNotifications(listRes.notifications);
            }
        } catch (error) {
            console.error('Exception marking all read:', error);
            setUnreadNotifCount(previousCount);
        }
    };

    // --- Drag handlers ---
    const handleDragStart = () => {
        dragStartRef.current = { ...position };
        wasDraggedRef.current = false;
        setIsDragging(true);
        resetIdleTimer();
    };

    const handleDrag = (_: any, info: PanInfo) => {
        const dx = Math.abs(info.offset.x);
        const dy = Math.abs(info.offset.y);
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
            wasDraggedRef.current = true;
        }
    };

    const handleDragEnd = (_: any, info: PanInfo) => {
        setIsDragging(false);
        const rawX = dragStartRef.current.x + info.offset.x;
        const rawY = dragStartRef.current.y + info.offset.y;
        const snapped = snapToEdge(rawX, rawY);
        setPosition(snapped);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapped)); } catch { }
        resetIdleTimer();
    };

    // Use pointer events for tap detection since onClick gets swallowed by drag
    const handlePointerDown = (e: React.PointerEvent) => {
        pointerDownPos.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        const dx = Math.abs(e.clientX - pointerDownPos.current.x);
        const dy = Math.abs(e.clientY - pointerDownPos.current.y);
        const dt = Date.now() - pointerDownPos.current.time;
        // Only treat as tap if moved less than threshold and was quick (< 300ms)
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD && dt < 300) {
            setMenuOpen(prev => !prev);
            setNotificationsOpen(false);
            resetIdleTimer();
        }
    };

    // Determine dropdown position based on button quadrant
    const isOnRight = position.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 500);
    const isOnBottom = position.y > (typeof window !== 'undefined' ? window.innerHeight / 2 : 400);

    // Hide Header on Chat App
    if (pathname?.startsWith('/app')) return null;

    return (
        <>
            {/* Floating Draggable Globe Button (AssistiveTouch style) */}
            <motion.div
                ref={fabRef}
                data-fab-menu
                drag
                dragMomentum={false}
                dragElastic={0}
                dragConstraints={{
                    top: EDGE_PADDING,
                    left: EDGE_PADDING,
                    right: typeof window !== 'undefined' ? window.innerWidth - BUTTON_SIZE - EDGE_PADDING : 800,
                    bottom: typeof window !== 'undefined' ? window.innerHeight - BUTTON_SIZE - EDGE_PADDING : 600,
                }}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={{
                    x: position.x,
                    y: position.y,
                    opacity: isIdle ? 0.4 : 1,
                    scale: isDragging ? 1.15 : 1,
                }}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                    opacity: { duration: 0.5 },
                }}
                whileHover={{ opacity: 1, scale: 1.05 }}
                onHoverStart={resetIdleTimer}
                style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, touchAction: 'none' }}
                className="cursor-grab active:cursor-grabbing"
            >
                {/* Main button — uses pointer events for tap since drag swallows onClick */}
                <div
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    className="group relative flex items-center justify-center focus:outline-none"
                    style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, cursor: 'pointer' }}
                >
                    {/* Glow ring when active */}
                    <div className={`absolute inset-0 rounded-full transition-all duration-500 ${menuOpen
                        ? 'bg-gradient-to-tr from-cyan-500/30 to-violet-500/30 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-110'
                        : isDragging
                            ? 'bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.2)] scale-105'
                            : ''
                        }`} />

                    {/* Button body */}
                    <div className={`w-full h-full rounded-full bg-zinc-900/80 backdrop-blur-xl border flex items-center justify-center overflow-hidden relative shadow-2xl transition-all duration-300 ${menuOpen ? 'border-cyan-500/40' : 'border-white/15 hover:border-white/25'
                        }`}>
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/15 to-violet-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Icon */}
                        <motion.div
                            className="relative z-10"
                            animate={{ rotate: menuOpen ? 90 : 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                            {menuOpen ? (
                                <X size={22} className="text-cyan-400" strokeWidth={2} />
                            ) : (
                                <Globe size={22} className="text-white group-hover:text-cyan-400 transition-colors" strokeWidth={1.5} />
                            )}
                        </motion.div>
                    </div>

                    {/* Notification dot */}
                    {unreadNotifCount > 0 && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-900 animate-pulse" />
                    )}
                </div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: isOnBottom ? 10 : -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: isOnBottom ? 10 : -10 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="absolute w-60 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.6)] overflow-hidden ring-1 ring-white/5"
                            style={{
                                [isOnBottom ? 'bottom' : 'top']: BUTTON_SIZE + 8,
                                [isOnRight ? 'right' : 'left']: 0,
                            }}
                        >
                            {/* Menu header */}
                            <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-cyan-500/5 to-violet-500/5">
                                <span className="text-[11px] font-bold text-zinc-500 tracking-widest uppercase">Menu</span>
                            </div>

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

                                        {/* Notifications inline */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNotificationClick();
                                            }}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-all font-medium group w-full text-left relative"
                                        >
                                            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                                                <Bell size={14} />
                                            </div>
                                            Notifications
                                            {unreadNotifCount > 0 && (
                                                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
                                                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                                                </span>
                                            )}
                                        </button>

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

                {/* Notification panel (appears below/above dropdown) */}
                <AnimatePresence>
                    {notificationsOpen && menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute w-72 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                            style={{
                                [isOnBottom ? 'bottom' : 'top']: BUTTON_SIZE + 8 + 260,
                                [isOnRight ? 'right' : 'left']: 0,
                            }}
                        >
                            <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h3 className="font-semibold text-white text-sm">Notifications</h3>
                                {unreadNotifCount > 0 && (
                                    <button onClick={handleMarkAllRead} className="text-[10px] text-cyan-400 hover:text-cyan-300 tracking-wide uppercase font-bold">
                                        Mark read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-zinc-500 text-sm">No notifications</div>
                                ) : (
                                    <div className="flex flex-col">
                                        {notifications.map((notif: any) => (
                                            <Link
                                                key={notif._id}
                                                href={notif.link || '#'}
                                                onClick={() => { setNotificationsOpen(false); setMenuOpen(false); }}
                                                className={`px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex gap-3 ${(notif.isRead || notif.read) ? 'opacity-50' : ''}`}
                                            >
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${(notif.isRead || notif.read) ? 'bg-zinc-800 text-zinc-500' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                                    <Bell className="w-3 h-3" />
                                                </div>
                                                <div>
                                                    <p className={`text-xs leading-snug ${(notif.isRead || notif.read) ? 'text-zinc-500' : 'text-zinc-200'}`}>
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
            </motion.div>
        </>
    );
}
