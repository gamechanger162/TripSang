import { TripCardSkeletonGrid } from '@/components/ui/TripCardSkeleton';

export default function SearchLoading() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Search header skeleton */}
                <div className="mb-8 space-y-4">
                    <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>

                {/* Filters skeleton */}
                <div className="flex flex-wrap gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    ))}
                </div>

                {/* Results grid */}
                <TripCardSkeletonGrid count={9} />
            </div>
        </div>
    );
}
