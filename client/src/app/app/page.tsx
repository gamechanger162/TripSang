'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavRail from '@/components/app/NavRail';
import ConversationList from '@/components/app/ConversationList';
import ChatView from '@/components/app/ChatView';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin?callbackUrl=/app');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            </div>
        );
    }

    if (!session) return null;

    const handleSelectConversation = (id: string) => {
        setSelectedConversation(id);
    };

    const handleBack = () => {
        setSelectedConversation(null);
    };

    // Mobile: Show either list or chat (not both)
    // Desktop: Show both side by side
    return (
        <div className="app-main-layout">
            {/* Nav Rail */}
            <NavRail />

            {/* Conversation List (hidden on mobile when chat is open) */}
            <AnimatePresence mode="wait">
                {(!isMobile || !selectedConversation) && (
                    <motion.div
                        key="conversation-list"
                        className="conversation-list-panel"
                        initial={isMobile ? { x: -100, opacity: 0 } : false}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -100, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ConversationList
                            onSelectConversation={handleSelectConversation}
                            selectedId={selectedConversation}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat View */}
            <AnimatePresence mode="wait">
                {selectedConversation ? (
                    <motion.div
                        key="chat-view"
                        className="chat-view-panel"
                        initial={isMobile ? { x: 100, opacity: 0 } : false}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 100, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChatView
                            conversationId={selectedConversation}
                            onBack={handleBack}
                            isMobile={isMobile}
                        />
                    </motion.div>
                ) : (
                    !isMobile && (
                        <motion.div
                            key="empty-chat"
                            className="chat-view-panel empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="empty-state">
                                <div className="empty-icon">💬</div>
                                <h3>Select a conversation</h3>
                                <p>Choose from your existing chats or start a new one</p>
                            </div>
                        </motion.div>
                    )
                )}
            </AnimatePresence>

            <style jsx>{`
                .app-main-layout {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
                
                .conversation-list-panel {
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    padding-bottom: 64px; /* Mobile nav height */
                }
                
                @media (min-width: 768px) {
                    .conversation-list-panel {
                        width: 320px;
                        min-width: 320px;
                        border-right: 1px solid rgba(255, 255, 255, 0.1);
                        padding-bottom: 0;
                    }
                }
                
                @media (min-width: 1024px) {
                    .conversation-list-panel {
                        width: 360px;
                        min-width: 360px;
                    }
                }
                
                .chat-view-panel {
                    flex: 1;
                    height: 100%;
                    overflow: hidden;
                    padding-bottom: 64px; /* Mobile nav height */
                }
                
                @media (min-width: 768px) {
                    .chat-view-panel {
                        padding-bottom: 0;
                    }
                }
                
                .chat-view-panel.empty {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .empty-state {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.5);
                }
                
                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }
                
                .empty-state h3 {
                    font-size: 18px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 8px;
                }
                
                .empty-state p {
                    font-size: 14px;
                }
            `}</style>
        </div>
    );
}
