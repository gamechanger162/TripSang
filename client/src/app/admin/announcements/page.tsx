'use client';

import { useEffect, useState } from 'react';
import { useSession, getSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Announcement {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    isActive: boolean;
    createdAt: string;
}

async function fetchAuth(path: string, opts?: RequestInit) {
    let token: string | null | undefined = null;
    if (typeof window !== 'undefined') {
        const session = await getSession();
        token = (session?.user as any)?.accessToken;
        if (!token) token = localStorage.getItem('token');
    }
    return fetch(`${API_URL}${path}`, {
        ...opts,
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...opts?.headers },
    }).then(r => r.json());
}

export default function AdminAnnouncementsPage() {
    const { data: session } = useSession();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ title: '', message: '', type: 'info' as Announcement['type'] });
    const [saving, setSaving] = useState(false);

    const userRole = (session?.user as any)?.role;

    useEffect(() => {
        if (userRole === 'admin') fetchAnnouncements();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole]);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetchAuth('/api/admin/announcements');
            if (res.success) setAnnouncements(res.announcements);
        } catch { } finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingId ? `/api/admin/announcements/${editingId}` : '/api/admin/announcements';
            const res = await fetchAuth(url, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) });
            if (res.success) {
                toast.success(editingId ? 'Updated' : 'Created');
                setShowForm(false); setEditingId(null); setForm({ title: '', message: '', type: 'info' });
                fetchAnnouncements();
            } else { toast.error(res.message || 'Failed'); }
        } catch { toast.error('Failed to save'); }
        finally { setSaving(false); }
    };

    const handleToggle = async (id: string) => {
        try {
            const res = await fetchAuth(`/api/admin/announcements/${id}/toggle`, { method: 'PATCH' });
            if (res.success) { toast.success(res.message); fetchAnnouncements(); }
        } catch { toast.error('Failed'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this announcement?')) return;
        try {
            const res = await fetchAuth(`/api/admin/announcements/${id}`, { method: 'DELETE' });
            if (res.success) { toast.success('Deleted'); fetchAnnouncements(); }
        } catch { toast.error('Failed'); }
    };

    const handleEdit = (a: Announcement) => {
        setForm({ title: a.title, message: a.message, type: a.type });
        setEditingId(a._id);
        setShowForm(true);
    };

    const typeConfig: Record<string, { bg: string; text: string; border: string }> = {
        info: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
        warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
        success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
        error: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Announcements</h1>
                    <p className="text-sm text-gray-500 mt-1">Create and manage site-wide announcements</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: '', message: '', type: 'info' }); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-medium text-white hover:from-indigo-500 hover:to-purple-500 transition-all"
                >
                    <Plus size={16} />
                    New
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/[0.08] rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white">{editingId ? 'Edit' : 'Create'} Announcement</h2>
                            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-600 hover:text-gray-400 transition-colors"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Title</label>
                                <input
                                    type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required maxLength={100} placeholder="Announcement title"
                                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Message</label>
                                <textarea
                                    value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    required maxLength={500} rows={4} placeholder="Announcement message..."
                                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none transition-all"
                                />
                                <p className="text-[10px] text-gray-600 mt-1">{form.message.length}/500</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Type</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['info', 'warning', 'success', 'error'] as const).map((t) => (
                                        <button
                                            key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium border capitalize transition-all ${form.type === t
                                                ? `${typeConfig[t].bg} ${typeConfig[t].text} ${typeConfig[t].border}`
                                                : 'bg-white/[0.02] text-gray-500 border-white/[0.06] hover:border-white/[0.12]'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition-all">
                                    {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Announcements List */}
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/[0.04] rounded-xl" />)}
                </div>
            ) : announcements.length === 0 ? (
                <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] py-16 text-center">
                    <p className="text-gray-600">No announcements yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.map((a) => {
                        const tc = typeConfig[a.type] || typeConfig.info;
                        return (
                            <div key={a._id} className="rounded-xl bg-gray-900/60 border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <h3 className="text-sm font-semibold text-white truncate">{a.title}</h3>
                                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border capitalize ${tc.bg} ${tc.text} ${tc.border}`}>{a.type}</span>
                                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${a.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                                                {a.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-1.5">{a.message}</p>
                                        <p className="text-[10px] text-gray-700">{new Date(a.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => handleToggle(a._id)} className="p-1.5 rounded-md hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors" title={a.isActive ? 'Deactivate' : 'Activate'}>
                                            {a.isActive ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} />}
                                        </button>
                                        <button onClick={() => handleEdit(a)} className="p-1.5 rounded-md hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"><Pencil size={14} /></button>
                                        <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
