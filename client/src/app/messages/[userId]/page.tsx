'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { messageAPI } from '@/lib/api';
import { DirectMessage } from '@/types/messages';
import FuturisticDirectMessage from '@/components/messages/FuturisticDirectMessage';
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
    const [blockStatus, setBlockStatus] = useState<{
        iBlockedThem: boolean;
        theyBlockedMe: boolean;
        canMessage: boolean;
    } | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    useEffect(() => {
        if (status === 'authenticated' && userId) {
            loadConversation();
            loadBlockStatus();
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

    const loadBlockStatus = async () => {
        try {
            const response = await messageAPI.getBlockStatus(userId);
            if (response.success) {
                setBlockStatus({
                    iBlockedThem: response.iBlockedThem,
                    theyBlockedMe: response.theyBlockedMe,
                    canMessage: response.canMessage
                });
            }
        } catch (error) {
            console.error('Error loading block status:', error);
        }
    };

    const handleBlock = async () => {
        if (!confirm(`Are you sure you want to block ${otherUser?.name}? They won't be able to message you.`)) {
            return;
        }

        try {
            const response = await messageAPI.blockUser(userId);
            if (response.success) {
                toast.success(response.message);
                setBlockStatus(prev => prev ? { ...prev, iBlockedThem: true, canMessage: false } : null);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to block user');
        }
    };

    const handleUnblock = async () => {
        try {
            const response = await messageAPI.unblockUser(userId);
            if (response.success) {
                toast.success('User unblocked');
                loadBlockStatus(); // Reload to get accurate status
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to unblock user');
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (!otherUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
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
        <div className="fixed inset-0 flex flex-col bg-gray-900 z-40">
            {/* Blocked notice */}
            {blockStatus?.iBlockedThem && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            You have blocked this user. They cannot send you messages.
                        </p>
                        <button
                            onClick={handleUnblock}
                            className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:underline"
                        >
                            Unblock
                        </button>
                    </div>
                </div>
            )}

            {/* Chat area */}
            <div className="flex-1 overflow-hidden">
                <div className="max-w-7xl mx-auto h-full">
                    {conversationId && (
                        <FuturisticDirectMessage
                            conversationId={conversationId}
                            receiverId={userId}
                            receiverName={otherUser.name}
                            receiverImage={otherUser.profilePicture}
                            initialMessages={messages}
                            isBlocked={!blockStatus?.canMessage}
                            blockStatus={blockStatus}
                            onBlock={handleBlock}
                            onUnblock={handleUnblock}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
