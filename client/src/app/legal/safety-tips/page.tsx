export default function SafetyTips() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8 text-red-600 text-center">Travel Safety Tips</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg text-center mb-10 text-gray-600 dark:text-gray-300">
                    Your safety is our top priority. While exploring the world is exciting, it's important to stay smart and secure. Here are some essential tips for a safe TripSang experience.
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">🔍 Research Your Destination</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Know the local laws, customs, and emergency numbers before you go. Check travel advisories and stay informed about the specific risks of the area you are visiting.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">📱 Verify Your Profile</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            We encourage all users to verify their phone numbers. This helps build trust within the community. Look for other travelers who have verified profiles when planning a meetup.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">🤝 Meet in Public First</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            When meeting a new travel buddy from TripSang, always arrange the first meeting in a public, well-lit place. Tell a friend or family member where you are going and who you are meeting.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">💰 Money Safety</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Be cautious about sharing financial details. Use our built-in features for trip planning. TripSang will never ask for your password or financial information via chat.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">🛑 Trust Your Instincts</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            If something feels off, it probably is. You have the right to leave any situation that makes you uncomfortable. Don't worry about being "polite"—worry about being safe.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">🚑 Emergency Contacts</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Always keep a list of emergency contacts, including local emergency services and your country's embassy, saved on your phone and written down.
                        </p>
                    </div>
                </div>

                <div className="mt-12 bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">Reporting Suspicious Activity</h3>
                    <p className="text-red-700 dark:text-red-300 text-sm">
                        If you encounter a user violating our Community Guidelines or acting suspiciously, please report them immediately via the profile page or contact support@tripsang.com.
                    </p>
                </div>
            </div>
        </div>
    );
}
