'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle, Users, Compass, Settings,
    LogOut, ChevronLeft, ChevronRight, Plus, Hash
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function ChatSidebar() {
    const { isSidebarOpen, setSidebarOpen } = useNavigation();
    const pathname = usePathname();
    const { data: session } = useSession();

    const navItems = [
        { icon: MessageCircle, label: 'Chats', href: '/app', color: 'text-cyan-400' },
        { icon: Users, label: 'Squads', href: '/app/squads', color: 'text-violet-400' },
        { icon: Hash, label: 'Communities', href: '/app/communities', color: 'text-pink-400' },
        { icon: Compass, label: 'Explore', href: '/app/explore', color: 'text-emerald-400' },
    ];

    return (
        <motion.div
            initial={false}
            animate={{
                width: isSidebarOpen ? 280 : 80
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-full border-r border-white/5 bg-zinc-900/50 backdrop-blur-xl flex flex-col relative z-20"
        >
            {/* Toggle Button */}
            <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors z-30"
            >
                {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>

            {/* Profile Section */}
            <div className={`p-4 flex items-center gap-3 border-b border-white/5 ${!isSidebarOpen && 'justify-center'}`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/20 shrink-0">
                    {session?.user?.name?.[0] || 'T'}
                </div>

                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="overflow-hidden whitespace-nowrap"
                        >
                            <h3 className="font-semibold text-white text-sm truncate">{session?.user?.name}</h3>
                            <p className="text-xs text-zinc-500 truncate">Online</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all group relative overflow-hidden ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 bg-white/5 rounded-xl"
                                />
                            )}
                            <item.icon size={22} className={`${isActive ? item.color : 'text-zinc-500 group-hover:text-zinc-300'} transition-colors relative z-10`} />

                            <AnimatePresence>
                                {isSidebarOpen && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="font-medium text-sm whitespace-nowrap relative z-10"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    )
                })}
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-white/5 flex flex-col gap-2">
                <Link
                    href="/app/settings"
                    className={`flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-zinc-400 hover:text-white ${!isSidebarOpen && 'justify-center'}`}
                >
                    <Settings size={20} />
                    {isSidebarOpen && <span className="text-sm font-medium">Settings</span>}
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className={`flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-colors text-zinc-400 hover:text-red-400 ${!isSidebarOpen && 'justify-center'}`}
                >
                    <LogOut size={20} />
                    {isSidebarOpen && <span className="text-sm font-medium">Log Out</span>}
                </button>
            </div>
        </motion.div>
    );
}
