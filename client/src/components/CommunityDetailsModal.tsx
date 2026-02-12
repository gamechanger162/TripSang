import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Users, Calendar, MapPin, User as UserIcon, LogOut, Check, ArrowLeft, Trash2, Share2, Lock, Shield, Pencil, Save } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { communityAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface CommunityDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    community: any; // Using any for simplicity, but ideally should match Community interface
}

export default function CommunityDetailsModal({ isOpen, onClose, community }: CommunityDetailsModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [view, setView] = useState<'details' | 'members' | 'edit'>('details');
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
    const [adminOnlyLocal, setAdminOnlyLocal] = useState(community?.adminOnlyMessages || false);

    // Edit form state
    const [editName, setEditName] = useState(community?.name || '');
    const [editDescription, setEditDescription] = useState(community?.description || '');
    const [editCategory, setEditCategory] = useState(community?.category || 'Other');
    const [editPrivate, setEditPrivate] = useState(community?.isPrivate ?? true);
    const [isSaving, setIsSaving] = useState(false);

    const CATEGORIES = ['Bikers', 'Photographers', 'Trekkers', 'Foodies', 'Adventurers', 'Backpackers', 'Luxury', 'Solo', 'Culture', 'Beach', 'Mountains', 'Other'];

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
            await communityAPI.updateSettings(community._id, {
                name: editName,
                description: editDescription,
                category: editCategory,
                isPrivate: editPrivate,
            });
            toast.success('Community updated!');
            window.location.reload();
        } catch (error: any) {
            console.error('Failed to update community:', error);
            toast.error(error?.message || 'Failed to update community');
        } finally {
            setIsSaving(false);
        }
    };

    // safe check for user id
    const currentUserId = (session?.user as any)?.id || (session?.user as any)?._id;

    // check membership
    const isMember = community?.members?.some((m: any) =>
        (typeof m === 'string' ? m : m._id) === currentUserId
    );

    // check if creator
    const isCreator = (community?.creator?._id || community?.creator) === currentUserId;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        setRemovingMemberId(memberId);
        try {
            await communityAPI.removeMember(community._id, memberId);
            toast.success('Member removed');
            window.location.reload(); // Simple reload to refresh list
        } catch (error) {
            console.error('Failed to remove member:', error);
            toast.error('Failed to remove member');
        } finally {
            setRemovingMemberId(null);
        }
    };

    if (!isOpen || !community) return null;

    const MembersView = () => (
        <div className="flex flex-col h-full bg-[#121212]">
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#121212] flex-none">
                <button
                    onClick={() => setView('details')}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-400" />
                </button>
                <h3 className="text-lg font-semibold text-white">Members</h3>
                <span className="text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded-full ml-auto">{community.memberCount}</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                <div className="space-y-2">
                    {community.members?.map((member: any) => (
                        <div
                            key={member._id}
                            className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors group border border-transparent hover:border-white/5 relative"
                        >
                            <Link href={`/profile/${member._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10 flex-none">
                                    {member.profilePicture ? (
                                        <Image src={member.profilePicture} alt={member.name} width={40} height={40} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                                            <UserIcon size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">
                                        {member.name}
                                        {community.creator?._id === member._id && <span className="ml-2 text-xs text-teal-500">(Creator)</span>}
                                    </p>
                                </div>
                            </Link>

                            {isCreator && member._id !== currentUserId && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleRemoveMember(member._id);
                                    }}
                                    disabled={removingMemberId === member._id}
                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                                    title="Remove member"
                                >
                                    {removingMemberId === member._id ? (
                                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    ref={modalRef}
                    className="w-full max-w-md bg-[#000a1f]/90 border border-cyan-500/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] h-full relative"
                >
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

                    {view === 'edit' && isCreator ? (
                        <div className="flex flex-col h-full bg-transparent relative z-10">
                            <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-black/20 backdrop-blur-md flex-none">
                                <button
                                    onClick={() => setView('details')}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-cyan-400"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">Edit Community</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
                                {/* Name */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        maxLength={50}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder-zinc-600"
                                        placeholder="Community name"
                                    />
                                    <p className="text-[10px] text-zinc-600 mt-1 text-right">{editName.length}/50</p>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Description</label>
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        maxLength={500}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder-zinc-600 resize-none"
                                        placeholder="Describe your community..."
                                    />
                                    <p className="text-[10px] text-zinc-600 mt-1 text-right">{editDescription.length}/500</p>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Category</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {CATEGORIES.map((cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setEditCategory(cat)}
                                                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${editCategory === cat
                                                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                                        : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Privacy */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Privacy</label>
                                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
                                                <Lock size={14} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">Private Community</p>
                                                <p className="text-[11px] text-zinc-500">Members must request to join</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setEditPrivate(!editPrivate)}
                                            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${editPrivate
                                                ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                                                : 'bg-zinc-700'
                                                }`}
                                        >
                                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${editPrivate ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="p-4 bg-[rgba(0,10,31,0.95)] backdrop-blur-xl border-t border-white/5 mt-auto relative z-20">
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={isSaving || !editName.trim()}
                                    className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] border border-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    ) : view === 'members' ? (
                        <div className="flex flex-col h-full bg-transparent relative z-10">
                            <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-black/20 backdrop-blur-md flex-none">
                                <button
                                    onClick={() => setView('details')}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-cyan-400"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">Alliance Members</h3>
                                <span className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full ml-auto shadow-[0_0_10px_rgba(6,182,212,0.1)]">{community.memberCount}</span>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                                {community.members?.map((member: any) => (
                                    <div
                                        key={member._id}
                                        className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all duration-300 group border border-transparent hover:border-cyan-500/20 relative"
                                    >
                                        <Link href={`/profile/${member._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-gray-900 overflow-hidden border border-white/10 group-hover:border-cyan-500/50 transition-colors shadow-lg">
                                                {member.profilePicture ? (
                                                    <Image src={member.profilePicture} alt={member.name} width={40} height={40} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900 to-blue-900 text-cyan-400">
                                                        <UserIcon size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-200 group-hover:text-cyan-100 transition-colors truncate">
                                                    {member.name}
                                                    {community.creator?._id === member._id && <span className="ml-2 text-xs text-amber-400 font-bold drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">BOSS</span>}
                                                </p>
                                            </div>
                                        </Link>

                                        {isCreator && member._id !== currentUserId && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleRemoveMember(member._id);
                                                }}
                                                disabled={removingMemberId === member._id}
                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 border border-red-500/20"
                                                title="Kick member"
                                            >
                                                {removingMemberId === member._id ? (
                                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                                {/* Header Image */}
                                <div className="h-48 relative">
                                    {community.coverImage ? (
                                        <Image
                                            src={community.coverImage}
                                            alt="Cover"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-cyan-900 via-blue-900 to-purple-900" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#000a1f] via-[#000a1f]/40 to-transparent" />

                                    {/* Glass Pattern Overlay */}
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>

                                    <button
                                        onClick={onClose}
                                        className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white/80 hover:text-white transition-all border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] group"
                                    >
                                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                    </button>
                                </div>

                                {/* Main Info */}
                                <div className="px-6 relative -mt-20 mb-6">
                                    {/* Logo */}
                                    <div className="w-32 h-32 rounded-3xl bg-[#000a1f] p-1.5 shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-4 relative z-10">
                                        <div className="w-full h-full rounded-2xl overflow-hidden relative">
                                            {community.logo ? (
                                                <Image
                                                    src={community.logo}
                                                    alt={community.name}
                                                    width={120}
                                                    height={120}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
                                                    <Users size={48} className="text-white drop-shadow-md" />
                                                </div>
                                            )}
                                            {/* Logo Gloss */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Title & Stats */}
                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-3 leading-tight tracking-tight drop-shadow-lg">{community.name}</h2>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                                                <Users size={14} className="text-cyan-400" />
                                                <span className="font-medium">{community.memberCount || 0} members</span>
                                            </div>
                                            {community.category && (
                                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                                                    <MapPin size={14} className="text-purple-400" />
                                                    <span className="font-medium text-purple-100">{community.category}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Details Sections */}
                                <div className="px-6 space-y-8 pb-6 text-gray-300">
                                    {/* Description */}
                                    {community.description && (
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <h3 className="text-xs font-bold text-cyan-500 mb-2 uppercase tracking-widest">Mission Brief</h3>
                                            <p className="text-sm leading-relaxed whitespace-pre-line text-gray-300 font-light">
                                                {community.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Creator */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest pl-1">Organizer</h3>
                                        <Link
                                            href={`/profile/${community.creator?._id}`}
                                            className="flex items-center gap-4 p-3 bg-gradient-to-r from-white/5 to-transparent hover:from-cyan-900/20 hover:to-transparent rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all group"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden border border-white/10 group-hover:border-cyan-500/50 shadow-lg">
                                                {community.creator?.profilePicture ? (
                                                    <Image src={community.creator.profilePicture} alt={community.creator.name} width={48} height={48} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <UserIcon size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                                                    {community.creator?.name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-gray-500">Alliance Leader</p>
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Members List - Preview */}
                                    {community.members && community.members.length > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Roster</h3>
                                                <button
                                                    onClick={() => setView('members')}
                                                    className="text-xs text-cyan-400 font-bold hover:text-cyan-300 transition-colors uppercase tracking-wider hover:underline underline-offset-4"
                                                >
                                                    View all
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-4 gap-3">
                                                {community.members.slice(0, 8).map((member: any) => (
                                                    <Link
                                                        key={member._id}
                                                        href={`/profile/${member._id}`}
                                                        className="flex flex-col items-center gap-2 group"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden border border-white/10 group-hover:border-cyan-500/80 transition-all duration-300 shadow-lg group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] relative">
                                                            {member.profilePicture ? (
                                                                <Image src={member.profilePicture} alt={member.name} width={48} height={48} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-500 group-hover:text-cyan-400">
                                                                    <UserIcon size={20} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 text-center truncate w-full group-hover:text-cyan-300 transition-colors font-medium">
                                                            {member.name.split(' ')[0]}
                                                        </span>
                                                    </Link>
                                                ))}
                                                {community.members.length > 8 && (
                                                    <button
                                                        onClick={() => setView('members')}
                                                        className="flex flex-col items-center gap-2 justify-center cursor-pointer group"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 text-xs font-bold group-hover:bg-white/10 group-hover:text-white transition-all">
                                                            +{community.members.length - 8}
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 group-hover:text-white">More</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Admin Settings (Creator Only) */}
                                    {isCreator && (
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest pl-1">Admin Settings</h3>
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                                                {/* Edit Community Button */}
                                                <button
                                                    onClick={() => {
                                                        setEditName(community.name || '');
                                                        setEditDescription(community.description || '');
                                                        setEditCategory(community.category || 'Other');
                                                        setEditPrivate(community.isPrivate ?? true);
                                                        setView('edit');
                                                    }}
                                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
                                                >
                                                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                                                        <Pencil size={14} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-medium text-white">Edit Community</p>
                                                        <p className="text-[11px] text-zinc-500">Name, description, category & privacy</p>
                                                    </div>
                                                </button>

                                                <div className="h-px bg-white/5" />

                                                {/* Admin Only Messages Toggle */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                                                            <Shield size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">Admin Only Messages</p>
                                                            <p className="text-[11px] text-zinc-500">Only you can send messages</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            const newValue = !adminOnlyLocal;
                                                            try {
                                                                await communityAPI.updateSettings(community._id, { adminOnlyMessages: newValue });
                                                                setAdminOnlyLocal(newValue);
                                                                toast.success(newValue ? 'Admin-only messaging enabled' : 'All members can now message');
                                                            } catch (error) {
                                                                console.error('Failed to update setting:', error);
                                                                toast.error('Failed to update setting');
                                                            }
                                                        }}
                                                        className={`relative w-11 h-6 rounded-full transition-all duration-300 ${adminOnlyLocal
                                                            ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                                                            : 'bg-zinc-700'
                                                            }`}
                                                    >
                                                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${adminOnlyLocal ? 'translate-x-[22px]' : 'translate-x-0.5'
                                                            }`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Share Community */}
                                    <div>
                                        <button
                                            onClick={() => {
                                                const shareUrl = `${window.location.origin}/app/communities?id=${community._id}`;
                                                if (navigator.share) {
                                                    navigator.share({
                                                        title: community.name,
                                                        text: `Join ${community.name} on TripSang!`,
                                                        url: shareUrl,
                                                    }).catch(() => { });
                                                } else {
                                                    navigator.clipboard.writeText(shareUrl);
                                                    toast.success('Community link copied!');
                                                }
                                            }}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 text-cyan-400 rounded-2xl text-sm font-bold tracking-wide transition-all border border-cyan-500/20 hover:border-cyan-500/40 group"
                                        >
                                            <Share2 size={16} className="group-hover:scale-110 transition-transform" />
                                            Share Community
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Footer Actions */}
                            <div className="p-4 bg-[rgba(0,10,31,0.95)] backdrop-blur-xl border-t border-white/5 mt-auto relative z-20">
                                {isMember ? (
                                    !confirmLeave ? (
                                        <button
                                            onClick={() => setConfirmLeave(true)}
                                            className="w-full py-3.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 border border-white/5 hover:border-red-500/30 group"
                                        >
                                            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                                            Leave Alliance
                                        </button>
                                    ) : (
                                        <div className="space-y-3 animation-fade-in bg-red-900/10 p-3 rounded-xl border border-red-500/20">
                                            <p className="text-xs text-center text-red-200 font-medium">
                                                Are you sure you want to leave? You'll lose access to exclusive channels.
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setConfirmLeave(false)}
                                                    className="flex-1 py-3 bg-black/40 hover:bg-black/60 text-white rounded-lg text-sm font-medium transition-colors border border-white/10"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    disabled={isProcessing}
                                                    onClick={async () => {
                                                        setIsProcessing(true);
                                                        try {
                                                            await communityAPI.leave(community._id);
                                                            toast.success('Left community');
                                                            window.location.href = '/app/communities'; // Redirect after leaving
                                                        } catch (error) {
                                                            console.error('Failed to leave:', error);
                                                            toast.error('Failed to leave');
                                                            setIsProcessing(false);
                                                        }
                                                    }}
                                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-red-900/20"
                                                >
                                                    {isProcessing ? 'Leaving...' : 'Confirm Leave'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <button
                                        disabled={isProcessing}
                                        onClick={async () => {
                                            setIsProcessing(true);
                                            try {
                                                await communityAPI.join(community._id);
                                                toast.success('Joined community');
                                                // Refresh page to update state
                                                window.location.reload();
                                            } catch (error) {
                                                console.error('Failed to join:', error);
                                                toast.error('Failed to join');
                                                setIsProcessing(false);
                                            }
                                        }}
                                        className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] border border-cyan-400/20"
                                    >
                                        <Check size={18} strokeWidth={3} />
                                        {isProcessing ? 'Joining...' : 'Join Alliance'}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
