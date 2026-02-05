'use client';

export default function HowItWorks() {
    const steps = [
        {
            icon: '👤',
            title: '1. Log In',
            description: 'Create your profile and verify with Aadhaar or PAN for trusted travel.'
        },
        {
            icon: '🎁',
            title: '2. Get Free Trial',
            description: 'Enjoy a 30-day free trial of premium features.'
        },
        {
            icon: '🗺️',
            title: '3. Explore & Create',
            description: 'Browse trending trips or start your own plan.'
        },
        {
            icon: '💬',
            title: '4. Chat & Connect',
            description: 'Meet your squad and travel together.'
        }
    ];

    return (
        <section className="py-20 bg-dark-900 border-b border-white/5 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4">How It Works</h2>
                    <p className="text-gray-400">Start your journey in 4 simple steps</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[60px] left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary-900 via-primary-700 to-primary-900 z-0"></div>

                    {steps.map((step, index) => (
                        <div key={index} className="relative z-10 text-center group">
                            <div className="w-24 h-24 mx-auto bg-dark-800 border-2 border-primary-900 rounded-full flex items-center justify-center mb-6 group-hover:border-primary-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300">
                                <span className="text-3xl">{step.icon}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                            <p className="text-gray-400 text-sm">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
