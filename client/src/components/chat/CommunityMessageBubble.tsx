import { memo, useState } from 'react';
import Image from 'next/image';
import { MoreVertical, Trash2, Copy, Reply } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

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
    onReply?: () => void;
    isMobile: boolean;
    groupPosition?: 'single' | 'top' | 'middle' | 'bottom';
}

const CommunityMessageBubble = memo(({ message, isOwn, onImageClick, onDelete, onReply, isMobile, groupPosition = 'single' }: CommunityMessageBubbleProps) => {
    const [showActions, setShowActions] = useState(false);

    const formatTime = (ts: string) => {
        return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className={`flex w-full px-2 sm:px-4 py-0.5 group relative hover:bg-white/[0.02] transition-colors ${isOwn ? 'justify-end' : 'justify-start'}`}>

            {/* Avatar (Only for received messages) */}
            {!isOwn && (
                <div className={`w-8 h-8 mr-2 shrink-0 flex flex-col justify-end ${(groupPosition === 'bottom' || groupPosition === 'single') ? 'visible' : 'invisible'}`}>
                    {(groupPosition === 'bottom' || groupPosition === 'single') && (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                            {message.senderProfilePicture ? (
                                <Image
                                    src={message.senderProfilePicture}
                                    alt={message.senderName}
                                    width={32} height={32}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                    {message.senderName?.[0]}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Bubble Container */}
            <div className={`relative max-w-[85%] sm:max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>

                {/* Sender Name */}
                {!isOwn && (groupPosition === 'top' || groupPosition === 'single') && (
                    <span className="text-[11px] text-zinc-400 ml-1 mb-1 font-medium">
                        {message.senderName}
                    </span>
                )}

                {/* Message Bubble */}
                <div
                    className={`
                        relative px-3 py-2 text-sm shadow-sm break-words min-w-[60px]
                        ${isOwn
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl rounded-tr-sm'
                            : 'bg-zinc-800 text-zinc-100 rounded-2xl rounded-tl-sm border border-white/5'}
                    `}
                >
                    {/* Image Content */}
                    {message.type === 'image' && message.imageUrl && (
                        <div className="mb-1 rounded-lg overflow-hidden cursor-pointer relative group/image">
                            <Image
                                src={message.imageUrl}
                                alt="Shared image"
                                width={300} height={200}
                                className="object-cover max-h-60 w-full"
                                onClick={() => onImageClick(message.imageUrl!)}
                            />
                        </div>
                    )}

                    {/* Text Content */}
                    {message.message && (
                        <p className="whitespace-pre-wrap leading-relaxed">{message.message}</p>
                    )}

                    {/* Time */}
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isOwn ? 'text-white/70' : 'text-zinc-500'}`}>
                        <span>{formatTime(message.timestamp)}</span>
                        {isOwn && <span>• Sent</span>}
                    </div>

                    {/* Options Button */}
                    <div className={`absolute top-0 ${isOwn ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-center justify-center h-full`}>
                        <button
                            className="p-1.5 rounded-full bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white shadow-lg backdrop-blur-md"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowActions(!showActions);
                            }}
                        >
                            <MoreVertical size={14} />
                        </button>
                    </div>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {showActions && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`absolute bottom-full ${isOwn ? 'right-0' : 'left-0'} mb-1 bg-zinc-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden min-w-[140px] py-1`}
                                >
                                    {onReply && (
                                        <button
                                            onClick={() => { onReply(); setShowActions(false); }}
                                            className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 flex items-center gap-2"
                                        >
                                            <Reply size={14} /> Reply
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(message.message); setShowActions(false); toast.success('Copied'); }}
                                        className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 flex items-center gap-2"
                                    >
                                        <Copy size={14} /> Copy
                                    </button>

                                    {isOwn && (
                                        <button
                                            onClick={() => { onDelete(); setShowActions(false); }}
                                            className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
});

CommunityMessageBubble.displayName = 'CommunityMessageBubble';

export default CommunityMessageBubble;
