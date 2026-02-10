'use client';

import { motion } from 'framer-motion';
import { Shield, Award, BadgeCheck } from 'lucide-react';

const partners = [
    { name: 'Adventure Pulse', type: 'Tour Operator', icon: '🏔️' },
    { name: 'WanderStay', type: 'Homestays', icon: '🏡' },
    { name: 'RideShare India', type: 'Transport', icon: '🚗' },
    { name: 'CampWild', type: 'Camping', icon: '⛺' },
    { name: 'DiveDeep', type: 'Water Sports', icon: '🤿' },
    { name: 'SnowPeak', type: 'Winter Sports', icon: '🎿' },
];

export default function VerifiedPartners() {
    return (
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-teal-500/[0.02] blur-[100px] rounded-full" />

            <div className="max-w-6xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 glass-pill text-sm mb-6 text-teal-400">
                        <Shield className="w-4 h-4" />
                        Trusted Partners
                    </div>
                    <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
                        Verified Partners
                    </h2>
                    <p className="text-zinc-500 text-lg max-w-xl mx-auto">
                        Work with vetted and verified travel service providers.
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {partners.map((partner, i) => (
                        <motion.div
                            key={partner.name}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            className="glass-card p-5 flex items-center gap-4 group"
                        >
                            <div className="text-3xl">{partner.icon}</div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="text-white font-semibold text-sm">{partner.name}</h3>
                                    <BadgeCheck className="w-3.5 h-3.5 text-teal-400" />
                                </div>
                                <p className="text-zinc-500 text-xs mt-0.5">{partner.type}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
