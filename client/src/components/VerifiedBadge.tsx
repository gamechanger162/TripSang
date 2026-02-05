'use client';

import React from 'react';

interface VerifiedBadgeProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    tooltip?: boolean;
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
    size = 'md',
    className = '',
    tooltip = true
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    return (
        <div
            className={`absolute -top-0.5 -right-0.5 ${sizeClasses[size]} ${className}`}
            title={tooltip ? 'Verified User' : ''}
            aria-label="Verified user"
        >
            <div className="relative w-full h-full">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 rounded-full blur-sm opacity-75"></div>

                {/* Badge container */}
                <div className="relative w-full h-full bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-lg">
                    {/* Checkmark Icon */}
                    <svg
                        className="w-2/3 h-2/3 text-white drop-shadow-md"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default VerifiedBadge;
