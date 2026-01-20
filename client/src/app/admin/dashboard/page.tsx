'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { adminAPI, uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

type TabType = 'users' | 'guides' | 'trips' | 'settings';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'guide';
    isActive: boolean;
    isMobileVerified: boolean;
    createdAt: string;
    profilePicture?: string;
}

interface Trip {
    _id: string;
    title: string;
    description: string;
    creator: {
        _id: string;
        name: string;
        email: string;
    };
    startDate: string;
    status: 'active' | 'completed' | 'cancelled';
    squad: string[];
}

interface Stats {
    users: {
        total: number;
        byRole: { _id: string; count: number }[];
    };
    trips: {
        total: number;
        active: number;
    };
    payments: {
        total: number;
        revenue: number;
    };
}

interface GlobalConfig {
    enableGoogleAds: boolean;
    googleAdSenseClient: string;
    enablePaidSignup: boolean;
    signupFee: number;
    signupFeeCurrency: string;
}

export default function AdminDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('settings');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Users state
    const [users, setUsers] = useState<User[]>([]);
    const [usersPage, setUsersPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [userFilter, setUserFilter] = useState<'all' | 'user' | 'guide' | 'admin'>('all');

    // Trips state
    const [trips, setTrips] = useState<Trip[]>([]);
    const [tripsPage, setTripsPage] = useState(1);
    const [totalTrips, setTotalTrips] = useState(0);
    const [tripStatusFilter, setTripStatusFilter] = useState<string>('');
    const [stats, setStats] = useState<Stats | null>(null);

    // Broadcast modal state
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [bannerMessage, setBannerMessage] = useState('');
    const [bannerImageUrl, setBannerImageUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [broadcasting, setBroadcasting] = useState(false);

    // Settings state
    const [config, setConfig] = useState<GlobalConfig>({
        enableGoogleAds: false,
        googleAdSenseClient: '',
        enablePaidSignup: false,
        signupFee: 99,
        signupFeeCurrency: 'INR',
    });

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

        setLoading(false);
    }, [status, session, router]);

    // Fetch config
    const fetchConfig = async () => {
        try {
            const response = await adminAPI.getConfig();
            if (response.success && response.config) {
                setConfig(response.config);
            }
        } catch (error: any) {
            console.error('Error fetching config:', error);
            toast.error('Failed to load settings');
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const filters: any = {
                page: usersPage,
                limit: 20,
            };

            if (userFilter !== 'all') {
                filters.role = userFilter;
            }

            const response = await adminAPI.getUsers(filters);
            if (response.success) {
                setUsers(response.users);
                setTotalUsers(response.pagination.totalUsers);
            }
        } catch (error: any) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await adminAPI.getStats();
            if (response.success) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchTrips = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getTrips(tripsPage, 20, tripStatusFilter);
            if (response.success) {
                setTrips(response.trips);
                setTotalTrips(response.pagination.totalTrips);
            }
        } catch (error: any) {
            console.error('Error fetching trips:', error);
            toast.error('Failed to load trips');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTrip = async (tripId: string) => {
        if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) return;

        try {
            const response = await adminAPI.deleteTrip(tripId, 'Removed by admin');
            if (response.success) {
                toast.success('Trip deleted successfully');
                fetchTrips(); // Refresh
                fetchStats(); // Update stats
            }
        } catch (error: any) {
            console.error('Error deleting trip:', error);
            toast.error(error.message || 'Failed to delete trip');
        }
    };

    // Initial data fetch
    useEffect(() => {
        if (session?.user?.role === 'admin') {
            fetchConfig();
            fetchStats();
        }
    }, [session]);

    // Fetch users when tab changes
    useEffect(() => {
        if (activeTab === 'users' && session?.user?.role === 'admin') {
            fetchUsers();
        }
    }, [activeTab, usersPage, userFilter, session]);

    // Fetch trips when tab changes
    useEffect(() => {
        if (activeTab === 'trips' && session?.user?.role === 'admin') {
            fetchTrips();
        }
    }, [activeTab, tripsPage, tripStatusFilter, session]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size should be less than 2MB');
                return;
            }

            setImageFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        setBroadcasting(true);

        try {
            let finalImageUrl = null;

            // Upload image if a new file is selected
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);

                // Toast for upload progress
                const uploadToast = toast.loading('Uploading image...');

                try {
                    const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${session?.user?.accessToken}`
                        },
                        body: formData
                    });

                    const uploadData = await uploadResponse.json();

                    if (!uploadData.success) {
                        throw new Error(uploadData.message || 'Image upload failed');
                    }

                    finalImageUrl = uploadData.imageUrl;
                    toast.success('Image uploaded!', { id: uploadToast });
                } catch (err) {
                    toast.error('Image upload failed', { id: uploadToast });
                    throw err;
                }
            } else if (imagePreview && !imagePreview.startsWith('data:')) {
                // If imagePreview is a URL (not base64), keep it (could happen if we support editing later or URL input)
                finalImageUrl = imagePreview;
            }

            // Create Announcement
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/announcements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.user?.accessToken}`
                },
                body: JSON.stringify({
                    title: 'Site Banner',
                    message: bannerMessage,
                    type: 'info',
                    imageUrl: finalImageUrl
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Banner published successfully!');
                setBannerMessage('');
                setBannerImageUrl('');
                setImageFile(null);
                setImagePreview('');
                setShowBroadcast(false);
            } else {
                toast.error(data.message || 'Failed to publish banner');
            }
        } catch (error: any) {
            console.error('Error broadcasting:', error);
            toast.error(error.message || 'Failed to publish banner');
        } finally {
            setBroadcasting(false);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);

        try {
            const response = await adminAPI.updateConfig({
                enableGoogleAds: config.enableGoogleAds,
                googleAdSenseClient: config.googleAdSenseClient,
                enablePaidSignup: config.enablePaidSignup,
                signupFee: config.signupFee,
                signupFeeCurrency: config.signupFeeCurrency,
            });

            if (response.success) {
                toast.success('Settings saved successfully!');
            }
        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast.error(error.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleBlockUser = async (userId: string, block: boolean) => {
        try {
            const response = await adminAPI.blockUser(userId, block);

            if (response.success) {
                toast.success(block ? 'User blocked' : 'User unblocked');
                // Refresh users
                fetchUsers();
            }
        } catch (error: any) {
            console.error('Error blocking user:', error);
            toast.error(error.message || 'Failed to update user');
        }
    };

    const handleUpdateRole = async (userId: string, newRole: 'user' | 'admin' | 'guide') => {
        try {
            const response = await adminAPI.updateUserRole(userId, newRole);

            if (response.success) {
                toast.success(`Role updated to ${newRole}`);
                fetchUsers();
            }
        } catch (error: any) {
            console.error('Error updating role:', error);
            toast.error(error.message || 'Failed to update role');
        }
    };

    if (loading && status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (session?.user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
            {/* Header */}
            <div className="bg-white dark:bg-dark-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage TripSang platform</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowBroadcast(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                                    />
                                </svg>
                                Broadcast
                            </button>
                            <Link href="/admin/announcements" className="btn-outline text-sm px-3 py-2">
                                Manage
                            </Link>
                            <div className="badge badge-primary">Admin</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.users.total}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Trips</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.trips.active}</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{stats.payments.revenue}</p>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Trips</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.trips.total}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                            { id: 'trips', label: 'Trips', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                            { id: 'guides', label: 'Guides', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                            { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                                </svg>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        {/* Filters */}
                        <div className="card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Management</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {totalUsers} total users
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <select
                                        value={userFilter}
                                        onChange={(e) => setUserFilter(e.target.value as any)}
                                        className="input-field"
                                    >
                                        <option value="all">All Users</option>
                                        <option value="user">Regular Users</option>
                                        <option value="guide">Guides</option>
                                        <option value="admin">Admins</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Users List */}
                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                                    <thead className="bg-gray-50 dark:bg-dark-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Joined
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-dark-900 divide-y divide-gray-200 dark:divide-dark-700">
                                        {users.map((user) => (
                                            <tr key={user._id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                                                                    {user.name[0]}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {user.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleUpdateRole(user._id, e.target.value as any)}
                                                        className="text-sm border border-gray-300 dark:border-dark-600 rounded px-2 py-1 bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="guide">Guide</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col space-y-1">
                                                        <span
                                                            className={`inline-flex px-2 text-xs font-semibold rounded-full ${user.isActive
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                                }`}
                                                        >
                                                            {user.isActive ? 'Active' : 'Blocked'}
                                                        </span>
                                                        {user.isMobileVerified && (
                                                            <span className="inline-flex px-2 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                                Verified
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleBlockUser(user._id, !user.isActive)}
                                                        className={`${user.isActive
                                                            ? 'text-red-600 hover:text-red-900'
                                                            : 'text-green-600 hover:text-green-900'
                                                            }`}
                                                    >
                                                        {user.isActive ? 'Block' : 'Unblock'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {totalUsers > 20 && (
                            <div className="flex items-center justify-center space-x-2">
                                <button
                                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                                    disabled={usersPage === 1}
                                    className="btn-outline disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="text-gray-700 dark:text-gray-300 px-4">
                                    Page {usersPage}
                                </span>
                                <button
                                    onClick={() => setUsersPage((p) => p + 1)}
                                    disabled={users.length < 20}
                                    className="btn-outline disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Guides Tab */}
                {activeTab === 'guides' && (
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Guide Management
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Guide management features coming soon...
                        </p>
                    </div>
                )}

                {/* Trips Tab */}
                {activeTab === 'trips' && (
                    <div className="space-y-6">
                        <div className="card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Trip Management</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {totalTrips} total trips
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <select
                                        value={tripStatusFilter}
                                        onChange={(e) => setTripStatusFilter(e.target.value)}
                                        className="input-field"
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                                    <thead className="bg-gray-50 dark:bg-dark-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Trip
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Creator
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Squad
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-dark-900 divide-y divide-gray-200 dark:divide-dark-700">
                                        {trips.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                    No trips found
                                                </td>
                                            </tr>
                                        ) : (
                                            trips.map((trip) => (
                                                <tr key={trip._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {trip.title}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(trip.startDate).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white">
                                                            {trip.creator?.name || 'Unknown'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {trip.creator?.email || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${trip.status === 'active' ? 'bg-green-100 text-green-800' :
                                                                trip.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-red-100 text-red-800'
                                                            }`}>
                                                            {trip.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {trip.squad?.length || 0} members
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleDeleteTrip(trip._id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        {/* Google Ads Settings */}
                        <div className="card">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                Google AdSense
                            </h2>

                            {/* Enable Google Ads Toggle */}
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200 dark:border-dark-700">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Enable Google Ads
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Show Google AdSense ads across the platform
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.enableGoogleAds}
                                        onChange={(e) =>
                                            setConfig({ ...config, enableGoogleAds: e.target.checked })
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600" />
                                </label>
                            </div>

                            {/* AdSense Client ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    AdSense Client ID
                                </label>
                                <input
                                    type="text"
                                    value={config.googleAdSenseClient}
                                    onChange={(e) =>
                                        setConfig({ ...config, googleAdSenseClient: e.target.value })
                                    }
                                    placeholder="ca-pub-1234567890123456"
                                    className="input-field"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Get this from your Google AdSense account
                                </p>
                            </div>
                        </div>

                        {/* Paid Signup Settings */}
                        <div className="card">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                Paid Signup
                            </h2>

                            {/* Enable Paid Signup Toggle */}
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200 dark:border-dark-700">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Enable Paid Signup
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Require payment during user registration
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.enablePaidSignup}
                                        onChange={(e) =>
                                            setConfig({ ...config, enablePaidSignup: e.target.checked })
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600" />
                                </label>
                            </div>

                            {/* Signup Fee */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Signup Fee
                                    </label>
                                    <input
                                        type="number"
                                        value={config.signupFee}
                                        onChange={(e) =>
                                            setConfig({ ...config, signupFee: parseFloat(e.target.value) || 0 })
                                        }
                                        className="input-field"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Currency
                                    </label>
                                    <select
                                        value={config.signupFeeCurrency}
                                        onChange={(e) =>
                                            setConfig({ ...config, signupFeeCurrency: e.target.value })
                                        }
                                        className="input-field"
                                    >
                                        <option value="INR">INR (₹)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {saving ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="w-5 h-5 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        Save Settings
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Broadcast Modal */}
            {showBroadcast && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Publish Site Banner
                                </h2>
                                <button
                                    onClick={() => setShowBroadcast(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>


                            <form onSubmit={handleBroadcast} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Banner Message
                                    </label>
                                    <textarea
                                        value={bannerMessage}
                                        onChange={(e) => setBannerMessage(e.target.value)}
                                        maxLength={200}
                                        required
                                        rows={3}
                                        className="input-field w-full resize-none"
                                        placeholder="Enter banner message to display across the site..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{bannerMessage.length}/200 characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Banner Image (Optional)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="input-field w-full"
                                    />
                                    {imagePreview && (
                                        <div className="mt-3">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-32 h-32 object-cover rounded border-2 border-gray-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview('');
                                                }}
                                                className="text-xs text-red-600 hover:text-red-800 mt-1"
                                            >
                                                Remove image
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Upload an image to make your banner eye-catching (max 2MB)
                                    </p>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                                    <button
                                        type="button"
                                        onClick={() => setShowBroadcast(false)}
                                        className="btn-outline"
                                        disabled={broadcasting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={broadcasting}
                                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {broadcasting ? (
                                            <>
                                                <svg
                                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    />
                                                </svg>
                                                Publishing...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                                                    />
                                                </svg>
                                                Publish Banner
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

