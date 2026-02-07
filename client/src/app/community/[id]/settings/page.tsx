'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { communityAPI, uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Shield, Trash2, Check, X, Loader2, Save, Lock, Globe, Camera } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface CommunityMember {
    _id: string;
    name: string;
    profilePicture?: string;
}

interface Community {
    _id: string;
    name: string;
    description: string;
    category: string;
    isPrivate: boolean;
    coverImage?: string;
    creator: CommunityMember;
    members: CommunityMember[];
    pendingRequests: {
        user: CommunityMember;
        requestedAt: string;
    }[];
}

const CATEGORIES = [
    'Bikers', 'Photographers', 'Trekkers', 'Foodies',
    'Adventurers', 'Backpackers', 'Luxury', 'Solo',
    'Culture', 'Beach', 'Mountains', 'Other'
];

export default function CommunitySettingsPage() {
    const { id } = useParams();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [community, setCommunity] = useState<Community | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'requests' | 'members' | 'settings'>('requests');

    // Edit form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        isPrivate: true,
        logo: ''
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const reader = new FileReader();
            reader.onload = (e) => setLogoPreview(e.target?.result as string);
            reader.readAsDataURL(file);

            // Upload using uploadFile which accepts File object directly
            const response = await uploadAPI.uploadFile(file);

            if (response.success && response.url) {
                setFormData(p => ({ ...p, logo: response.url }));
                toast.success('Logo uploaded!');
            }
        } catch (error) {
            toast.error('Failed to upload logo');
            setLogoPreview(null);
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated' && id) {
            loadCommunity();
        }
    }, [status, id]);

    const loadCommunity = async () => {
        try {
            setLoading(true);
            const response = await communityAPI.getDetails(id as string);

            if (response.success) {
                if (!response.isCreator) {
                    toast.error('Only admins can access settings');
                    router.push(`/community/${id}`);
                    return;
                }
                setCommunity(response.community);
                setFormData({
                    name: response.community.name,
                    description: response.community.description,
                    category: response.community.category,
                    isPrivate: response.community.isPrivate,
                    logo: response.community.logo || ''
                });
                if (response.community.logo) {
                    setLogoPreview(response.community.logo);
                }
            } else {
                toast.error(response.message || 'Failed to load community');
                router.push('/messages');
            }
        } catch (error: any) {
            toast.error('Failed to load community');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const response = await communityAPI.updateSettings(id as string, formData);
            if (response.success) {
                toast.success('Settings updated successfully');
                setCommunity(prev => prev ? { ...prev, ...formData } : null);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = async (userId: string) => {
        try {
            const response = await communityAPI.approveRequest(id as string, userId);
            if (response.success) {
                toast.success('Member approved');
                loadCommunity(); // Reload to update lists
            }
        } catch (error) {
            toast.error('Failed to approve request');
        }
    };

    const handleReject = async (userId: string) => {
        try {
            const response = await communityAPI.rejectRequest(id as string, userId);
            if (response.success) {
                toast.success('Request rejected');
                setCommunity(prev => prev ? {
                    ...prev,
                    pendingRequests: prev.pendingRequests.filter(r => r.user._id !== userId)
                } : null);
            }
        } catch (error) {
            toast.error('Failed to reject request');
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        try {
            const response = await communityAPI.removeMember(id as string, userId);
            if (response.success) {
                toast.success('Member removed');
                setCommunity(prev => prev ? {
                    ...prev,
                    members: prev.members.filter(m => m._id !== userId)
                } : null);
            }
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    const handleDeleteCommunity = async () => {
        if (!confirm('Are you sure? This action cannot be undone and will delete all messages.')) return;

        try {
            const response = await communityAPI.delete(id as string);
            if (response.success) {
                toast.success('Community deleted');
                router.push('/messages');
            }
        } catch (error) {
            toast.error('Failed to delete community');
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!community) return null;

    return (
        <div className="min-h-screen bg-gray-900 py-8 pt-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href={`/community/${id}`}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-300" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Shield className="w-6 h-6 text-primary-500" />
                            Community Settings
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Manage {community.name}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-800 mb-8">
                    {[
                        { id: 'requests', label: 'Join Requests', count: community.pendingRequests?.length || 0 },
                        { id: 'members', label: 'Members', count: community.members.length },
                        { id: 'settings', label: 'General Settings' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary-500 text-primary-400'
                                : 'border-transparent text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className="px-2 py-0.5 bg-gray-800 rounded-full text-xs">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {activeTab === 'requests' && (
                        <div className="space-y-4">
                            {community.pendingRequests?.length === 0 ? (
                                <div className="text-center py-12 bg-gray-800/50 rounded-xl">
                                    <p className="text-gray-400">No pending join requests</p>
                                </div>
                            ) : (
                                community.pendingRequests?.map(req => (
                                    <div key={req.user._id} className="flex items-center justify-between p-4 bg-gray-800/60 rounded-xl border border-gray-700/50">
                                        <div className="flex items-center gap-3">
                                            {req.user.profilePicture ? (
                                                <Image
                                                    src={req.user.profilePicture}
                                                    alt={req.user.name}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-medium">
                                                        {req.user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-white font-medium">{req.user.name}</h3>
                                                <p className="text-xs text-gray-400">
                                                    Requested {new Date(req.requestedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleReject(req.user._id)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleApprove(req.user._id)}
                                                className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="space-y-4">
                            {community.members.map(member => (
                                <div key={member._id} className="flex items-center justify-between p-4 bg-gray-800/60 rounded-xl border border-gray-700/50">
                                    <div className="flex items-center gap-3">
                                        {member.profilePicture ? (
                                            <Image
                                                src={member.profilePicture}
                                                alt={member.name}
                                                width={40}
                                                height={40}
                                                className="rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                                <span className="text-white font-medium">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-white font-medium">{member.name}</h3>
                                                {member._id === community.creator._id && (
                                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {member._id !== community.creator._id && (
                                        <button
                                            onClick={() => handleRemoveMember(member._id)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                                            title="Remove member"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-8">
                            <form onSubmit={handleUpdateSettings} className="space-y-6 bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50">
                                {/* Logo Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Community Logo
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative w-20 h-20 rounded-xl border-2 border-dashed border-gray-600 hover:border-primary-500 transition-colors flex items-center justify-center overflow-hidden bg-gray-900"
                                        >
                                            {uploading ? (
                                                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                                            ) : logoPreview ? (
                                                <Image
                                                    src={logoPreview}
                                                    alt="Logo preview"
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <Camera className="w-6 h-6 text-gray-400" />
                                            )}
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.svg,.heic"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                        <div className="text-sm text-gray-400">
                                            <p>Click to upload logo</p>
                                            <p className="text-xs">JPG, PNG, GIF, WebP up to 5MB</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Community Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Category
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-700">
                                        <div className="flex items-center gap-3">
                                            {formData.isPrivate ? (
                                                <Lock className="w-5 h-5 text-amber-400" />
                                            ) : (
                                                <Globe className="w-5 h-5 text-green-400" />
                                            )}
                                            <div>
                                                <p className="text-white font-medium">Private</p>
                                                <p className="text-xs text-gray-400">
                                                    {formData.isPrivate ? 'Approval required' : 'Open to all'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, isPrivate: !p.isPrivate }))}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${formData.isPrivate ? 'bg-amber-500' : 'bg-gray-600'}`}
                                        >
                                            <span
                                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.isPrivate ? 'translate-x-6' : ''}`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Save Changes
                                </button>
                            </form>

                            <div className="p-6 bg-red-500/10 rounded-2xl border border-red-500/20">
                                <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                                    <Trash2 className="w-5 h-5" />
                                    Danger Zone
                                </h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Deleting this community will permanently remove all messages, media, and member data. This action cannot be undone.
                                </p>
                                <button
                                    onClick={handleDeleteCommunity}
                                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Delete Community
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
