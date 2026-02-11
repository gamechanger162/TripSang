'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, Mountain, Tent, Bike, Camera, Palmtree } from 'lucide-react';

const communities = [
    {
        name: 'Trekkers United',
        icon: Mountain,
        members: '12.5K',
        gradient: 'from-emerald-500 to-teal-600',
        tags: ['Mountain', 'Trekking']
    },
    {
        name: 'Beach Lovers',
        icon: Palmtree,
        members: '8.2K',
        gradient: 'from-blue-400 to-cyan-500',
        tags: ['Beach', 'Chill']
    },
    {
        name: 'Riders Club',
        icon: Bike,
        members: '5.1K',
        gradient: 'from-orange-500 to-red-600',
        tags: ['Bike Trip', 'Road Trip']
    },
    {
        name: 'Camping Squad',
        icon: Tent,
        members: '9.3K',
        gradient: 'from-green-600 to-emerald-700',
        tags: ['Camping', 'Nature']
    },
    {
        name: 'Shutterbugs',
        icon: Camera,
        members: '4.7K',
        gradient: 'from-purple-500 to-pink-600',
        tags: ['Photography', 'Culture']
    },
    {
        name: 'Solo Travelers',
        icon: Users,
        members: '15K+',
        gradient: 'from-indigo-500 to-violet-600',
        tags: ['Backpacking', 'Solo']
    }
];

export default function CommunitiesShowcase() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {communities.map((community, i) => (
                <motion.div
                    key={community.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="relative group"
                >
                    <Link href={`/search?tags=${community.tags.join(',')}`}>
                        <div className={`h-32 rounded-2xl bg-gradient-to-br ${community.gradient} p-4 flex flex-col justify-between overflow-hidden relative`}>
                            {/* Overlay pattern */}
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-20 transition-opacity" />

                            {/* Icon */}
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                                <community.icon size={16} />
                            </div>

                            {/* Text */}
                            <div>
                                <h3 className="text-white font-bold text-sm leading-tight mb-0.5">{community.name}</h3>
                                <p className="text-white/80 text-[10px] font-medium">{community.members} members</p>
                            </div>

                            {/* Decorative huge icon */}
                            <community.icon className="absolute -bottom-4 -right-4 w-20 h-20 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                    </Link>
                </motion.div>
            ))}
        </div>
    );
}
