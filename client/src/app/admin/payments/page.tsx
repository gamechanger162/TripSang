'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
    CreditCard, TrendingUp, ChevronLeft, ChevronRight, Search
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Payment {
    _id: string;
    user?: { _id: string; name: string; email: string };
    amount: number;
    currency: string;
    type: string;
    status: string;
    createdAt: string;
    razorpayPaymentId?: string;
}

async function fetchWithAuth(path: string) {
    const res = await fetch(`${API_URL}${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
}

export default function AdminPaymentsPage() {
    const { data: session } = useSession();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const userRole = (session?.user as any)?.role;

    useEffect(() => {
        if (userRole === 'admin') {
            fetchPayments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, page, typeFilter, statusFilter]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', String(page));
            params.append('limit', '20');
            if (typeFilter) params.append('type', typeFilter);
            if (statusFilter) params.append('status', statusFilter);

            const res = await fetchWithAuth(`/api/payments/admin/all?${params.toString()}`);
            if (res.success) {
                setPayments(res.payments || []);
                setTotalRevenue(res.totalRevenue || 0);
                setTotalCount(res.totalCount || 0);
            }
        } catch (err) {
            toast.error('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'success': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const typeLabel = (type: string) => type.replace(/_/g, ' ');

    const totalPages = Math.ceil(totalCount / 20);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Payments</h1>
                <p className="text-sm text-gray-500 mt-1">Revenue tracking and payment history</p>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <TrendingUp size={16} className="text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-white">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <CreditCard size={16} className="text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Total Payments</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalCount}</p>
                </div>
                <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <TrendingUp size={16} className="text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Avg. Payment</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        ₹{totalCount > 0 ? Math.round(totalRevenue / totalCount).toLocaleString() : 0}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                >
                    <option value="" className="bg-gray-900">All Types</option>
                    <option value="signup_fee" className="bg-gray-900">Signup Fee</option>
                    <option value="premium_subscription" className="bg-gray-900">Subscription</option>
                    <option value="one_time_premium" className="bg-gray-900">One-Time Premium</option>
                    <option value="guide_commission" className="bg-gray-900">Guide Commission</option>
                    <option value="trip_booking" className="bg-gray-900">Trip Booking</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                >
                    <option value="" className="bg-gray-900">All Status</option>
                    <option value="success" className="bg-gray-900">Success</option>
                    <option value="pending" className="bg-gray-900">Pending</option>
                    <option value="failed" className="bg-gray-900">Failed</option>
                </select>
            </div>

            {/* Payments Table */}
            <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/[0.06]">
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(5)].map((_, j) => (
                                            <td key={j} className="px-5 py-4"><div className="h-4 w-20 bg-white/[0.06] rounded" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-gray-600">No payments found</td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-3.5">
                                            <p className="text-sm text-white">{payment.user?.name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-600">{payment.user?.email || 'N/A'}</p>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm font-medium text-white">
                                            ₹{payment.amount}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs text-gray-400 capitalize">{typeLabel(payment.type)}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${statusColor(payment.status)}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-gray-500">
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
                        <p className="text-xs text-gray-600">Page {page} of {totalPages}</p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-md hover:bg-white/[0.06] text-gray-500 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= totalPages}
                                className="p-1.5 rounded-md hover:bg-white/[0.06] text-gray-500 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
