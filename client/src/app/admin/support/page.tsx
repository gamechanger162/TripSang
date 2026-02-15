'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { socketManager } from '@/lib/socketManager';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Headphones, Search, Clock, CheckCircle2, XCircle,
    Send, Loader2, ArrowLeft, RotateCcw, User, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SupportMessage {
    _id: string;
    sender: string;
    senderRole: 'user' | 'admin';
    senderName: string;
    senderProfilePicture?: string;
    message: string;
    type: 'text' | 'image' | 'system';
    imageUrl?: string;
    timestamp: string;
}

interface SupportTicket {
    _id: string;
    userId: {
        _id: string;
        name: string;
        profilePicture?: string;
        email?: string;
    };
    status: 'open' | 'closed';
    subject: string;
    messages: SupportMessage[];
    lastMessage: {
        text: string;
        sender: string;
        senderRole: string;
        timestamp: string;
    };
    createdAt: string;
    updatedAt: string;
}

export default function AdminSupportPage() {
    const { data: session } = useSession();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('open');
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const token = (session?.user as any)?.accessToken;

    // Fetch all support tickets
    const fetchTickets = useCallback(async () => {
        try {
            const res = await fetch(`${apiUrl}/api/support-chat/admin/all?status=${filterStatus}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setTickets(data.chats);
            }
        } catch (err) {
            console.error('Fetch tickets error:', err);
            toast.error('Failed to load support tickets');
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, token, filterStatus]);

    useEffect(() => {
        if (token) fetchTickets();
    }, [token, fetchTickets]);

    // Select a ticket and load full messages
    const handleSelectTicket = async (ticket: SupportTicket) => {
        setIsLoadingChat(true);
        try {
            const res = await fetch(`${apiUrl}/api/support-chat/admin/${ticket._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSelectedTicket(data.chat);

                // Join socket room
                if (socketManager.isSocketConnected()) {
                    socketManager.emit('join_support_chat', { chatId: data.chat._id });
                }
            }
        } catch (err) {
            console.error('Load ticket error:', err);
            toast.error('Failed to load conversation');
        } finally {
            setIsLoadingChat(false);
        }
    };

    // Listen for real-time messages
    useEffect(() => {
        if (!selectedTicket) return;

        const handleReceiveSupportMessage = (data: any) => {
            if (data.chatId === selectedTicket._id) {
                setSelectedTicket(prev => {
                    if (!prev) return prev;
                    const exists = prev.messages.some(m => m._id === data.message._id);
                    if (exists) return prev;
                    // Remove temp messages
                    const filtered = prev.messages.filter(m => {
                        if (!m._id.startsWith('temp-')) return true;
                        return m.message !== data.message.message;
                    });
                    return { ...prev, messages: [...filtered, data.message] };
                });
            }
            // Also update ticket list
            setTickets(prev => prev.map(t =>
                t._id === data.chatId
                    ? { ...t, lastMessage: { text: data.message.message, sender: data.message.sender, senderRole: data.message.senderRole, timestamp: data.message.timestamp } }
                    : t
            ));
        };

        const handleSupportChatUpdated = (data: any) => {
            // Update ticket list when a user sends a new message
            setTickets(prev => {
                const existing = prev.find(t => t._id === data.chatId);
                if (existing) {
                    return prev.map(t =>
                        t._id === data.chatId ? { ...t, lastMessage: data.lastMessage } : t
                    ).sort((a, b) =>
                        new Date(b.lastMessage?.timestamp || 0).getTime() - new Date(a.lastMessage?.timestamp || 0).getTime()
                    );
                }
                // New ticket - refresh the list
                fetchTickets();
                return prev;
            });
        };

        socketManager.on('receive_support_message', handleReceiveSupportMessage);
        socketManager.on('support_chat_updated', handleSupportChatUpdated);

        return () => {
            socketManager.off('receive_support_message', handleReceiveSupportMessage);
            socketManager.off('support_chat_updated', handleSupportChatUpdated);
        };
    }, [selectedTicket, fetchTickets]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedTicket?.messages]);

    // Send message
    const handleSend = async () => {
        if (!selectedTicket || !newMessage.trim() || sending) return;

        setSending(true);
        const text = newMessage.trim();
        setNewMessage('');

        // Optimistic
        const tempMsg: SupportMessage = {
            _id: 'temp-' + Date.now(),
            sender: (session?.user as any)?.id,
            senderRole: 'admin',
            senderName: (session?.user as any)?.name || 'Admin',
            message: text,
            type: 'text',
            timestamp: new Date().toISOString()
        };

        setSelectedTicket(prev => prev ? { ...prev, messages: [...prev.messages, tempMsg] } : prev);

        if (socketManager.isSocketConnected()) {
            socketManager.emit('send_support_message', {
                chatId: selectedTicket._id,
                message: text,
                type: 'text'
            });
        }

        setSending(false);
        inputRef.current?.focus();
    };

    // Close ticket
    const handleCloseTicket = async () => {
        if (!selectedTicket) return;
        try {
            const res = await fetch(`${apiUrl}/api/support-chat/admin/${selectedTicket._id}/close`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSelectedTicket(data.chat);
                toast.success('Ticket closed');
                fetchTickets();
            }
        } catch (err) {
            toast.error('Failed to close ticket');
        }
    };

    // Reopen ticket
    const handleReopenTicket = async () => {
        if (!selectedTicket) return;
        try {
            const res = await fetch(`${apiUrl}/api/support-chat/admin/${selectedTicket._id}/reopen`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSelectedTicket(data.chat);
                toast.success('Ticket reopened');
                fetchTickets();
            }
        } catch (err) {
            toast.error('Failed to reopen ticket');
        }
    };

    const formatTime = (timestamp: string) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const filteredTickets = tickets.filter(t => {
        if (!searchTerm) return true;
        const name = t.userId?.name || '';
        const email = t.userId?.email || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20">
                        <Headphones size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Support Chats</h1>
                        <p className="text-xs text-gray-500">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1 border border-white/5">
                    {(['open', 'closed', 'all'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => { setFilterStatus(status); setIsLoading(true); }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${filterStatus === status
                                ? 'bg-white/10 text-white'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-0 bg-gray-900/50 rounded-xl border border-white/5 overflow-hidden min-h-0">
                {/* Ticket List */}
                <div className={`w-full md:w-[340px] flex-shrink-0 border-r border-white/5 flex flex-col ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                    {/* Search */}
                    <div className="p-3 border-b border-white/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-800/50 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                            />
                        </div>
                    </div>

                    {/* Ticket Items */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No {filterStatus !== 'all' ? filterStatus : ''} tickets</p>
                            </div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <button
                                    key={ticket._id}
                                    onClick={() => handleSelectTicket(ticket)}
                                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors border-b border-white/[0.03] ${selectedTicket?._id === ticket._id
                                        ? 'bg-white/[0.06]'
                                        : 'hover:bg-white/[0.03]'
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                                            {ticket.userId?.profilePicture ? (
                                                <img src={ticket.userId.profilePicture} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={16} className="text-gray-500" />
                                            )}
                                        </div>
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${ticket.status === 'open' ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h3 className="text-sm font-medium text-white truncate">
                                                {ticket.userId?.name || 'Unknown'}
                                            </h3>
                                            <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">
                                                {formatTime(ticket.lastMessage?.timestamp || ticket.updatedAt)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">
                                            {ticket.lastMessage?.senderRole === 'admin' && (
                                                <span className="text-emerald-400/60">You: </span>
                                            )}
                                            {ticket.lastMessage?.text || 'No messages'}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Panel */}
                <div className={`flex-1 flex flex-col min-w-0 ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                    {selectedTicket ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gray-900/30">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedTicket(null)}
                                        className="md:hidden p-1 rounded-lg hover:bg-white/5 text-gray-400"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                                        {selectedTicket.userId?.profilePicture ? (
                                            <img src={selectedTicket.userId.profilePicture} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={14} className="text-gray-500" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">{selectedTicket.userId?.name}</h3>
                                        <p className="text-[10px] text-gray-500">{selectedTicket.userId?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedTicket.status === 'open' ? (
                                        <button
                                            onClick={handleCloseTicket}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20"
                                        >
                                            <XCircle size={14} />
                                            Close
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleReopenTicket}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                                        >
                                            <RotateCcw size={14} />
                                            Reopen
                                        </button>
                                    )}
                                    <span className={`px-2 py-1 text-[10px] font-medium rounded-full ${selectedTicket.status === 'open'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-gray-700/50 text-gray-400 border border-white/5'
                                        }`}>
                                        {selectedTicket.status === 'open' ? <CheckCircle2 size={10} className="inline mr-1" /> : <Clock size={10} className="inline mr-1" />}
                                        {selectedTicket.status}
                                    </span>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                                {isLoadingChat ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                                    </div>
                                ) : (
                                    selectedTicket.messages.map((msg, idx) => {
                                        const isAdmin = msg.senderRole === 'admin';
                                        const isSystem = msg.type === 'system';

                                        if (isSystem) {
                                            return (
                                                <div key={msg._id || idx} className="flex justify-center my-2">
                                                    <span className="px-3 py-1 text-[11px] text-gray-500 bg-gray-800/50 rounded-full">
                                                        {msg.message}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <motion.div
                                                key={msg._id || idx}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[75%] ${msg._id?.startsWith('temp-') ? 'opacity-70' : ''}`}>
                                                    {!isAdmin && (
                                                        <p className="text-[10px] text-gray-500 mb-1 ml-1">{msg.senderName}</p>
                                                    )}
                                                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${isAdmin
                                                        ? 'bg-indigo-500/80 text-white rounded-br-md'
                                                        : 'bg-gray-800 text-gray-200 rounded-bl-md border border-white/5'
                                                        }`}
                                                    >
                                                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                                    </div>
                                                    <p className={`text-[10px] mt-1 text-gray-600 ${isAdmin ? 'text-right mr-1' : 'ml-1'}`}>
                                                        {formatTime(msg.timestamp)}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Admin Input */}
                            {selectedTicket.status === 'open' ? (
                                <div className="px-4 py-3 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                            placeholder="Reply to user..."
                                            className="flex-1 bg-gray-800/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                            disabled={sending}
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!newMessage.trim() || sending}
                                            className={`p-2.5 rounded-xl transition-all ${newMessage.trim()
                                                ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                                                : 'bg-gray-800 text-gray-600'
                                                }`}
                                        >
                                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-4 py-3 border-t border-white/5 text-center">
                                    <p className="text-xs text-gray-500">Ticket closed • <button onClick={handleReopenTicket} className="text-emerald-400 hover:underline">Reopen</button></p>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Empty State */
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mx-auto mb-4 border border-white/5">
                                    <Headphones size={28} className="text-gray-600" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-400 mb-1">Select a conversation</h3>
                                <p className="text-xs text-gray-600">Choose a support ticket to view and respond</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
