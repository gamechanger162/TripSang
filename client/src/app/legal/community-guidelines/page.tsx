import { Smile, ShieldCheck, Shield, Map, Sparkles } from 'lucide-react';

export default function CommunityGuidelines() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8 text-primary-500 text-center">Community Guidelines</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg text-center mb-10 text-gray-300">
                    We want TripSang to be a positive, safe, and inclusive space for travelers from all walks of life. To keep the vibes good, we ask everyone to follow these simple guidelines.
                </p>

                <div className="space-y-12">
                    <section className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center text-purple-400">
                            <Smile className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-2 text-white">Be Cool & Inclusive</h2>
                            <p className="text-gray-300">
                                Kindness is key. We are a global community of diverse backgrounds. Respect differences, be friendly, and keep the environment welcoming. We have zero tolerance for bullying, harassment, hate speech, or toxic behavior.
                            </p>
                        </div>
                    </section>

                    <section className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center text-blue-400">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-2 text-white">Keep It 100 (Authenticity)</h2>
                            <p className="text-gray-300">
                                Be your authentic self. Don't catfish, impersonate others, or pretend to be someone you're not. Share honest travel plans, real stories, and genuine intentions. Trust is the foundation of a good travel squad.
                            </p>
                        </div>
                    </section>

                    <section className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center text-green-400">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-2 text-white">Safety First, Always</h2>
                            <p className="text-gray-300">
                                Respect personal boundaries. Keep your personal information safe and never pressure others to share theirs. If you see something suspicious or someone making you uncomfortable, report it immediately.
                            </p>
                        </div>
                    </section>

                    <section className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-500">
                            <Map className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-2 text-white">You're the Boss of Your Travels</h2>
                            <p className="text-gray-300">
                                Do your research. Trust your instincts. While we facilitate connections, every trip involves some risk. Be smart, plan ahead, and take responsibility for your own safety and decisions.
                            </p>
                        </div>
                    </section>

                    <section className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-pink-900/30 rounded-full flex items-center justify-center text-pink-400">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-2 text-white">Spread Good Vibes</h2>
                            <p className="text-gray-300">
                                Share helpful tips, uplift other travelers, and post fun experiences. Let's make TripSang the most inspiring place to plan your next adventure!
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
