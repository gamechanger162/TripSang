import { Search, Smartphone, Users, Wallet, AlertTriangle, Phone } from 'lucide-react';

export default function SafetyTips() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8 text-red-600 text-center">Travel Safety Tips</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg text-center mb-10 text-gray-300">
                    Your safety is our top priority. While exploring the world is exciting, it's important to stay smart and secure. Here are some essential tips for a safe TripSang experience.
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700">
                        <div className="flex items-center gap-3 mb-3">
                            <Search className="w-6 h-6 text-primary-500" />
                            <h3 className="text-xl font-bold text-white">Research Your Destination</h3>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Know the local laws, customs, and emergency numbers before you go. Check travel advisories and stay informed about the specific risks of the area you are visiting.
                        </p>
                    </div>

                    <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700">
                        <div className="flex items-center gap-3 mb-3">
                            <Smartphone className="w-6 h-6 text-green-500" />
                            <h3 className="text-xl font-bold text-white">Verify Your Profile</h3>
                        </div>
                        <p className="text-gray-400 text-sm">
                            We encourage all users to verify their phone numbers and Government IDs. Verified profiles (blue tick) indicate that we have confirmed their identity. Prioritize traveling with verified members.
                        </p>
                    </div>

                    <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700">
                        <div className="flex items-center gap-3 mb-3">
                            <Users className="w-6 h-6 text-blue-500" />
                            <h3 className="text-xl font-bold text-white">Meet in Public First</h3>
                        </div>
                        <p className="text-gray-400 text-sm">
                            When meeting a new travel buddy from TripSang, always arrange the first meeting in a public, well-lit place. Tell a friend or family member where you are going and who you are meeting.
                        </p>
                    </div>

                    <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700">
                        <div className="flex items-center gap-3 mb-3">
                            <Wallet className="w-6 h-6 text-yellow-500" />
                            <h3 className="text-xl font-bold text-white">Money Safety</h3>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Be cautious about sharing financial details. Use our built-in features for trip planning. TripSang will never ask for your password or financial information via chat.
                        </p>
                    </div>

                    <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                            <h3 className="text-xl font-bold text-white">Trust Your Instincts</h3>
                        </div>
                        <p className="text-gray-400 text-sm">
                            If something feels off, it probably is. You have the right to leave any situation that makes you uncomfortable. Don't worry about being "polite"—worry about being safe.
                        </p>
                    </div>

                    <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700">
                        <div className="flex items-center gap-3 mb-3">
                            <Phone className="w-6 h-6 text-red-400" />
                            <h3 className="text-xl font-bold text-white">Emergency Contacts</h3>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Always keep a list of emergency contacts, including local emergency services and your country's embassy, saved on your phone and written down.
                        </p>
                    </div>
                </div>

                <div className="mt-12 bg-red-900/10 p-6 rounded-2xl border border-red-900/30">
                    <h3 className="text-lg font-bold text-red-200 mb-2">Reporting Suspicious Activity</h3>
                    <p className="text-red-300 text-sm">
                        If you encounter a user violating our Community Guidelines or acting suspiciously, please report them immediately via the profile page or contact support@tripsang.com.
                    </p>
                </div>
            </div>
        </div>
    );
}
