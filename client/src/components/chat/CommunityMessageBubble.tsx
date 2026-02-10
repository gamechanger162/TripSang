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
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-4`}>
            <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-2'}`}>
                {!isOwn && (
                    <p className="text-xs text-cyan-400 mb-1 ml-3 font-medium tracking-wide">{message.senderName}</p>
                )}
                <div
                    className={`relative rounded-3xl px-5 py-3 shadow-lg backdrop-blur-md border ${isOwn
                        ? 'bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-cyan-500/30 rounded-br-none shadow-[0_0_15px_rgba(6,182,212,0.15)] text-white'
                        : 'bg-white/5 border-white/10 rounded-bl-none hover:bg-white/10 transition-colors text-gray-200'
                        }`}
                >
                    {message.type === 'image' && message.imageUrl ? (
                        <div
                            className="cursor-pointer hover:opacity-90 transition-all duration-300 relative w-full aspect-video min-w-[240px] rounded-2xl overflow-hidden border border-white/10"
                            onClick={() => onImageClick(message.imageUrl!)}
                        >
                            <Image
                                src={message.imageUrl}
                                alt="Shared"
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                    ) : (
                        <p className={`text-[15px] leading-relaxed ${isOwn ? 'text-white/95' : 'text-gray-200'}`}>{message.message}</p>
                    )}

                    <p className={`text-[10px] mt-2 flex items-center gap-1 ${isOwn ? 'text-cyan-200/60 justify-end' : 'text-gray-500'}`}>
                        {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {isOwn && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]"></span>}
                    </p>
                </div>
            </div>
        </div>
    );
});

CommunityMessageBubble.displayName = 'CommunityMessageBubble';

export default CommunityMessageBubble;
