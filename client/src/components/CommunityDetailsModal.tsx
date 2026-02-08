import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Users, Calendar, MapPin, User as UserIcon, LogOut, Check, ArrowLeft, Trash2 } from 'lucide-react';
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
    const [view, setView] = useState<'details' | 'members'>('details');
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    ref={modalRef}
                    className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] h-full"
                >
                    {view === 'members' ? (
                        <MembersView />
                    ) : (
                        <>
                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                                {/* Header Image */}
                                <div className="h-40 relative">
                                    {community.coverImage ? (
                                        <Image
                                            src={community.coverImage}
                                            alt="Cover"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-teal-600 to-emerald-800" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/30" />

                                    <button
                                        onClick={onClose}
                                        className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white/90 hover:text-white transition-all border border-white/10"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Main Info */}
                                <div className="px-6 relative -mt-16 mb-6">
                                    {/* Logo */}
                                    <div className="w-28 h-28 rounded-3xl bg-[#121212] p-1.5 shadow-xl mb-4">
                                        {community.logo ? (
                                            <Image
                                                src={community.logo}
                                                alt={community.name}
                                                width={112}
                                                height={112}
                                                className="w-full h-full object-cover rounded-2xl"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                                                <Users size={40} className="text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Title & Stats */}
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{community.name}</h2>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                                <Users size={14} className="text-teal-400" />
                                                <span>{community.memberCount || 0} members</span>
                                            </div>
                                            {community.category && (
                                                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                                    <MapPin size={14} className="text-purple-400" />
                                                    <span>{community.category}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Details Sections */}
                                <div className="px-6 space-y-8 pb-6">
                                    {/* Description */}
                                    {community.description && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">About</h3>
                                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                                                {community.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Creator */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Organizer</h3>
                                        <Link
                                            href={`/profile/${community.creator?._id}`}
                                            className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-white/10">
                                                {community.creator?.profilePicture ? (
                                                    <Image src={community.creator.profilePicture} alt={community.creator.name} width={40} height={40} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <UserIcon size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors">
                                                    {community.creator?.name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-gray-500">Community Creator</p>
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Members List - Preview */}
                                    {community.members && community.members.length > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Members</h3>
                                                <button
                                                    onClick={() => setView('members')}
                                                    className="text-xs text-teal-400 font-medium hover:text-teal-300 transition-colors"
                                                >
                                                    View all
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-4 gap-3">
                                                {community.members.slice(0, 8).map((member: any) => (
                                                    <Link
                                                        key={member._id}
                                                        href={`/profile/${member._id}`}
                                                        className="flex flex-col items-center gap-1 group"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden border border-white/10 group-hover:border-teal-500/50 transition-colors ring-2 ring-transparent group-hover:ring-teal-500/20">
                                                            {member.profilePicture ? (
                                                                <Image src={member.profilePicture} alt={member.name} width={48} height={48} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                                    <UserIcon size={18} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 text-center truncate w-full group-hover:text-gray-300 transition-colors">
                                                            {member.name.split(' ')[0]}
                                                        </span>
                                                    </Link>
                                                ))}
                                                {community.members.length > 8 && (
                                                    <button
                                                        onClick={() => setView('members')}
                                                        className="flex flex-col items-center gap-1 justify-center cursor-pointer hover:opacity-80 transition-opacity"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 text-xs font-medium">
                                                            +{community.members.length - 8}
                                                        </div>
                                                        <span className="text-[10px] text-gray-500">More</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Fixed Footer Actions */}
                            <div className="p-4 bg-[#121212]/95 backdrop-blur-xl border-t border-white/5 mt-auto">
                                {isMember ? (
                                    !confirmLeave ? (
                                        <button
                                            onClick={() => setConfirmLeave(true)}
                                            className="w-full py-3 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 border border-white/5 hover:border-red-500/20"
                                        >
                                            <LogOut size={16} />
                                            Leave Community
                                        </button>
                                    ) : (
                                        <div className="space-y-3 animation-fade-in">
                                            <p className="text-xs text-center text-gray-400">
                                                Are you sure you want to leave this community?
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setConfirmLeave(false)}
                                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors border border-white/10"
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
                                                    className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-red-500/20"
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
                                        className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Check size={16} />
                                        {isProcessing ? 'Joining...' : 'Join Community'}
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
