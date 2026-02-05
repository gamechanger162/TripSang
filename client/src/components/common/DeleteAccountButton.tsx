'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { userAPI } from '@/lib/api';

export default function DeleteAccountButton() {
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') {
            toast.error('Please type DELETE to confirm');
            return;
        }

        setIsDeleting(true);
        try {
            const response = await userAPI.deleteAccount();
            if (response.success) {
                toast.success('Account deleted successfully');
                // Sign out and redirect to home
                await signOut({ callbackUrl: '/' });
            } else {
                throw new Error(response.message || 'Failed to delete account');
            }
        } catch (error: any) {
            console.error('Delete account error:', error);
            toast.error(error.message || 'Failed to delete account');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!showConfirm) {
        return (
            <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
                <Trash2 size={18} />
                Delete Account
            </button>
        );
    }

    return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl space-y-4">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-200">
                    <AlertTriangle size={20} />
                </div>
                <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-200">Delete Your Account?</h3>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                        This action is <strong>permanent</strong> and cannot be undone. All your trips, messages, reviews, and data will be deleted.
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                    Type <code className="bg-red-100 dark:bg-red-800 px-1 rounded">DELETE</code> to confirm
                </label>
                <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                />
            </div>

            <div className="flex gap-3">
                <button
                    onClick={() => {
                        setShowConfirm(false);
                        setConfirmText('');
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting || confirmText !== 'DELETE'}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isDeleting ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Deleting...
                        </>
                    ) : (
                        <>
                            <Trash2 size={16} />
                            Delete Forever
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
