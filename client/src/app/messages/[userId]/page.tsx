'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { messageAPI } from '@/lib/api';
import { DirectMessage } from '@/types/messages';
import DirectMessageBox from '@/components/messages/DirectMessageBox';
import toast from 'react-hot-toast';

export default function ChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;

    const [conversationId, setConversationId] = useState<string>('');
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated' && userId) {
            loadConversation();
        }
    }, [status, userId]);

    const loadConversation = async () => {
        try {
            setLoading(true);
            const response = await messageAPI.getOrCreateConversation(userId);

            if (response.success) {
                setConversationId(response.conversation._id);
                setMessages(response.messages || []);
                setOtherUser(response.otherUser);
            }
        } catch (error: any) {
            console.error('Error loading conversation:', error);
            toast.error(error.message || 'Failed to load conversation');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (!otherUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">User not found</p>
                    <Link href="/messages" className="btn-primary">
                        Back to Messages
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-dark-900">
            {/* Header */}
            <div className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-dark-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {/* Back button */}
                            <Link
                                href="/messages"
                                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>

                            {/* User info */}
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                                    {otherUser.profilePicture ? (
                                        <Image
                                            src={otherUser.profilePicture}
                                            alt={otherUser.name}
                                            width={40}
                                            height={40}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                                            {otherUser.name[0].toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {otherUser.name}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-hidden">
                <div className="max-w-7xl mx-auto h-full">
                    {conversationId && (
                        <DirectMessageBox
                            conversationId={conversationId}
                            receiverId={userId}
                            receiverName={otherUser.name}
                            initialMessages={messages}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
