'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    ShieldCheck, ShieldX, ChevronLeft, ChevronRight, FileText, X
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface VerificationRequest {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    verificationStatus: string;
    verificationDocuments?: { front?: string; back?: string; selfie?: string };
    createdAt: string;
}

export default function AdminVerificationPage() {
    const { data: session } = useSession();
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<VerificationRequest | null>(null);
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const userRole = (session?.user as any)?.role;

    useEffect(() => {
        if (userRole === 'admin') fetchRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, page]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getVerificationRequests(page, 20);
            if (res.success) setRequests(res.requests || []);
        } catch { } finally { setLoading(false); }
    };

    const handleAction = async (action: 'approve' | 'reject') => {
        if (!selected) return;
        if (action === 'reject' && !reason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }
        setProcessing(true);
        try {
            const res = await adminAPI.handleVerificationAction(selected._id, action, reason || undefined);
            if (res.success) {
                toast.success(action === 'approve' ? 'Approved' : 'Rejected');
                setSelected(null);
                setReason('');
                fetchRequests();
            }
        } catch (err: any) { toast.error(err.message || 'Failed'); }
        finally { setProcessing(false); }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">ID Verification</h1>
                <p className="text-sm text-gray-500 mt-1">Review and process identity verification requests</p>
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/[0.04] rounded-xl" />)}
                </div>
            ) : requests.length === 0 ? (
                <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] py-16 text-center">
                    <ShieldCheck size={32} className="mx-auto text-gray-700 mb-3" />
                    <p className="text-gray-600">No pending verification requests</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map((req) => (
                        <div key={req._id} className="rounded-xl bg-gray-900/60 border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                                        {req.profilePicture ? (
                                            <img src={req.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-amber-300">{req.name?.[0]?.toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{req.name}</p>
                                        <p className="text-xs text-gray-600 truncate">{req.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        {req.verificationStatus}
                                    </span>
                                    <button
                                        onClick={() => { setSelected(req); setReason(''); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.06] text-gray-300 hover:bg-white/[0.1] hover:text-white transition-all"
                                    >
                                        <FileText size={12} />
                                        Review
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-500 disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
                <span className="text-xs text-gray-600 px-3">Page {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={requests.length < 20} className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-500 disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
            </div>

            {/* Review Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/[0.08] rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white">Review: {selected.name}</h2>
                            <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-gray-400 transition-colors"><X size={18} /></button>
                        </div>

                        {/* User info */}
                        <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.06] mb-4 text-sm">
                            <p className="text-gray-400"><strong className="text-gray-300">Name:</strong> {selected.name}</p>
                            <p className="text-gray-400"><strong className="text-gray-300">Email:</strong> {selected.email}</p>
                            <p className="text-gray-400"><strong className="text-gray-300">Submitted:</strong> {new Date(selected.createdAt).toLocaleDateString()}</p>
                        </div>

                        {/* Documents */}
                        {selected.verificationDocuments && (
                            <div className="mb-5">
                                <p className="text-xs font-medium text-gray-400 mb-3">Submitted Documents</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {selected.verificationDocuments.front && (
                                        <div className="rounded-lg overflow-hidden border border-white/[0.08]">
                                            <p className="text-[10px] text-gray-500 px-3 py-1.5 bg-white/[0.04]">Front</p>
                                            <img src={selected.verificationDocuments.front} alt="Front" className="w-full h-40 object-cover" />
                                        </div>
                                    )}
                                    {selected.verificationDocuments.back && (
                                        <div className="rounded-lg overflow-hidden border border-white/[0.08]">
                                            <p className="text-[10px] text-gray-500 px-3 py-1.5 bg-white/[0.04]">Back</p>
                                            <img src={selected.verificationDocuments.back} alt="Back" className="w-full h-40 object-cover" />
                                        </div>
                                    )}
                                    {selected.verificationDocuments.selfie && (
                                        <div className="rounded-lg overflow-hidden border border-white/[0.08]">
                                            <p className="text-[10px] text-gray-500 px-3 py-1.5 bg-white/[0.04]">Selfie</p>
                                            <img src={selected.verificationDocuments.selfie} alt="Selfie" className="w-full h-40 object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Rejection reason */}
                        <div className="mb-5">
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Reason (required for rejection)</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                                placeholder="Enter reason for rejection..."
                                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none transition-all"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setSelected(null)}
                                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction('reject')}
                                disabled={processing}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-all"
                            >
                                <ShieldX size={14} />
                                Reject
                            </button>
                            <button
                                onClick={() => handleAction('approve')}
                                disabled={processing}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-50 transition-all"
                            >
                                <ShieldCheck size={14} />
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
