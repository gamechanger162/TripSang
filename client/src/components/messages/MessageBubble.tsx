'use client';

import { DirectMessage } from '@/types/messages';
import { useSession } from 'next-auth/react';

interface MessageBubbleProps {
    message: DirectMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
    const { data: session } = useSession();
    const isOwnMessage = message.sender === session?.user?.id;

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                {/* Sender name (only for received messages) */}
                {!isOwnMessage && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">
                        {message.senderName}
                    </span>
                )}

                {/* Message bubble */}
                <div
                    className={`rounded-2xl px-4 py-2 ${isOwnMessage
                            ? 'bg-primary-600 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white rounded-bl-sm'
                        }`}
                >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                </div>

                {/* Timestamp */}
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-2">
                    {formatTime(message.timestamp)}
                    {isOwnMessage && message.read && <span className="ml-1">✓✓</span>}
                </span>
            </div>
        </div>
    );
}
