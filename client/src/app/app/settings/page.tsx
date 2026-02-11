'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    User,
    Bell,
    Shield,
    LogOut,
    ChevronRight,
    Volume2,
    MessageCircle,
    CheckCircle2,
    Clock,
    AlertCircle,
    Lock,
    Globe
} from 'lucide-react';

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [notifications, setNotifications] = useState(true);
    const [sounds, setSounds] = useState(true);

    if (status === 'unauthenticated') {
        router.push('/auth/signin?callbackUrl=/app/settings');
        return null;
    }

    if (!session) return null;

    const user = session.user as any;

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/' });
    };

    const getVerificationStatus = () => {
        const isIdentityVerified = user?.verificationStatus === 'verified';
        const isPhoneVerified = user?.isMobileVerified;
        const status = user?.verificationStatus;

        if (isIdentityVerified && isPhoneVerified) {
            return {
                label: 'Verified',
                icon: <CheckCircle2 size={16} className="text-emerald-400" />,
                color: 'text-emerald-400',
                subtext: 'Identity & Phone verified',
                href: '/profile/edit',
                bgColor: 'bg-emerald-500/10',
                borderColor: 'border-emerald-500/20'
            };
        }
        if (status === 'pending') {
            return {
                label: 'Pending Approval',
                icon: <Clock size={16} className="text-yellow-400" />,
                color: 'text-yellow-400',
                subtext: 'Review in progress',
                href: '/verify/status',
                bgColor: 'bg-yellow-500/10',
                borderColor: 'border-yellow-500/20'
            };
        }
        if (status === 'rejected') {
            return {
                label: 'Identity Rejected',
                icon: <AlertCircle size={16} className="text-red-400" />,
                color: 'text-red-400',
                subtext: 'Tap to try again',
                href: '/verify/identity',
                bgColor: 'bg-red-500/10',
                borderColor: 'border-red-500/20'
            };
        }
        if (isPhoneVerified && !isIdentityVerified) {
            return {
                label: 'Verify Government ID',
                icon: <Shield size={16} className="text-cyan-400" />,
                color: 'text-zinc-200',
                subtext: 'Phone verified',
                href: '/verify/id',
                bgColor: 'bg-cyan-500/10',
                borderColor: 'border-cyan-500/20'
            };
        }
        return {
            label: 'Verify Identity',
            icon: <Shield size={16} className="text-cyan-400" />,
            color: 'text-zinc-200',
            subtext: 'Get verified badge',
            href: '/verify/identity',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20'
        };
    };

    const verStatus = getVerificationStatus();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex-1 w-full h-full overflow-y-auto bg-gradient-to-b from-[#0B0E11] to-[#0f1216] p-4 md:p-8 pb-32">
            <motion.div
                className="max-w-2xl mx-auto space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants}>
                    <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                    <p className="text-zinc-400 text-sm">Manage your account preferences and profile.</p>
                </motion.div>

                {/* Profile Card */}
                <motion.div variants={itemVariants}>
                    <Link href="/profile" className="block group">
                        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 flex items-center gap-5 transition-all hover:bg-zinc-800/40 hover:border-white/10 hover:shadow-xl hover:shadow-black/20">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 shadow-lg bg-zinc-800">
                                    {user?.image ? (
                                        <Image
                                            src={user.image}
                                            alt={user.name || 'User'}
                                            fill
                                            className="object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                            <User size={32} />
                                        </div>
                                    )}
                                </div>
                                {user?.verificationStatus === 'verified' && (
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1 rounded-full border-4 border-[#0e1115]">
                                        <CheckCircle2 size={14} strokeWidth={3} />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-white truncate flex items-center gap-2">
                                    {user?.name || 'User'}
                                </h3>
                                <p className="text-zinc-400 text-sm truncate mb-1">{user?.email}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-cyan-400 group-hover:underline">View Profile</span>
                                </div>
                            </div>

                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-white/10 group-hover:text-white transition-colors">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    </Link>
                </motion.div>

                {/* Account Settings */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-2">Account</h2>
                    <div className="bg-zinc-900/30 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">

                        <Link href="/profile/edit" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="text-zinc-200 font-medium group-hover:text-white transition-colors">Edit Profile</p>
                                    <p className="text-zinc-500 text-xs">Update your personal information</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-400" />
                        </Link>

                        <Link href={verStatus.href} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${verStatus.bgColor} ${verStatus.color.replace('text-', 'text-')}`}>
                                    {verStatus.icon}
                                </div>
                                <div>
                                    <p className={`font-medium group-hover:text-white transition-colors ${verStatus.color === 'text-zinc-200' ? 'text-zinc-200' : verStatus.color}`}>
                                        {verStatus.label}
                                    </p>
                                    <p className="text-zinc-500 text-xs">{verStatus.subtext}</p>
                                </div>
                            </div>
                            {user?.verificationStatus !== 'verified' && (
                                <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-400" />
                            )}
                        </Link>

                        <Link href="/security" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                                    <Lock size={18} />
                                </div>
                                <div>
                                    <p className="text-zinc-200 font-medium group-hover:text-white transition-colors">Privacy & Security</p>
                                    <p className="text-zinc-500 text-xs">Manage password and security</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-400" />
                        </Link>
                    </div>
                </motion.div>

                {/* Preferences */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-2">Preferences</h2>
                    <div className="bg-zinc-900/30 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">

                        <div className="flex items-center justify-between p-4 px-5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                                    <Bell size={18} />
                                </div>
                                <span className="text-zinc-200 font-medium">Push Notifications</span>
                            </div>
                            <button
                                onClick={() => setNotifications(!notifications)}
                                className={`w-12 h-7 rounded-full transition-colors relative ${notifications ? 'bg-cyan-600' : 'bg-zinc-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 px-5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
                                    <Volume2 size={18} />
                                </div>
                                <span className="text-zinc-200 font-medium">Sound Effects</span>
                            </div>
                            <button
                                onClick={() => setSounds(!sounds)}
                                className={`w-12 h-7 rounded-full transition-colors relative ${sounds ? 'bg-cyan-600' : 'bg-zinc-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${sounds ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 px-5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                                    <Globe size={18} />
                                </div>
                                <span className="text-zinc-200 font-medium">Language</span>
                            </div>
                            <span className="text-zinc-500 text-sm flex items-center gap-2">
                                English <ChevronRight size={14} />
                            </span>
                        </div>

                    </div>
                </motion.div>

                {/* Support & Logout */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-2">Support</h2>
                    <div className="bg-zinc-900/30 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden mb-6">
                        <Link href="/help-support" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                                    <MessageCircle size={18} />
                                </div>
                                <span className="text-zinc-200 font-medium group-hover:text-white">Help & Support</span>
                            </div>
                            <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-400" />
                        </Link>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 font-semibold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 group"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Sign Out
                    </button>

                    <p className="text-center text-zinc-600 text-xs font-mono pt-4">v1.2.0 • TripSang Inc.</p>
                </motion.div>
            </motion.div>
        </div>
    );
}
