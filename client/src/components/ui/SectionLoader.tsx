'use client';

export const SectionLoader = () => (
    <div className="w-full py-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
            {/* Spinner */}
            <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />

            {/* Skeleton Text */}
            <div className="space-y-3 flex flex-col items-center">
                <div className="h-4 w-48 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-3 w-32 bg-white/5 rounded-lg animate-pulse" />
            </div>
        </div>
    </div>
);
