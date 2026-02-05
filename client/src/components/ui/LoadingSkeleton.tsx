'use client';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
        />
    );
}

interface TextSkeletonProps {
    lines?: number;
    className?: string;
}

export function TextSkeleton({ lines = 3, className = '' }: TextSkeletonProps) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    );
}

interface AvatarSkeletonProps {
    size?: 'sm' | 'md' | 'lg';
}

export function AvatarSkeleton({ size = 'md' }: AvatarSkeletonProps) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    return <Skeleton className={`${sizeClasses[size]} rounded-full`} />;
}

interface CardSkeletonProps {
    hasImage?: boolean;
    imageHeight?: string;
}

export function CardSkeleton({ hasImage = true, imageHeight = 'h-48' }: CardSkeletonProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            {hasImage && <Skeleton className={`${imageHeight} w-full`} />}
            <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <TextSkeleton lines={2} />
                <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2">
                        <AvatarSkeleton size="sm" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
        </div>
    );
}
