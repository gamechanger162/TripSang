import Link from 'next/link';
import Image from 'next/image';

export default function AboutUs() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600">
                About TripSang
            </h1>

            <div className="prose dark:prose-invert max-w-none">
                <section className="mb-12 text-center">
                    <p className="text-xl text-gray-300 leading-relaxed">
                        Connecting travelers. Facilitating shared adventures. <br />
                        Discover, create, and join travel plans with like-minded explorers.
                    </p>
                </section>

                <section className="mb-12 grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-100">Our Mission</h2>
                        <p className="mb-4">
                            At TripSang, we aim to redefine how people travel and connect. We believe that the best journeys are the ones shared with others.
                        </p>
                        <p>
                            Whether you're a spontaneous backpacker looking for a buddy or a meticulous planner organizing a group expedition, TripSang is your platform to find your squad and create unforgettable memories.
                        </p>
                    </div>
                    <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-dark-700 group">
                        <Image
                            src="/images/trending/world_travel_map.png"
                            alt="Global Connectivity"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                            <p className="text-white font-medium">Connecting 10,000+ Travelers Worldwide</p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-gray-100 text-center">What We Offer</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-6 bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
                            <div className="text-3xl mb-4">🤝</div>
                            <h3 className="text-lg font-bold mb-2">Travel Matching</h3>
                            <p className="text-sm text-gray-400">
                                Find travel partners who share your interests, budget, and travel style.
                            </p>
                        </div>
                        <div className="p-6 bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
                            <div className="text-3xl mb-4">💬</div>
                            <h3 className="text-lg font-bold mb-2">Community Chat</h3>
                            <p className="text-sm text-gray-400">
                                Connect with your squad before you depart using our built-in real-time chat features.
                            </p>
                        </div>
                        <div className="p-6 bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
                            <div className="text-3xl mb-4">🛡️</div>
                            <h3 className="text-lg font-bold mb-2">Verified Profiles</h3>
                            <p className="text-sm text-gray-400">
                                Travel with confidence knowing our community utilizes phone verification and reputation systems.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="text-center mt-12 py-8 bg-primary-50 dark:bg-primary-900/10 rounded-2xl">
                    <h2 className="text-2xl font-bold mb-4">Ready to start your adventure?</h2>
                    <Link
                        href="/trips/create"
                        className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-full transition-colors"
                    >
                        Create a Trip
                    </Link>
                </section>
            </div>
        </div>
    );
}
