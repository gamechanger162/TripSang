'use client';

import { useState } from 'react';
import { DirectMessage } from '@/types/messages';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { linkifyText } from '@/utils/linkify';
import ImageViewer from '../ImageViewer';

interface MessageBubbleProps {
    message: DirectMessage;
    onReply?: (message: DirectMessage) => void;
}

export default function MessageBubble({ message, onReply }: MessageBubbleProps) {
    const { data: session } = useSession();
    const isOwnMessage = message.sender === session?.user?.id;
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <>
            <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}>
                <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    {/* Message bubble */}
                    <div
                        className={`rounded-2xl px-4 py-3 shadow-sm ${isOwnMessage
                            ? 'bg-primary-600 text-white rounded-br-none'
                            : 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white rounded-bl-none'
                            }`}
                    >
                        {/* Quoted Message */}
                        {message.replyTo && (
                            <div
                                className={`mb-2 p-2 rounded-lg text-xs border-l-2 cursor-pointer ${isOwnMessage
                                    ? 'bg-white/10 border-white/50 text-white/90'
                                    : 'bg-gray-50 dark:bg-dark-800/50 border-primary-500 text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <p className="font-bold mb-0.5">{message.replyTo.senderName}</p>
                                <p className="truncate">
                                    {message.replyTo.type === 'image' ? '📷 Image' : message.replyTo.message}
                                </p>
                            </div>
                        )}

                        {message.type === 'image' && message.imageUrl ? (
                            <div
                                className="mb-1 rounded-lg overflow-hidden cursor-pointer max-w-[280px]"
                                onClick={() => setViewingImage(message.imageUrl!)}
                            >
                                <Image
                                    src={message.imageUrl}
                                    alt="Shared image"
                                    width={280}
                                    height={210}
                                    unoptimized
                                    className="w-full h-auto max-h-[300px] object-cover hover:scale-105 transition-transform"
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

                    {/* Actions */}
                    <div className={`flex items-center mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                        {onReply && (
                            <button
                                onClick={() => onReply(message)}
                                className="text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
                                title="Reply"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Viewer Modal */}
            <ImageViewer
                imageUrl={viewingImage || ''}
                isOpen={!!viewingImage}
                onClose={() => setViewingImage(null)}
                alt="DM image"
            />
        </>
    );
}
