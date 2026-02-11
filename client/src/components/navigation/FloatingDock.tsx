'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useNavigation } from '@/contexts/NavigationContext';
import { Search, Home, Camera, User, X, Plus, MessageCircle, Calendar, Sparkles, Compass } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEnv } from '@/hooks/useEnv';
import Image from 'next/image';

interface DockItem {
    id: string;
    icon: React.ElementType;
    label: string;
    href: string;
    gradient: string;
    emoji: string;
    thumbnailUrl?: string | null;
    isAvatar?: boolean;
}

const BASE_ITEMS: Omit<DockItem, 'thumbnailUrl' | 'isAvatar'>[] = [
    { id: 'home', icon: Home, label: 'Home', href: '/', gradient: 'from-amber-400 to-orange-500', emoji: '🏡' },
    { id: 'explore', icon: Compass, label: 'Explore', href: '/search', gradient: 'from-teal-400 to-cyan-500', emoji: '🧭' },
    { id: 'chat', icon: MessageCircle, label: 'Chat', href: '/app', gradient: 'from-pink-400 to-rose-500', emoji: '💬' },
    { id: 'create', icon: Plus, label: 'Create', href: '/trips/create', gradient: 'from-violet-400 to-purple-600', emoji: '✨' },
    { id: 'plans', icon: Calendar, label: 'My Plan', href: '/my-plan', gradient: 'from-orange-400 to-red-500', emoji: '📅' },
    { id: 'moments', icon: Camera, label: 'Moments', href: '/gallery', gradient: 'from-sky-400 to-blue-500', emoji: '📸' },
    { id: 'profile', icon: User, label: 'Profile', href: '/dashboard', gradient: 'from-emerald-400 to-green-500', emoji: '👤' },
];

