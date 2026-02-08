'use client';

import { Check } from 'lucide-react';

interface VerifiedBadgeProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function VerifiedBadge({ size = 'md', className = '' }: VerifiedBadgeProps) {
    const sizeMap = {
        sm: { wrapper: 14, icon: 10 },
        md: { wrapper: 18, icon: 12 },
        lg: { wrapper: 22, icon: 14 },
    };

    const { wrapper, icon } = sizeMap[size];

    return (
        <div
            className={`verified-badge ${className}`}
            title="Verified (Aadhaar/PAN)"
            style={{
                width: wrapper,
                height: wrapper,
                minWidth: wrapper,
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.4)',
            }}
        >
            <Check size={icon} color="white" strokeWidth={3} />
        </div>
    );
}
