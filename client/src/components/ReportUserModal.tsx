'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface ReportUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportedUserId: string;
    reportedUserName: string;
}

export default function ReportUserModal({ isOpen, onClose, reportedUserId, reportedUserName }: ReportUserModalProps) {
    const [reason, setReason] = useState('spam');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const reasons = [
        { value: 'spam', label: 'Spam or Advertising' },
        { value: 'harassment', label: 'Harassment or Bullying' },
        { value: 'fake_profile', label: 'Fake Profile' },
        { value: 'inappropriate_content', label: 'Inappropriate Content' },
        { value: 'scam', label: 'Scam or Fraud' },
        { value: 'other', label: 'Other' }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim()) {
            toast.error('Please provide a description');
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    reportedUserId,
                    reason,
                    description
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Report submitted. Thank you for helping keep our community safe.');
                setDescription('');
                setReason('spam');
                onClose();
            } else {
                toast.error(data.message || 'Failed to submit report');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error('Failed to submit report');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal */}
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Report User
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Report <span className="font-semibold">{reportedUserName}</span> for inappropriate behavior
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Reason Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Reason for reporting
                            </label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                {reasons.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Additional details
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                maxLength={500}
                                placeholder="Please provide specific details about why you are reporting this user..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {description.length}/500 characters
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </form>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                        False reports may result in action against your account. All reports are reviewed by our moderation team.
                    </p>
                </div>
            </div>
        </div>
    );
}
