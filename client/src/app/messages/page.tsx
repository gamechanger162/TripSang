'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy /messages route - redirects to new /app chat
 * This page is kept for backwards compatibility with old links
 */
export default function MessagesPage() {
    const router = useRouter();

    useEffect(() => {
        // Permanent redirect to new chat app
        router.replace('/app');
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4" />
                <p className="text-white/60">Redirecting to chat...</p>
            </div>
        </div>
    );
}
