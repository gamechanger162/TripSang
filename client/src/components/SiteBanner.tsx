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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcements/active`);
            const data = await response.json();

            if (data.success && data.announcement) {
                const activeAnnouncement = data.announcement;

                // Check if user has dismissed this specific announcement
                const dismissedId = localStorage.getItem('dismissedBanner');
                if (dismissedId !== activeAnnouncement._id) {
                    setAnnouncement(activeAnnouncement);
                    setIsVisible(true);
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-4xl h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scaleIn">

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Left Side: Image (or Icon if no image) */}
                <div className={`relative h-1/2 md:h-full w-full md:w-1/2 ${announcement.imageUrl ? 'bg-gray-100' : 'bg-primary-600 flex items-center justify-center'}`}>
                    {announcement.imageUrl ? (
                        <img
                            src={announcement.imageUrl}
                            alt="Announcement"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback to icon if image fails
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-primary-600');
                                e.currentTarget.parentElement?.classList.remove('bg-gray-100');
                            }}
                        />
                    ) : (
                        <svg className="w-32 h-32 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                            />
                        </svg>
                    )}
                </div>

                {/* Right Side: Content */}
                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center items-center text-center bg-white dark:bg-gray-800">
                    <p className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-200 mb-8 leading-relaxed max-w-lg">
                        {announcement.message}
                    </p>

                    <button
                        onClick={handleClose}
                        className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white text-lg font-semibold rounded-full transform transition hover:scale-105 shadow-lg shadow-primary-600/30"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
                .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
            `}</style>
        </div>
    );
}
