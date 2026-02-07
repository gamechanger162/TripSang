'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CityAutocomplete from '@/components/CityAutocomplete';
import { INDIAN_CITIES } from '@/data/cities';
import { tripAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface HeroSectionProps {
    tripCode: string;
    setTripCode: (code: string) => void;
    searchingCode: boolean;
    setSearchingCode: (searching: boolean) => void;
}

export default function HeroSection({
    tripCode,
    setTripCode,
    searchingCode,
    setSearchingCode
}: HeroSectionProps) {
    const router = useRouter();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (from) params.append('startPoint', from);
        if (to) params.append('endPoint', to);
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
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black z-10" />
                {/* Animated orbs for premium feel */}
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[120px] animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-float animation-delay-2000" />
                <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[80px] animate-float animation-delay-4000" />
                <Image
                    src="/hero-bg.jpg"
                    alt="Travel Adventure"
                    fill
                    className="object-cover scale-105"
                    priority
                    sizes="100vw"
                />
            </div>

            {/* Floating particles effect */}
            <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${10 + Math.random() * 10}s`
                        }}
                    />
                ))}
            </div>

            <div className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
                <div className="mb-10 animate-fade-in-up">
                    {/* Premium badges */}
                    <div className="flex justify-center gap-3 mb-8">
                        <span className="inline-flex items-center py-1.5 px-4 rounded-full bg-gradient-to-r from-primary-600/20 to-indigo-600/20 backdrop-blur-xl border border-white/20 text-sm font-semibold text-white shadow-lg shadow-primary-900/20">
                            <span className="w-2 h-2 bg-primary-400 rounded-full mr-2 animate-pulse" />
                            The Future of Group Travel
                        </span>
                        <span className="inline-flex items-center py-1.5 px-4 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30 text-sm font-bold text-green-400 shadow-lg shadow-green-900/20">
                            ✨ 30-Day Free Trial
                        </span>
                    </div>

                    {/* Logo with glow effect */}
                    <div className="flex justify-center mb-6 relative">
                        <div className="absolute -inset-10 bg-gradient-to-r from-primary-600/0 via-primary-600/10 to-primary-600/0 blur-3xl" />
                        <Image
                            src="/logo-text.png"
                            alt="Tripसंग"
                            width={420}
                            height={130}
                            className="object-contain drop-shadow-[0_0_30px_rgba(99,102,241,0.3)] relative z-10"
                            priority
                        />
                    </div>

                    {/* Tagline with gradient text */}
                    <p className="text-xl md:text-2xl text-gray-200 font-light max-w-2xl mx-auto leading-relaxed mb-2">
                        Don't just travel. <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-200 to-white">Belong.</span>
                    </p>
                    <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto">
                        Find your squad, split costs, and create stories that last forever.
                    </p>
                    <p className="text-sm text-primary-400 mt-4 font-medium tracking-wide">
                        🎁 Sign up today and get 30 days of Premium access — absolutely free!
                    </p>
                </div>

                {/* Trip Code - Premium glassmorphism */}
                <div className="mb-10 flex flex-wrap items-center justify-center gap-4 animate-slide-up animation-delay-200">
                    <div className="flex items-center gap-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-3 border border-white/20 hover:border-primary-500/50 transition-all duration-500 shadow-xl shadow-black/20 hover:shadow-primary-900/30">
                        <div className="flex items-center gap-2 px-2">
                            <span className="text-primary-400 font-bold">🎫</span>
                            <span className="text-xs text-gray-300 font-semibold uppercase tracking-wider">Join Trip</span>
                        </div>
                        <div className="h-8 w-px bg-white/20" />
                        <input
                            type="text"
                            value={tripCode}
                            onChange={(e) => setTripCode(e.target.value.toUpperCase().slice(0, 6))}
                            placeholder="ENTER CODE"
                            maxLength={6}
                            className="w-32 bg-transparent text-white font-mono text-center font-bold tracking-[0.3em] outline-none placeholder-gray-500 text-lg"
                            onKeyDown={(e) => e.key === 'Enter' && searchByCode()}
                        />
                        <button
                            onClick={searchByCode}
                            disabled={searchingCode || tripCode.length !== 6}
                            className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 rounded-xl text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary-600/40 disabled:opacity-50 disabled:scale-100"
                        >
                            {searchingCode ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Search Form - Premium glass card */}
                <div className="animate-slide-up animation-delay-400">
                    <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl border border-white/25 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/30 hover:shadow-primary-900/20 transition-all duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                                <div className="text-left md:col-span-1">
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-300 tracking-wider uppercase ml-1 mb-3">
                                        <span className="w-6 h-6 flex items-center justify-center bg-primary-600/30 rounded-lg">📍</span>
                                        From
                                    </label>
                                    <CityAutocomplete
                                        id="from"
                                        name="from"
                                        value={from}
                                        onChange={setFrom}
                                        placeholder="Your city"
                                        className="w-full bg-black/30 border border-white/15 rounded-xl px-5 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500/60 focus:bg-black/40 transition-all duration-300 text-base"
                                        cities={INDIAN_CITIES}
                                    />
                                </div>
                                <div className="text-left md:col-span-1">
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-300 tracking-wider uppercase ml-1 mb-3">
                                        <span className="w-6 h-6 flex items-center justify-center bg-indigo-600/30 rounded-lg">🎯</span>
                                        Destination
                                    </label>
                                    <CityAutocomplete
                                        id="to"
                                        name="to"
                                        value={to}
                                        onChange={setTo}
                                        placeholder="Where to?"
                                        className="w-full bg-black/30 border border-white/15 rounded-xl px-5 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500/60 focus:bg-black/40 transition-all duration-300 text-base"
                                        cities={INDIAN_CITIES}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <button
                                        type="submit"
                                        className="w-full h-14 bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 hover:from-primary-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-xl shadow-primary-900/40 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-800/50 transition-all duration-300 relative overflow-hidden group"
                                    >
                                        <span className="relative z-10">Find Adventure</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Trust indicators */}
                <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-gray-400 text-sm animate-fade-in animation-delay-600">
                    <div className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>10,000+ Travelers</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full hidden md:block" />
                    <div className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Aadhaar Verified</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full hidden md:block" />
                    <div className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Secure Payments</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
