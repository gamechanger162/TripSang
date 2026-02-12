'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useNavigation } from '@/contexts/NavigationContext';
import {
    Home, Camera, User, X, Plus, MessageCircle,
    Calendar, Sparkles, Compass, ChevronUp
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEnv } from '@/hooks/useEnv';
import Image from 'next/image';

/* ─── Types ────────────────────────────────────────── */
interface DockItem {
    id: string;
    icon: React.ElementType;
    label: string;
    href: string;
    color: string;
    glow: string;
    thumbnailUrl?: string | null;
    isAvatar?: boolean;
}

/* ─── Nav Items ────────────────────────────────────── */
const BASE_ITEMS: Omit<DockItem, 'thumbnailUrl' | 'isAvatar'>[] = [
    { id: 'home', icon: Home, label: 'Home', href: '/', color: '#FBBF24', glow: 'rgba(251,191,36,0.4)' },
    { id: 'explore', icon: Compass, label: 'Explore', href: '/search', color: '#2DD4BF', glow: 'rgba(45,212,191,0.4)' },
    { id: 'chat', icon: MessageCircle, label: 'Chat', href: '/app', color: '#F472B6', glow: 'rgba(244,114,182,0.4)' },
    { id: 'create', icon: Plus, label: 'Create', href: '/trips/create', color: '#A78BFA', glow: 'rgba(167,139,250,0.5)' },
    { id: 'plans', icon: Calendar, label: 'Plans', href: '/my-plan', color: '#FB923C', glow: 'rgba(251,146,60,0.4)' },
    { id: 'moments', icon: Camera, label: 'Moments', href: '/gallery', color: '#60A5FA', glow: 'rgba(96,165,250,0.4)' },
    { id: 'profile', icon: User, label: 'Me', href: '/dashboard', color: '#34D399', glow: 'rgba(52,211,153,0.4)' },
];

