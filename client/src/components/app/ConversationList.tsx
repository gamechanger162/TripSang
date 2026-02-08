'use client';

import { useState, useEffect, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import VerifiedBadge from './ui/VerifiedBadge';
import { useEnv } from '@/hooks/useEnv';

interface Conversation {
    _id: string;
    type: 'dm' | 'squad' | 'community';
    name: string;
    avatar?: string;
    lastMessage?: {
        text: string;
        timestamp: string;
        senderId: string;
    };
    unreadCount: number;
    participants?: Array<{
        _id: string;
        name: string;
        profilePicture?: string;
        isVerified?: boolean;
    }>;
    isVerified?: boolean;
}

interface ConversationListProps {
    onSelectConversation: (id: string) => void;
    selectedId: string | null;
}

export default function ConversationList({ onSelectConversation, selectedId }: ConversationListProps) {
    const { apiUrl } = useEnv();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/api/messages/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setConversations(data.conversations || []);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Filter conversations by search
    const filteredConversations = conversations.filter(conv =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = diff / (1000 * 60 * 60);

        if (hours < 24) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (hours < 168) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const renderConversation = (index: number, conv: Conversation) => (
        <motion.div
            key={conv._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
        >
            <div
                className={`conversation-item ${selectedId === conv._id ? 'selected' : ''}`}
                onClick={() => onSelectConversation(conv._id)}
            >
                {/* Avatar */}
                <div className="avatar-wrapper">
                    {conv.avatar ? (
                        <img src={conv.avatar} alt={conv.name} className="avatar" />
                    ) : (
                        <div className="avatar-placeholder">
                            {conv.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    {conv.type === 'squad' && (
                        <div className="type-badge squad">👥</div>
                    )}
                    {conv.type === 'community' && (
                        <div className="type-badge community">🌐</div>
                    )}
                </div>

                {/* Content */}
                <div className="conversation-content">
                    <div className="conversation-header">
                        <span className="conversation-name">
                            {conv.name}
                            {conv.isVerified && <VerifiedBadge size="sm" className="ml-1" />}
                        </span>
                        {conv.lastMessage && (
                            <span className="conversation-time">
                                {formatTime(conv.lastMessage.timestamp)}
                            </span>
                        )}
                    </div>
                    <div className="conversation-preview">
                        <span className="preview-text">
                            {conv.lastMessage?.text || 'No messages yet'}
                        </span>
                        {conv.unreadCount > 0 && (
                            <span className="unread-badge">{conv.unreadCount}</span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="conversation-list-container">
            {/* Header */}
            <div className="list-header">
                <h2>Messages</h2>
                <button className="new-chat-btn">
                    <Plus size={20} />
                </button>
            </div>

            {/* Search */}
            <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Conversation List */}
            {loading ? (
                <div className="loading-state">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton-item">
                            <div className="skeleton-avatar" />
                            <div className="skeleton-content">
                                <div className="skeleton-line w-3/4" />
                                <div className="skeleton-line w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredConversations.length === 0 ? (
                <div className="empty-list">
                    <p>No conversations yet</p>
                </div>
            ) : (
                <Virtuoso
                    style={{ height: 'calc(100% - 120px)' }}
                    data={filteredConversations}
                    itemContent={renderConversation}
                    className="app-scrollable"
                />
            )}

            <style jsx>{`
                .conversation-list-container {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: rgba(0, 0, 0, 0.2);
                }
                
                .list-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .list-header h2 {
                    font-size: 20px;
                    font-weight: 700;
                    color: white;
                }
                
                .new-chat-btn {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(20, 184, 166, 0.2);
                    border: 1px solid rgba(20, 184, 166, 0.3);
                    border-radius: 10px;
                    color: #14b8a6;
                    transition: all 0.2s;
                }
                
                .new-chat-btn:hover {
                    background: rgba(20, 184, 166, 0.3);
                }
                
                .search-wrapper {
                    position: relative;
                    padding: 0 16px 16px;
                }
                
                .search-icon {
                    position: absolute;
                    left: 28px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255, 255, 255, 0.4);
                    margin-top: -8px;
                }
                
                .search-input {
                    width: 100%;
                    padding: 10px 12px 10px 40px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: white;
                    font-size: 14px;
                    outline: none;
                    transition: all 0.2s;
                }
                
                .search-input::placeholder {
                    color: rgba(255, 255, 255, 0.4);
                }
                
                .search-input:focus {
                    border-color: rgba(20, 184, 166, 0.5);
                    background: rgba(255, 255, 255, 0.15);
                }
                
                .conversation-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .conversation-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .conversation-item.selected {
                    background: rgba(20, 184, 166, 0.15);
                }
                
                .avatar-wrapper {
                    position: relative;
                    flex-shrink: 0;
                }
                
                .avatar, .avatar-placeholder {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    object-fit: cover;
                }
                
                .avatar-placeholder {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #14b8a6, #0d9488);
                    color: white;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .type-badge {
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    background: #1a1a24;
                    border: 2px solid #1a1a24;
                }
                
                .conversation-content {
                    flex: 1;
                    min-width: 0;
                }
                
                .conversation-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }
                
                .conversation-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .conversation-time {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.5);
                }
                
                .conversation-preview {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .preview-text {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.6);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    flex: 1;
                }
                
                .unread-badge {
                    min-width: 20px;
                    height: 20px;
                    padding: 0 6px;
                    background: #14b8a6;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: 600;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-left: 8px;
                }
                
                .loading-state, .empty-list {
                    padding: 16px;
                }
                
                .skeleton-item {
                    display: flex;
                    gap: 12px;
                    padding: 12px 0;
                }
                
                .skeleton-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: rgba(255, 255, 255, 0.1);
                    animation: pulse 1.5s infinite;
                }
                
                .skeleton-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .skeleton-line {
                    height: 12px;
                    border-radius: 6px;
                    background: rgba(255, 255, 255, 0.1);
                    animation: pulse 1.5s infinite;
                }
                
                .empty-list {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.5);
                    padding-top: 40px;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
