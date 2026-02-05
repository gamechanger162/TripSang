'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { tripAPI } from '@/lib/api';

interface TrendingDestination {
    name: string;
    image?: string;
    img?: string;
    category?: string;
    description?: string;
    tripCount?: number;
}

// Static trending data with categories
const staticTrending: TrendingDestination[] = [
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

export default function TrendingDestinations() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [trendingDestinations, setTrendingDestinations] = useState<TrendingDestination[]>([]);

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

    // Filter items based on active category
    const filteredItems = activeCategory === 'All'
        ? staticTrending
        : staticTrending.filter(item => item.category === activeCategory);

    // Use fetched data if available AND category is All
    const displayItems = (trendingDestinations.length > 0 && activeCategory === 'All')
        ? [...trendingDestinations, ...staticTrending]
        : filteredItems;

    // Duplicate for infinite scroll (Marquee needs enough items)
    const marqueeItems = [...displayItems, ...displayItems, ...displayItems].slice(0, 15);

    return (
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
                            <Image
                                src={item.image || item.img || '/images/trending/placeholder.png'}
                                alt={item.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                sizes="288px"
                            />
                            {/* Overlay Gradient */}
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
                                    {item.tripCount && item.tripCount > 0 ? `${item.tripCount} trips` : 'Trending Now'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
