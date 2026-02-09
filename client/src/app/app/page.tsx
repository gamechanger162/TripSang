'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConversationList from '@/components/app/ConversationList';
import ChatView from '@/components/app/ChatView';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, Radio } from 'lucide-react';
import { messageAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface SelectedConversation {
    id: string;
    type: 'dm' | 'squad';
}

function AppContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const userIdParam = searchParams.get('userId');
    const [selectedConversation, setSelectedConversation] = useState<SelectedConversation | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin?callbackUrl=/app');
        }
    }, [status, router]);

    // Handle deep link to specific conversation via userId
    useEffect(() => {
        const initChatFromParams = async () => {
            if (userIdParam && session?.user && !selectedConversation) {
                try {
                    const response = await messageAPI.getOrCreateConversation(userIdParam);
                    if (response.success && response.conversation) {
                        setSelectedConversation({
                            id: response.conversation._id,
                            type: 'dm'
                        });
                        // Clean up URL
                        router.replace('/app', { scroll: false });
                    }
                } catch (error) {
                    console.error('Failed to initialize chat from params:', error);
                    toast.error('Failed to open conversation');
                }
            }
        };

        if (status === 'authenticated') {
            initChatFromParams();
        }
    }, [userIdParam, session, status, selectedConversation, router]);

    // Don't render if not authenticated (still checking or redirecting)
    if (status === 'unauthenticated' || !session) return null;

    const handleSelectConversation = (id: string, type: 'dm' | 'squad') => {
        setSelectedConversation({ id, type });
    };

    const handleBack = () => {
        setSelectedConversation(null);
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="flex w-full h-full overflow-hidden">
            {/* Conversation List (hidden on mobile when chat is open) */}
            <AnimatePresence mode="wait">
                {(!isMobile || !selectedConversation) && (
                    <motion.div
                        key="conversation-list"
                        className="w-full md:w-[320px] lg:w-[360px] md:min-w-[320px] lg:min-w-[360px] h-full overflow-hidden"
                        initial={isMobile ? { x: -100, opacity: 0 } : false}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -100, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ConversationList
                            onSelectConversation={handleSelectConversation}
                            selectedId={selectedConversation?.id || null}
                            refreshTrigger={refreshTrigger}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat View / Empty State */}
            <AnimatePresence mode="wait">
                {selectedConversation ? (
                    <motion.div
                        key="chat-view"
                        className="flex-1 h-full overflow-hidden"
                        initial={isMobile ? { x: 100, opacity: 0 } : false}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 100, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChatView
                            conversationId={selectedConversation.id}
                            conversationType={selectedConversation.type}
                            onBack={handleBack}
                            isMobile={isMobile}
                        />
                    </motion.div>
                ) : (
                    !isMobile && (
                        <motion.div
                            key="empty-chat"
                            className="flex-1 h-full flex items-center justify-center"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Premium Empty State with Radar Animation */}
                            <div className="flex flex-col items-center text-center p-8">
                                {/* Radar Icon with Pulsing Rings */}
                                <div className="relative mb-8">
                                    {/* Outer Pulsing Rings */}
                                    <motion.div
                                        className="absolute inset-0 w-32 h-32 rounded-full border border-teal-500/20"
                                        initial={{ scale: 0.5, opacity: 1 }}
                                        animate={{ scale: 2.5, opacity: 0 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                                    />
                                    <motion.div
                                        className="absolute inset-0 w-32 h-32 rounded-full border border-teal-500/30"
                                        initial={{ scale: 0.5, opacity: 1 }}
                                        animate={{ scale: 2, opacity: 0 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                                    />
                                    <motion.div
                                        className="absolute inset-0 w-32 h-32 rounded-full border border-emerald-500/40"
                                        initial={{ scale: 0.5, opacity: 1 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1 }}
                                    />

                                    {/* Center Icon */}
                                    <motion.div
                                        className="relative w-32 h-32 rounded-full bg-gradient-to-br from-teal-500/20 via-emerald-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/10 flex items-center justify-center"
                                        animate={{
                                            boxShadow: [
                                                '0 0 20px rgba(20, 184, 166, 0.1)',
                                                '0 0 40px rgba(20, 184, 166, 0.2)',
                                                '0 0 20px rgba(20, 184, 166, 0.1)'
                                            ]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Radio className="w-12 h-12 text-teal-400" />
                                    </motion.div>

                                    {/* Sparkles around */}
                                    <motion.div
                                        className="absolute -top-2 -right-2"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Sparkles className="w-6 h-6 text-orange-400/60" />
                                    </motion.div>
                                    <motion.div
                                        className="absolute -bottom-2 -left-2"
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Sparkles className="w-5 h-5 text-teal-400/60" />
                                    </motion.div>
                                </div>

                                {/* Text */}
                                <motion.h3
                                    className="text-2xl font-bold text-white mb-2"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Select a conversation
                                </motion.h3>
                                <motion.p
                                    className="text-gray-400 max-w-xs"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    Choose from your existing chats or start a new adventure with fellow travelers
                                </motion.p>

                                {/* Subtle hint */}
                                <motion.div
                                    className="mt-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-500"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <span className="text-teal-400">Tip:</span> Messages are end-to-end encrypted
                                </motion.div>
                            </div>
                        </motion.div>
                    )
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AppPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center w-full h-full text-white">
                Loading...
            </div>
        }>
            <AppContent />
        </Suspense>
    );
}
