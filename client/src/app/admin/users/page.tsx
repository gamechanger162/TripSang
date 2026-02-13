'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Search, Shield, Smartphone, Crown, Ban, UserCheck, ChevronLeft, ChevronRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'guide';
    isActive: boolean;
    isMobileVerified: boolean;
    createdAt: string;
    profilePicture?: string;
    verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
}

export default function AdminUsersPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');

    // Grant Premium modal
    const [grantModal, setGrantModal] = useState<{ user: User; days: number } | null>(null);
    const [granting, setGranting] = useState(false);

    // Debounce search
    useEffect(() => {
        const timeout = setTimeout(() => setSearchDebounce(searchQuery), 400);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const userRole = (session?.user as any)?.role;

    useEffect(() => {
        if (userRole === 'admin') {
            fetchUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, page, roleFilter, searchDebounce]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const filters: any = { page, limit: 20 };
            if (roleFilter !== 'all') filters.role = roleFilter;
            if (searchDebounce) filters.search = searchDebounce;

            const res = await adminAPI.getUsers(filters);
            if (res.success) {
                setUsers(res.users);
                setTotalUsers(res.pagination.totalUsers);
            }
        } catch (err) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleBlockUser = async (userId: string, block: boolean) => {
        try {
            const res = await adminAPI.blockUser(userId, block);
            if (res.success) {
                toast.success(block ? 'User blocked' : 'User unblocked');
                fetchUsers();
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update user');
        }
    };

    const handleUpdateRole = async (userId: string, newRole: 'user' | 'admin' | 'guide') => {
        try {
            const res = await adminAPI.updateUserRole(userId, newRole);
            if (res.success) {
                toast.success(`Role updated to ${newRole}`);
                fetchUsers();
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update role');
        }
    };

    const handleGrantPremium = async () => {
        if (!grantModal) return;
        setGranting(true);
        try {
            const res = await adminAPI.grantPremium(grantModal.user._id, grantModal.days);
            if (res.success) {
                toast.success(`Premium granted to ${grantModal.user.name}`);
                setGrantModal(null);
                fetchUsers();
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to grant premium');
        } finally {
            setGranting(false);
        }
    };

    const totalPages = Math.ceil(totalUsers / 20);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Users</h1>
                    <p className="text-sm text-gray-500 mt-1">{totalUsers} total users</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        placeholder="Search by name or email..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                >
                    <option value="all" className="bg-gray-900">All Roles</option>
                    <option value="user" className="bg-gray-900">Users</option>
                    <option value="guide" className="bg-gray-900">Guides</option>
                    <option value="admin" className="bg-gray-900">Admins</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/[0.06]">
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-5 py-4"><div className="h-4 w-32 bg-white/[0.06] rounded" /></td>
                                        <td className="px-5 py-4"><div className="h-4 w-16 bg-white/[0.06] rounded" /></td>
                                        <td className="px-5 py-4"><div className="h-4 w-16 bg-white/[0.06] rounded" /></td>
                                        <td className="px-5 py-4"><div className="h-4 w-20 bg-white/[0.06] rounded" /></td>
                                        <td className="px-5 py-4"><div className="h-4 w-24 bg-white/[0.06] rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-gray-600">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-semibold text-indigo-300">{user.name?.[0]?.toUpperCase()}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleUpdateRole(user._id, e.target.value as any)}
                                                className="text-xs px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-gray-300 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                                            >
                                                <option value="user" className="bg-gray-900">User</option>
                                                <option value="guide" className="bg-gray-900">Guide</option>
                                                <option value="admin" className="bg-gray-900">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${user.isActive
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    }`}>
                                                    {user.isActive ? 'Active' : 'Blocked'}
                                                </span>
                                                {user.isMobileVerified && (
                                                    <span title="Phone Verified"><Smartphone size={12} className="text-blue-400" /></span>
                                                )}
                                                {user.verificationStatus === 'verified' && (
                                                    <span title="ID Verified"><Shield size={12} className="text-emerald-400" /></span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setGrantModal({ user, days: 30 })}
                                                    className="p-1.5 rounded-md hover:bg-purple-500/10 text-purple-400 transition-colors"
                                                    title="Grant Premium"
                                                >
                                                    <Crown size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleBlockUser(user._id, user.isActive)}
                                                    className={`p-1.5 rounded-md transition-colors ${user.isActive
                                                        ? 'hover:bg-red-500/10 text-red-400'
                                                        : 'hover:bg-emerald-500/10 text-emerald-400'
                                                        }`}
                                                    title={user.isActive ? 'Block' : 'Unblock'}
                                                >
                                                    {user.isActive ? <Ban size={14} /> : <UserCheck size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
                        <p className="text-xs text-gray-600">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-md hover:bg-white/[0.06] text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= totalPages}
                                className="p-1.5 rounded-md hover:bg-white/[0.06] text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Grant Premium Modal */}
            {grantModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/[0.08] rounded-xl shadow-2xl max-w-sm w-full p-6">
                        <h2 className="text-lg font-bold text-white mb-1">Grant Premium</h2>
                        <p className="text-sm text-gray-500 mb-5">to {grantModal.user.name}</p>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Duration (days)</label>
                        <input
                            type="number"
                            value={grantModal.days}
                            onChange={(e) => setGrantModal({ ...grantModal, days: parseInt(e.target.value) || 1 })}
                            min="1"
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/50 mb-5"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setGrantModal(null)}
                                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGrantPremium}
                                disabled={granting}
                                className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
                            >
                                {granting ? 'Granting...' : 'Grant Premium'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
