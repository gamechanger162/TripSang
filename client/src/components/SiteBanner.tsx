'use client';

import { useEffect, useState } from 'react';

interface Announcement {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    isActive: boolean;
    imageUrl?: string;
}

export default function SiteBanner() {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        fetchActiveAnnouncement();
    }, []);

    const fetchActiveAnnouncement = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/announcements`);
            const data = await response.json();

            if (data.success && data.announcements.length > 0) {
                // Get the first active announcement
                const activeAnnouncement = data.announcements.find((a: Announcement) => a.isActive);

                if (activeAnnouncement) {
                    // Check if user has dismissed this specific announcement
                    const dismissedId = localStorage.getItem('dismissedBanner');
                    if (dismissedId !== activeAnnouncement._id) {
                        setAnnouncement(activeAnnouncement);
                        setIsVisible(true);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching announcement:', error);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        if (announcement) {
            localStorage.setItem('dismissedBanner', announcement._id);
        }
    };

    if (!isVisible || !announcement) {
        return null;
    }

    return (
        <div className="bg-primary-600 text-white px-4 py-3 shadow-md relative z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    {announcement.imageUrl ? (
                        <img
                            src={announcement.imageUrl}
                            alt="Banner"
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                                // Hide image if it fails to load
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                            />
                        </svg>
                    )}
                    <p className="text-sm md:text-base font-medium">{announcement.message}</p>
                </div>
                <button
                    onClick={handleClose}
                    className="flex-shrink-0 hover:bg-primary-700 rounded-full p-1 transition-colors"
                    aria-label="Close banner"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
