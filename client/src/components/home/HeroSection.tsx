'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { tripAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowRight, Users, Map, Star } from 'lucide-react';

// Dynamic import – Three.js cannot run on the server
const DataGlobe = dynamic(() => import('./globe/DataGlobe'), {
    ssr: false,
    loading: () => (
        <div className="absolute inset-0 bg-black" />
    ),
});

export default function HeroSection() {
    const router = useRouter();
    const [tripCode, setTripCode] = useState('');
    const [searching, setSearching] = useState(false);

    const handleSearch = async () => {
        if (!tripCode || tripCode.length !== 6) {
            toast.error('Please enter a valid 6-character trip code');
            return;
        }

        setSearching(true);
        try {
            const response = await tripAPI.getByCode(tripCode);
            if (response.success && response.trip) {
                router.push(`/trips/${response.trip._id}`);
            }
        } catch (error: any) {
            toast.error(error.message || 'No trip found with this code');
        } finally {
            setSearching(false);
        }
    };

    return (
        <section className="relative h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center bg-black">
            {/* 1. 3D Globe Background */}
            <DataGlobe />

            {/* Subtle gradient overlay for text readability */}
            <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-black/30 via-transparent to-black/60" />

            {/* 2. Main Content */}
            <div className="relative z-[2] w-full max-w-4xl mx-auto px-4 flex flex-col items-center text-center">

                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="mb-8"
                >
                    <Image
                        src="/logo-tripsang.png"
                        alt="TripSang"
                        width={280}
                        height={90}
                        className="object-contain drop-shadow-2xl"
                        priority
                    />
                </motion.div>

                {/* Unique Text Layout */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="mb-12"
                >
                    <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-4 drop-shadow-lg">
                        The World is <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-300">Waiting.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-zinc-200 font-light max-w-2xl mx-auto drop-shadow-md">
                        Find your <span className="font-semibold text-white">Travel Partner.</span>
                    </p>
                </motion.div>

                {/* Magnetic Trip Code Input */}
                <motion.div
                    initial={{ opacity: 0, width: "50%" }}
                    animate={{ opacity: 1, width: "100%" }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    <div className="glass-strong p-2 rounded-full flex items-center gap-2 shadow-2xl shadow-black/20 border border-white/20 backdrop-blur-xl transition-all hover:scale-105 duration-300">
                        <input
                            type="text"
                            value={tripCode}
                            onChange={(e) => setTripCode(e.target.value.toUpperCase().slice(0, 6))}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="JOIN VIA CODE"
                            maxLength={6}
                            className="bg-transparent border-none text-white placeholder-zinc-400 text-center font-mono text-lg tracking-[0.2em] flex-1 h-12 focus:ring-0 uppercase ml-4"
                        />

                        <button
                            onClick={handleSearch}
                            disabled={searching || tripCode.length !== 6}
                            className="h-12 w-12 rounded-full bg-white text-black hover:bg-teal-400 transition-colors flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {searching ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <ArrowRight className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </motion.div>

            </div>

            {/* 3. Bottom Stats Ticker */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1 }}
                className="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/60 to-transparent py-8 z-[2]"
            >
                <div className="flex gap-12 justify-center opacity-90 text-white/80 text-sm font-medium tracking-wide">
                    <span className="flex items-center gap-2"><Users size={16} className="text-teal-400" /> 10K+ Travelers</span>
                    <span className="flex items-center gap-2"><Map size={16} className="text-teal-400" /> 500+ Adventures</span>
                    <span className="flex items-center gap-2"><Star size={16} className="text-teal-400" /> 4.9/5 Rating</span>
                </div>
            </motion.div>
        </section>
    );
}
