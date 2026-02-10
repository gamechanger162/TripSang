'use client';

import { motion } from 'framer-motion';
import { Users, Map, Shield, Zap, MessageCircle, CreditCard } from 'lucide-react';

const features = [
    {
        icon: Users,
        title: 'Find Your Squad',
        description: 'Connect with verified travelers who share your vibe and travel style.',
        span: 'md:col-span-2 md:row-span-1', // wide card
        gradient: 'from-teal-500/10 to-teal-600/5',
    },
    {
        icon: Map,
        title: 'Plan Together',
        description: 'Collaborative trip planning with real-time maps and itineraries.',
        span: 'md:col-span-1 md:row-span-2', // tall card
        gradient: 'from-orange-500/10 to-orange-600/5',
    },
    {
        icon: Shield,
        title: 'Verified & Safe',
        description: 'Aadhaar-verified profiles. Travel with confidence every time.',
        span: 'md:col-span-1 md:row-span-1',
        gradient: 'from-emerald-500/10 to-emerald-600/5',
    },
    {
        icon: Zap,
        title: 'Instant Match',
        description: 'Get matched with compatible travelers based on your preferences.',
        span: 'md:col-span-1 md:row-span-1',
        gradient: 'from-purple-500/10 to-purple-600/5',
    },
    {
        icon: MessageCircle,
        title: 'Squad Chat',
        description: 'Real-time group messaging with media sharing and location updates.',
        span: 'md:col-span-1 md:row-span-1',
        gradient: 'from-blue-500/10 to-blue-600/5',
    },
    {
        icon: CreditCard,
        title: 'Split Costs',
        description: 'Transparent cost-sharing with secure in-app payments via Razorpay.',
        span: 'md:col-span-2 md:row-span-1',
        gradient: 'from-teal-500/10 to-orange-500/5',
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
};

export default function FeaturesGrid() {
    return (
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-500/[0.03] blur-[120px] rounded-full" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Section heading */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
                        Everything You Need
                    </h2>
                    <p className="text-zinc-500 text-lg max-w-xl mx-auto">
                        A complete ecosystem for social travel — from discovery to memories.
                    </p>
                </motion.div>

                {/* Desktop: 3D Bento Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="hidden md:grid grid-cols-3 gap-4"
                >
                    {features.map((feature) => (
                        <motion.div
                            key={feature.title}
                            variants={itemVariants}
                            className={`glass-card group cursor-default p-6 ${feature.span} relative overflow-hidden`}
                        >
                            {/* Gradient overlay on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4 group-hover:border-teal-500/30 transition-colors duration-300">
                                    <feature.icon className="w-6 h-6 text-teal-400" />
                                </div>
                                <h3 className="font-display text-xl font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Mobile: Snap-scroll carousel */}
                <div className="md:hidden overflow-x-auto snap-x-mandatory scrollbar-hide -mx-4 px-4">
                    <div className="flex gap-4" style={{ width: 'max-content' }}>
                        {features.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card p-5 w-[280px] snap-start flex-shrink-0"
                            >
                                <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
                                    <feature.icon className="w-5 h-5 text-teal-400" />
                                </div>
                                <h3 className="font-display text-lg font-semibold text-white mb-1.5">{feature.title}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
