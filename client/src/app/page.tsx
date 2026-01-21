'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import CityAutocomplete from '@/components/CityAutocomplete';
import { INDIAN_CITIES } from '@/data/cities';
import { tripAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function HomePage() {
    const router = useRouter();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [date, setDate] = useState('');
    const [tripCode, setTripCode] = useState('');
    const [searchingCode, setSearchingCode] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (from) params.append('startPoint', from);
        if (to) params.append('endPoint', to);
        if (date) params.append('startDate', date);
        router.push(`/search?${params.toString()}`);
    };

    const searchByCode = async () => {
        if (!tripCode || tripCode.length !== 6) {
            toast.error('Please enter a valid 6-character trip code');
            return;
        }

        setSearchingCode(true);
        try {
            const response = await tripAPI.getByCode(tripCode);
            if (response.success && response.trip) {
                router.push(`/trips/${response.trip._id}`);
            }
        } catch (error: any) {
            toast.error(error.message || 'No trip found with this code');
        } finally {
            setSearchingCode(false);
        }
    };

    return (
        <div className="min-h-screen -mt-16">
            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 via-primary-800/70 to-secondary-900/80 z-10" />
                    <Image
                        src="/hero-bg.jpg"
                        alt="Travel Adventure"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                <div className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
                    <div className="mb-8 animate-fade-in">
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 font-display">
                            TripSang
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 font-light max-w-2xl mx-auto">
                            Connect. Explore. Create Memories. <br />
                            <span className="text-lg opacity-80 mt-2 block">
                                The ultimate social network for travelers. Find your squad, share costs, and experience the world together.
                            </span>
                        </p>
                    </div>

                    <div className="mt-10 animate-slide-up">
                        <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
                            <div className="glass rounded-2xl p-6 md:p-8 shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                    <div className="relative">
                                        <label htmlFor="from" className="block text-sm font-medium text-white/90 mb-2 text-left">From</label>
                                        <CityAutocomplete
                                            id="from"
                                            name="from"
                                            value={from}
                                            onChange={setFrom}
                                            placeholder="Starting point"
                                            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-primary-400"
                                            cities={INDIAN_CITIES}
                                        />
                                    </div>
                                    <div className="relative">
                                        <label htmlFor="to" className="block text-sm font-medium text-white/90 mb-2 text-left">To</label>
                                        <CityAutocomplete
                                            id="to"
                                            name="to"
                                            value={to}
                                            onChange={setTo}
                                            placeholder="Dream destination"
                                            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-primary-400"
                                            cities={INDIAN_CITIES}
                                        />
                                    </div>
                                    <div className="relative">
                                        <label htmlFor="date" className="block text-sm font-medium text-white/90 mb-2 text-left">Start Date</label>
                                        <input
                                            id="date"
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-primary-400"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="mt-6 w-full bg-gradient-to-r from-secondary-500 to-primary-600 hover:from-secondary-600 hover:to-primary-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg transform hover:scale-[1.01]"
                                >
                                    Find Your Adventure
                                </button>
                            </div>
                        </form>

                        {/* Trip Code & Explore Section */}
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                            {/* Trip Code Search */}
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20">
                                <span className="text-white/70 text-sm px-2 hidden sm:block">Have a code?</span>
                                <input
                                    type="text"
                                    value={tripCode}
                                    onChange={(e) => setTripCode(e.target.value.toUpperCase().slice(0, 6))}
                                    placeholder="TRIP CODE"
                                    maxLength={6}
                                    className="w-28 px-3 py-2 text-sm font-mono uppercase tracking-wider bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 text-center"
                                    onKeyDown={(e) => e.key === 'Enter' && searchByCode()}
                                />
                                <button
                                    onClick={searchByCode}
                                    disabled={searchingCode || tripCode.length !== 6}
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    {searchingCode ? '...' : 'Go'}
                                </button>
                            </div>

                            <span className="text-white/50 hidden sm:block">or</span>

                            {/* Explore All Button */}
                            <Link
                                href="/search"
                                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 text-white font-medium transition-all hover:scale-105"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Explore All Trips
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 mb-4">
                            Why Travelers Love TripSang
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">Everything you need to plan the perfect group trip</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                title: "Find Your Squad",
                                desc: "Match with travelers who share your vibe, budget, and travel style.",
                                icon: (
                                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ),
                                color: "bg-blue-500"
                            },
                            {
                                title: "Integrated Chat",
                                desc: "Real-time chat rooms for every trip to plan itineraries and break the ice.",
                                icon: (
                                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                ),
                                color: "bg-green-500"
                            },
                            {
                                title: "Verified Profiles",
                                desc: "Travel with confidence. Mobile verification and transparent profiles.",
                                icon: (
                                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ),
                                color: "bg-purple-500"
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-8 transition-transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
                                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
                    </div>
                    <div className="relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0"></div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                            {[1, 2, 3].map((step, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg text-center">
                                    <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                                        {step}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                                        {step === 1 ? 'Create or Find a Trip' : step === 2 ? 'Connect & Chat' : 'Travel & Enjoy'}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {step === 1 ? 'Start your own journey or browse upcoming trips.' : step === 2 ? 'Get to know your future travel buddies.' : 'Meet up correctly and make memories!'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-white dark:bg-gray-900">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-12 text-gray-900 dark:text-white">What Travelers Say</h2>
                    <blockquote className="text-2xl font-medium text-gray-900 dark:text-white italic">
                        "I found the best group for my Ladakh trip here. We started as strangers and ended as family. Highly recommend TripSang!"
                    </blockquote>
                    <div className="mt-6 flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden">
                            {/* Placeholder Avatar */}
                            <svg className="w-full h-full text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-900 dark:text-white">Rahul Sharma</div>
                            <div className="text-sm text-gray-500">Backpacker</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
