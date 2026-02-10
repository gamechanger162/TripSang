import { memo, useState } from 'react';
import Image from 'next/image';
import { MoreVertical, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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
    onDelete: () => void;
    isMobile: boolean;
}

const CommunityMessageBubble = memo(({ message, isOwn, onImageClick, onDelete, isMobile }: CommunityMessageBubbleProps) => {
    const [showActions, setShowActions] = useState(false);

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-4 relative`}>
            <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-2'} relative group/bubble`}>
                {isOwn && (
                    <button
                        className={`absolute top-2 -left-8 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all ${isMobile || showActions ? 'opacity-100' : 'opacity-0 group-hover/bubble:opacity-100'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowActions(!showActions);
                        }}
                    >
                        <MoreVertical size={16} />
                    </button>
                )}

                <AnimatePresence>
                    {showActions && (
                        <>
                            <div
                                className="fixed inset-0 z-40 bg-transparent"
                                onClick={() => setShowActions(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className={`absolute top-8 ${isOwn ? 'right-0' : 'left-0'} z-50 min-w-[140px] bg-gray-900/95 border border-white/10 rounded-xl shadow-xl backdrop-blur-xl overflow-hidden`}
                            >
                                <button
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/5 hover:text-red-300 flex items-center gap-2 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                        setShowActions(false);
                                    }}
                                >
                                    <Trash2 size={14} />
                                    <span>Delete</span>
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

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
