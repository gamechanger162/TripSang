'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { adminAPI } from '@/lib/api';

export default function AdminVerificationDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'aadhaar' | 'pan' | 'all'>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
            router.push('/dashboard');
            toast.error('Access denied');
        } else if (status === 'authenticated' && session?.user?.role === 'admin') {
            fetchRequests();
        }
    }, [status, session, router]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getVerificationRequests();
            if (response.success) {
                setRequests(response.requests);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to load verification requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId: string, action: 'approve' | 'reject', reason?: string) => {
        try {
            setActionLoading(userId);
            const response = await adminAPI.handleVerificationAction(userId, action, reason);

            if (response.success) {
                toast.success(`Verification ${action}ed successfully`);
                setRequests(requests.filter(req => req._id !== userId));
                if (rejectingId === userId) {
                    setRejectingId(null);
                    setRejectReason('');
                }
            } else {
                toast.error(response.message || 'Action failed');
            }
        } catch (error) {
            console.error('Action error:', error);
            toast.error('Failed to process request');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
                            Verification Requests
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Review pending ID verification requests
                        </p>
                    </div>
                </div>

                {requests.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pending requests</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">All verification requests have been processed.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {requests.map((req) => (
                            <div key={req._id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={req.profilePicture || `https://ui-avatars.com/api/?name=${req.name}`} alt="" className="h-full w-full object-cover" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{req.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{req.email}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${req.idType === 'aadhaar' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {req.idType ? req.idType.toUpperCase() : 'ID'}
                                    </span>
                                </div>

                                <div className="p-4 flex-grow bg-gray-100 dark:bg-gray-900 grid gap-2">
                                    {/* Front Side */}
                                    <div className="aspect-video relative group bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
                                        {req.idDocumentFront ? (
                                            <a href={req.idDocumentFront} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={req.idDocumentFront} alt="ID Front" className="w-full h-full object-contain" />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                                                    <span className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100">Front - Click to Zoom</span>
                                                </div>
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-xs flex items-center justify-center h-full">No Front Doc</span>
                                        )}
                                    </div>

                                    {/* Back Side (only for Aadhaar usually, or if present) */}
                                    {req.idDocumentBack && (
                                        <div className="aspect-video relative group bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
                                            <a href={req.idDocumentBack} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={req.idDocumentBack} alt="ID Back" className="w-full h-full object-contain" />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                                                    <span className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100">Back - Click to Zoom</span>
                                                </div>
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
                                    {rejectingId === req._id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                className="w-full p-2 border rounded-md text-sm dark:bg-gray-800 dark:text-white"
                                                placeholder="Reason for rejection..."
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                rows={2}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAction(req._id, 'reject', rejectReason)}
                                                    disabled={!rejectReason || actionLoading === req._id}
                                                    className="flex-1 bg-red-600 text-white text-xs px-3 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    Confirm Reject
                                                </button>
                                                <button
                                                    onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                                    className="flex-1 bg-gray-300 text-gray-700 text-xs px-3 py-2 rounded hover:bg-gray-400"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleAction(req._id, 'approve')}
                                                disabled={actionLoading === req._id}
                                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => setRejectingId(req._id)}
                                                disabled={actionLoading === req._id}
                                                className="flex-1 bg-white border border-red-300 text-red-600 px-4 py-2 rounded hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
