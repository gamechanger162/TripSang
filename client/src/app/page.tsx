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
        { name: "Rio Carnival", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600&q=80" },
        { name: "Venice", image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80" },
        { name: "Thailand", image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80" },
        { name: "Gulmarg Snow", image: "https://images.unsplash.com/photo-1548263594-a71ea196f979?w=600&q=80" },
        { name: "Goa Party", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80" },
        { name: "Kerala", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80" },
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
                        sizes="100vw"
                    />
                </div>

                <div className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
                    <div className="mb-8 animate-fade-in-up">
                        <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium text-primary-300 mb-6">
                            🚀 The Future of Group Travel
                        </span>
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
                                <img
                                    src={item.image || item.img || '/placeholder.jpg'} // Fallback
                                    alt={item.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                                    loading="lazy"
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
                                Why <span className="inline-block relative top-4"><Image src="/logo-text.png" alt="Tripसंग" width={180} height={60} className="object-contain" /></span><br />
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Integrated Chat & Map - Large Block */}
                        <div className="md:col-span-2 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm rounded-3xl p-8 border border-white/10 relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-500 min-h-[400px]">
                            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/30 rounded-full blur-3xl group-hover:bg-indigo-600/50 transition-all duration-500" />
                            <div className="relative z-10">
                                <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/20">
                                    NEW: LIVE MAPS 📍
                                </span>
                                <h3 className="text-3xl font-bold text-white mb-4">Plan & Track Together</h3>
                                <p className="text-indigo-200 mb-8 max-w-sm">
                                    Real-time chat meets collaborative maps. Drop pins, plan routes, and see where your squad is—all in one place.
                                </p>
                            </div>

                            {/* Mock UI for Chat/Map */}
                            <div className="relative z-10 bg-black/40 rounded-xl p-4 max-w-md border border-white/5 backdrop-blur-md transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500 hover:shadow-2xl">
                                <div className="absolute top-4 right-4 text-green-400 animate-pulse">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" /></svg>
                                </div>
                                <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center p-1">
                                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-1.447-.894L15 7m0 13V7" /></svg>
                                    </div>
                                    <div className="text-sm">
                                        <div className="text-white font-bold">Trip Map</div>
                                        <div className="text-gray-400 text-xs">Akshay added "Cafe 1947"</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 justify-end">
                                    <div className="bg-primary-600 rounded-2xl rounded-tr-sm p-3 text-sm text-white shadow-lg">
                                        Map updated! Meet there at 5? 🗺️
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-400 to-purple-500 border border-white/20"></div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column Stack */}
                        <div className="space-y-6">
                            {/* Trip Gallery Feature - New! */}
                            <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-8 border border-white/10 relative overflow-hidden group hover:bg-gray-900/80 transition-all duration-300 h-full flex flex-col justify-center">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-0"></div>
                                <Image
                                    src="https://images.unsplash.com/photo-1533105079780-92b9be482077?w=500&q=80"
                                    fill
                                    alt="Gallery"
                                    className="object-cover absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 scale-100 group-hover:scale-105"
                                />
                                <div className="relative z-10 mt-auto">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 text-white border border-white/30">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">Trip Moments</h3>
                                    <p className="text-gray-300 text-sm mb-4">
                                        Share your travel memories with the community gallery.
                                    </p>
                                    <Link href="/gallery" className="text-primary-400 text-sm font-bold hover:text-primary-300 flex items-center gap-1">
                                        View Gallery <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    </Link>
                                </div>
                            </div>

                            {/* Trust Block */}
                            <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-6 border border-white/10 relative overflow-hidden group hover:border-gray-700 transition-colors duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 flex-shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Verified Vibes</h3>
                                        <p className="text-gray-400 text-xs">
                                            Travel safely with verified profiles and reviews.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* New "Moments" Showcase Section */}
            <section className="py-20 bg-black relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="md:w-1/2 relative z-10">
                            <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-500 to-pink-500 mb-6 leading-tight">
                                CAPTURE.<br />SHARE.<br />INSPIRE.
                            </h2>
                            <p className="text-gray-400 text-lg mb-8 max-w-md">
                                Your trip doesn't end when you return home. Post your favorite shots to the <strong>Trip Moments</strong> gallery and inspire the next wave of travelers.
                            </p>
                            <Link
                                href="/gallery"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Visit Gallery
                            </Link>
                        </div>

                        <div className="md:w-1/2 relative">
                            {/* Floating Cards Effect */}
                            <div className="relative w-full aspect-square md:aspect-[4/3]">
                                <div className="absolute top-0 right-0 w-2/3 h-5/6 bg-gray-800 rounded-2xl rotate-6 overflow-hidden border-4 border-white/5 opacity-60 transform translate-x-4">
                                    <Image src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80" fill alt="Travel 1" className="object-cover" />
                                </div>
                                <div className="absolute top-10 right-12 w-2/3 h-5/6 bg-gray-800 rounded-2xl -rotate-3 overflow-hidden border-4 border-white/10 shadow-2xl z-10">
                                    <Image src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=600&q=80" fill alt="Travel 2" className="object-cover" />
                                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                                        @Sarah in Bali 🌴
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 -left-4 bg-primary-600/20 w-32 h-32 rounded-full blur-3xl"></div>
                            </div>
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
