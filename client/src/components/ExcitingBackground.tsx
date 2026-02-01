'use client';

interface ExcitingBackgroundProps {
    variant?: 'hero' | 'auth' | 'dashboard' | 'trip' | 'profile';
    children?: React.ReactNode;
    className?: string;
}

export default function ExcitingBackground({ variant = 'dashboard', children, className = '' }: ExcitingBackgroundProps) {
    const backgrounds = {
        hero: (
            <div className="absolute inset-0 overflow-hidden">
                {/* Animated gradient mesh */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-purple-600 to-secondary-600 opacity-90" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,_var(--tw-gradient-stops))] from-purple-500/30 via-transparent to-transparent" />

                {/*Floating shapes */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
                <div className="absolute top-40 right-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-40 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filterblur-xl opacity-20 animate-blob animation-delay-4000" />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
            </div>
        ),
        auth: (
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />

                {/* Floating orbs */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float-delayed" />
            </div>
        ),
        dashboard: (
            <div className="absolute inset-0 overflow-hidden opacity-40 dark:opacity-20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-purple-50 to-secondary-50 dark:from-gray-900 dark:via-primary-950 dark:to-gray-900" />
                <div className="absolute inset-0 bg-dot-pattern opacity-30" />
            </div>
        ),
        trip: (
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-purple-900/20" />
                <div className="absolute inset-0 bg-wave-pattern opacity-5" />
            </div>
        ),
        profile: (
            <div className="absolute inset-0 overflow-hidden opacity-50 dark:opacity-30">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900" />
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary-200/40 to-transparent dark:from-primary-900/20 rounded-bl-full" />
            </div>
        )
    };

    return (
        <div className={`relative ${className}`}>
            {backgrounds[variant]}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
