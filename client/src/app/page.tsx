'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HomePage() {
    const router = useRouter();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [date, setDate] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        // Build search params
        const params = new URLSearchParams();
        if (from) params.append('startPoint', from);
        if (to) params.append('endPoint', to);
        if (date) params.append('startDate', date);

        // Redirect to search page
        router.push(`/search?${params.toString()}`);
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 via-primary-800/70 to-secondary-900/80 z-10" />
                    <Image
                        src="/hero-bg.jpg"
                        alt="Travel Adventure"
                        fill
                        className="object-cover"
                        priority
                        onError={(e) => {
                            // Fallback gradient if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                        }}
                    />
                    {/* Fallback Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-secondary-600" />
                </div>

                {/* Content */}
                <div className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    {/* Logo/Brand */}
                    <div className="mb-8 animate-fade-in">
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 font-display">
                            TripSang
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 font-light">
                            Connect. Explore. Create Memories.
                        </p>
                    </div>

                    {/* Search Box */}
                    <div className="mt-12 animate-slide-up">
                        <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
                            <div className="glass rounded-2xl p-6 md:p-8 shadow-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                    {/* From */}
                                    <div className="relative">
                                        <label
                                            htmlFor="from"
                                            className="block text-sm font-medium text-white/90 mb-2"
                                        >
                                            From
                                        </label>
                                        <div className="relative">
                                            <svg
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <input
                                                id="from"
                                                type="text"
                                                value={from}
                                                onChange={(e) => setFrom(e.target.value)}
                                                placeholder="Starting point"
                                                className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* To */}
                                    <div className="relative">
                                        <label
                                            htmlFor="to"
                                            className="block text-sm font-medium text-white/90 mb-2"
                                        >
                                            To
                                        </label>
                                        <div className="relative">
                                            <svg
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <input
                                                id="to"
                                                type="text"
                                                value={to}
                                                onChange={(e) => setTo(e.target.value)}
                                                placeholder="Destination"
                                                className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="relative">
                                        <label
                                            htmlFor="date"
                                            className="block text-sm font-medium text-white/90 mb-2"
                                        >
                                            Start Date
                                        </label>
                                        <div className="relative">
                                            <svg
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <input
                                                id="date"
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Search Button */}
                                <button
                                    type="submit"
                                    className="mt-6 w-full bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-glow transform hover:scale-[1.02] flex items-center justify-center"
                                >
                                    <svg
                                        className="w-5 h-5 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                    Search Trips
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                        <svg
                            className="w-6 h-6 text-white/80"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white dark:bg-dark-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Why Choose TripSang?
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Join thousands of travelers creating unforgettable experiences together
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="card text-center">
                            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-primary-600 dark:text-primary-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Find Your Squad
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Connect with like-minded travelers and build your perfect trip crew
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="card text-center">
                            <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-secondary-600 dark:text-secondary-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Discover Adventures
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Browse trips from trekking to food tours, curated by experienced guides
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="card text-center">
                            <div className="w-16 h-16 bg-accent-blue/10 dark:bg-accent-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-accent-blue"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Safe & Secure
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Verified travelers, secure payments, and 24/7 support for peace of mind
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
