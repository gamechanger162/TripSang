'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/app/ui/GlassCard';
import { GlassButton } from '@/components/app/ui/GlassCard';
import VerifiedBadge from '@/components/app/ui/VerifiedBadge';
import Image from 'next/image';
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
    Smartphone
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [notifications, setNotifications] = useState(true);
    const [sounds, setSounds] = useState(true);

    // Redirect if not authenticated
    if (status === 'unauthenticated') {
        router.push('/auth/signin?callbackUrl=/app/settings');
        return null;
    }

    // Don't render while loading or no session
    if (!session) return null;

    const user = session.user as any;

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/' });
    };

    // Helper to determine verification status display
    const getVerificationStatus = () => {
        const isIdentityVerified = user?.verificationStatus === 'verified';
        const isPhoneVerified = user?.isMobileVerified;
        const status = user?.verificationStatus;

        if (isIdentityVerified && isPhoneVerified) {
            return {
                label: 'Verified',
                icon: <CheckCircle2 size={18} className="text-emerald-400" />,
                color: 'text-emerald-400',
                subtext: 'Identity & Phone verified',
                href: '/profile/edit' // Or nowhere if we want it disabled
            };
        }

        if (status === 'pending') {
            return {
                label: 'Pending Approval',
                icon: <Clock size={18} className="text-yellow-400" />,
                color: 'text-yellow-400',
                subtext: 'Review in progress',
                href: '/verify/status' // Assuming a status page exists, or back to identity
            };
        }

        if (status === 'rejected') {
            return {
                label: 'Identity Rejected',
                icon: <AlertCircle size={18} className="text-red-400" />,
                color: 'text-red-400',
                subtext: 'Tap to try again',
                href: '/verify/identity'
            };
        }

        if (isPhoneVerified && !isIdentityVerified) {
            return {
                label: 'Verify Government ID',
                icon: <Shield size={18} className="text-blue-400" />,
                color: 'text-gray-200',
                subtext: 'Phone verified',
                href: '/verify/id'
            };
        }

        return {
            label: 'Verify Identity',
            icon: <Shield size={18} className="text-blue-400" />,
            color: 'text-gray-200',
            subtext: 'Get verified badge',
            href: '/verify/identity'
        };
    };

    const verStatus = getVerificationStatus();

    return (
        <>
            <div className="settings-content">
                <h1 className="page-title">Settings</h1>

                {/* Profile Section */}
                <div className="settings-section">
                    <h2 className="section-title">Profile</h2>
                    <Link href="/dashboard">
                        <GlassCard padding="md" hover className="profile-card">
                            <div className="profile-info-container">
                                <div className="profile-avatar-wrapper">
                                    {user?.image ? (
                                        <div className="profile-avatar-container">
                                            <Image
                                                src={user.image}
                                                alt={user.name || 'User'}
                                                fill
                                                sizes="64px"
                                                className="object-cover"
                                                unoptimized
                                                referrerPolicy="no-referrer"
                                            />
                                        </div>
                                    ) : (
                                        <div className="profile-avatar-placeholder">
                                            <User size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className="profile-text">
                                    <h3 className="profile-name">
                                        {user?.name || 'User'}
                                        <div className="flex items-center gap-1 ml-2">
                                            {user?.isMobileVerified && (
                                                <div
                                                    className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30"
                                                    title="Phone Verified"
                                                >
                                                    <Smartphone size={12} className="text-blue-400" />
                                                </div>
                                            )}
                                            {user?.verificationStatus === 'verified' && (
                                                <div
                                                    className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"
                                                    title="Identity Verified (Aadhaar/PAN)"
                                                >
                                                    <Shield size={12} className="text-emerald-400" />
                                                </div>
                                            )}
                                        </div>
                                    </h3>
                                    <p className="profile-email">{user?.email}</p>
                                    <p className="profile-view-text">View Profile</p>
                                </div>
                            </div>
                            <div className="chevron-wrapper">
                                <ChevronRight size={20} className="chevron" />
                            </div>
                        </GlassCard>
                    </Link>
                </div>

                {/* Account Settings */}
                <div className="settings-section">
                    <h2 className="section-title">Account</h2>
                    <GlassCard padding="none" className="settings-group">
                        <Link href="/profile/edit" className="setting-item clickable">
                            <div className="setting-main">
                                <div className="setting-icon-bg bg-blue-500/20 text-blue-400">
                                    <User size={20} />
                                </div>
                                <div className="setting-label">
                                    <span className="setting-title">Edit Profile</span>
                                </div>
                            </div>
                            <ChevronRight size={18} className="chevron" />
                        </Link>

                        <Link href={verStatus.href} className="setting-item clickable">
                            <div className="setting-main">
                                <div className={`setting-icon-bg ${verStatus.color === 'text-emerald-400' ? 'bg-emerald-500/20' : 'bg-purple-500/20 text-purple-400'}`}>
                                    {verStatus.icon}
                                </div>
                                <div className="setting-label">
                                    <span className={`setting-title ${verStatus.color !== 'text-gray-200' ? verStatus.color : ''}`}>
                                        {verStatus.label}
                                    </span>
                                    {verStatus.subtext && (
                                        <span className="setting-subtitle">{verStatus.subtext}</span>
                                    )}
                                </div>
                            </div>
                            {user?.verificationStatus !== 'verified' && (
                                <ChevronRight size={18} className="chevron" />
                            )}
                        </Link>
                    </GlassCard>
                </div>

                {/* Preferences */}
                <div className="settings-section">
                    <h2 className="section-title">Preferences</h2>
                    <GlassCard padding="none" className="settings-group">
                        <div className="setting-item">
                            <div className="setting-main">
                                <div className="setting-icon-bg bg-orange-500/20 text-orange-400">
                                    <Bell size={20} />
                                </div>
                                <span className="setting-title">Push Notifications</span>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={notifications}
                                    onChange={() => setNotifications(!notifications)}
                                />
                                <span className="slider" />
                            </label>
                        </div>

                        <div className="setting-item">
                            <div className="setting-main">
                                <div className="setting-icon-bg bg-pink-500/20 text-pink-400">
                                    <Volume2 size={20} />
                                </div>
                                <span className="setting-title">Message Sounds</span>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={sounds}
                                    onChange={() => setSounds(!sounds)}
                                />
                                <span className="slider" />
                            </label>
                        </div>
                    </GlassCard>
                </div>

                {/* Support */}
                <div className="settings-section">
                    <h2 className="section-title">Support</h2>
                    <GlassCard padding="none" className="settings-group">
                        <Link href="/help-support" className="setting-item clickable">
                            <div className="setting-main">
                                <div className="setting-icon-bg bg-teal-500/20 text-teal-400">
                                    <MessageCircle size={20} />
                                </div>
                                <span className="setting-title">Help & Support</span>
                            </div>
                            <ChevronRight size={18} className="chevron" />
                        </Link>
                    </GlassCard>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="logout-button"
                >
                    <LogOut size={18} />
                    Log Out
                </button>

                <p className="version-text">Version 1.0.0</p>
            </div>

            <style jsx>{`
                .settings-content {
                    flex: 1;
                    padding: 24px;
                    max-width: 600px;
                    margin: 0 auto;
                    width: 100%;
                    padding-bottom: 240px;
                    overflow-y: auto;
                    height: 100%;
                    background: linear-gradient(180deg, rgba(0, 20, 40, 0.3) 0%, rgba(0, 10, 25, 0.5) 100%);
                }

                @media (min-width: 768px) {
                    .settings-content {
                        padding-bottom: 40px;
                    }
                }

                .page-title {
                    font-size: 28px;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 32px;
                    letter-spacing: -0.02em;
                    text-shadow: 0 0 25px rgba(0, 255, 255, 0.4);
                }

                .settings-section {
                    margin-bottom: 32px;
                }

                .section-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: rgba(0, 255, 255, 0.6);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-bottom: 12px;
                    padding-left: 8px;
                }

                /* Profile Card Styles */
                .profile-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px !important;
                    background: rgba(0, 30, 50, 0.6) !important;
                    border: 1px solid rgba(0, 255, 255, 0.2) !important;
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.1) !important;
                }

                .profile-info-container {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .profile-avatar-wrapper {
                    position: relative;
                }

                .profile-avatar-container {
                    width: 64px;
                    height: 64px;
                    min-width: 64px;
                    border-radius: 50%;
                    overflow: hidden;
                    position: relative;
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
                    border: 2px solid rgba(0, 255, 255, 0.4);
                }

                .profile-avatar-placeholder {
                    width: 64px;
                    height: 64px;
                    min-width: 64px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #0891b2, #8b5cf6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
                    border: 2px solid rgba(0, 255, 255, 0.4);
                }

                .profile-text {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .profile-name {
                    font-size: 18px;
                    font-weight: 700;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    text-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
                }

                .profile-email {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.5);
                }

                .profile-view-text {
                    font-size: 12px;
                    color: #00ffff;
                    margin-top: 4px;
                    font-weight: 500;
                    text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
                }

                /* Settings Group & Items */
                .settings-group {
                    overflow: hidden;
                    border: 1px solid rgba(0, 255, 255, 0.15) !important;
                    background: rgba(0, 30, 50, 0.5) !important;
                }

                .setting-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(0, 255, 255, 0.1);
                    transition: all 0.3s;
                    min-height: 72px;
                }

                .setting-item:last-child {
                    border-bottom: none;
                }

                .setting-item.clickable:hover {
                    background: rgba(0, 255, 255, 0.05);
                }

                .setting-main {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .setting-icon-bg {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 0 10px rgba(0, 255, 255, 0.1);
                }

                .setting-label {
                    display: flex;
                    flex-direction: column;
                }

                .setting-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.9);
                }

                .setting-subtitle {
                    font-size: 12px;
                    color: rgba(0, 255, 255, 0.5);
                    margin-top: 2px;
                }

                .chevron {
                    color: rgba(0, 255, 255, 0.4);
                }

                /* Toggle Switch */
                .toggle {
                    position: relative;
                    width: 50px;
                    height: 30px;
                    cursor: pointer;
                }

                .toggle input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .slider {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 255, 255, 0.1);
                    border-radius: 20px;
                    transition: all 0.3s;
                    border: 1px solid rgba(0, 255, 255, 0.2);
                }

                .slider:before {
                    content: '';
                    position: absolute;
                    width: 24px;
                    height: 24px;
                    left: 2px;
                    top: 2px;
                    background: white;
                    border-radius: 50%;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                .toggle input:checked + .slider {
                    background: linear-gradient(135deg, #0891b2, #06b6d4);
                    border-color: #00ffff;
                    box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
                }

                .toggle input:checked + .slider:before {
                    transform: translateX(20px);
                }

                /* Logout Button */
                .logout-button {
                    width: 100%;
                    padding: 16px;
                    margin-top: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 16px;
                    color: #f87171;
                    font-weight: 600;
                    font-size: 15px;
                    transition: all 0.3s;
                }

                .logout-button:hover {
                    background: rgba(239, 68, 68, 0.2);
                    box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
                }

                .logout-button:active {
                    transform: scale(0.98);
                    opacity: 0.8;
                }

                .version-text {
                    text-align: center;
                    color: rgba(0, 255, 255, 0.3);
                    font-size: 12px;
                    margin-top: 32px;
                }
            `}</style>
        </>
    );
}
