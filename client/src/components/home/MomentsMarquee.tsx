'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { memoryAPI } from '@/lib/api';

const MarqueeRow = ({ images, direction = 'left', speed = 20 }: { images: string[], direction?: 'left' | 'right', speed?: number }) => {
    // If no images, don't render row
    if (!images || images.length === 0) return null;

    // Duplicate images to ensure seamless loop
    const seamlessImages = [...images, ...images, ...images, ...images].slice(0, 20);

    return (
        <div className="flex overflow-hidden relative w-full">
            <motion.div
                initial={{ x: direction === 'left' ? 0 : '-50%' }}
                animate={{ x: direction === 'left' ? '-50%' : 0 }}
                transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
                className="flex gap-4 min-w-max px-2"
            >
                {seamlessImages.map((src, i) => (
                    <div key={i} className="relative w-[250px] aspect-[4/3] rounded-2xl overflow-hidden glass-card p-0 group">
                        <img
                            src={src}
                            alt="Travel Moment"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export default function MomentsMarquee() {
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMemories = async () => {
            try {
                // Check session storage first
                const cached = sessionStorage.getItem('moments_feed');
                if (cached) {
                    setImages(JSON.parse(cached));
                    setLoading(false);
                    return;
                }

                // Try to fetch real memories
                const response = await memoryAPI.getFeed(1, 20);
                const feed = response.memories || response.feed;
                if (response.success && feed && feed.length > 0) {
                    // Extract image URLs
                    const memoryImages = feed
                        .map((m: any) => m.imageUrl)
                        .filter(Boolean);

                    if (memoryImages.length >= 5) {
                        setImages(memoryImages);
                        sessionStorage.setItem('moments_feed', JSON.stringify(memoryImages));
                        setLoading(false);
                        return;
                    }
                }
            } catch {
                console.warn('Failed to fetch public memories, using fallback');
            }

            // Fallback if API fails or not enough images
            const fallbackImages = [
                'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=600&q=80',
                'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&q=80',
                'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80',
                'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=600&q=80',
                'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80',
                'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&q=80',
                'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80',
                'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=600&q=80',
            ];

            setImages(fallbackImages);
            // CACHE FALLBACK TO PREVENT INFINITE RETRIES ON REMOUNT
            sessionStorage.setItem('moments_feed', JSON.stringify(fallbackImages));
            setLoading(false);
        };

        fetchMemories();
    }, []);

    if (loading) return null;

    // Split images into two rows for variety
    const midpoint = Math.ceil(images.length / 2);
    const row1 = images.slice(0, midpoint);
    const row2 = images.slice(midpoint);

    // If fetch returned few images, use all for both
    const finalRow1 = row1.length < 4 ? images : row1;
    const finalRow2 = row2.length < 4 ? images : row2;

    return (
        <section className="py-20 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
                <h2 className="font-display text-3xl font-bold text-white mb-2">
                    Captured Moments
                </h2>
                <p className="text-zinc-500">Real stories from real travelers.</p>
            </div>

            <div className="flex flex-col gap-6 -skew-y-2 opacity-90 hover:opacity-100 transition-opacity duration-500">
                <MarqueeRow images={finalRow1} direction="left" speed={40} />
                <MarqueeRow images={finalRow2} direction="right" speed={50} />
            </div>

            {/* Gradient Fade Edges */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />
        </section>
    );
}
