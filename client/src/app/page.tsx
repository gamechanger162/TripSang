'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { HeroSection, HowItWorks } from '@/components/home';

// Lazy load below-fold components for faster initial load
const TrendingDestinations = dynamic(
    () => import('@/components/home').then(m => ({ default: m.TrendingDestinations })),
    { ssr: false }
);
const FeaturesGrid = dynamic(
    () => import('@/components/home').then(m => ({ default: m.FeaturesGrid })),
    { ssr: false }
);
const VerifiedPartners = dynamic(
    () => import('@/components/home').then(m => ({ default: m.VerifiedPartners })),
    { ssr: false }
);
const MomentsShowcase = dynamic(
    () => import('@/components/home').then(m => ({ default: m.MomentsShowcase })),
    { ssr: false }
);
const CallToAction = dynamic(
    () => import('@/components/home').then(m => ({ default: m.CallToAction })),
    { ssr: false }
);

// Loading skeleton for lazy components
const SectionLoader = () => (
    <div className="w-full py-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-48 bg-zinc-800/50 rounded-lg animate-pulse"></div>
            <div className="h-4 w-64 bg-zinc-800/30 rounded-lg animate-pulse"></div>
        </div>
    </div>
);

export default function Home() {
    const [tripCode, setTripCode] = useState('');
    const [searchingCode, setSearchingCode] = useState(false);

    return (
        <main className="bg-zinc-950 min-h-screen overflow-x-hidden">
            {/* Hero Section with Search - loads immediately */}
            <HeroSection
                tripCode={tripCode}
                setTripCode={setTripCode}
                searchingCode={searchingCode}
                setSearchingCode={setSearchingCode}
            />

            {/* How It Works - loads immediately (above fold) */}
            <HowItWorks />

            {/* Below-fold content - lazy loaded */}
            <Suspense fallback={<SectionLoader />}>
                <TrendingDestinations />
            </Suspense>

            <Suspense fallback={<SectionLoader />}>
                <FeaturesGrid />
            </Suspense>

            <Suspense fallback={<SectionLoader />}>
                <VerifiedPartners />
            </Suspense>

            <Suspense fallback={<SectionLoader />}>
                <MomentsShowcase />
            </Suspense>

            <Suspense fallback={<SectionLoader />}>
                <CallToAction />
            </Suspense>
        </main>
    );
}
