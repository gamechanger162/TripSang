'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

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
        <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden py-20 bg-[#050508]">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/hero-bg.jpg')" }}
                />
                {/* Dark overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
            </div>

            {/* Futuristic Overlay Effects */}
            <div className="absolute inset-0 z-[1]">
                {/* Cyber grid pattern */}
                <div className="absolute inset-0 opacity-15" style={{
                    backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }} />

                {/* Subtle scan lines */}
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,255,0.015)_2px,rgba(0,255,255,0.015)_4px)] pointer-events-none" />

                {/* Cyan ambient glows */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/5 rounded-full blur-[200px]" />

                {/* Floating particles - subtle */}
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-400/50 rounded-full particle-gold blur-[0.5px]" style={{ animationDelay: '0s' }} />
                <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-cyan-300/40 rounded-full particle-gold blur-[0.5px]" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-cyan-400/35 rounded-full particle-gold blur-[0.5px]" style={{ animationDelay: '4s' }} />
                <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-cyan-500/40 rounded-full particle-gold blur-[0.5px]" style={{ animationDelay: '1s' }} />

                {/* Dynamic spotlight - cyan glow */}
                <div
                    className="absolute w-[600px] h-[600px] rounded-full pointer-events-none transition-all duration-700 ease-out"
                    style={{
                        left: mousePosition.x - 300,
                        top: mousePosition.y - 300,
                        background: 'radial-gradient(circle, rgba(0, 255, 255, 0.08) 0%, rgba(0, 150, 255, 0.04) 40%, transparent 70%)',
                    }}
                />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">

                {/* Live Activity Indicator - Top Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-6"
                >
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-full px-4 py-2 text-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-green-400 font-medium">127 travelers active now</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-cyan-400">Join them</span>
                    </div>
                </motion.div>

                {/* Hero Content */}
                <div className="text-center mb-12 max-w-5xl mx-auto relative z-10">

                    {/* Logo with intense glow effect */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="flex justify-center mb-8"
                    >
                        <div className="relative group">
                            {/* Intense glow layers */}
                            <div className="absolute inset-0 scale-150 bg-cyan-400/50 blur-[80px] rounded-full" />
                            <div className="absolute inset-0 scale-125 bg-cyan-500/40 blur-[50px] rounded-full animate-pulse" />
                            <div className="absolute inset-0 scale-110 bg-white/20 blur-[30px] rounded-full" />

                            <Image
                                src="/logo.png"
                                alt="TripSang"
                                width={320}
                                height={112}
                                className="object-contain relative z-10"
                                style={{
                                    filter: 'drop-shadow(0 0 15px rgba(0, 255, 255, 0.8)) drop-shadow(0 0 30px rgba(0, 255, 255, 0.6)) drop-shadow(0 0 50px rgba(0, 255, 255, 0.4))'
                                }}
                                priority
                            />
                        </div>
                    </motion.div>

                    {/* Main Headline with animated gradient */}
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]"
                    >
                        <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Find Your</span>
                        <br />
                        <span className="relative inline-block">
                            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x">
                                Travel Partner
                            </span>
                            {/* Animated underline */}
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 1, delay: 1 }}
                                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full origin-left"
                            />
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
                    >
                        <span className="text-gray-300">Connect with verified travelers who share your wanderlust.</span>
                        <br className="hidden md:block" />
                        <span className="text-cyan-300/70">Adventure awaits—explore it together.</span>
                    </motion.p>

                    {/* Animated Stats Row */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="flex flex-wrap justify-center gap-8 md:gap-12 mb-10"
                    >
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">10K+</div>
                            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider">Travelers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">500+</div>
                            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider">Trips Made</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">4.9★</div>
                            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider">Rating</div>
                        </div>
                    </motion.div>

                    {/* Main Actions Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto"
                    >
                        {/* Search Bar - Enhanced with glow */}
                        <div className="w-full relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition duration-500 animate-pulse"></div>
                            <form onSubmit={handleSearch} className="relative flex flex-col md:flex-row bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-2 md:p-3 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                                <div className="flex-1 relative border-b md:border-b-0 md:border-r border-white/10">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <span className="text-cyan-400">📍</span>
                                    </div>
                                    <CityAutocomplete
                                        id="from"
                                        name="from"
                                        value={from}
                                        onChange={setFrom}
                                        placeholder="From where?"
                                        className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 pl-10 h-12 text-lg"
                                        cities={INDIAN_CITIES}
                                    />
                                </div>
                                <div className="flex-1 relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <span className="text-cyan-400">🌏</span>
                                    </div>
                                    <CityAutocomplete
                                        id="to"
                                        name="to"
                                        value={to}
                                        onChange={setTo}
                                        placeholder="Destinations?"
                                        className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 pl-10 h-12 text-lg"
                                        cities={INDIAN_CITIES}
                                    />
                                </div>
                                <button type="submit" className="mt-2 md:mt-0 md:ml-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                                    Search
                                </button>
                            </form>
                        </div>

                        {/* Trip Code Divider */}
                        <div className="flex items-center gap-4 w-full justify-center opacity-60">
                            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent w-20"></div>
                            <span className="text-xs uppercase tracking-widest text-cyan-400/70">or join existing</span>
                            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent w-20"></div>
                        </div>

                        {/* Trip Code Input */}
                        <div className="flex gap-2">
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                                <input
                                    type="text"
                                    value={tripCode}
                                    onChange={(e) => setTripCode(e.target.value.toUpperCase().slice(0, 6))}
                                    placeholder="TRIP CODE"
                                    maxLength={6}
                                    className="relative bg-black/70 border border-cyan-500/30 rounded-xl px-4 py-3 text-center font-mono text-lg tracking-[0.2em] text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400/60 w-48 uppercase"
                                    onKeyDown={(e) => e.key === 'Enter' && searchByCode()}
                                />
                            </div>
                            <button
                                onClick={searchByCode}
                                disabled={searchingCode || tripCode.length !== 6}
                                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            >
                                {searchingCode ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                )}
                            </button>
                        </div>

                    </motion.div>
                </div>

                {/* Floating Trust Badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="flex flex-wrap justify-center gap-4 md:gap-6"
                >
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-green-500/30 rounded-full px-4 py-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <span className="text-green-400">✓</span>
                        <span className="text-sm text-gray-300">Aadhaar Verified</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-full px-4 py-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <span className="text-blue-400">🔒</span>
                        <span className="text-sm text-gray-300">Secure Payments</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-full px-4 py-2 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        <span className="text-purple-400">⚡</span>
                        <span className="text-sm text-gray-300">Instant Matching</span>
                    </div>
                </motion.div>
            </div >
        </section >
    );
}

