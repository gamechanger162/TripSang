'use client';

import { motion } from 'framer-motion';
import { UserPlus, Search, Users, Plane } from 'lucide-react';

const steps = [
    {
        number: '01',
        icon: UserPlus,
        title: 'Create Your Profile',
        description: 'Sign up, verify your identity, and tell us about your travel style.',
    },
    {
        number: '02',
        icon: Search,
        title: 'Discover Trips',
        description: 'Browse trips that match your vibe — Trek, Chill, Party, or Culture.',
    },
    {
        number: '03',
        icon: Users,
        title: 'Join a Squad',
        description: 'Connect with your travel mates, chat in real-time, and plan together.',
    },
    {
        number: '04',
        icon: Plane,
        title: 'Travel Together',
        description: 'Share costs, create memories, and experience the journey of a lifetime.',
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

export default function HowItWorks() {
    return (
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-teal-500/[0.03] blur-[120px] rounded-full -translate-y-1/2" />

            <div className="max-w-5xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
                        How It Works
                    </h2>
                    <p className="text-zinc-500 text-lg max-w-xl mx-auto">
                        From sign-up to take-off in four simple steps.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.number}
                            variants={itemVariants}
                            className="glass-card p-6 relative group"
                        >
                            {/* Step number with glow */}
                            <div className="text-5xl font-display font-bold text-teal-500/10 absolute top-4 right-4 group-hover:text-teal-500/20 transition-colors">
                                {step.number}
                            </div>

                            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4 group-hover:shadow-glow-teal transition-shadow duration-500">
                                <step.icon className="w-6 h-6 text-teal-400" />
                            </div>

                            <h3 className="font-display text-lg font-semibold text-white mb-2">{step.title}</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed">{step.description}</p>

                            {/* Connecting line for desktop */}
                            {i < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-teal-500/30 to-transparent" />
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
