'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Flag, User, Calendar, AlertTriangle, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Report {
    _id: string;
    reportedUser: {
        _id: string;
        name: string;
        email: string;
        profilePicture?: string;
    };
    reportedBy: {
        _id: string;
        name: string;
        email: string;
    };
    reason: string;
    description: string;
    status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
    adminNotes?: string;
    reviewedBy?: {
        _id: string;
        name: string;
    };
    reviewedAt?: string;
    createdAt: string;
}

export default function AdminReportsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [updating, setUpdating] = useState(false);

    // Check admin access
    useEffect(() => {
        if (status === 'loading') return;

        if (status === 'unauthenticated') {
            toast.error('Please login');
            router.push('/auth/signin');
            return;
        }

        if (session?.user?.role !== 'admin') {
            toast.error('Access denied. Admin only.');
            router.push('/');
            return;
        }

        fetchReports();
    }, [status, session, router]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const session = await getSession();
            let token = session?.user?.accessToken;

            if (!token && typeof window !== 'undefined') {
                token = localStorage.getItem('token') || undefined;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setReports(data.reports);
            } else {
                toast.error(data.message || 'Failed to load reports');
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const updateReportStatus = async (reportId: string, newStatus: string) => {
        try {
            setUpdating(true);
            const session = await getSession();
            let token = session?.user?.accessToken;

            if (!token && typeof window !== 'undefined') {
                token = localStorage.getItem('token') || undefined;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${reportId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: newStatus,
                    adminNotes: adminNotes
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Report status updated');
                setSelectedReport(null);
                setAdminNotes('');
                fetchReports();
            } else {
                toast.error(data.message || 'Failed to update report');
            }
        } catch (error) {
            console.error('Error updating report:', error);
            toast.error('Failed to update report');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'reviewed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'action_taken': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'dismissed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'reviewed': return <Eye className="w-4 h-4" />;
            case 'action_taken': return <CheckCircle className="w-4 h-4" />;
            case 'dismissed': return <XCircle className="w-4 h-4" />;
            default: return <AlertTriangle className="w-4 h-4" />;
        }
    };

    const getReasonLabel = (reason: string) => {
        const labels: Record<string, string> = {
            'spam': 'Spam or Advertising',
            'harassment': 'Harassment or Bullying',
            'fake_profile': 'Fake Profile',
            'inappropriate_content': 'Inappropriate Content',
            'scam': 'Scam or Fraud',
            'other': 'Other'
        };
        return labels[reason] || reason;
    };

    const filteredReports = statusFilter === 'all'
        ? reports
        : reports.filter(r => r.status === statusFilter);

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Flag className="w-8 h-8 text-red-500" />
                            User Reports
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage user reports and take appropriate action
                        </p>
                    </div>
                    <Link
                        href="/admin/dashboard"
                        className="btn-outline"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{reports.length}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Reports</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                        <div className="text-2xl font-bold text-yellow-600">{reports.filter(r => r.status === 'pending').length}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                        <div className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === 'action_taken').length}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Action Taken</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                        <div className="text-2xl font-bold text-gray-600">{reports.filter(r => r.status === 'dismissed').length}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Dismissed</div>
                    </div>
                </div>

                {/* Filter */}
                <div className="mb-6">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="all">All Reports</option>
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="action_taken">Action Taken</option>
                        <option value="dismissed">Dismissed</option>
                    </select>
                </div>

                {/* Reports List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    {filteredReports.length === 0 ? (
                        <div className="p-12 text-center">
                            <Flag className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Reports</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {statusFilter === 'all' ? 'No reports have been submitted yet' : `No ${statusFilter} reports`}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredReports.map((report) => (
                                <div key={report._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            {/* Reported User */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold">
                                                    {report.reportedUser?.profilePicture ? (
                                                        <img src={report.reportedUser.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        report.reportedUser?.name?.[0] || '?'
                                                    )}
                                                </div>
                                                <div>
                                                    <Link
                                                        href={`/profile/${report.reportedUser?._id}`}
                                                        className="font-semibold text-gray-900 dark:text-white hover:text-primary-600"
                                                    >
                                                        {report.reportedUser?.name || 'Unknown User'}
                                                    </Link>
                                                    <p className="text-sm text-gray-500">{report.reportedUser?.email}</p>
                                                </div>
                                            </div>

                                            {/* Reason & Description */}
                                            <div className="mb-3">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    {getReasonLabel(report.reason)}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                                                {report.description}
                                            </p>

                                            {/* Reporter & Date */}
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    Reported by: {report.reportedBy?.name}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* Admin Notes */}
                                            {report.adminNotes && (
                                                <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                    <p className="text-xs font-medium text-gray-500 mb-1">Admin Notes:</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{report.adminNotes}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex flex-col items-end gap-3">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                                {getStatusIcon(report.status)}
                                                {report.status.replace('_', ' ')}
                                            </span>

                                            <button
                                                onClick={() => {
                                                    setSelectedReport(report);
                                                    setAdminNotes(report.adminNotes || '');
                                                }}
                                                className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                                            >
                                                Take Action
                                            </button>

                                            <Link
                                                href={`/profile/${report.reportedUser?._id}`}
                                                className="text-xs text-primary-600 hover:text-primary-700"
                                            >
                                                View Profile →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50"
                            onClick={() => setSelectedReport(null)}
                        ></div>
                        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Take Action on Report
                            </h3>

                            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Reported User:</strong> {selectedReport.reportedUser?.name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Reason:</strong> {getReasonLabel(selectedReport.reason)}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Admin Notes
                                </label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Add notes about your decision..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => updateReportStatus(selectedReport._id, 'reviewed')}
                                    disabled={updating}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                                >
                                    Mark Reviewed
                                </button>
                                <button
                                    onClick={() => updateReportStatus(selectedReport._id, 'action_taken')}
                                    disabled={updating}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                                >
                                    Action Taken
                                </button>
                                <button
                                    onClick={() => updateReportStatus(selectedReport._id, 'dismissed')}
                                    disabled={updating}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
