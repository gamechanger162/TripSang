import React from 'react';

interface PremiumBadgeProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    tooltip?: boolean;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({
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
            title={tooltip ? 'Premium Member' : ''}
            aria-label="Premium member"
        >
            <div className="relative w-full h-full">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-full blur-sm opacity-75 animate-pulse"></div>

                {/* Badge container */}
                <div className="relative w-full h-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-lg">
                    {/* Crown Icon */}
                    <svg
                        className="w-2/3 h-2/3 text-white drop-shadow-md"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default PremiumBadge;
