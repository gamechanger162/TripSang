'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Announcement {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    isActive: boolean;
    createdAt: string;
}

export default function AnnouncementsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info' as 'info' | 'warning' | 'success' | 'error',
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'loading') return;

        const userRole = (session?.user as any)?.role;
        if (status === 'unauthenticated' || (status === 'authenticated' && userRole !== 'admin')) {
            router.push('/');
            return;
        }
        if (status === 'authenticated' && userRole === 'admin') {
            fetchAnnouncements();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, session?.user]);

    const fetchAnnouncements = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/announcements`, {
                headers: {
                    'Authorization': `Bearer ${session?.user?.accessToken}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setAnnouncements(data.announcements);
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
            toast.error('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingId
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/announcements/${editingId}`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/announcements`;

            const response = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.user?.accessToken}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(editingId ? 'Announcement updated!' : 'Announcement created!');
                fetchAnnouncements();
                setShowForm(false);
                setFormData({ title: '', message: '', type: 'info' });
                setEditingId(null);
            } else {
                toast.error(data.message || 'Failed to save announcement');
            }
        } catch (error) {
            console.error('Error saving announcement:', error);
            toast.error('Failed to save announcement');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/announcements/${id}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${session?.user?.accessToken}`
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                fetchAnnouncements();
            }
        } catch (error) {
            console.error('Error toggling announcement:', error);
            toast.error('Failed to toggle announcement');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/announcements/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session?.user?.accessToken}`
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Announcement deleted');
                fetchAnnouncements();
            }
        } catch (error) {
            console.error('Error deleting announcement:', error);
            toast.error('Failed to delete announcement');
        }
    };

    const handleEdit = (announcement: Announcement) => {
        setFormData({
            title: announcement.title,
            message: announcement.message,
            type: announcement.type
        });
        setEditingId(announcement._id);
        setShowForm(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900 px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Announcements Manager
                    </h1>
                    <button
                        onClick={() => {
                            setShowForm(!showForm);
                            setEditingId(null);
                            setFormData({ title: '', message: '', type: 'info' });
                        }}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                        {showForm ? 'Cancel' : 'New Announcement'}
                    </button>
                </div>

                {/* Create/Edit Form */}
                {showForm && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {editingId ? 'Edit Announcement' : 'Create Announcement'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    maxLength={100}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Enter announcement title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Message
                                </label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    maxLength={500}
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Enter announcement message"
                                />
                                <p className="text-xs text-gray-500 mt-1">{formData.message.length}/500</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="success">Success</option>
                                    <option value="error">Error</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                            >
                                {editingId ? 'Update Announcement' : 'Create Announcement'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Announcements List */}
                <div className="space-y-4">
                    {announcements.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                            <p className="text-gray-500 dark:text-gray-400">No announcements yet</p>
                        </div>
                    ) : (
                        announcements.map((announcement) => (
                            <div
                                key={announcement._id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {announcement.title}
                                            </h3>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${announcement.type === 'info' ? 'bg-blue-100 text-blue-800' :
                                                announcement.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                    announcement.type === 'success' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {announcement.type}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${announcement.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {announcement.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                                            {announcement.message}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Created: {new Date(announcement.createdAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleEdit(announcement)}
                                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggle(announcement._id)}
                                            className={`px-3 py-1 text-sm rounded ${announcement.isActive
                                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                                }`}
                                        >
                                            {announcement.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(announcement._id)}
                                            className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
