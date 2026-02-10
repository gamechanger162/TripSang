'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SAMPLE_PHOTOS = [
    { src: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&q=80', caption: 'Beach vibes in Goa', height: 'h-64' },
    { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80', caption: 'Mountain trekking', height: 'h-80' },
    { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80', caption: 'Sunset at Udaipur', height: 'h-56' },
    { src: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=400&q=80', caption: 'Camping under stars', height: 'h-72' },
    { src: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=400&q=80', caption: 'City exploration', height: 'h-60' },
    { src: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80', caption: 'Desert safari', height: 'h-80' },
    { src: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&q=80', caption: 'Heritage walks', height: 'h-64' },
    { src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80', caption: 'Lake serenity', height: 'h-56' },
    { src: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&q=80', caption: 'Temple journeys', height: 'h-72' },
];

export default function MomentsShowcase() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Background glow */}
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-orange-500/[0.03] blur-[120px] rounded-full" />

            <div className="max-w-6xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
                        Trip Moments
                    </h2>
                    <p className="text-zinc-500 text-lg max-w-xl mx-auto">
                        Real photos from real travelers. Your next adventure awaits.
                    </p>
                </motion.div>

                {/* Masonry Grid */}
                <div className="masonry-grid">
                    {SAMPLE_PHOTOS.map((photo, index) => (
                        <div
                            key={index}
                            className={`masonry-item transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                                }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="glass-card overflow-hidden group cursor-pointer p-0">
                                <div className={`relative ${photo.height} overflow-hidden`}>
                                    <img
                                        src={photo.src}
                                        alt={photo.caption}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    {/* Glass overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <span className="text-white text-sm font-medium">{photo.caption}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
