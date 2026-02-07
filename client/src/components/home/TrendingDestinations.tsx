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

// Static trending data with Cloudinary CDN URLs for optimal performance
const staticTrending: TrendingDestination[] = [
    { name: "Bali, Indonesia", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474941/tripsang/trending/tripsang/trending/bali_landscape.jpg", category: "Chill Places", description: "Beautiful beaches, yoga retreats, rice terraces, and affordable luxury." },
    { name: "Jaipur, India", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474951/tripsang/trending/tripsang/trending/jaipur_palace.jpg", category: "Chill Places", description: "The Pink City, famous for its majestic palaces and vibrant culture." },
    { name: "Jaisalmer", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474953/tripsang/trending/tripsang/trending/jaisalmer_fort_desert.jpg", category: "Adventure", description: "The Golden City of India, known for its desert safari and forts." },
    { name: "Ladakh", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474960/tripsang/trending/tripsang/trending/ladakh_lake.jpg", category: "Adventure", description: "Rugged mountains, crystal clear lakes, and high-altitude adventure." },
    { name: "Tawang", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474981/tripsang/trending/tripsang/trending/tawang_monastery.jpg", category: "Adventure", description: "Hidden gem of Arunachal Pradesh with majestic monasteries and snowy passes." },
    { name: "Kyoto, Japan", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474957/tripsang/trending/tripsang/trending/kyoto.jpg", category: "Chill Places", description: "Ancient temples, traditional tea houses, and sublime zen gardens." },
    { name: "Santorini, Greece", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474975/tripsang/trending/tripsang/trending/santorini.jpg", category: "Chill Places", description: "Iconic white buildings with blue domes overlooking the crystal clear Aegean Sea." },
    { name: "Machu Picchu, Peru", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474961/tripsang/trending/tripsang/trending/machu_picchu.jpg", category: "Adventure", description: "The Lost City of the Incas, hidden high in the Andes Mountains." },
    { name: "Iceland", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474949/tripsang/trending/tripsang/trending/iceland.jpg", category: "Adventure", description: "Land of fire and ice, featuring volcanoes, geysers, hot springs, and lava fields." },
    { name: "Dubai, UAE", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474944/tripsang/trending/tripsang/trending/dubai.jpg", category: "Chill Places", description: "Ultramodern architecture, luxury shopping, and lively nightlife scene." },
    { name: "Paris, France", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474968/tripsang/trending/tripsang/trending/paris.jpg", category: "Chill Places", description: "The City of Light, known for romance, gastronomy, and art." },
    { name: "Kaziranga", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474955/tripsang/trending/tripsang/trending/kaziranga_rhino.jpg", category: "Adventure", description: "Home of the one-horned rhino and vibrant biodiversity in Assam." },
    { name: "Shillong", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474976/tripsang/trending/tripsang/trending/shillong_hills.jpg", category: "Chill Places", description: "Scotland of the East, known for its rolling hills and waterfalls." },
    { name: "Spiti Valley", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474980/tripsang/trending/tripsang/trending/spiti_valley.jpg", category: "Adventure", description: "Cold desert mountain valley famous for its stunning landscapes and monasteries." },
    { name: "Rio Carnival", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474972/tripsang/trending/tripsang/trending/rio_carnival.jpg", category: "Adventure", description: "Experience the world's biggest party with vibrant colors and samba." },
    { name: "Kasol", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474954/tripsang/trending/tripsang/trending/kasol_parvati.jpg", category: "Chill Places", description: "Mini Israel of India, sitting by the Parvati river with varied trekking trails." },
    { name: "Gokarna", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474948/tripsang/trending/tripsang/trending/gokarna_beach.jpg", category: "Solo-Friendly", description: "Peaceful beaches and temples, perfect for a solo spiritual retreat." },
    { name: "Pondicherry", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474970/tripsang/trending/tripsang/trending/pondicherry_street.jpg", category: "Chill Places", description: "French colonial charm, serene beaches, and peaceful vibes." },
    { name: "Venice", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474985/tripsang/trending/tripsang/trending/venice_canals.jpg", category: "Chill Places", description: "Timeless canals and romantic gondola rides in the floating city." },
    { name: "Meghalaya", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474965/tripsang/trending/tripsang/trending/meghalaya_rootbridge.jpg", category: "Adventure", description: "Abode of Clouds, living root bridges, and mesmerizing waterfalls." },
    { name: "Coorg", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474942/tripsang/trending/tripsang/trending/coorg_hills.jpg", category: "Chill Places", description: "The Scotland of India, known for its coffee plantations and misty hills." },
    { name: "Munnar", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474966/tripsang/trending/tripsang/trending/munnar_tea.jpg", category: "Chill Places", description: "Famous hill station with tea gardens, misty peaks, and serene vibes." },
    { name: "Thailand", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474983/tripsang/trending/tripsang/trending/thailand_beach.jpg", category: "Chill Places", description: "Tropical paradise with stunning islands and vibrant night markets." },
    { name: "Rishikesh", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474973/tripsang/trending/tripsang/trending/rishikesh_rafting.jpg", category: "Adventure", description: "Yoga capital of the world and thrill of white water rafting." },
    { name: "Varkala", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474984/tripsang/trending/tripsang/trending/varkala_cliff.jpg", category: "Solo-Friendly", description: "A beautiful coastal town with cliffs adjacent to the Arabian Sea." },
    { name: "Gulmarg", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474978/tripsang/trending/tripsang/trending/snowy_mountains.jpg", category: "Adventure", description: "Premier skiing destination with breathtaking snow-capped peaks." },
    { name: "Goa Party", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474946/tripsang/trending/tripsang/trending/goa_party.jpg", category: "Solo-Friendly", description: "The ultimate beach party destination with a friendly vibe." },
    { name: "Andaman", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474939/tripsang/trending/tripsang/trending/andaman_beach.jpg", category: "Chill Places", description: "Pristine white sand beaches and turquoise blue waters." },
    { name: "Kerala", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474956/tripsang/trending/tripsang/trending/kerala_backwaters.jpg", category: "Chill Places", description: "God's own country with serene backwaters and lush greenery." },
    { name: "Manali", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474963/tripsang/trending/tripsang/trending/manali_trek.jpg", category: "Adventure", description: "A high-altitude resort town for backpacking and trekking." },
    { name: "Vietnam", image: "https://res.cloudinary.com/dacs14pjr/image/upload/v1770474987/tripsang/trending/tripsang/trending/vietnam_street.jpg", category: "Solo-Friendly", description: "Rich history, bustling cities, and incredible street food." },
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
                                loading="lazy"
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
