'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { adminAPI } from '@/lib/api';
import Link from 'next/link';
import {
    Users, Map, CreditCard, TrendingUp,
    UserPlus, ArrowUpRight, Activity
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Stats {
    users: { total: number; byRole: { _id: string; count: number }[] };
    trips: { total: number; active: number };
    payments: { total: number; revenue: number; byType?: Record<string, { total: number; count: number }> };
    recentUsers?: { _id: string; name: string; email: string; createdAt: string }[];
}

export default function AdminDashboardPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const userRole = (session?.user as any)?.role;

    useEffect(() => {
        if (userRole === 'admin') {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole]);

    const loadData = async () => {
        try {
            const res = await adminAPI.getStats();
            if (res.success) setStats(res.stats);
        } catch (err) {
            console.error('Failed to load stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-white/[0.06] rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-white/[0.06] rounded-xl" />
                    ))}
                </div>
                <div className="h-64 bg-white/[0.06] rounded-xl" />
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Users',
            value: stats?.users.total || 0,
            icon: Users,
            gradient: 'from-blue-500 to-cyan-500',
            bgGlow: 'shadow-blue-500/10',
            href: '/admin/users',
        },
        {
            label: 'Active Trips',
            value: stats?.trips.active || 0,
            icon: Map,
            gradient: 'from-emerald-500 to-teal-500',
            bgGlow: 'shadow-emerald-500/10',
            href: '/admin/trips',
        },
        {
            label: 'Total Revenue',
            value: `₹${stats?.payments.revenue || 0}`,
            icon: CreditCard,
            gradient: 'from-purple-500 to-pink-500',
            bgGlow: 'shadow-purple-500/10',
            href: '/admin/payments',
        },
        {
            label: 'Total Trips',
            value: stats?.trips.total || 0,
            icon: TrendingUp,
            gradient: 'from-orange-500 to-amber-500',
            bgGlow: 'shadow-orange-500/10',
            href: '/admin/trips',
        },
    ];

    const roleData = stats?.users.byRole || [];
    const userCount = roleData.find(r => r._id === 'user')?.count || 0;
    const guideCount = roleData.find(r => r._id === 'guide')?.count || 0;
    const adminCount = roleData.find(r => r._id === 'admin')?.count || 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Overview</h1>
                <p className="text-sm text-gray-500 mt-1">Welcome back. Here&apos;s what&apos;s happening on TripSang.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.label}
                            href={card.href}
                            className={`group relative overflow-hidden rounded-xl bg-gray-900/60 border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all duration-300 shadow-lg ${card.bgGlow}`}
                        >
                            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 group-hover:opacity-20 transition-opacity blur-xl`} />
                            <div className="relative">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3`}>
                                    <Icon size={18} className="text-white" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                                <div className="flex items-end justify-between mt-1">
                                    <p className="text-2xl font-bold text-white">{card.value}</p>
                                    <ArrowUpRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Role Breakdown + Quick Actions + Recent Users */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Role Breakdown */}
                <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] p-6">
                    <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity size={16} className="text-indigo-400" />
                        User Breakdown
                    </h2>
                    <div className="space-y-4">
                        {[
                            { label: 'Regular Users', count: userCount, color: 'bg-blue-500' },
                            { label: 'Guides', count: guideCount, color: 'bg-emerald-500' },
                            { label: 'Admins', count: adminCount, color: 'bg-purple-500' },
                        ].map((item) => {
                            const total = stats?.users.total || 1;
                            const pct = Math.round((item.count / total) * 100);
                            return (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between text-sm mb-1.5">
                                        <span className="text-gray-400">{item.label}</span>
                                        <span className="text-white font-medium">{item.count}</span>
                                    </div>
                                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${item.color} rounded-full transition-all duration-700`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] p-6">
                    <h2 className="text-sm font-semibold text-white mb-4">Quick Actions</h2>
                    <div className="space-y-2">
                        {[
                            { label: 'Manage Users', href: '/admin/users', icon: Users },
                            { label: 'View Payments', href: '/admin/payments', icon: CreditCard },
                            { label: 'Create Announcement', href: '/admin/announcements', icon: UserPlus },
                            { label: 'Review Verifications', href: '/admin/verify', icon: Activity },
                        ].map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link
                                    key={action.label}
                                    href={action.href}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all"
                                >
                                    <Icon size={16} className="text-gray-600" />
                                    {action.label}
                                    <ArrowUpRight size={14} className="ml-auto text-gray-700" />
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Users */}
                <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] p-6">
                    <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <UserPlus size={16} className="text-emerald-400" />
                        Recent Signups
                    </h2>
                    <div className="space-y-3">
                        {(stats?.recentUsers || []).map((user) => (
                            <div key={user._id} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/[0.08]">
                                    <span className="text-xs font-semibold text-indigo-300">{user.name?.[0]?.toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                                </div>
                                <span className="text-[10px] text-gray-600 whitespace-nowrap">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                        {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                            <p className="text-sm text-gray-600 text-center py-4">No recent signups</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Type Breakdown */}
            {stats?.payments.byType && Object.keys(stats.payments.byType).length > 0 && (
                <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] p-6">
                    <h2 className="text-sm font-semibold text-white mb-4">Revenue by Type</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {Object.entries(stats.payments.byType).map(([type, data]) => (
                            <div key={type} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                    {type.replace(/_/g, ' ')}
                                </p>
                                <p className="text-lg font-bold text-white">₹{data.total}</p>
                                <p className="text-xs text-gray-600 mt-0.5">{data.count} payments</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
