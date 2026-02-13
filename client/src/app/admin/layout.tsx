'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
    LayoutDashboard, Users, Map, FileText, CreditCard,
    Megaphone, ShieldCheck, Settings, Menu, X, ChevronLeft,
    LogOut
} from 'lucide-react';

const navItems = [
    { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/trips', label: 'Trips', icon: Map },
    { href: '/admin/content', label: 'Content', icon: FileText },
    { href: '/admin/payments', label: 'Payments', icon: CreditCard },
    { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/admin/verify', label: 'Verification', icon: ShieldCheck },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated') {
            toast.error('Please login');
            router.push('/auth/signin');
            return;
        }
        const userRole = (session?.user as any)?.role;
        if (status === 'authenticated' && userRole !== 'admin') {
            toast.error('Access denied. Admin only.');
            router.push('/');
        }
    }, [status, session?.user, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500 border-t-transparent mx-auto mb-4" />
                    <p className="text-gray-400">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    if ((session?.user as any)?.role !== 'admin') return null;

    return (
        <div className="min-h-screen bg-gray-950 flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col
                    bg-gray-900/80 backdrop-blur-xl border-r border-white/[0.06]
                    transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${collapsed ? 'w-[72px]' : 'w-64'}
                `}
            >
                {/* Logo area */}
                <div className={`flex items-center h-16 px-4 border-b border-white/[0.06] ${collapsed ? 'justify-center' : 'justify-between'}`}>
                    {!collapsed && (
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <ShieldCheck size={16} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-white leading-none">TripSang</h1>
                                <p className="text-[10px] text-gray-500 mt-0.5">Admin Panel</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-gray-500 hover:text-gray-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                                    ${isActive
                                        ? 'bg-indigo-500/15 text-indigo-400 shadow-sm shadow-indigo-500/5'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                                    }
                                    ${collapsed ? 'justify-center px-0' : ''}
                                `}
                                title={collapsed ? item.label : undefined}
                            >
                                <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom section */}
                <div className={`p-3 border-t border-white/[0.06] ${collapsed ? 'flex justify-center' : ''}`}>
                    <Link
                        href="/"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition-all
                            ${collapsed ? 'justify-center px-0' : ''}
                        `}
                        title={collapsed ? 'Back to Site' : undefined}
                    >
                        <LogOut size={18} className="flex-shrink-0" />
                        {!collapsed && <span>Back to Site</span>}
                    </Link>
                </div>
            </aside>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar (mobile) */}
                <header className="lg:hidden sticky top-0 z-30 h-14 bg-gray-900/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 rounded-lg hover:bg-white/[0.06] text-gray-400"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="ml-3 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <ShieldCheck size={12} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold text-white">Admin</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
