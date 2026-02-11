'use client';

import { motion } from 'framer-motion';
import { UserPlus, Compass, Users, MapPin, ShieldCheck, CreditCard, MessageCircle, Heart } from 'lucide-react';

const features = [
    {
        icon: UserPlus,
        title: "1. Create Profile",
        desc: "Build your travel identity. Add interests, bio, and verify for trust.",
        color: "text-blue-400"
    },
    {
        icon: Compass,
        title: "2. Explore Trips",
        desc: "Browse curated itineraries or create your own dream journey.",
        color: "text-teal-400"
    },
    {
        icon: Users,
        title: "3. Join a Squad",
        desc: "Connect with like-minded travelers. Chat and plan together.",
        color: "text-orange-400"
    },
    {
        icon: MapPin,
        title: "4. Travel Together",
        desc: "Embark on adventures. Share moments, split costs, belong.",
        color: "text-purple-400"
    },
    // Key Benefits mixed in
    {
        icon: ShieldCheck,
        title: "Verified & Safe",
        desc: "Govt ID verification for every member. Travel with peace of mind.",
        color: "text-emerald-400"
    },
    {
        icon: CreditCard,
        title: "Split Costs Easily",
        desc: "Built-in expense tracker. Settle up seamlessly after the trip.",
        color: "text-yellow-400"
    }
];

export default function WhyTripSang() {
    return (
        <section className="py-20 relative overflow-hidden">
            {/* Background Element */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[300px] bg-gradient-to-r from-teal-500/[0.03] via-purple-500/[0.03] to-orange-500/[0.03] -skew-y-3 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
                    Why TripSang?
                </h2>
                <p className="text-zinc-500">Your roadmap to better travel.</p>
            </div>

            {/* Horizontal Scroll Strip */}
            <div className="overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                <div className="flex gap-4 md:gap-6 w-max px-4 md:px-8">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="w-[280px] md:w-[320px] glass-card p-6 md:p-8 rounded-3xl border border-white/5 relative group"
                        >
                            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${feature.color}`}>
                                <feature.icon size={24} />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-teal-400 transition-colors">
                                {feature.title}
                            </h3>

                            <p className="text-zinc-400 text-sm leading-relaxed">
                                {feature.desc}
                            </p>

                            {/* Hover Gradient Border */}
                            <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-white/10 transition-colors pointer-events-none" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
