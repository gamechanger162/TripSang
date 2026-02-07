'use client';

export default function HowItWorks() {
    const steps = [
        {
            icon: '👤',
            title: '1. Log In',
            description: 'Sign up and get your 30-day free trial instantly.',
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            icon: '🛡️',
            title: '2. Get Verified',
            description: 'Verify with Aadhaar or PAN for trusted travel.',
            gradient: 'from-emerald-500 to-teal-500'
        },
        {
            icon: '🗺️',
            title: '3. Explore & Create',
            description: 'Browse trending trips or start your own adventure.',
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            icon: '💬',
            title: '4. Chat & Connect',
            description: 'Meet your squad and travel together safely.',
            gradient: 'from-orange-500 to-red-500'
        }
    ];

    return (
        <section className="py-24 bg-gradient-to-b from-dark-900 via-dark-950 to-black border-b border-white/5 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-primary-600/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[80px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600/10 border border-primary-500/20 mb-6">
                        <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                        <span className="text-sm font-semibold text-primary-400">Quick Start Guide</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                        How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">Works</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-md mx-auto">Start your journey in 4 simple steps</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-1 bg-gradient-to-r from-primary-900/0 via-primary-600/50 to-primary-900/0 z-0 rounded-full" />

                    {steps.map((step, index) => (
                        <div key={index} className="relative z-10 text-center group">
                            {/* Card with glassmorphism */}
                            <div className="p-4 md:p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary-500/30 transition-all duration-500 hover:bg-white/10 hover:transform hover:-translate-y-2">
                                {/* Icon container with gradient border */}
                                <div className={`relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6`}>
                                    <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} rounded-full opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500`} />
                                    <div className={`relative w-full h-full bg-dark-800/80 border-2 border-transparent bg-clip-padding rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-500`}
                                        style={{
                                            backgroundImage: `linear-gradient(rgb(17 17 27), rgb(17 17 27)), linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                                            backgroundOrigin: 'border-box',
                                            backgroundClip: 'padding-box, border-box',
                                            '--tw-gradient-from': step.gradient.includes('blue') ? '#3b82f6' : step.gradient.includes('emerald') ? '#10b981' : step.gradient.includes('purple') ? '#a855f7' : '#f97316',
                                            '--tw-gradient-to': step.gradient.includes('cyan') ? '#06b6d4' : step.gradient.includes('teal') ? '#14b8a6' : step.gradient.includes('pink') ? '#ec4899' : '#ef4444'
                                        } as React.CSSProperties}
                                    >
                                        <span className="text-3xl md:text-4xl transform group-hover:scale-110 transition-transform duration-300">{step.icon}</span>
                                    </div>
                                    {/* Step number badge */}
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-dark-900 border border-white/20 rounded-full flex items-center justify-center text-xs font-bold text-primary-400">
                                        {index + 1}
                                    </div>
                                </div>

                                <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-primary-300 transition-colors duration-300">
                                    {step.title.replace(/^\d+\.\s/, '')}
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
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
