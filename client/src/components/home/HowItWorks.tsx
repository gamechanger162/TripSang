'use client';

export default function HowItWorks() {
    const steps = [
        {
            icon: (
                <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            title: '1. Log In',
            description: 'Sign up and get your 30-day free trial instantly.',
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            icon: (
                <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: '2. Get Verified',
            description: 'Verify with Aadhaar or PAN for trusted travel.',
            gradient: 'from-emerald-500 to-teal-500'
        },
        {
            icon: (
                <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: '3. Explore & Create',
            description: 'Browse trending trips or start your own adventure.',
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            icon: (
                <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            title: '4. Chat & Connect',
            description: 'Meet your squad and travel together safely.',
            gradient: 'from-orange-500 to-red-500'
        }
    ];

    return (
        <section className="py-24 bg-[#0a0a0a] border-b border-white/5 relative overflow-hidden">
            {/* Premium Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-orange-500/3 rounded-full blur-[80px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <span className="premium-badge mb-6">Quick Start</span>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                        How It <span className="text-premium-gold">Works</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-md mx-auto font-light">Start your journey in 4 simple steps</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 relative">
                    {/* Connecting Line with warm glow (Desktop) */}
                    <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-px z-0">
                        <div className="w-full h-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                    </div>

                    {steps.map((step, index) => (
                        <div key={index} className="relative z-10 text-center group">
                            {/* Premium card */}
                            <div className="premium-card p-4 md:p-6 rounded-2xl border border-white/5 transition-all duration-500 group">
                                {/* Icon container */}
                                <div className={`relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6`}>
                                    <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} rounded-full opacity-15 blur-xl group-hover:opacity-30 transition-opacity duration-500`} />
                                    <div className={`relative w-full h-full bg-[#0f0f12] border border-white/10 rounded-full flex items-center justify-center group-hover:scale-105 group-hover:border-amber-500/20 transition-all duration-500`}>
                                        {step.icon}
                                    </div>
                                    {/* Step number badge */}
                                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#0f0f12] border border-amber-500/30 rounded-full flex items-center justify-center text-sm font-bold text-amber-400">
                                        {index + 1}
                                    </div>
                                </div>

                                <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors duration-300">
                                    {step.title.replace(/^\d+\.\s/, '')}
                                </h3>
                                <p className="text-gray-400/70 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300 font-light">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
