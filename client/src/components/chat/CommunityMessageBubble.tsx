import { memo } from 'react';
import Image from 'next/image';

interface Message {
    _id: string;
    sender: string;
    senderName: string;
    senderProfilePicture?: string;
    message: string;
    type: 'text' | 'image';
    imageUrl?: string;
    timestamp: string;
}

interface CommunityMessageBubbleProps {
    message: Message;
    isOwn: boolean;
    onImageClick: (url: string) => void;
}

const CommunityMessageBubble = memo(({ message, isOwn, onImageClick }: CommunityMessageBubbleProps) => {
    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] ${isOwn ? 'order-2' : ''}`}>
                {!isOwn && (
                    <p className="text-xs text-gray-400 mb-1">{message.senderName}</p>
                )}
                <div className={`rounded-2xl px-4 py-2 ${isOwn ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white' : 'bg-white/10 text-white'}`}>
                    {message.type === 'image' && message.imageUrl ? (
                        <div
                            className="cursor-pointer hover:opacity-90 transition-opacity relative w-full aspect-video min-w-[200px]"
                            onClick={() => onImageClick(message.imageUrl!)}
                        >
                            <Image
                                src={message.imageUrl}
                                alt="Shared"
                                fill
                                className="rounded-lg object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                    ) : (
                        <p>{message.message}</p>
                    )}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
});

CommunityMessageBubble.displayName = 'CommunityMessageBubble';

export default CommunityMessageBubble;
