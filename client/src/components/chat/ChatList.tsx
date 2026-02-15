'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Plus, User, Users, Headphones, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatListProps {
    conversations: any[];
    activeChatId: string | null;
    onSelectChat: (chat: any) => void;
    isLoading?: boolean;
    onlineUsers?: string[];
    onSupportChat?: () => void;
}

export default function ChatList({
    conversations,
    activeChatId,
    onSelectChat,
    isLoading,
    onlineUsers = [],
    onSupportChat
}: ChatListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewMenu, setShowNewMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowNewMenu(false);
            }
        };
        if (showNewMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNewMenu]);

    const filteredChats = conversations.filter(chat => {
        const name = chat.otherUser?.name || chat.name || 'Unknown';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="w-full md:w-[320px] lg:w-[360px] h-full flex flex-col border-r border-white/5 bg-zinc-900/30 backdrop-blur-md">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-900/50 backdrop-blur-xl z-20">
                <h2 className="font-bold text-lg text-white">Messages</h2>
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowNewMenu(!showNewMenu)}
                        className={`p-2 rounded-full transition-colors ${showNewMenu ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400'}`}
                    >
                        {showNewMenu ? <X size={18} /> : <Plus size={18} />}
                    </button>

                    <AnimatePresence>
                        {showNewMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-2 w-56 bg-zinc-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                            >
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setShowNewMenu(false);
                                            onSupportChat?.();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-200 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                                            <Headphones size={16} className="text-emerald-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">Chat with Support</p>
                                            <p className="text-[11px] text-zinc-500">Get help from our team</p>
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 py-3">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-400 transition-colors w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        className="w-full bg-zinc-950/50 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {isLoading ? (
                    <div className="p-4 text-center mt-10">
                        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-zinc-500">Loading chats...</p>
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 mt-10">
                        <p className="text-sm">No conversations found.</p>
                        <button className="text-cyan-400 text-xs mt-2 hover:underline">Start a new one</button>
                    </div>
                ) : (
                    filteredChats.map((chat) => {
                        const otherUser = chat.otherUser;
                        const isOnline = onlineUsers.includes(otherUser?._id);
                        const isActive = activeChatId === chat._id;

                        // Normalize display data (backend sends: otherUser.name, lastMessage.text, lastMessage.timestamp)
                        const displayName = otherUser?.name || chat.name || 'Unknown User';
                        const displayImage = otherUser?.profilePicture || chat.image;
                        const lastMsg = chat.lastMessage?.text || 'Started a conversation';
                        const msgTime = chat.lastMessage?.timestamp || chat.updatedAt;
                        const time = msgTime
                            ? new Date(msgTime).toLocaleDateString() === new Date().toLocaleDateString()
                                ? new Date(msgTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : new Date(msgTime).toLocaleDateString()
                            : '';

                        return (
                            <motion.div
                                key={chat._id}
                                onClick={() => onSelectChat(chat)}
                                whileTap={{ scale: 0.98 }}
                                className={`group p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all border border-transparent ${isActive
                                    ? 'bg-white/10 border-white/5 shadow-lg shadow-black/20'
                                    : 'hover:bg-white/5 hover:border-white/5'
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border-2 transition-colors ${isActive ? 'border-cyan-500/30' : 'border-transparent group-hover:border-white/10'} bg-zinc-800`}>
                                        {displayImage ? (
                                            <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-zinc-500 font-bold text-lg">{displayName[0]}</span>
                                        )}
                                    </div>
                                    {isOnline && (
                                        <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 ring-1 ring-black/50" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h3 className={`text-sm font-semibold truncate transition-colors ${isActive ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                                            {displayName}
                                        </h3>
                                        <span className={`text-[10px] ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                            {time}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-sm truncate pr-2 ${isActive ? 'text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-400'} ${chat.unreadCount > 0 ? 'font-medium text-white' : ''}`}>
                                            {chat.type === 'image' ? <span className="flex items-center gap-1 italic"><Search size={12} /> Photo</span> : lastMsg}
                                        </p>
                                        {chat.unreadCount > 0 && (
                                            <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-cyan-500 text-black text-[10px] font-bold rounded-full px-1">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

