'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

export default function GlassCard({
    children,
    className = '',
    padding = 'md',
    hover = false,
    onClick
}: GlassCardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-6'
    };

    return (
        <motion.div
            className={`glass-card ${paddingClasses[padding]} ${hover ? 'glass-card-hover' : ''} ${className}`}
            onClick={onClick}
            whileHover={hover ? { scale: 1.02 } : undefined}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                cursor: onClick ? 'pointer' : 'default',
            }}
        >
            {children}
        </motion.div>
    );
}

// Glass Button variant
interface GlassButtonProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function GlassButton({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = '',
    type = 'button'
}: GlassButtonProps) {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    const variantStyles = {
        primary: {
            background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.8), rgba(20, 184, 166, 0.6))',
            border: '1px solid rgba(20, 184, 166, 0.5)',
        },
        secondary: {
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        ghost: {
            background: 'transparent',
            border: '1px solid transparent',
        }
    };

    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${sizeClasses[size]} ${className} font-medium rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
                ...variantStyles[variant],
                backdropFilter: variant !== 'ghost' ? 'blur(10px)' : undefined,
            }}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
        >
            {children}
        </motion.button>
    );
}
