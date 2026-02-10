'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import CityAutocomplete from '@/components/CityAutocomplete';
import { INDIAN_CITIES } from '@/data/cities';
import { tripAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, ArrowRight, MapPin, Globe, Sparkles } from 'lucide-react';

interface HeroSectionProps {
    tripCode: string;
    setTripCode: (code: string) => void;
    searchingCode: boolean;
    setSearchingCode: (searching: boolean) => void;
}

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
};

const staggerItem = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    }
};

export default function HeroSection({
    tripCode,
    setTripCode,
    searchingCode,
    setSearchingCode
}: HeroSectionProps) {
    const router = useRouter();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [companions, setCompanions] = useState('');
    const [days, setDays] = useState('');

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
        <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden py-20">
            {/* Spatial UX: Deep mesh gradient background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-zinc-950" />
                {/* Teal mesh glow */}
                <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-teal-500/[0.07] blur-[120px]" />
                {/* Orange mesh glow */}
                <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-orange-500/[0.05] blur-[100px]" />
                {/* Center subtle glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-teal-600/[0.04] blur-[150px]" />
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-grid opacity-40" />
            </div>

            {/* Floating orbs */}
            <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
                <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-teal-400/30 rounded-full animate-float" />
                <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 bg-orange-400/25 rounded-full animate-float-slow" />
                <div className="absolute bottom-[30%] left-[20%] w-1 h-1 bg-teal-300/20 rounded-full animate-float-delayed" />
                <div className="absolute top-[60%] right-[25%] w-2.5 h-2.5 bg-teal-500/15 rounded-full animate-float" style={{ animationDelay: '3s' }} />
            </div>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center"
            >
                {/* Live Activity Badge */}
                <motion.div variants={staggerItem} className="mb-8">
                    <div className="glass-pill flex items-center gap-2.5 text-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-400 font-medium">127 travelers active</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-teal-400">Join them</span>
                    </div>
                </motion.div>

                {/* Kinetic Typography: Main Headline */}
                <motion.div variants={staggerItem} className="text-center mb-6 max-w-4xl">
                    <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
                        <motion.span
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="block text-white"
                        >
                            Don&apos;t Just Travel.
                        </motion.span>
                        <motion.span
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="block text-gradient-teal mt-2"
                        >
                            Belong.
                        </motion.span>
                    </h1>
                </motion.div>

                {/* Subtitle */}
                <motion.p
                    variants={staggerItem}
                    className="text-zinc-400 text-lg md:text-xl max-w-2xl text-center mb-12 leading-relaxed"
                >
                    Connect with verified travelers. Share costs. Experience the world together.
                </motion.p>

                {/* Mad Libs Natural Language Search Bar */}
                <motion.div variants={staggerItem} className="w-full max-w-3xl mb-8">
                    <form onSubmit={handleSearch}>
                        <div className="glass-strong rounded-2xl p-4 md:p-5 relative group">
                            {/* Glow border effect */}
                            <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500/20 via-transparent to-orange-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-sm" />

                            {/* Natural language sentence */}
                            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-2 text-zinc-300">
                                <span className="text-sm md:text-base font-medium text-zinc-500 whitespace-nowrap flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-teal-500" />
                                    I want to go from
                                </span>
                                <div className="w-full md:w-40">
                                    <CityAutocomplete
                                        id="from"
                                        name="from"
                                        value={from}
                                        onChange={setFrom}
                                        placeholder="anywhere"
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 text-sm transition-all"
                                        cities={INDIAN_CITIES}
                                    />
                                </div>
                                <span className="text-sm md:text-base font-medium text-zinc-500 whitespace-nowrap">to</span>
                                <div className="w-full md:w-40">
                                    <CityAutocomplete
                                        id="to"
                                        name="to"
                                        value={to}
                                        onChange={setTo}
                                        placeholder="dream destination"
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 text-sm transition-all"
                                        cities={INDIAN_CITIES}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap"
                                >
                                    <Search className="w-4 h-4" />
                                    Find Trips
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>

                {/* Trip Code Divider */}
                <motion.div variants={staggerItem} className="flex items-center gap-4 w-full max-w-sm justify-center mb-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1" />
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-600">or join with code</span>
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1" />
                </motion.div>

                {/* Trip Code Input */}
                <motion.div variants={staggerItem} className="flex gap-3 mb-14">
                    <input
                        type="text"
                        value={tripCode}
                        onChange={(e) => setTripCode(e.target.value.toUpperCase().slice(0, 6))}
                        placeholder="TRIP CODE"
                        maxLength={6}
                        className="glass-input text-center font-mono text-lg tracking-[0.25em] w-48 uppercase !rounded-xl !py-3"
                        onKeyDown={(e) => e.key === 'Enter' && searchByCode()}
                    />
                    <button
                        onClick={searchByCode}
                        disabled={searchingCode || tripCode.length !== 6}
                        className="btn-primary !px-4 !py-3 !rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {searchingCode ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <ArrowRight className="w-5 h-5" />
                        )}
                    </button>
                </motion.div>

                {/* Trust Badges */}
                <motion.div
                    variants={staggerItem}
                    className="flex flex-wrap justify-center gap-3"
                >
                    {[
                        { icon: '✓', label: 'Aadhaar Verified', color: 'teal' },
                        { icon: '🔒', label: 'Secure Payments', color: 'teal' },
                        { icon: '⚡', label: 'Instant Matching', color: 'orange' },
                    ].map((badge) => (
                        <div
                            key={badge.label}
                            className="glass-pill flex items-center gap-2 text-sm py-2 px-4"
                        >
                            <span className="text-teal-400">{badge.icon}</span>
                            <span className="text-zinc-400">{badge.label}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Stats Row */}
                <motion.div
                    variants={staggerItem}
                    className="flex flex-wrap justify-center gap-10 mt-14"
                >
                    {[
                        { value: '10K+', label: 'Travelers', color: 'text-teal-400' },
                        { value: '500+', label: 'Trips Created', color: 'text-orange-400' },
                        { value: '4.9★', label: 'Avg Rating', color: 'text-teal-300' },
                    ].map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className={`text-3xl md:text-4xl font-bold ${stat.color} font-display`}>{stat.value}</div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </motion.div>
        </section>
    );
}
