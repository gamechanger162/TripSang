import { Skeleton } from '@/components/ui/LoadingSkeleton';

export default function TripsLoading() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero image skeleton */}
                <div className="relative h-[60vh] w-full rounded-2xl overflow-hidden mb-8">
                    <Skeleton className="w-full h-full" />
                </div>

                {/* Title and info skeleton */}
                <div className="space-y-6">
                    <Skeleton className="h-10 w-3/4" />

                    <div className="flex flex-wrap gap-4">
                        <Skeleton className="h-6 w-32 rounded-full" />
                        <Skeleton className="h-6 w-40 rounded-full" />
                        <Skeleton className="h-6 w-28 rounded-full" />
                    </div>

                    {/* Description skeleton */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>

                    {/* Creator info skeleton */}
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>

                    {/* Map placeholder skeleton */}
                    <div className="h-64 rounded-xl overflow-hidden">
                        <Skeleton className="w-full h-full" />
                    </div>

                    {/* Squad section skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-24" />
                        <div className="flex gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <Skeleton className="w-12 h-12 rounded-full" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
