'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/app/ui/GlassCard';
import { GlassButton } from '@/components/app/ui/GlassCard';
import VerifiedBadge from '@/components/app/ui/VerifiedBadge';
import {
    User,
    Bell,
    Shield,
    LogOut,
    ChevronRight,
    Moon,
    Volume2,
    MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

    return (
        <>
            <div className="settings-content">
                <h1>Settings</h1>

                {/* Profile Section */}
                <div className="settings-section">
                    <h2>Profile</h2>
                    <Link href={`/profile/${user?.id}`}>
                        <GlassCard padding="md" hover className="profile-card">
                            <div className="profile-info">
                                <div className="profile-avatar">
                                    {user?.image ? (
                                        <img src={user.image} alt={user.name} />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div>
                                    <h3 className="profile-name">
                                        {user?.name || 'User'}
                                        {user?.isVerified && <VerifiedBadge size="sm" className="ml-1" />}
                                    </h3>
                                    <p className="profile-email">{user?.email}</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="chevron" />
                        </GlassCard>
                    </Link>
                </div>

                {/* Preferences */}
                <div className="settings-section">
                    <h2>Preferences</h2>

                    <GlassCard padding="none" className="settings-group">
                        <div className="setting-item">
                            <div className="setting-info">
                                <Bell size={20} />
                                <span>Push Notifications</span>
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
                            <div className="setting-info">
                                <Volume2 size={20} />
                                <span>Message Sounds</span>
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

                {/* Account */}
                <div className="settings-section">
                    <h2>Account</h2>

                    <GlassCard padding="none" className="settings-group">
                        <Link href="/profile/edit" className="setting-item clickable">
                            <div className="setting-info">
                                <User size={20} />
                                <span>Edit Profile</span>
                            </div>
                            <ChevronRight size={18} className="chevron" />
                        </Link>

                        <Link href="/verify/identity" className="setting-item clickable">
                            <div className="setting-info">
                                <Shield size={20} />
                                <span>Verify Identity</span>
                            </div>
                            <ChevronRight size={18} className="chevron" />
                        </Link>

                        <Link href="/help-support" className="setting-item clickable">
                            <div className="setting-info">
                                <MessageCircle size={20} />
                                <span>Help & Support</span>
                            </div>
                            <ChevronRight size={18} className="chevron" />
                        </Link>
                    </GlassCard>
                </div>

                {/* Logout */}
                <GlassButton
                    onClick={handleLogout}
                    variant="secondary"
                    className="logout-btn"
                >
                    <LogOut size={18} className="mr-2" />
                    Logout
                </GlassButton>
            </div>

            <style jsx>{`
                .settings-layout {
                    display: flex;
                    width: 100%;
                    height: 100%;
                }
                
                .settings-content {
                    flex: 1;
                    padding: 24px;
                    max-width: 600px;
                    overflow-y: auto;
                    padding-bottom: 100px;
                }
                
                @media (min-width: 768px) {
                    .settings-content {
                        padding-bottom: 40px;
                    }
                }
                
                h1 {
                    font-size: 24px;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 24px;
                }
                
                .settings-section {
                    margin-bottom: 24px;
                }
                
                .settings-section h2 {
                    font-size: 13px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.5);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 12px;
                }
                
                .profile-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .profile-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .profile-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #14b8a6, #0d9488);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    overflow: hidden;
                }
                
                .profile-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .profile-name {
                    font-size: 16px;
                    font-weight: 600;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .profile-email {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .chevron {
                    color: rgba(255, 255, 255, 0.4);
                }
                
                .settings-group {
                    overflow: hidden;
                }
                
                .setting-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                .setting-item:last-child {
                    border-bottom: none;
                }
                
                .setting-item.clickable {
                    cursor: pointer;
                    transition: background 0.2s;
                    color: inherit;
                    text-decoration: none;
                }
                
                .setting-item.clickable:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .setting-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: white;
                }
                
                .toggle {
                    position: relative;
                    width: 44px;
                    height: 24px;
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
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    transition: all 0.3s;
                }
                
                .slider:before {
                    content: '';
                    position: absolute;
                    width: 18px;
                    height: 18px;
                    left: 3px;
                    top: 3px;
                    background: white;
                    border-radius: 50%;
                    transition: all 0.3s;
                }
                
                .toggle input:checked + .slider {
                    background: #14b8a6;
                }
                
                .toggle input:checked + .slider:before {
                    transform: translateX(20px);
                }
                
                .logout-btn {
                    width: 100%;
                    justify-content: center;
                    margin-top: 8px;
                    border-color: rgba(239, 68, 68, 0.3) !important;
                    color: #ef4444 !important;
                }
                
                .logout-btn:hover {
                    background: rgba(239, 68, 68, 0.1) !important;
                }
            `}</style>
        </>
    );
}
