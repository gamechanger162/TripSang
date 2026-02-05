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
    const [date, setDate] = useState('');

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
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
            {/* Video Background (Simulated with Image for now) */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black z-10" />
                <Image
                    src="/hero-bg.jpg"
                    alt="Travel Adventure"
                    fill
                    className="object-cover scale-105 animate-pulse-slow"
                    priority
                    sizes="100vw"
                />
            </div>

            <div className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
                <div className="mb-8 animate-fade-in-up">
                    <div className="flex justify-center gap-3 mb-6">
                        <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium text-primary-300">
                            🚀 The Future of Group Travel
                        </span>
                        <span className="inline-block py-1 px-3 rounded-full bg-green-500/20 backdrop-blur-md border border-green-500/30 text-sm font-bold text-green-400">
                            ✨ 30-Day Free Trial
                        </span>
                    </div>
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/logo-text.png"
                            alt="Tripसंग"
                            width={400}
                            height={120}
                            className="object-contain drop-shadow-2xl"
                            priority
                        />
                    </div>
                    <p className="text-xl md:text-2xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
                        Don't just travel. <span className="text-white font-semibold">Belong.</span> <br />
                        Find your squad, split costs, and create stories that last forever.
                    </p>
                    <p className="text-sm text-primary-400 mt-3 font-medium">
                        Sign up today and get 30 days of Premium access — absolutely free!
                    </p>
                </div>

                {/* Trip Code & Explore */}
                <div className="mb-8 flex flex-wrap items-center justify-center gap-4 animate-slide-up animation-delay-200">
                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md rounded-xl p-2 border border-white/10 hover:border-primary-500/50 transition-colors duration-300">
                        <span className="text-xs text-gray-400 pl-2 font-mono uppercase">Join Trip:</span>
                        <input
                            type="text"
                            value={tripCode}
                            onChange={(e) => setTripCode(e.target.value.toUpperCase().slice(0, 6))}
                            placeholder="ENTER CODE"
                            maxLength={6}
                            className="w-28 bg-transparent text-white font-mono text-center font-bold tracking-widest outline-none placeholder-gray-600"
                            onKeyDown={(e) => e.key === 'Enter' && searchByCode()}
                        />
                        <button
                            onClick={searchByCode}
                            disabled={searchingCode || tripCode.length !== 6}
                            className="w-8 h-8 flex items-center justify-center bg-primary-600 hover:bg-primary-500 rounded-lg text-white transition-transform hover:scale-105"
                        >
                            {searchingCode ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Search Form */}
                <div className="animate-slide-up animation-delay-400">
                    <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-6 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="text-left md:col-span-1">
                                    <label className="text-xs font-bold text-gray-400 tracking-wider uppercase ml-1 block mb-2">From</label>
                                    <CityAutocomplete
                                        id="from"
                                        name="from"
                                        value={from}
                                        onChange={setFrom}
                                        placeholder="City"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors"
                                        cities={INDIAN_CITIES}
                                    />
                                </div>
                                <div className="text-left md:col-span-1">
                                    <label className="text-xs font-bold text-gray-400 tracking-wider uppercase ml-1 block mb-2">To</label>
                                    <CityAutocomplete
                                        id="to"
                                        name="to"
                                        value={to}
                                        onChange={setTo}
                                        placeholder="Destination"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors"
                                        cities={INDIAN_CITIES}
                                    />
                                </div>
                                <div className="text-left md:col-span-1">
                                    <label className="text-xs font-bold text-gray-400 tracking-wider uppercase ml-1 block mb-2">When</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors [color-scheme:dark]"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <button
                                        type="submit"
                                        className="w-full h-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-900/40 transform hover:-translate-y-1 transition-all duration-300"
                                    >
                                        Find Adventure
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}
