'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ConversationList from '@/components/app/ConversationList';
import ChatView from '@/components/app/ChatView';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, Radio } from 'lucide-react';

interface SelectedConversation {
    id: string;
    type: 'dm';
}

export default function AppPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [selectedConversation, setSelectedConversation] = useState<SelectedConversation | null>(null);
    const [isMobile, setIsMobile] = useState(false);

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

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-900 via-gray-950 to-black">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 animate-pulse" />
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-teal-500/50"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                    <p className="text-gray-400 text-sm">Loading...</p>
                </motion.div>
            </div>
        );
    }

    if (!session) return null;

    const handleSelectConversation = (id: string, type: 'dm') => {
        setSelectedConversation({ id, type });
    };

    const handleBack = () => {
        setSelectedConversation(null);
    };

    return (
        <div className="flex w-full h-full overflow-hidden pb-16 md:pb-0">


            {/* Conversation List (hidden on mobile when chat is open) */}
            <AnimatePresence mode="wait">
                {(!isMobile || !selectedConversation) && (
                    <motion.div
                        key="conversation-list"
                        className="w-full md:w-[320px] lg:w-[360px] md:min-w-[320px] lg:min-w-[360px] h-full overflow-hidden pb-16 md:pb-0"
                        initial={isMobile ? { x: -100, opacity: 0 } : false}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -100, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ConversationList
                            onSelectConversation={handleSelectConversation}
                            selectedId={selectedConversation?.id || null}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat View / Empty State */}
            <AnimatePresence mode="wait">
                {selectedConversation ? (
                    <motion.div
                        key="chat-view"
                        className="flex-1 h-full overflow-hidden pb-16 md:pb-0"
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