/* ─── FloatingDock ─────────────────────────────────── */
export default function FloatingDock() {
    const { navState, isSearchActive, setSearchActive } = useNavigation();
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const { apiUrl } = useEnv();
    const mouseX = useMotionValue(Infinity);
    const [searchQuery, setSearchQuery] = useState('');
    const [mounted, setMounted] = useState(false);
    const [latestMomentPhoto, setLatestMomentPhoto] = useState<string | null>(null);
    const [unreadChat, setUnreadChat] = useState(0);

    useEffect(() => { setMounted(true); }, []);

    /* ─ Fetch latest moment photo (cached) ─ */
    useEffect(() => {
        const fetch_ = async () => {
            try {
                const cached = sessionStorage.getItem('latestMomentPhoto');
                if (cached) { setLatestMomentPhoto(cached); return; }
                const token = session?.user?.accessToken || localStorage.getItem('token');
                if (!token || !apiUrl) return;
                const res = await fetch(`${apiUrl}/api/memories/feed?page=1&limit=1`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.memories?.[0]?.photos?.[0]?.url) {
                        const url = data.memories[0].photos[0].url;
                        setLatestMomentPhoto(url);
                        sessionStorage.setItem('latestMomentPhoto', url);
                    }
                }
            } catch { /* silent */ }
        };
        if (session?.user) fetch_();
    }, [session?.user?.accessToken, apiUrl]);

    /* ─ Fetch unread count ─ */
    useEffect(() => {
        const fetch_ = async () => {
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
            } catch { /* silent */ }
        };
        if (session?.user) fetch_();
    }, [session?.user?.accessToken, apiUrl]);

    const items: DockItem[] = useMemo(() =>
        BASE_ITEMS.map(item => {
            if (item.id === 'profile') return { ...item, thumbnailUrl: session?.user?.image || null, isAvatar: true };
            if (item.id === 'moments') return { ...item, thumbnailUrl: latestMomentPhoto };
            return { ...item, thumbnailUrl: null, isAvatar: false };
        }),
        [session?.user?.image, latestMomentPhoto]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchActive(false);
        }
    };

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchActive(false); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [setSearchActive]);

    if (pathname?.startsWith('/app')) return null;

    const isActive = (href: string) => href === '/' ? pathname === '/' : (pathname?.startsWith(href) || false);

    return (
        <div
            className="fixed bottom-0 inset-x-0 z-50 pointer-events-none flex justify-center pb-3 px-2"
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
        >
            <AnimatePresence mode="popLayout">
                {isSearchActive ? (
                    /* ═══ SEARCH ═══ */
                    <motion.div
                        key="search"
                        className="pointer-events-auto w-full max-w-[420px]"
                        initial={{ opacity: 0, y: 24, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    >
                        <div className="dock-glass rounded-full h-12 flex items-center px-4 gap-2">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
                                <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                            </motion.div>
                            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center">
                                <input
                                    autoFocus type="text" value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Where to next?"
                                    className="w-full bg-transparent border-none outline-none text-white/90 placeholder-white/30 text-sm font-medium tracking-wide"
                                />
                            </form>
                            <motion.button
                                type="button" onClick={() => setSearchActive(false)}
                                className="p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
                                whileHover={{ rotate: 90 }} whileTap={{ scale: 0.8 }}
                            >
                                <X className="w-4 h-4 text-white/40" />
                            </motion.button>
                        </div>
                    </motion.div>

                ) : navState === 'scrolled' ? (
                    /* ═══ COLLAPSED DOT — scroll to top ═══ */
                    <motion.button
                        key="dot"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="pointer-events-auto rounded-full flex items-center justify-center group overflow-hidden relative cursor-pointer"
                        style={{
                            width: 44, height: 44,
                            background: 'linear-gradient(145deg, rgba(22,18,30,0.92), rgba(12,10,18,0.95))',
                            backdropFilter: 'blur(24px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        }}
                        initial={{ opacity: 0, y: 24, scale: 0.3 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.3 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                    >
                        {/* Spinning conic gradient ring */}
                        <motion.div
                            className="absolute inset-[2px] rounded-full"
                            style={{
                                background: 'conic-gradient(from 0deg, #A78BFA, #14B8A6, #FBBF24, #EC4899, #A78BFA)',
                                mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
                                WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                        {/* Pulsing center dot */}
                        <motion.div
                            className="w-2 h-2 rounded-full bg-white"
                            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </motion.button>

                ) : (
                    /* ═══ MAIN DOCK ═══ */
                    <motion.nav
                        key="dock"
                        className="pointer-events-auto"
                        initial={{ opacity: 0, y: 40, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.92 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                        style={{ willChange: 'transform' }}
                    >
                        <div className="dock-glass dock-shape flex items-end h-[60px] px-1 relative">
                            {/* Top shimmer line */}
                            <div className="absolute top-0 inset-x-3 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                            {items.map((item, i) => (
                                <DockIcon
                                    key={item.id}
                                    item={item}
                                    index={i}
                                    active={isActive(item.href)}
                                    mounted={mounted}
                                    mouseX={mouseX}
                                    unreadChat={unreadChat}
                                    onClick={item.id === 'explore' ? (e) => { e.preventDefault(); setSearchActive(true); } : undefined}
                                />
                            ))}
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>

            {/* Scoped styles */}
            <style jsx global>{`
                .dock-glass {
                    background: linear-gradient(180deg, rgba(22,18,30,0.85) 0%, rgba(12,10,18,0.92) 100%);
                    backdrop-filter: blur(24px) saturate(1.4);
                    -webkit-backdrop-filter: blur(24px) saturate(1.4);
                    border: 1px solid rgba(255,255,255,0.07);
                    box-shadow:
                        0 -4px 30px rgba(0,0,0,0.4),
                        0 4px 20px rgba(0,0,0,0.3),
                        inset 0 1px 0 rgba(255,255,255,0.06);
                }
                .dock-shape {
                    border-radius: 22px;
                }
            `}</style>
        </div>
    );
}

/* ============================================================
   DockIcon — compact icon with macOS-style magnify on hover
   ============================================================ */
function DockIcon({
    item, index, active, mounted, mouseX, unreadChat, onClick,
}: {
    item: DockItem; index: number; active: boolean; mounted: boolean;
    mouseX: any; unreadChat: number; onClick?: (e: React.MouseEvent) => void;
}) {
    const ref = useRef<HTMLAnchorElement>(null);
    const isCreate = item.id === 'create';
    const isChat = item.id === 'chat';
    const hasUnread = isChat && unreadChat > 0;
    const IconComp = item.icon;

    /* macOS-style magnification on desktop hover */
    const dist = useTransform(mouseX, (val: number) => {
        const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - rect.x - rect.width / 2;
    });
    const scaleRaw = useTransform(dist, [-100, 0, 100], [1, 1.25, 1]);
    const scale = useSpring(scaleRaw, { mass: 0.1, stiffness: 200, damping: 14 });
    const yRaw = useTransform(dist, [-100, 0, 100], [0, -6, 0]);
    const y = useSpring(yRaw, { mass: 0.1, stiffness: 200, damping: 14 });

    return (
        <Link
            ref={ref}
            href={item.href}
            onClick={onClick}
            className="relative outline-none group"
        >
            <motion.div
                className="flex flex-col items-center justify-end pb-1.5 relative"
                style={{
                    scale,
                    y,
                    width: 'clamp(42px, 12.5vw, 54px)',
                    transformOrigin: 'bottom center',
                }}
            >
                {/* ─── Active glow underneath ─── */}
                {active && (
                    <motion.div
                        className="absolute inset-x-1 top-1 bottom-1 rounded-[14px]"
                        style={{ background: `radial-gradient(ellipse at 50% 40%, ${item.glow}, transparent 75%)` }}
                        layoutId="dock-active-glow"
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    />
                )}

                {/* ─── Icon container ─── */}
                <motion.div
                    className="relative flex items-center justify-center"
                    style={{
                        width: isCreate ? 36 : 28,
                        height: isCreate ? 36 : 28,
                    }}
                    whileTap={{ scale: 0.82 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                    {isCreate ? (
                        /* ─── Create: gradient circle ─── */
                        <>
                            <div
                                className="absolute inset-0 rounded-[12px]"
                                style={{
                                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                                    boxShadow: active
                                        ? '0 0 20px rgba(139,92,246,0.5)'
                                        : '0 0 12px rgba(139,92,246,0.25)',
                                    transition: 'box-shadow 0.3s ease',
                                }}
                            />
                            {/* Shimmer overlay */}
                            <div
                                className="absolute inset-0 rounded-[12px] overflow-hidden"
                            >
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.2) 50%, transparent 65%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 3s ease-in-out infinite',
                                    }}
                                />
                            </div>
                            <Plus size={18} className="relative z-10 text-white" strokeWidth={2.5} />
                        </>
                    ) : item.thumbnailUrl ? (
                        /* ─── Thumbnail (avatar / moment photo) ─── */
                        <div
                            className="w-7 h-7 rounded-full overflow-hidden transition-all duration-300"
                            style={{
                                border: active ? `2px solid ${item.color}` : '1.5px solid rgba(255,255,255,0.12)',
                                boxShadow: active ? `0 0 10px ${item.glow}` : 'none',
                            }}
                        >
                            <Image src={item.thumbnailUrl} alt={item.label} width={28} height={28} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        /* ─── Standard icon ─── */
                        <IconComp
                            size={active ? 21 : 19}
                            strokeWidth={active ? 2.2 : 1.5}
                            style={{
                                color: active ? item.color : 'rgba(255,255,255,0.35)',
                                filter: active ? `drop-shadow(0 0 6px ${item.glow})` : 'none',
                                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                            }}
                        />
                    )}

                    {/* Unread badge */}
                    {hasUnread && (
                        <motion.span
                            className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                                fontSize: 8, fontWeight: 800, color: '#fff', lineHeight: 1,
                                boxShadow: '0 2px 8px rgba(239,68,68,0.5), 0 0 0 2px rgba(12,10,18,0.9)',
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                        >
                            {unreadChat > 99 ? '99+' : unreadChat}
                        </motion.span>
                    )}
                </motion.div>

                {/* ─── Label ─── */}
                <span
                    className="text-[8px] sm:text-[9px] font-semibold tracking-wider uppercase mt-0.5 leading-none"
                    style={{
                        color: active ? item.color : 'rgba(255,255,255,0.28)',
                        transition: 'color 0.3s ease',
                        textShadow: active ? `0 0 8px ${item.glow}` : 'none',
                    }}
                >
                    {item.label}
                </span>

                {/* ─── Active dot ─── */}
                {active && (
                    <motion.div
                        className="w-[3px] h-[3px] rounded-full mt-[2px]"
                        style={{ background: item.color, boxShadow: `0 0 4px ${item.glow}` }}
                        layoutId="dock-active-dot"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                )}
            </motion.div>
        </Link>
    );
}
