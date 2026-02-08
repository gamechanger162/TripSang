'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavRail from '@/components/app/NavRail';
import GlassCard from '@/components/app/ui/GlassCard';
import VerifiedBadge from '@/components/app/ui/VerifiedBadge';
import { useEnv } from '@/hooks/useEnv';
import { motion } from 'framer-motion';
import { Users, MapPin, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Squad {
    _id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    coverImage?: string;
    creator: {
        _id: string;
        name: string;
        profilePicture?: string;
        isVerified?: boolean;
    };
    squad: Array<{
        _id: string;
        name: string;
        profilePicture?: string;
    }>;
    unreadCount?: number;
}

export default function SquadsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { apiUrl } = useEnv();
    const [squads, setSquads] = useState<Squad[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin?callbackUrl=/app/squads');
        }
    }, [status, router]);

    useEffect(() => {
        const fetchSquads = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${apiUrl}/api/trips/my-trips`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setSquads(data.trips || []);
                }
            } catch (error) {
                console.error('Failed to fetch squads:', error);
            } finally {
                setLoading(false);
            }
        };

        if (session) fetchSquads();
    }, [session, apiUrl]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            </div>
        );
    }

    if (!session) return null;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="squads-layout">
            <NavRail />

            <div className="squads-content">
                <div className="squads-header">
                    <h1>Squad Chats</h1>
                    <p>Your trip groups and squad conversations</p>
                </div>

                {loading ? (
                    <div className="squads-loading">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton-squad" />
                        ))}
                    </div>
                ) : squads.length === 0 ? (
                    <div className="empty-squads">
                        <div className="empty-icon">👥</div>
                        <h3>No squad chats yet</h3>
                        <p>Join or create a trip to start chatting with your squad</p>
                        <Link href="/trips" className="explore-btn">
                            Explore Trips
                        </Link>
                    </div>
                ) : (
                    <div className="squads-grid">
                        {squads.map((squad, index) => (
                            <motion.div
                                key={squad._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link href={`/trips/${squad._id}`}>
                                    <GlassCard padding="none" hover className="squad-card">
                                        {/* Cover Image */}
                                        <div className="squad-cover">
                                            {squad.coverImage ? (
                                                <img src={squad.coverImage} alt={squad.title} />
                                            ) : (
                                                <div className="cover-placeholder">
                                                    <MapPin size={32} />
                                                </div>
                                            )}
                                            {squad.unreadCount && squad.unreadCount > 0 && (
                                                <div className="unread-badge">{squad.unreadCount}</div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="squad-info">
                                            <h3>{squad.title}</h3>

                                            <div className="squad-meta">
                                                <span>
                                                    <MapPin size={14} />
                                                    {squad.destination}
                                                </span>
                                                <span>
                                                    <Calendar size={14} />
                                                    {formatDate(squad.startDate)}
                                                </span>
                                            </div>

                                            {/* Squad Members */}
                                            <div className="squad-members">
                                                <div className="member-avatars">
                                                    {squad.squad.slice(0, 4).map((member, i) => (
                                                        <div
                                                            key={member._id}
                                                            className="member-avatar"
                                                            style={{ zIndex: 4 - i }}
                                                        >
                                                            {member.profilePicture ? (
                                                                <img src={member.profilePicture} alt={member.name} />
                                                            ) : (
                                                                <span>{member.name.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {squad.squad.length > 4 && (
                                                        <div className="member-avatar more">
                                                            +{squad.squad.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                                <ChevronRight size={20} className="arrow" />
                                            </div>
                                        </div>
                                    </GlassCard>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .squads-layout {
                    display: flex;
                    width: 100%;
                    height: 100%;
                }
                
                .squads-content {
                    flex: 1;
                    padding: 24px;
                    overflow-y: auto;
                    padding-bottom: 80px;
                }
                
                @media (min-width: 768px) {
                    .squads-content {
                        padding-bottom: 24px;
                    }
                }
                
                .squads-header {
                    margin-bottom: 24px;
                }
                
                .squads-header h1 {
                    font-size: 24px;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 4px;
                }
                
                .squads-header p {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 14px;
                }
                
                .squads-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                }
                
                .squad-cover {
                    height: 120px;
                    position: relative;
                    overflow: hidden;
                    border-radius: 16px 16px 0 0;
                }
                
                .squad-cover img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .cover-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, rgba(20, 184, 166, 0.3), rgba(249, 115, 22, 0.3));
                    color: rgba(255, 255, 255, 0.5);
                }
                
                .unread-badge {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    min-width: 24px;
                    height: 24px;
                    padding: 0 8px;
                    background: #ef4444;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .squad-info {
                    padding: 16px;
                }
                
                .squad-info h3 {
                    font-size: 16px;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 8px;
                }
                
                .squad-meta {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 12px;
                }
                
                .squad-meta span {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .squad-members {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .member-avatars {
                    display: flex;
                }
                
                .member-avatar {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    border: 2px solid #1a1a24;
                    margin-left: -8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #14b8a6, #0d9488);
                    color: white;
                    font-size: 11px;
                    font-weight: 600;
                    overflow: hidden;
                }
                
                .member-avatar:first-child {
                    margin-left: 0;
                }
                
                .member-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .member-avatar.more {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .arrow {
                    color: rgba(255, 255, 255, 0.4);
                }
                
                .empty-squads {
                    text-align: center;
                    padding: 60px 20px;
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }
                
                .empty-squads h3 {
                    font-size: 18px;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 8px;
                }
                
                .explore-btn {
                    display: inline-block;
                    margin-top: 20px;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #14b8a6, #0d9488);
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    text-decoration: none;
                    transition: transform 0.2s;
                }
                
                .explore-btn:hover {
                    transform: scale(1.05);
                }
                
                .squads-loading {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                }
                
                .skeleton-squad {
                    height: 200px;
                    border-radius: 16px;
                    background: rgba(255, 255, 255, 0.1);
                    animation: pulse 1.5s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
