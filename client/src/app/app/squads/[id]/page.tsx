'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import NavRail from '@/components/app/NavRail';
import ChatView from '@/components/app/ChatView';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function SquadChatPage() {
    const { id } = useParams();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin?callbackUrl=/app/squads');
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
                    <p className="text-gray-400 text-sm">Loading squad chat...</p>
                </motion.div>
            </div>
        );
    }

    if (!session) return null;

    const handleBack = () => {
        router.push('/app/squads');
    };

    return (
        <div className="flex flex-col flex-1 h-full w-full overflow-hidden">
            <ChatView
                conversationId={id as string}
                conversationType="squad"
                onBack={handleBack}
                isMobile={isMobile}
            />
        </div>
    );
}
