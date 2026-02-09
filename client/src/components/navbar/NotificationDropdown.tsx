'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Notification {
    _id: string;
    message: string;
    link?: string;
    createdAt: string;
    sender?: {
        name?: string;
        profilePicture?: string;
    };
}

interface NotificationDropdownProps {
    isOpen: boolean;
    notifications: Notification[];
    unreadCount: number;
    linkColor: string;
    onToggle: () => void;
    isMobile?: boolean;
    onClose?: () => void;
}

export default function NotificationDropdown({
    isOpen,
    notifications,
    unreadCount,
    linkColor,
    onToggle,
    isMobile = false,
    onClose
}: NotificationDropdownProps) {
    const iconSize = isMobile ? 'w-5 h-5' : 'w-6 h-6';
    const badgeSize = isMobile ? 'h-3.5 w-3.5 text-[8px]' : 'h-4 w-4 text-[10px]';

    return (
        <div className="relative" data-notification-dropdown>
            <button
                onClick={onToggle}
                className={`p-2 rounded-full hover:bg-white/10 transition-colors ${linkColor}`}
            >
                <div className="relative">
                    <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className={`absolute -top-1 -right-1 bg-red-500 text-white font-bold rounded-full flex items-center justify-center ${badgeSize} ${!isMobile && 'animate-bounce'}`}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className={`${isMobile
                    ? 'fixed top-16 left-4 right-4 max-h-80'
                    : 'absolute right-0 mt-2 w-80 max-h-96'
                    } bg-[#001428]/95 backdrop-blur-xl rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] py-2 border border-cyan-500/20 overflow-y-auto z-50`}>
                    <div className="px-4 py-2 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className={`font-semibold text-white ${isMobile ? 'text-sm' : ''}`}>Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                        <div className={`p-${isMobile ? '4' : '6'} text-center text-gray-400 ${isMobile ? 'text-sm' : ''}`}>
                            No notifications
                        </div>
                    ) : (
                        (isMobile ? notifications.slice(0, 5) : notifications).map((notif) => (
                            <Link
                                key={notif._id}
                                href={notif.link || '#'}
                                className="block px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
                                onClick={onClose}
                            >
                                <div className="flex gap-3">
                                    {!isMobile && (
                                        notif.sender?.profilePicture ? (
                                            <Image src={notif.sender.profilePicture} alt="" width={32} height={32} className="rounded-full flex-shrink-0 object-cover w-8 h-8 ring-2 ring-cyan-500/30 group-hover:ring-cyan-500/60 transition-all" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-cyan-900/30 flex items-center justify-center text-xs font-bold text-cyan-400 flex-shrink-0 border border-cyan-500/30">
                                                {notif.sender?.name?.[0] || '!'}
                                            </div>
                                        )
                                    )}
                                    <div>
                                        <p className={`text-gray-200 group-hover:text-white transition-colors leading-tight mb-1 ${isMobile ? 'text-sm line-clamp-2' : 'text-sm'}`}>
                                            {notif.message}
                                        </p>
                                        <p className="text-xs text-gray-500 group-hover:text-cyan-400/70 transition-colors">
                                            {new Date(notif.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
