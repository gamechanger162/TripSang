'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavRail from '@/components/app/NavRail';
import GlassCard from '@/components/app/ui/GlassCard';
import { GlassButton } from '@/components/app/ui/GlassCard';
import { useEnv } from '@/hooks/useEnv';
import { communityAPI, userAPI, paymentAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { Globe, Users, Lock, Crown, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import CreateCommunityModal from '@/components/community/CreateCommunityModal';

interface Community {
    _id: string;
    name: string;
    description: string;
    avatar?: string;
    coverImage?: string;
    memberCount: number;
    category: string;
    isPremium: boolean;
    isJoined: boolean;
}

export default function CommunitiesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { apiUrl } = useEnv();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'joined'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin?callbackUrl=/app/communities');
        }
    }, [status, router]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const fetchCommunities = async () => {
            // Guard: Wait for session to be fully loaded
            if (status !== 'authenticated' || !session?.user) return;

            try {
                setLoading(true);
                let data;

                if (filter === 'joined') {
                    // Get my communities
                    const response = await communityAPI.getMyCommunities();
                    data = response.communities || [];
                } else {
                    // Discover communities with search
                    const response = await communityAPI.discover(undefined, debouncedSearch);
                    data = response.communities || [];
                }

                setCommunities(data);
            } catch (error) {
                console.error('Failed to fetch communities:', error);
                // Only show toast once per error
                if (!loading) {
                    toast.error('Failed to load communities');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCommunities();
        // Use stable primitive values as dependencies to prevent infinite loops
    }, [status, (session?.user as any)?.id, filter, debouncedSearch]);

    const handleCreateCommunity = async () => {
        const user = session?.user as any;
        console.log('Debug: Checking premium status for user:', user);

        // 1. Check session first (fast path)
        let isPremium = user?.subscription?.plan === 'premium' || user?.subscription?.plan === 'pro' || user?.isPremium;

        // 2. If not found in session, fetch subscription status from payment API (more reliable)
        if (!isPremium) {
            try {
                const toastId = toast.loading('Verifying membership...');
                const response = await paymentAPI.getStatus();
                toast.dismiss(toastId);

                if (response.success && response.subscription) {
                    const sub = response.subscription;
                    console.log('Debug: Fetched subscription:', sub);

                    // Check for active subscription or valid trial
                    const trialEnd = sub.trialEndDate || sub.trialEnds;
                    isPremium = sub.status === 'active' ||
                        sub.status === 'trial' ||
                        sub.plan === 'premium' ||
                        sub.plan === 'pro' ||
                        (trialEnd && new Date(trialEnd) > new Date());
                }
            } catch (error) {
                console.error('Failed to verify premium status:', error);
                toast.error('Could not verify membership. Please try again.');
                return;
            }
        }

        if (!isPremium) {
            toast.error('Premium subscription required to create communities');
            router.push('/my-plan');
            return;
        }
        // Open the create community modal instead of redirecting
        setShowCreateModal(true);
    };

    const handleCommunityCreated = (newCommunity: any) => {
        // Add the new community to the list
        setCommunities(prev => [newCommunity, ...prev]);
        setShowCreateModal(false);
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="communities-layout">
            <NavRail />

            <div className="communities-content">
                <div className="communities-header">
                    <div>
                        <h1>Communities</h1>
                        <p>Join clubs and connect with fellow travelers</p>
                    </div>
                    <GlassButton onClick={handleCreateCommunity} variant="primary">
                        <Plus size={18} className="mr-2" />
                        Create
                    </GlassButton>
                </div>

                {/* Filter Tabs & Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center">
                    <div className="filter-tabs">
                        <button
                            className={`tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Discover
                        </button>
                        <button
                            className={`tab ${filter === 'joined' ? 'active' : ''}`}
                            onClick={() => setFilter('joined')}
                        >
                            Joined
                        </button>
                    </div>

                    {filter === 'all' && (
                        <div className="search-wrapper">
                            <input
                                type="text"
                                placeholder="Search communities..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="communities-loading">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton-community" />
                        ))}
                    </div>
                ) : communities.length === 0 ? (
                    <div className="empty-communities">
                        <Globe size={48} className="empty-icon" />
                        <h3>
                            {searchQuery ? 'No communities match your search'
                                : filter === 'joined' ? 'No communities joined yet'
                                    : 'No communities found'}
                        </h3>
                        <p>
                            {filter === 'joined' ? 'Explore and join communities to connect with travelers'
                                : 'Be the first to create a community!'}
                        </p>
                    </div>
                ) : (
                    <div className="communities-grid">
                        {communities.map((community, index) => (
                            <motion.div
                                key={community._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link href={`/community/${community._id}`}>
                                    <GlassCard padding="none" hover className="community-card">
                                        {/* Cover */}
                                        <div className="community-cover">
                                            {community.coverImage ? (
                                                <img src={community.coverImage} alt={community.name} />
                                            ) : (
                                                <div className="cover-gradient" />
                                            )}

                                            {/* Avatar */}
                                            <div className="community-avatar">
                                                {community.avatar ? (
                                                    <img src={community.avatar} alt={community.name} />
                                                ) : (
                                                    <Globe size={24} />
                                                )}
                                            </div>

                                            {/* Premium Badge */}
                                            {community.isPremium && (
                                                <div className="premium-badge">
                                                    <Crown size={12} />
                                                    Premium
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="community-info">
                                            <h3>{community.name}</h3>
                                            <p className="community-desc">{community.description}</p>

                                            <div className="community-meta">
                                                <span className="category">{community.category}</span>
                                                <span className="members">
                                                    <Users size={14} />
                                                    {community.memberCount}
                                                </span>
                                                {community.isJoined && (
                                                    <span className="joined-badge">Joined</span>
                                                )}
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
                .communities-layout {
                    display: flex;
                    width: 100%;
                    height: 100%;
                }
                
                .communities-content {
                    flex: 1;
                    padding: 24px;
                    overflow-y: auto;
                    padding-bottom: 80px;
                }
                
                @media (min-width: 768px) {
                    .communities-content {
                        padding-bottom: 24px;
                    }
                }
                
                .communities-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    margin-bottom: 24px;
                }
                
                .communities-header h1 {
                    font-size: 24px;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 4px;
                }
                
                .communities-header p {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 14px;
                }
                
                .filter-tabs {
                    display: flex;
                    gap: 8px;
                }
                
                .search-wrapper {
                    width: 100%;
                    max-width: 300px;
                }
                
                .search-input {
                    width: 100%;
                    padding: 8px 16px;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    font-size: 14px;
                    outline: none;
                    transition: all 0.2s;
                }
                
                .search-input:focus {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(20, 184, 166, 0.5);
                }
                
                .tab {
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.6);
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.2s;
                }
                
                .tab:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .tab.active {
                    background: rgba(20, 184, 166, 0.2);
                    border-color: rgba(20, 184, 166, 0.3);
                    color: #14b8a6;
                }
                
                .communities-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 16px;
                }
                
                .community-cover {
                    height: 80px;
                    position: relative;
                    overflow: hidden;
                    border-radius: 16px 16px 0 0;
                }
                
                .community-cover img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .cover-gradient {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(20, 184, 166, 0.4), rgba(139, 92, 246, 0.4));
                }
                
                .community-avatar {
                    position: absolute;
                    bottom: -20px;
                    left: 16px;
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #14b8a6, #0d9488);
                    border: 3px solid #1a1a24;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    overflow: hidden;
                }
                
                .community-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .premium-badge {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 600;
                    color: white;
                }
                
                .community-info {
                    padding: 28px 16px 16px;
                }
                
                .community-info h3 {
                    font-size: 16px;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 4px;
                }
                
                .community-desc {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 12px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .community-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .category {
                    font-size: 12px;
                    padding: 4px 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    color: rgba(255, 255, 255, 0.7);
                }
                
                .members {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .joined-badge {
                    font-size: 11px;
                    padding: 3px 8px;
                    background: rgba(20, 184, 166, 0.2);
                    border: 1px solid rgba(20, 184, 166, 0.3);
                    border-radius: 6px;
                    color: #14b8a6;
                    margin-left: auto;
                }
                
                .empty-communities {
                    text-align: center;
                    padding: 60px 20px;
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .empty-icon {
                    margin: 0 auto 16px;
                    color: rgba(255, 255, 255, 0.3);
                }
                
                .empty-communities h3 {
                    font-size: 18px;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 8px;
                }
                
                .communities-loading {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 16px;
                }
                
                .skeleton-community {
                    height: 180px;
                    border-radius: 16px;
                    background: rgba(255, 255, 255, 0.1);
                    animation: pulse 1.5s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>

            {/* Create Community Modal */}
            <CreateCommunityModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCommunityCreated}
            />
        </div>
    );
}
