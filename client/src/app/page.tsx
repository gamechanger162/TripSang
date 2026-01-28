'use client';

import { useState, useEffect } from 'react';
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
    const [stats, setStats] = useState({ trips: 0, travelers: 0 });
    const [trendingDestinations, setTrendingDestinations] = useState<any[]>([]);

    // Fetch trending destinations
    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const response = await tripAPI.getTrendingDestinations();
                if (response.success && response.destinations && response.destinations.length > 0) {
                    setTrendingDestinations(response.destinations);
                }
            } catch (error) {
                console.error('Failed to fetch trending trips:', error);
            }
        };
        fetchTrending();
    }, []);

    // Simulate counting up stats
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                trips: prev.trips < 1200 ? prev.trips + 11 : 1243,
                travelers: prev.travelers < 5000 ? prev.travelers + 45 : 5892
            }));
        }, 50);
        return () => clearInterval(interval);
    }, []);

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

    // Marquee content
    const staticTrending = [
        { name: "Manali Trek", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=500&q=80" },
        { name: "Goa Beach Party", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500&q=80" },
        { name: "Rishikesh Rafting", image: "https://images.unsplash.com/photo-1506665531195-35661e984842?w=500&q=80" },
        { name: "Kerala Backwaters", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=500&q=80" },
        { name: "Ladakh Bike Trip", image: "https://images.unsplash.com/photo-1581793434113-1463ee08709a?w=500&q=80" },
        { name: "Jaipur Culture", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=500&q=80" },
    ];

    // Use fetched data if available, otherwise static
    const displayItems = trendingDestinations.length > 0 ? trendingDestinations : staticTrending;

    // Duplicate for infinite scroll
    const marqueeItems = [...displayItems, ...displayItems, ...displayItems];

    return (
        <div className="min-h-screen -mt-16 bg-black text-white overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
                {/* Video Background (Simulated with Image for now, but conceptually video) */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black z-10" />
                    <Image
                        src="/hero-bg.jpg" // Keeping existing asset as fallback
                        alt="Travel Adventure"
                        fill
                        className="object-cover scale-105 animate-pulse-slow"
                        priority
                    />
                </div>

                <div className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
                    <div className="mb-8 animate-fade-in-up">
                        <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium text-primary-300 mb-6">
                            🚀 The Future of Group Travel
                        </span>
                        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-4 font-display tracking-tight leading-none drop-shadow-2xl">
                            TRIPसंग
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
                            Don't just travel. <span className="text-white font-semibold">Belong.</span> <br />
                            Find your squad, split costs, and create stories that last forever.
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
                                            id="from" // Added ID
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
                                            id="to" // Added ID
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

            {/* Trending Vibes Marquee - NEW & EXCITING */}
            <section className="py-12 bg-black border-y border-white/5 relative z-10 overflow-hidden">
                <div className="mb-8 text-center">
                    <h3 className="text-sm font-bold text-primary-500 tracking-[0.2em] uppercase">Trending Locations</h3>
                </div>

                <div className="flex w-full whitespace-nowrap overflow-hidden pause-on-hover py-4">
                    <div className="flex animate-marquee">
                        {marqueeItems.map((item, idx) => (
                            <div key={`${item.name}-${idx}`} className="inline-block mx-4 w-64 h-80 relative group cursor-pointer overflow-hidden rounded-2xl border border-white/10">
                                <Image
                                    src={item.image || item.img || '/placeholder.jpg'} // Fallback
                                    alt={item.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <h4 className="text-2xl font-bold font-display">{item.name}</h4>
                                    <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className="text-xs font-semibold bg-primary-600 px-2 py-1 rounded">EXPLORE</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bento Grid Features - MODERN REPLACEMENT */}
            <section className="py-24 relative bg-dark-900">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="mb-16 md:flex items-end justify-between">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                                Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">Tripसंग</span><br />
                                is Different.
                            </h2>
                            <p className="text-gray-400 max-w-md text-lg">
                                We built the platform we wished we had. No more messy group chats or awkward money talks.
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="flex gap-8">
                                <div>
                                    <div className="text-3xl font-bold text-white">{stats.trips.toLocaleString()}+</div>
                                    <div className="text-sm text-gray-500 uppercase tracking-widest">Trips Created</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">{stats.travelers.toLocaleString()}+</div>
                                    <div className="text-sm text-gray-500 uppercase tracking-widest">Travelers</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
                        {/* Integrated Chat - Large Block */}
                        <div className="md:col-span-2 row-span-2 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm rounded-3xl p-8 border border-white/10 relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-500">
                            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/30 rounded-full blur-3xl group-hover:bg-indigo-600/50 transition-all duration-500" />
                            <h3 className="text-3xl font-bold text-white mb-4 relative z-10">Vibe-Check Before You Fly</h3>
                            <p className="text-indigo-200 mb-8 max-w-sm relative z-10">
                                Don't travel with strangers. Our integrated chat rooms let you break the ice, plan itineraries, and build hype before day one.
                            </p>

                            <div className="relative z-10 bg-black/40 rounded-xl p-4 max-w-md border border-white/5 backdrop-blur-md transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold text-xs">A</div>
                                    <div className="bg-gray-800 rounded-lg rounded-tl-none p-2 px-3 text-sm text-gray-200">
                                        Anyone up for paragliding in Bir? 🪂
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 justify-end">
                                    <div className="bg-primary-900/50 border border-primary-700/50 rounded-lg rounded-tr-none p-2 px-3 text-sm text-white">
                                        Count me in! Always wanted to try.
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-xs">Me</div>
                                </div>
                            </div>
                        </div>

                        {/* Split Costs - Small Block */}
                        <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-8 border border-white/10 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4 text-green-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Budget Transparently</h3>
                            <p className="text-gray-400 text-sm">
                                Set a budget range. We help you find squads that match your wallet.
                            </p>
                        </div>

                        {/* Verified - Small Block */}
                        <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-8 border border-white/10 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 text-blue-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Verified Travelers</h3>
                            <p className="text-gray-400 text-sm">
                                Mobile verification and profile reviews ensure you travel safe.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Immersive Parallax Call to Action */}
            <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80"
                        alt="Adventure awaits"
                        fill
                        className="object-cover brightness-50"
                    />
                </div>
                <div className="relative z-10 text-center px-4 max-w-4xl">
                    <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter drop-shadow-2xl">
                        YOUR TRIBE IS<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">WAITING</span>
                    </h2>
                    <p className="text-2xl text-white/90 font-light mb-12">
                        Life is short. The world is wide. Stop waiting for your friends to agree on a date.
                    </p>
                    <Link
                        href="/trips/create"
                        className="inline-block bg-white text-black text-lg font-bold px-10 py-5 rounded-full hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-2xl"
                    >
                        Start a Trip Now
                    </Link>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-24 bg-black text-center border-t border-white/10">
                <div className="max-w-2xl mx-auto px-4">
                    <p className="text-primary-500 font-mono text-sm mb-4">JOIN 10,000+ TRAVELERS</p>
                    <h3 className="text-3xl font-bold text-white mb-8">Ready to make memories?</h3>
                    <div className="flex justify-center gap-4">
                        <Link href="/search" className="btn-outline border-white/30 text-white hover:bg-white hover:text-black hover:border-white">
                            Browse Trips
                        </Link>
                        <Link href="/auth/register" className="btn-primary">
                            Create Account
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
