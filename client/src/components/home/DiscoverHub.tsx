'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UpcomingTrips from './UpcomingTrips';
import CommunitiesShowcase from './CommunitiesShowcase';
import { Calendar, Users } from 'lucide-react';

const tabs = [
    { id: 'upcoming', label: 'Upcoming Trips', icon: Calendar },
    { id: 'communities', label: 'Join a Tribe', icon: Users },
];

export default function DiscoverHub() {
    const [activeTab, setActiveTab] = useState('upcoming');

    return (
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                <div>
                    <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                        Discover & Connect
                    </h2>
                    <p className="text-zinc-500 text-lg max-w-xl">
                        Find your next adventure, join a live trip, or meet your tribe.
                    </p>
                </div>

                {/* Glass Tabs */}
                <div className="glass-strong p-1.5 rounded-xl flex items-center relative gap-1 self-start md:self-auto">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative px-6 py-3 rounded-lg text-sm font-medium transition-colors z-10 flex items-center gap-2
                                    ${isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}
                                `}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-teal-500/20 rounded-lg border border-teal-500/30"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <tab.icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : ''}`} />
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area with smooth crossfade */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'upcoming' && <UpcomingTrips />}
                        {activeTab === 'communities' && <CommunitiesShowcase />}
                    </motion.div>
                </AnimatePresence>
            </div>

        </section>
    );
}
