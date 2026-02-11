'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { SectionLoader } from '../components/ui/SectionLoader';

// Heavy components are lazy loaded to improve initial load performance
const HeroSection = dynamic(() => import('@/components/home/HeroSection'), {
    loading: () => <SectionLoader />,
});

const DiscoverHub = dynamic(() => import('@/components/home/DiscoverHub'), {
    loading: () => <SectionLoader />,
});

const WhyTripSang = dynamic(() => import('@/components/home/WhyTripSang'), {
    loading: () => <SectionLoader />,
});

const MomentsMarquee = dynamic(() => import('@/components/home/MomentsMarquee'), {
    loading: () => <SectionLoader />,
});

const CallToAction = dynamic(() => import('@/components/home/CallToAction'), {
    loading: () => <SectionLoader />,
});

export default function Home() {
    return (
        <main className="bg-zinc-950 min-h-screen overflow-x-hidden">
            {/* 1. Cinematic Hero (Viewport Height) */}
            <HeroSection />

            {/* 2. Consolidated Discovery (Upcoming Trips, Communities) */}
            <Suspense fallback={<SectionLoader />}>
                <DiscoverHub />
            </Suspense>

            {/* 3. The "Why" Strip (Horizontal Scroll) */}
            <Suspense fallback={<SectionLoader />}>
                <WhyTripSang />
            </Suspense>

            {/* 4. Visual Vibes (Marquee) */}
            <Suspense fallback={<SectionLoader />}>
                <MomentsMarquee />
            </Suspense>

            {/* 5. Final Push */}
            <Suspense fallback={<SectionLoader />}>
                <CallToAction />
            </Suspense>
        </main>
    );
}
