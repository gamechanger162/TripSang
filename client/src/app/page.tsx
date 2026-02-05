'use client';

import { useState } from 'react';
import {
    HeroSection,
    HowItWorks,
    TrendingDestinations,
    FeaturesGrid,
    VerifiedPartners,
    MomentsShowcase,
    CallToAction
} from '@/components/home';

export default function Home() {
    const [tripCode, setTripCode] = useState('');
    const [searchingCode, setSearchingCode] = useState(false);

    return (
        <main className="bg-black min-h-screen overflow-x-hidden">
            {/* Hero Section with Search */}
            <HeroSection
                tripCode={tripCode}
                setTripCode={setTripCode}
                searchingCode={searchingCode}
                setSearchingCode={setSearchingCode}
            />

            {/* How It Works */}
            <HowItWorks />

            {/* Trending Destinations Marquee */}
            <TrendingDestinations />

            {/* Features Bento Grid */}
            <FeaturesGrid />

            {/* Verified Partners & Trust Section */}
            <VerifiedPartners />

            {/* Trip Moments Gallery Showcase */}
            <MomentsShowcase />

            {/* Call to Action Sections */}
            <CallToAction />
        </main>
    );
}
