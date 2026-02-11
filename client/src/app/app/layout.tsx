'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Users, Hash, Compass, Settings, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MeshBackground from '@/components/app/ui/MeshBackground';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { Toaster } from 'react-hot-toast';

const mobileNavItems = [
    { icon: Home, label: 'Home', href: '/', color: 'text-amber-400' },
    { icon: MessageCircle, label: 'Chats', href: '/app', color: 'text-cyan-400' },
    { icon: Users, label: 'Squads', href: '/app/squads', color: 'text-violet-400' },
    { icon: Hash, label: 'Communities', href: '/app/communities', color: 'text-pink-400' },
    { icon: Compass, label: 'Explore', href: '/app/explore', color: 'text-emerald-400' },
    { icon: Settings, label: 'Settings', href: '/app/settings', color: 'text-zinc-400' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="app-shell font-sans text-white">
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: '#18181b',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)'
                }
            }} />

            {/* Animated Mesh Background */}
            <MeshBackground />

            {/* Main App Content */}
            <div className="app-content flex h-full overflow-hidden relative z-10">
                {/* Desktop Sidebar — hidden on mobile */}
                <div className="hidden md:flex">
                    <ChatSidebar />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 h-full overflow-hidden relative flex flex-col bg-zinc-950/30 backdrop-blur-sm pb-16 md:pb-0">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation — visible on mobile only */}
            <motion.nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-xl border-t border-white/5 safe-area-bottom"
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.15 }}
            >
                <div className="flex items-center justify-around h-16 px-1">
                    {mobileNavItems.map((item) => {
                        const isActive = item.href === '/'
                            ? pathname === '/'
                            : item.href === '/app'
                                ? pathname === '/app'
                                : pathname?.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl"
                            >
                                {/* Active background pill */}
                                {isActive && (
                                    <motion.div
                                        layoutId="appMobileNavPill"
                                        className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.06]"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 30,
                                            mass: 0.8,
                                        }}
                                    />
                                )}

                                {/* Icon */}
                                <motion.div
                                    className="relative z-10"
                                    animate={{
                                        y: isActive ? -1 : 0,
                                        scale: isActive ? 1.1 : 1,
                                    }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                >
                                    <item.icon
                                        size={20}
                                        strokeWidth={isActive ? 2.5 : 1.8}
                                        className={`transition-colors duration-200 ${isActive ? item.color : 'text-zinc-500'}`}
                                    />
                                </motion.div>

                                {/* Label */}
                                <span className={`relative z-10 text-[10px] font-medium leading-none transition-colors duration-200 ${isActive ? item.color : 'text-zinc-500'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </motion.nav>

            <style jsx global>{`
                /* ===== Organic Modernist App Shell ===== */
                .app-shell {
                    position: fixed;
                    inset: 0;
                    width: 100vw;
                    height: 100dvh;
                    overflow: hidden;
                    background: #09090b; /* Zinc-950 */
                }

                /* Safe area for bottom nav on iOS */
                .safe-area-bottom {
                    padding-bottom: env(safe-area-inset-bottom, 0px);
                }
                
                /* Custom Scrollbar for Chat */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
