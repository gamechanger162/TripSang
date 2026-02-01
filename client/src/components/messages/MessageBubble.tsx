'use client';

import { DirectMessage } from '@/types/messages';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { linkifyText } from '@/utils/linkify';

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
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}>
            <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                {/* Message bubble */}
                <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${isOwnMessage
                        ? 'bg-primary-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white rounded-bl-none'
                        }`}
                >
                    {message.type === 'image' && message.imageUrl ? (
                        <div className="mb-1 rounded-lg overflow-hidden">
                            <Image
                                src={message.imageUrl}
                                alt="Shared image"
                                width={300}
                                height={225}
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    ) : (
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{linkifyText(message.message)}</p>
                    )}

                    <div className={`text-[10px] mt-1 flex justify-end opacity-70 ${isOwnMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                        {formatTime(message.timestamp)}
                        {isOwnMessage && (
                            <span className="ml-1">
                                {message.read ? (
                                    <span className="text-blue-200 font-bold">✓✓</span>
                                ) : (
                                    <span>✓</span>
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