export default function FloatingDock() {
    const { navState, isSearchActive, setSearchActive } = useNavigation();
    const pathname = usePathname();
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();
    const { apiUrl } = useEnv();
    const mouseX = useMotionValue(Infinity);
    const [searchQuery, setSearchQuery] = useState('');
    const [mounted, setMounted] = useState(false);
    const [latestMomentPhoto, setLatestMomentPhoto] = useState<string | null>(null);
    const [unreadChat, setUnreadChat] = useState(0);

    useEffect(() => { setMounted(true); }, []);

    // Fetch latest moment photo
    useEffect(() => {
        const fetchLatestMoment = async () => {
            try {
                // Check cache first
                const cachedPhoto = sessionStorage.getItem('latestMomentPhoto');
                if (cachedPhoto) {
                    setLatestMomentPhoto(cachedPhoto);
                    return;
                }

                const token = session?.user?.accessToken || localStorage.getItem('token');
                if (!token || !apiUrl) return;
                const res = await fetch(`${apiUrl}/api/memories/feed?page=1&limit=1`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.memories?.length > 0 && data.memories[0].photos?.length > 0) {
                        const photoUrl = data.memories[0].photos[0].url;
                        setLatestMomentPhoto(photoUrl);
                        sessionStorage.setItem('latestMomentPhoto', photoUrl);
                    }
                }
            } catch { /* Silent */ }
        };
        if (session?.user) fetchLatestMoment();
    }, [session?.user?.accessToken, apiUrl]);

    // Fetch unread chat count
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const token = session?.user?.accessToken || localStorage.getItem('token');
                if (!token || !apiUrl) return;
                const res = await fetch(`${apiUrl}/api/messages/unread-count`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setUnreadChat(data.unreadCount || 0);
                }
                // Silently ignore 429 or other errors
            } catch { /* Silent */ }
        };
        if (session?.user) fetchUnread();
    }, [session?.user?.accessToken, apiUrl]);

    // Build items with dynamic thumbnails
    const items: DockItem[] = useMemo(() => {
        return BASE_ITEMS.map(item => {
            if (item.id === 'profile') {
                return { ...item, thumbnailUrl: session?.user?.image || null, isAvatar: true };
            }
            if (item.id === 'moments') {
                return { ...item, thumbnailUrl: latestMomentPhoto };
            }
            return { ...item, thumbnailUrl: null, isAvatar: false };
        });
    }, [session?.user?.image, latestMomentPhoto]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchActive(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSearchActive(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setSearchActive]);

    if (pathname?.startsWith('/app')) return null;

    return (
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center justify-end pointer-events-none w-full max-w-full"
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
        >
            <AnimatePresence mode="popLayout">
                {isSearchActive ? (
                    <motion.div
                        key="search-bar"
                        className="pointer-events-auto backdrop-blur-2xl rounded-2xl overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(15,15,20,0.92), rgba(25,20,35,0.92))',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)',
                        }}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1, width: "min(480px, 95vw)" }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    >
                        <form onSubmit={handleSearchSubmit} className="flex items-center w-full h-14 px-5 gap-3">
                            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                                <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
                            </motion.div>
                            <input
                                autoFocus
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Where do you want to go?"
                                className="flex-1 bg-transparent border-none outline-none text-white/90 placeholder-white/25 font-medium text-sm min-w-0 tracking-wide"
                            />
                            <motion.button
                                type="button"
                                onClick={() => setSearchActive(false)}
                                className="p-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                                whileHover={{ rotate: 90 }}
                                whileTap={{ scale: 0.8 }}
                            >
                                <X className="w-4 h-4 text-white/40" />
                            </motion.button>
                        </form>
                    </motion.div>
                ) : navState === 'scrolled' ? (
                    <motion.button
                        key="scrolled-dot"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="pointer-events-auto backdrop-blur-2xl rounded-full flex items-center justify-center group overflow-hidden relative"
                        style={{
                            width: 52,
                            height: 52,
                            background: 'linear-gradient(135deg, rgba(15,15,20,0.92), rgba(25,20,35,0.92))',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                        }}
                        initial={{ opacity: 0, y: 20, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.5 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        <motion.div
                            className="absolute inset-[3px] rounded-full"
                            style={{
                                background: 'conic-gradient(from 0deg, #FF9A76, #A78BFA, #14B8A6, #FB923C, #FF9A76)',
                                mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
                                WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                            className="w-2 h-2 rounded-full bg-white"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </motion.button>
                ) : (
                    <motion.div
                        key="full-dock"
                        ref={containerRef}
                        className="pointer-events-auto flex items-end justify-center gap-1 px-2.5 pb-2 pt-2.5 backdrop-blur-2xl rounded-2xl mx-auto max-w-[95vw] sm:max-w-none relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(15,15,20,0.88), rgba(25,20,35,0.88))',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
                        }}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        {/* Aurora strip */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
                            <motion.div
                                className="h-full w-[200%]"
                                style={{ background: 'linear-gradient(90deg, transparent, #FF9A76, #A78BFA, #14B8A6, #FB923C, transparent)' }}
                                animate={{ x: ['-50%', '0%'] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            />
                        </div>

                        {items.map((item, i) => (
                            <DockIcon
                                key={item.id}
                                mouseX={mouseX}
                                item={item}
                                index={i}
                                isActive={pathname === item.href}
                                mounted={mounted}
                                unreadChat={unreadChat}
                                onClick={item.id === 'explore' ? (e) => { e.preventDefault(); setSearchActive(true); } : undefined}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ============================================================
   Individual Dock Icon — each type gets a unique visual
   ============================================================ */
function DockIcon({
    mouseX, item, index, isActive, mounted, unreadChat, onClick
}: {
    mouseX: any; item: DockItem; index: number; isActive: boolean;
    mounted: boolean; unreadChat: number; onClick?: (e: any) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    const distance = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const sizeSync = useTransform(distance, [-150, 0, 150], [44, 72, 44]);
    const size = useSpring(sizeSync, { mass: 0.1, stiffness: 180, damping: 14 });
    const ySync = useTransform(distance, [-150, 0, 150], [0, -12, 0]);
    const y = useSpring(ySync, { mass: 0.1, stiffness: 180, damping: 14 });

    const IconComp = item.icon;
    const today = new Date().getDate();

    // Render the inner content based on icon type
    const renderIconContent = () => {
        switch (item.id) {

            /* ─── HOME: Animated gradient orb ─── */
            case 'home':
                return (
                    <motion.div
                        className="w-full h-full rounded-[16px] flex items-center justify-center relative overflow-hidden cursor-pointer"
                        style={{
                            background: isActive ? undefined : 'rgba(255,255,255,0.04)',
                            border: isActive ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                        {isActive && (
                            <motion.div
                                className={`absolute inset-0 rounded-[16px] bg-gradient-to-br ${item.gradient}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            />
                        )}
                        {/* Pulsing gradient orb behind the icon */}
                        <motion.div
                            className="absolute w-6 h-6 rounded-full"
                            style={{
                                background: isActive
                                    ? 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)'
                                    : 'radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)',
                            }}
                            animate={{
                                scale: [1, 1.6, 1],
                                opacity: [0.5, 0.8, 0.5],
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.div className="relative z-10">
                            <Home
                                size={18}
                                style={{
                                    color: isActive ? 'white' : 'rgba(255,255,255,0.4)',
                                    filter: isActive ? 'drop-shadow(0 0 6px rgba(255,255,255,0.4))' : 'none',
                                    transition: 'color 0.2s',
                                }}
                            />
                        </motion.div>
                    </motion.div>
                );

            /* ─── EXPLORE: Mini planet with orbiting satellites ─── */
            case 'explore':
                return (
                    <motion.div
                        className="w-full h-full rounded-[16px] flex items-center justify-center relative overflow-hidden cursor-pointer"
                        style={{
                            background: isActive
                                ? 'radial-gradient(circle at 40% 40%, #0d3b66, #0a1628)'
                                : 'rgba(255,255,255,0.04)',
                            border: isActive ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                        {/* Starfield dots */}
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={`star-${i}`}
                                className="absolute rounded-full bg-white"
                                style={{
                                    width: (i % 2 === 0) ? 1 : 1.5,
                                    height: (i % 3 === 0) ? 1 : 1.5,
                                    top: `${15 + i * 12}%`,
                                    left: `${10 + (i * 17) % 80}%`,
                                }}
                                animate={{ opacity: [0.2, 0.7, 0.2] }}
                                transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
                            />
                        ))}

                        {/* Planet globe */}
                        <motion.div
                            className="relative z-10 rounded-full"
                            style={{
                                width: 16,
                                height: 16,
                                background: isActive
                                    ? 'radial-gradient(circle at 35% 30%, #5eead4, #14b8a6, #0d6e6e)'
                                    : 'radial-gradient(circle at 35% 30%, rgba(94,234,212,0.5), rgba(20,184,166,0.3), rgba(13,110,110,0.2))',
                                boxShadow: isActive
                                    ? '0 0 12px rgba(20,184,166,0.5), inset -3px -2px 4px rgba(0,0,0,0.3)'
                                    : 'inset -3px -2px 4px rgba(0,0,0,0.2)',
                            }}
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        >
                            {/* Planet highlight */}
                            <div
                                className="absolute rounded-full"
                                style={{
                                    width: 5,
                                    height: 3,
                                    top: 3,
                                    left: 4,
                                    background: 'rgba(255,255,255,0.3)',
                                    borderRadius: '50%',
                                    filter: 'blur(1px)',
                                }}
                            />
                        </motion.div>

                        {/* Orbit ring 1 — fast satellite */}
                        <motion.div
                            className="absolute z-20"
                            style={{ width: 28, height: 28 }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        >
                            <div
                                className="absolute rounded-full"
                                style={{
                                    width: 4,
                                    height: 4,
                                    top: 0,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: isActive ? '#fbbf24' : 'rgba(251,191,36,0.5)',
                                    boxShadow: isActive ? '0 0 6px rgba(251,191,36,0.6)' : 'none',
                                }}
                            />
                        </motion.div>

                        {/* Orbit ring 2 — medium satellite */}
                        <motion.div
                            className="absolute z-20"
                            style={{ width: 22, height: 22 }}
                            animate={{ rotate: -360 }}
                            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                        >
                            <div
                                className="absolute rounded-full"
                                style={{
                                    width: 3,
                                    height: 3,
                                    bottom: 0,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: isActive ? '#a78bfa' : 'rgba(167,139,250,0.4)',
                                    boxShadow: isActive ? '0 0 5px rgba(167,139,250,0.5)' : 'none',
                                }}
                            />
                        </motion.div>

                        {/* Sonar ripple */}
                        <motion.div
                            className="absolute rounded-full border z-0"
                            style={{
                                width: 20,
                                height: 20,
                                borderColor: isActive ? 'rgba(94,234,212,0.3)' : 'rgba(94,234,212,0.1)',
                            }}
                            animate={{ scale: [0.8, 2], opacity: [0.5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
                        />
                    </motion.div>
                );

            /* ─── CHAT: Breathing bubble + unread badge ─── */
            case 'chat':
                return (
                    <motion.div
                        className="w-full h-full rounded-[16px] flex items-center justify-center relative overflow-hidden cursor-pointer"
                        style={{
                            background: isActive ? undefined : 'rgba(255,255,255,0.04)',
                            border: isActive ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                        {isActive && (
                            <motion.div
                                className={`absolute inset-0 rounded-[16px] bg-gradient-to-br ${item.gradient}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            />
                        )}
                        {/* Breathing icon */}
                        <motion.div
                            className="relative z-10"
                            animate={unreadChat > 0 ? {
                                scale: [1, 1.12, 1],
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <MessageCircle
                                size={18}
                                style={{
                                    color: isActive ? 'white' : unreadChat > 0 ? '#F472B6' : 'rgba(255,255,255,0.4)',
                                    filter: unreadChat > 0 ? 'drop-shadow(0 0 6px rgba(244,114,182,0.4))' : 'none',
                                    transition: 'color 0.2s',
                                }}
                            />
                        </motion.div>
                        {/* Unread badge */}
                        {unreadChat > 0 && (
                            <motion.div
                                className="absolute top-0.5 right-0.5 z-20 flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                            >
                                <span
                                    className="min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, #F472B6, #EC4899)',
                                        boxShadow: '0 0 8px rgba(244,114,182,0.5)',
                                    }}
                                >
                                    {unreadChat > 99 ? '99+' : unreadChat}
                                </span>
                                {/* Pulse ring */}
                                <motion.div
                                    className="absolute inset-0 rounded-full"
                                    style={{ border: '1px solid rgba(244,114,182,0.4)' }}
                                    animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                                />
                            </motion.div>
                        )}
                    </motion.div>
                );

            /* ─── CREATE: Cosmic nebula portal ─── */
            case 'create':
                return (
                    <motion.div
                        className="w-full h-full rounded-[16px] flex items-center justify-center relative overflow-hidden cursor-pointer"
                        style={{
                            background: 'radial-gradient(circle at 50% 50%, #1a0a2e, #0d0618, #070212)',
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                        {/* Nebula glow core */}
                        <motion.div
                            className="absolute rounded-full"
                            style={{
                                width: 24,
                                height: 24,
                                background: 'radial-gradient(circle, rgba(167,139,250,0.4) 0%, rgba(244,114,182,0.15) 50%, transparent 70%)',
                            }}
                            animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.6, 1, 0.6],
                            }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        />

                        {/* Swirling particle ring — 8 stardust particles */}
                        {[...Array(8)].map((_, i) => {
                            const angle = (i * 45) * (Math.PI / 180);
                            const radius = 12 + (i % 3) * 3;
                            const particleSize = i % 2 === 0 ? 2.5 : 1.5;
                            const colors = ['#A78BFA', '#F472B6', '#FB923C', '#34D399', '#38BDF8', '#FBBF24', '#EC4899', '#8B5CF6'];
                            return (
                                <motion.div
                                    key={`particle-${i}`}
                                    className="absolute z-10 rounded-full"
                                    style={{
                                        width: particleSize,
                                        height: particleSize,
                                        background: colors[i],
                                        boxShadow: `0 0 4px ${colors[i]}80`,
                                    }}
                                    animate={{
                                        x: [
                                            Math.cos(angle) * radius,
                                            Math.cos(angle + Math.PI) * radius,
                                            Math.cos(angle + Math.PI * 2) * radius,
                                        ],
                                        y: [
                                            Math.sin(angle) * radius,
                                            Math.sin(angle + Math.PI) * radius,
                                            Math.sin(angle + Math.PI * 2) * radius,
                                        ],
                                        opacity: [0.4, 1, 0.4],
                                    }}
                                    transition={{
                                        duration: 3 + i * 0.4,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                            );
                        })}

                        {/* Outer faint ring */}
                        <motion.div
                            className="absolute rounded-full"
                            style={{
                                width: 30,
                                height: 30,
                                border: '1px solid rgba(167,139,250,0.15)',
                            }}
                            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                            transition={{ rotate: { duration: 10, repeat: Infinity, ease: 'linear' }, scale: { duration: 3, repeat: Infinity } }}
                        />

                        {/* Plus icon — rotates 45° on hover */}
                        <motion.div
                            className="relative z-20"
                            whileHover={{ rotate: 135, scale: 1.2 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        >
                            <Plus
                                size={18}
                                style={{
                                    color: 'white',
                                    filter: 'drop-shadow(0 0 10px rgba(167,139,250,0.7)) drop-shadow(0 0 20px rgba(244,114,182,0.3))',
                                }}
                            />
                        </motion.div>

                        {/* Subtle border shimmer */}
                        <motion.div
                            className="absolute inset-0 rounded-[16px]"
                            style={{
                                background: 'conic-gradient(from 0deg, transparent, rgba(167,139,250,0.15), transparent, rgba(244,114,182,0.1), transparent)',
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                        />
                    </motion.div>
                );

            /* ─── MY PLAN: Animated diamond gem ─── */
            case 'plans':
                return (
                    <motion.div
                        className="w-full h-full rounded-[16px] flex items-center justify-center relative overflow-hidden cursor-pointer"
                        style={{
                            background: isActive ? undefined : 'rgba(255,255,255,0.04)',
                            border: isActive ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                        {isActive && (
                            <motion.div
                                className={`absolute inset-0 rounded-[16px] bg-gradient-to-br ${item.gradient}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            />
                        )}
                        {/* Golden glow */}
                        <motion.div
                            className="absolute rounded-full"
                            style={{
                                width: 22, height: 22,
                                background: isActive
                                    ? 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)'
                                    : 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)',
                            }}
                            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        {/* Diamond shape */}
                        <motion.div
                            className="relative z-10"
                            style={{ width: 14, height: 14, transform: 'rotate(45deg)' }}
                            animate={{ rotate: [45, 47, 43, 45] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            {/* Diamond body */}
                            <div
                                style={{
                                    width: '100%', height: '100%',
                                    borderRadius: 2,
                                    background: isActive
                                        ? 'linear-gradient(135deg, #ffffff, #e0e0e0, #ffffff)'
                                        : 'linear-gradient(135deg, #FBBF24, #F59E0B, #D97706, #FBBF24)',
                                    boxShadow: isActive
                                        ? '0 0 10px rgba(255,255,255,0.4)'
                                        : '0 0 8px rgba(251,191,36,0.4), inset 0 0 4px rgba(255,255,255,0.3)',
                                }}
                            />
                            {/* Facet highlight */}
                            <div
                                style={{
                                    position: 'absolute', top: 2, left: 2,
                                    width: 5, height: 5,
                                    background: 'rgba(255,255,255,0.5)',
                                    borderRadius: 1,
                                    filter: 'blur(1px)',
                                }}
                            />
                        </motion.div>
                        {/* Shimmer sweep */}
                        <motion.div
                            className="absolute z-20"
                            style={{
                                width: 3, height: 20,
                                background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.4), transparent)',
                                filter: 'blur(2px)',
                            }}
                            animate={{ x: [-15, 15], opacity: [0, 0.8, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                        />
                    </motion.div>
                );

            /* ─── MOMENTS: Real photo thumbnail ─── */
            case 'moments':
                if (item.thumbnailUrl) {
                    return (
                        <motion.div
                            className="w-full h-full rounded-[16px] flex items-center justify-center relative overflow-hidden cursor-pointer"
                            style={{ border: isActive ? '2px solid transparent' : '1px solid rgba(255,255,255,0.08)' }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                            {isActive && (
                                <motion.div
                                    className="absolute inset-[-2px] rounded-[18px]"
                                    style={{ background: 'linear-gradient(135deg, #38BDF8, #BAE6FD)', padding: 2 }}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                />
                            )}
                            <div className="absolute inset-[2px] rounded-[14px] overflow-hidden bg-[#12121a]">
                                <Image src={item.thumbnailUrl} alt="Moments" fill className="object-cover" sizes="72px" />
                                {!isActive && <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-opacity duration-200" />}
                            </div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full flex items-center justify-center z-20"
                                style={{ background: 'rgba(12,12,20,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}>
                                <Camera size={8} style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.5)' }} />
                            </div>
                        </motion.div>
                    );
                }
                // fallthrough to default icon
                return renderDefaultIcon();

            /* ─── PROFILE: Real profile picture ─── */
            case 'profile':
                if (item.thumbnailUrl) {
                    return (
                        <motion.div
                            className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden cursor-pointer"
                            style={{ border: isActive ? '2px solid transparent' : '1px solid rgba(255,255,255,0.08)' }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                            {isActive && (
                                <motion.div
                                    className="absolute inset-[-2px] rounded-full"
                                    style={{ background: 'linear-gradient(135deg, #34D399, #6EE7B7)', padding: 2 }}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                />
                            )}
                            <div className="absolute inset-[2px] rounded-full overflow-hidden bg-[#12121a]">
                                <Image src={item.thumbnailUrl} alt="Profile" fill className="object-cover" sizes="72px" />
                                {!isActive && <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-opacity duration-200" />}
                            </div>
                            {/* Online indicator dot */}
                            <motion.div
                                className="absolute bottom-0 right-0 w-3 h-3 rounded-full z-20 flex items-center justify-center"
                                style={{
                                    background: 'rgba(12,12,20,0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                <motion.div
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                />
                            </motion.div>
                        </motion.div>
                    );
                }
                // fallthrough to default icon
                return renderDefaultIcon();

            default:
                return renderDefaultIcon();
        }
    };

    // Default icon renderer (fallback)
    const renderDefaultIcon = () => (
        <motion.div
            className="w-full h-full rounded-[16px] flex items-center justify-center relative overflow-hidden cursor-pointer"
            style={{
                background: isActive ? undefined : 'rgba(255,255,255,0.04)',
                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.04)',
            }}
            whileHover={{ scale: 1.08, background: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
            {isActive && (
                <motion.div
                    className={`absolute inset-0 rounded-[16px] bg-gradient-to-br ${item.gradient}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
            )}
            <IconComp
                size={18}
                className="relative z-10"
                style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }}
            />
        </motion.div>
    );

    return (
        <Link href={item.href} onClick={onClick} className="relative">
            <motion.div
                ref={ref}
                style={{ width: size, y }}
                className="aspect-square relative group"
                initial={{ opacity: 0, scale: 0, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                    delay: mounted ? 0 : index * 0.06,
                    type: 'spring', stiffness: 400, damping: 20,
                }}
            >
                {renderIconContent()}

                {/* Tooltip */}
                <motion.div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none">
                    <span className="hidden group-hover:flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap"
                        style={{
                            background: 'rgba(10,10,18,0.92)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        }}
                    >
                        <span className="text-[9px]">{item.emoji}</span>
                        {item.label}
                    </span>
                </motion.div>

                {/* Active glow line */}
                <AnimatePresence>
                    {isActive && item.id !== 'create' && (
                        <motion.div
                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-[3px] rounded-full"
                            style={{ width: '60%', background: 'linear-gradient(90deg, transparent, white, transparent)' }}
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 0.6 }}
                            exit={{ scaleX: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </Link>
    );
}
