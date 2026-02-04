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
    const [activeCategory, setActiveCategory] = useState('All');

    // Categorized Trending Data
    // Categorized Trending Data
    // Categorized Trending Data
    const staticTrending = [
        { name: "Bali, Indonesia", image: "/images/trending/bali_landscape.png", category: "Chill Places", description: "Beautiful beaches, yoga retreats, rice terraces, and affordable luxury." },
        { name: "Jaipur, India", image: "/images/trending/jaipur_palace.png", category: "Chill Places", description: "The Pink City, famous for its majestic palaces and vibrant culture." },
        { name: "Jaisalmer", image: "/images/trending/jaipur_palace.png", category: "Adventure", description: "The Golden City of India, known for its desert safari and forts." },
        { name: "Ladakh", image: "/images/trending/ladakh_lake.png", category: "Adventure", description: "Rugged mountains, crystal clear lakes, and high-altitude adventure." },
        { name: "Tawang", image: "/images/trending/tawang_monastery.png", category: "Adventure", description: "Hidden gem of Arunachal Pradesh with majestic monasteries and snowy passes." },
        { name: "Kyoto, Japan", image: "/images/trending/kyoto.png", category: "Chill Places", description: "Ancient temples, traditional tea houses, and sublime zen gardens." },
        { name: "Santorini, Greece", image: "/images/trending/santorini.png", category: "Chill Places", description: "Iconic white buildings with blue domes overlooking the crystal clear Aegean Sea." },
        { name: "Machu Picchu, Peru", image: "/images/trending/machu_picchu.png", category: "Adventure", description: "The Lost City of the Incas, hidden high in the Andes Mountains." },
        { name: "Iceland", image: "/images/trending/iceland.png", category: "Adventure", description: "Land of fire and ice, featuring volcanoes, geysers, hot springs, and lava fields." },
        { name: "Dubai, UAE", image: "/images/trending/dubai.png", category: "Chill Places", description: "Ultramodern architecture, luxury shopping, and lively nightlife scene." },
        { name: "Paris, France", image: "/images/trending/paris.png", category: "Chill Places", description: "The City of Light, known for romance, gastronomy, and art." },
        { name: "New York City, USA", image: "/placeholder.jpg", category: "Adventure", description: "The city that never sleeps, offering endless energy and iconic landmarks." },
        { name: "Cape Town, South Africa", image: "/placeholder.jpg", category: "Adventure", description: "Stunning coastlines, Table Mountain hikes, and vibrant culture." },
        { name: "Rome, Italy", image: "/placeholder.jpg", category: "Chill Places", description: "Eternal City filled with ancient history, art, and incredible food." },
        { name: "Istanbul, Turkey", image: "/placeholder.jpg", category: "Chill Places", description: "Where East meets West, famous for its bazaars, mosques, and history." },
        { name: "Sydney, Australia", image: "/placeholder.jpg", category: "Adventure", description: "Famous for its Opera House, Harbour Bridge, and beautiful beaches." },
        { name: "Queenstown, New Zealand", image: "/placeholder.jpg", category: "Adventure", description: "Adventure capital of the world, perfect for bungee jumping and skiing." },
        { name: "Barcelona, Spain", image: "/placeholder.jpg", category: "Chill Places", description: "Famous for Gaudí's architecture, beaches, and vibrant street life." },
        { name: "Amsterdam, Netherlands", image: "/placeholder.jpg", category: "Chill Places", description: "Known for its artistic heritage, elaborate canal system, and narrow houses." },
        { name: "Prague, Czech Republic", image: "/placeholder.jpg", category: "Chill Places", description: "The City of a Hundred Spires, known for its Old Town Square and baroque buildings." },
        { name: "Banff, Canada", image: "/placeholder.jpg", category: "Adventure", description: "Stunning turquoise lakes, snow-capped peaks, and abundant wildlife." },
        { name: "Maui, Hawaii", image: "/placeholder.jpg", category: "Chill Places", description: "Famous for its beaches, the sacred Iao Valley, and migrating humpback whales." },
        { name: "Cairo, Egypt", image: "/placeholder.jpg", category: "Adventure", description: "Home to the Giza Pyramids and the Great Sphinx, rich in ancient history." },
        { name: "Kaziranga", image: "/images/trending/kaziranga_rhino.png", category: "Adventure", description: "Home of the one-horned rhino and vibrant biodiversity in Assam." },
        { name: "Shillong", image: "/images/trending/meghalaya_rootbridge.png", category: "Chill Places", description: "Scotland of the East, known for its rolling hills and waterfalls." },
        { name: "Spiti Valley", image: "/images/trending/ladakh_lake.png", category: "Adventure", description: "Cold desert mountain valley famous for its stunning landscapes and monasteries." },
        { name: "Rio Carnival", image: "/images/trending/rio_carnival.png", category: "Adventure", description: "Experience the world's biggest party with vibrant colors and samba." },
        { name: "Kasol", image: "/images/trending/manali_trek.png", category: "Chill Places", description: "Mini Israel of India, sitting by the Parvati river with varied trekking trails." },
        { name: "Gokarna", image: "/images/trending/andaman_beach.png", category: "Solo-Friendly", description: "Peaceful beaches and temples, perfect for a solo spiritual retreat." },
        { name: "Pondicherry", image: "/images/trending/pondicherry_street.png", category: "Chill Places", description: "French colonial charm, serene beaches, and peaceful vibes." },
        { name: "Venice", image: "/images/trending/venice_canals.png", category: "Chill Places", description: "Timeless canals and romantic gondola rides in the floating city." },
        { name: "Meghalaya", image: "/images/trending/meghalaya_rootbridge.png", category: "Adventure", description: "Abode of Clouds, living root bridges, and mesmerizing waterfalls." },
        { name: "Coorg", image: "/images/trending/kerala_backwaters.png", category: "Chill Places", description: "The Scotland of India, known for its coffee plantations and misty hills." },
        { name: "Munnar", image: "/images/trending/kerala_backwaters.png", category: "Chill Places", description: "Famous hill station with tea gardens, misty peaks, and serene vibes." },
        { name: "Thailand", image: "/images/trending/thailand_beach.png", category: "Chill Places", description: "Tropical paradise with stunning islands and vibrant night markets." },
        { name: "Rishikesh", image: "/images/trending/rishikesh_rafting.png", category: "Adventure", description: "Yoga capital of the world and thrill of white water rafting." },
        { name: "Varkala", image: "/images/trending/bali_landscape.png", category: "Solo-Friendly", description: "A beautiful coastal town with cliffs adjacent to the Arabian Sea." },
        { name: "Gulmarg", image: "/images/trending/snowy_mountains.png", category: "Adventure", description: "Premier skiing destination with breathtaking snow-capped peaks." },
        { name: "Goa Party", image: "/images/trending/goa_party.png", category: "Solo-Friendly", description: "The ultimate beach party destination with a friendly vibe." },
        { name: "Andaman", image: "/images/trending/andaman_beach.png", category: "Chill Places", description: "Pristine white sand beaches and turquoise blue waters." },
        { name: "Kerala", image: "/images/trending/kerala_backwaters.png", category: "Chill Places", description: "God's own country with serene backwaters and lush greenery." },
        { name: "Manali", image: "/images/trending/manali_trek.png", category: "Adventure", description: "A high-altitude resort town for backpacking and trekking." },
        { name: "Vietnam", image: "/images/trending/vietnam_street.png", category: "Solo-Friendly", description: "Rich history, bustling cities, and incredible street food." },
    ];

    // Filter items based on active category
    const filteredItems = activeCategory === 'All'
        ? staticTrending
        : staticTrending.filter(item => item.category === activeCategory);

    // Use fetched data if available AND category is All (fetched data usually doesn't have local categories yet), otherwise use static
    const displayItems = (trendingDestinations.length > 0 && activeCategory === 'All')
        ? [...trendingDestinations, ...staticTrending] // Mix them for fullness
        : filteredItems;

    // Duplicate for infinite scroll (Marquee needs enough items)
    const marqueeItems = [...displayItems, ...displayItems, ...displayItems].slice(0, 15); // Limit total for performance

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

            {/* The Process Section - HOW IT WORKS */}
            <section className="py-20 bg-dark-900 border-b border-white/5 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">How It Works</h2>
                        <p className="text-gray-400">Start your journey in 4 simple steps</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-[60px] left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary-900 via-primary-700 to-primary-900 z-0"></div>

                        {/* Step 1 */}
                        <div className="relative z-10 text-center group">
                            <div className="w-24 h-24 mx-auto bg-dark-800 border-2 border-primary-900 rounded-full flex items-center justify-center mb-6 group-hover:border-primary-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300">
                                <span className="text-3xl">👤</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">1. Log In</h3>
                            <p className="text-gray-400 text-sm">Create your profile and verify with Aadhaar or PAN for trusted travel.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative z-10 text-center group">
                            <div className="w-24 h-24 mx-auto bg-dark-800 border-2 border-primary-900 rounded-full flex items-center justify-center mb-6 group-hover:border-primary-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300">
                                <span className="text-3xl">🎁</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">2. Get Free Trial</h3>
                            <p className="text-gray-400 text-sm">Enjoy a 30-day free trial of premium features.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative z-10 text-center group">
                            <div className="w-24 h-24 mx-auto bg-dark-800 border-2 border-primary-900 rounded-full flex items-center justify-center mb-6 group-hover:border-primary-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300">
                                <span className="text-3xl">🗺️</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">3. Explore & Create</h3>
                            <p className="text-gray-400 text-sm">Browse trending trips or start your own plan.</p>
                        </div>

                        {/* Step 4 */}
                        <div className="relative z-10 text-center group">
                            <div className="w-24 h-24 mx-auto bg-dark-800 border-2 border-primary-900 rounded-full flex items-center justify-center mb-6 group-hover:border-primary-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300">
                                <span className="text-3xl">💬</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">4. Chat & Connect</h3>
                            <p className="text-gray-400 text-sm">Meet your squad and travel together.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trending Vibes Marquee - REDESIGNED */}
            <section className="py-16 bg-black border-y border-white/5 relative z-10 overflow-hidden">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-white mb-6">Discover Popular Destinations</h2>
                    <p className="text-gray-400 mb-8">People don't just travel. They tell stories.</p>

                    {/* Category Filters */}
                    <div className="flex flex-wrap justify-center gap-4 mb-8">
                        {['All', 'Chill Places', 'Adventure', 'Solo-Friendly'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2 rounded-full border transition-all duration-300 ${activeCategory === cat
                                    ? 'bg-primary-600 border-primary-600 text-white shadow-lg scale-105'
                                    : 'bg-transparent border-white/20 text-gray-400 hover:border-white/50 hover:text-white'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex w-full whitespace-nowrap overflow-hidden pause-on-hover py-4">
                    <div className="flex animate-marquee">
                        {marqueeItems.map((item, idx) => (
                            <div
                                key={`${item.name}-${idx}`}
                                className="inline-block mx-3 w-72 h-96 relative group cursor-default overflow-hidden rounded-2xl transition-all duration-500 transform hover:scale-105"
                            >
                                <img
                                    src={item.image || item.img || '/placeholder.jpg'}
                                    alt={item.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    loading="lazy"
                                />
                                {/* Overlay Gradient - Always visible at bottom, grows on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

                                {/* Content Overlay */}
                                <div className="absolute bottom-0 left-0 w-full p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-primary-400">📍</span>
                                        <h4 className="text-2xl font-bold text-white font-display shadow-black drop-shadow-md">{item.name}</h4>
                                    </div>

                                    {/* Description reveals on hover */}
                                    <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-500 opacity-0 group-hover:opacity-100">
                                        <p className="text-sm text-gray-300 whitespace-normal line-clamp-3 mb-3">
                                            {item.description || "Experience the vibe of this amazing destination. Perfect for your next adventure."}
                                        </p>
                                    </div>

                                    {/* Always visible tagline/counter */}
                                    <div className="mt-2 text-xs text-gray-400 font-medium opacity-100 group-hover:opacity-0 transition-opacity duration-300 absolute -bottom-6">
                                        {item.tripCount > 0 ? `${item.tripCount} trips` : 'Trending Now'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bento Grid Features - MODERN REPLACEMENT */}
            <section className="py-24 relative bg-dark-900 z-20">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="mb-16 md:flex items-end justify-between">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                                Why <span className="inline-block relative top-4"><Image src="/logo-text.png" alt="Tripसंग" width={140} height={47} className="object-contain" /></span><br />
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
                                    src="/images/home/gallery_cover.png"
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

                        </div>
                    </div>
                </div>
            </section>

            {/* NEW: Dedicated Verified Partners Section */}
            <section className="py-20 bg-gradient-to-br from-blue-950 to-black border-y border-white/5 relative overflow-hidden z-20">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="md:w-1/2">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-bold mb-6">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                Verified & Trusted
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                                Travel with Real People.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Not Bots.</span>
                            </h2>
                            <p className="text-blue-100 text-lg mb-8 leading-relaxed max-w-xl">
                                Your safety is non-negotiable. We verify identities using <strong>Government ID (Aadhaar or PAN)</strong> so you can focus on the adventure, not the anxiety. Get your badge and join the circle of trusted travelers.
                            </p>

                            <div className="flex flex-col gap-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </div>
                                    <span className="text-gray-300">Government ID verification (Aadhaar/PAN)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </div>
                                    <span className="text-gray-300">Verified traveler reviews & ratings</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </div>
                                    <span className="text-gray-300">Safe & secure travel community</span>
                                </div>
                            </div>

                            <Link href="/verify/id" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 shadow-[0_0_25px_rgba(37,99,235,0.4)]">
                                Get Verified Now
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </Link>
                        </div>

                        <div className="md:w-1/2 relative">
                            {/* Visual Representation of ID Card/Verification */}
                            <div className="relative w-full aspect-square md:aspect-video bg-gradient-to-tr from-gray-900 to-gray-800 rounded-2xl border border-white/10 p-6 flex items-center justify-center group overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                                {/* Floating Badge Animation */}
                                <div className="relative z-10 w-48 h-48 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.5)] animate-float">
                                    <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                </div>

                                {/* Decorative circles */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-blue-500/30 rounded-full animate-ping-slow" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-blue-500/10 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* New "Moments" Showcase Section */}
            <section className="py-20 md:py-24 bg-black relative overflow-hidden z-0 mt-12 md:mt-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="md:w-1/2 relative">
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
                                    <Image src="/images/home/moment_hike.png" fill alt="Travel 1" className="object-cover" />
                                </div>
                                <div className="absolute top-10 right-12 w-2/3 h-5/6 bg-gray-800 rounded-2xl -rotate-3 overflow-hidden border-4 border-white/10 shadow-2xl z-10">
                                    <Image src="/images/home/moment_bali.png" fill alt="Travel 2" className="object-cover" />
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
                        src="/images/home/footer_bg.png"
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
                        <Link href="/auth/signup" className="btn-primary">
                            Create Account
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
