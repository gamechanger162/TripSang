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
    const [blockStatus, setBlockStatus] = useState<{
        iBlockedThem: boolean;
        theyBlockedMe: boolean;
        canMessage: boolean;
    } | null>(null);
    const [showMenu, setShowMenu] = useState(false);

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
        setShowMenu(false);
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
        setShowMenu(false);
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
        <div className="fixed inset-0 flex flex-col bg-gray-900 pt-16 pb-20 md:pb-0 z-40">
            {/* Header */}
            <div className="bg-gray-800 shadow-sm border-b border-gray-700 flex-shrink-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {/* Back button */}
                            <Link
                                href="/messages"
                                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>

                            {/* User info - Clickable to view profile */}
                            <Link href={`/profile/${userId}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
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
                                    <h2 className="text-lg font-semibold text-white">
                                        {otherUser.name}
                                    </h2>
                                    {blockStatus?.theyBlockedMe && (
                                        <p className="text-xs text-red-500">This user has blocked you</p>
                                    )}
                                </div>
                            </Link>
                        </div>

                        {/* Menu button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </button>

                            {/* Dropdown menu */}
                            {showMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 py-1 z-50">
                                    <Link
                                        href={`/profile/${userId}`}
                                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                                        onClick={() => setShowMenu(false)}
                                    >
                                        View Profile
                                    </Link>
                                    {blockStatus?.iBlockedThem ? (
                                        <button
                                            onClick={handleUnblock}
                                            className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100 dark:hover:bg-dark-700"
                                        >
                                            Unblock User
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleBlock}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-dark-700"
                                        >
                                            Block User
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
                        <DirectMessageBox
                            conversationId={conversationId}
                            receiverId={userId}
                            receiverName={otherUser.name}
                            initialMessages={messages}
                            isBlocked={!blockStatus?.canMessage}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
