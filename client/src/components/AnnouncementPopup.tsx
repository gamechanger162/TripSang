'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface Announcement {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    isActive: boolean;
}

export default function AnnouncementPopup() {
    const pathname = usePathname();
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!pathname?.startsWith('/app')) {
            fetchActiveAnnouncement();
        }
    }, [pathname]);

    const fetchActiveAnnouncement = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcements/active`);
            const data = await response.json();

            if (data.success && data.announcement) {
                // Check if user has already dismissed this announcement
                const dismissedId = localStorage.getItem('dismissedAnnouncement');
                if (dismissedId !== data.announcement._id) {
                    setAnnouncement(data.announcement);
                    setIsVisible(true);
                }
            }
        } catch (error) {
            console.error('Error fetching announcement:', error);
        }
    };

    const handleClose = () => {
        if (announcement) {
            localStorage.setItem('dismissedAnnouncement', announcement._id);
        }
        setIsVisible(false);
    };

    if (!isVisible || !announcement) return null;

    const getTypeStyles = () => {
        switch (announcement.type) {
            case 'info':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    border: 'border-blue-200 dark:border-blue-800',
                    text: 'text-blue-800 dark:text-blue-200',
                    icon: (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    )
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
                    border: 'border-yellow-200 dark:border-yellow-800',
                    text: 'text-yellow-800 dark:text-yellow-200',
                    icon: (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    )
                };
            case 'success':
                return {
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    border: 'border-green-200 dark:border-green-800',
                    text: 'text-green-800 dark:text-green-200',
                    icon: (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    )
                };
            case 'error':
                return {
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    border: 'border-red-200 dark:border-red-800',
                    text: 'text-red-800 dark:text-red-200',
                    icon: (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    )
                };
            default:
                return getTypeStyles();
        }
    };

    const styles = getTypeStyles();

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
                {/* Modal */}
                <div className={`max-w-lg w-full rounded-2xl shadow-2xl border-2 ${styles.bg} ${styles.border} animate-slideUp`}>
                    {/* Header */}
                    <div className="flex items-start p-6">
                        <div className={`flex-shrink-0 ${styles.text}`}>
                            {styles.icon}
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className={`text-lg font-bold ${styles.text}`}>
                                {announcement.title}
                            </h3>
                            <p className={`mt-2 text-sm ${styles.text}`}>
                                {announcement.message}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className={`ml-4 flex-shrink-0 ${styles.text} hover:opacity-75 transition-opacity`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Footer */}
                    <div className={`px-6 py-4 border-t ${styles.border}`}>
                        <button
                            onClick={handleClose}
                            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${announcement.type === 'info' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                                announcement.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                                    announcement.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                                        'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }

                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </>
    );
}
