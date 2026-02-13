'use client';

import { useEffect, useState } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { memoryAPI, adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Image, Flag, Trash2, ChevronLeft, ChevronRight, AlertTriangle,
    Clock, CheckCircle, XCircle, Eye, MessageSquare, Heart
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Memory {
    _id: string;
    content?: string;
    author?: { _id: string; name: string; profilePicture?: string };
    photos?: { url: string }[];
    likeCount: number;
    commentCount: number;
    createdAt: string;
}

interface Report {
    _id: string;
    reportedUser: { _id: string; name: string; email: string; profilePicture?: string };
    reportedBy: { _id: string; name: string };
    reason: string;
    description: string;
    status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
    adminNotes?: string;
    createdAt: string;
}

// Helper for report endpoints (require admin auth)
async function fetchAuth(path: string, opts?: RequestInit) {
    let token: string | null | undefined = null;
    if (typeof window !== 'undefined') {
        const sess = await getSession();
        token = (sess?.user as any)?.accessToken;
        if (!token) token = localStorage.getItem('token');
    }
    return fetch(`${API_URL}${path}`, {
        ...opts,
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...opts?.headers },
    }).then(r => r.json());
}

export default function AdminContentPage() {
    const { data: session } = useSession();
    const [tab, setTab] = useState<'memories' | 'reports'>('memories');

    // Memories state
    const [memories, setMemories] = useState<Memory[]>([]);
    const [memPage, setMemPage] = useState(1);
    const [memLoading, setMemLoading] = useState(true);

    // Reports state
    const [reports, setReports] = useState<Report[]>([]);
    const [repLoading, setRepLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionReport, setActionReport] = useState<Report | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [updating, setUpdating] = useState(false);

    const userRole = (session?.user as any)?.role;

    useEffect(() => {
        if (userRole !== 'admin') return;
        if (tab === 'memories') fetchMemories();
        else fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, tab, memPage]);

    const fetchMemories = async () => {
        setMemLoading(true);
        try {
            const res = await memoryAPI.getFeed(memPage, 20);
            if (res.success) setMemories(res.memories || []);
        } catch { } finally { setMemLoading(false); }
    };

    const fetchReports = async () => {
        setRepLoading(true);
        try {
            const res = await fetchAuth('/api/reports');
            if (res.success) setReports(res.reports || []);
        } catch { } finally { setRepLoading(false); }
    };

    const handleDeleteMemory = async (id: string) => {
        if (!confirm('Delete this memory?')) return;
        try {
            const res = await memoryAPI.deleteMemory(id);
            if (res.success) { toast.success('Memory deleted'); fetchMemories(); }
        } catch { toast.error('Failed'); }
    };

    const updateReportStatus = async (id: string, newStatus: string) => {
        setUpdating(true);
        try {
            const res = await fetchAuth(`/api/reports/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus, adminNotes }),
            });
            if (res.success) { toast.success('Updated'); setActionReport(null); setAdminNotes(''); fetchReports(); }
        } catch { toast.error('Failed'); }
        finally { setUpdating(false); }
    };

    const reasonLabel: Record<string, string> = {
        spam: 'Spam', harassment: 'Harassment', fake_profile: 'Fake Profile',
        inappropriate_content: 'Inappropriate', scam: 'Scam', other: 'Other',
    };

    const statusColor = (s: string) => {
        switch (s) {
            case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'reviewed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'action_taken': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'dismissed': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const filteredReports = statusFilter === 'all' ? reports : reports.filter(r => r.status === statusFilter);
    const pendingCount = reports.filter(r => r.status === 'pending').length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
                <p className="text-sm text-gray-500 mt-1">Manage memories and user reports</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06] w-fit">
                {[
                    { key: 'memories' as const, label: 'Memories', icon: Image },
                    { key: 'reports' as const, label: 'Reports', icon: Flag, badge: pendingCount },
                ].map(({ key, label, icon: Icon, badge }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                            ${tab === key ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300'}
                        `}
                    >
                        <Icon size={14} />
                        {label}
                        {badge ? (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded-full">{badge}</span>
                        ) : null}
                    </button>
                ))}
            </div>

            {/* Memories Tab */}
            {tab === 'memories' && (
                <>
                    <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/[0.06]">
                                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Media</th>
                                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                                        <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {memLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                {[...Array(5)].map((_, j) => (
                                                    <td key={j} className="px-5 py-4"><div className="h-4 w-20 bg-white/[0.06] rounded" /></td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : memories.length === 0 ? (
                                        <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-600">No memories found</td></tr>
                                    ) : (
                                        memories.map((m) => (
                                            <tr key={m._id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                                                            <span className="text-[10px] font-bold text-indigo-300">{m.author?.name?.[0]?.toUpperCase()}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm text-white truncate">{m.author?.name}</p>
                                                            <p className="text-[10px] text-gray-600">{new Date(m.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className="text-sm text-gray-400 line-clamp-2 max-w-[200px]">{m.content || '—'}</p>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex -space-x-1.5">
                                                        {m.photos?.slice(0, 3).map((p, i) => (
                                                            <img key={i} src={p.url} alt="" className="w-7 h-7 rounded-md object-cover ring-1 ring-gray-900" />
                                                        ))}
                                                        {(m.photos?.length || 0) > 3 && (
                                                            <div className="w-7 h-7 rounded-md bg-white/[0.06] flex items-center justify-center text-[10px] text-gray-500 ring-1 ring-gray-900">
                                                                +{(m.photos?.length || 0) - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1"><Heart size={10} />{m.likeCount}</span>
                                                        <span className="flex items-center gap-1"><MessageSquare size={10} />{m.commentCount}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <button onClick={() => handleDeleteMemory(m._id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setMemPage(p => Math.max(1, p - 1))} disabled={memPage === 1} className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-500 disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
                        <span className="text-xs text-gray-600 px-3">Page {memPage}</span>
                        <button onClick={() => setMemPage(p => p + 1)} disabled={memories.length < 20} className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-500 disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
                    </div>
                </>
            )}

            {/* Reports Tab */}
            {tab === 'reports' && (
                <>
                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                    >
                        <option value="all" className="bg-gray-900">All Reports</option>
                        <option value="pending" className="bg-gray-900">Pending</option>
                        <option value="reviewed" className="bg-gray-900">Reviewed</option>
                        <option value="action_taken" className="bg-gray-900">Action Taken</option>
                        <option value="dismissed" className="bg-gray-900">Dismissed</option>
                    </select>

                    <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] divide-y divide-white/[0.04]">
                        {repLoading ? (
                            <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto" /></div>
                        ) : filteredReports.length === 0 ? (
                            <div className="py-12 text-center">
                                <Flag size={28} className="mx-auto text-gray-700 mb-3" />
                                <p className="text-gray-600">No reports found</p>
                            </div>
                        ) : (
                            filteredReports.map((r) => (
                                <div key={r._id} className="p-5 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[10px] font-bold text-red-300">{r.reportedUser?.name?.[0]?.toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{r.reportedUser?.name}</p>
                                                    <p className="text-[10px] text-gray-600">{r.reportedUser?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                                                    {reasonLabel[r.reason] || r.reason}
                                                </span>
                                                <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${statusColor(r.status)}`}>
                                                    {r.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2">{r.description}</p>
                                            <p className="text-[10px] text-gray-700 mt-1.5">Reported by {r.reportedBy?.name} · {new Date(r.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                            onClick={() => { setActionReport(r); setAdminNotes(r.adminNotes || ''); }}
                                            className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.06] text-gray-300 hover:bg-white/[0.1] hover:text-white transition-all flex-shrink-0"
                                        >
                                            Take Action
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Action Modal */}
            {actionReport && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/[0.08] rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Take Action</h2>
                        <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.06] mb-4 text-sm">
                            <p className="text-gray-400"><strong className="text-gray-300">User:</strong> {actionReport.reportedUser?.name}</p>
                            <p className="text-gray-400"><strong className="text-gray-300">Reason:</strong> {reasonLabel[actionReport.reason] || actionReport.reason}</p>
                        </div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Admin Notes</label>
                        <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            rows={3}
                            placeholder="Notes about your decision..."
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none mb-4"
                        />
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => updateReportStatus(actionReport._id, 'reviewed')} disabled={updating} className="px-3 py-1.5 rounded-lg text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 disabled:opacity-50 transition-all">Mark Reviewed</button>
                            <button onClick={() => updateReportStatus(actionReport._id, 'action_taken')} disabled={updating} className="px-3 py-1.5 rounded-lg text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-50 transition-all">Action Taken</button>
                            <button onClick={() => updateReportStatus(actionReport._id, 'dismissed')} disabled={updating} className="px-3 py-1.5 rounded-lg text-xs bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 disabled:opacity-50 transition-all">Dismiss</button>
                            <button onClick={() => setActionReport(null)} className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-all ml-auto">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
