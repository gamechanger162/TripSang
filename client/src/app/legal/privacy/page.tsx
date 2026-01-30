export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
            <div className="prose dark:prose-invert">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <h2>1. Introduction</h2>
                <p>Welcome to TripSang. We respect your privacy and are committed to protecting your personal data.</p>

                <h2>2. Data We Collect</h2>
                <p>We may collect personal identification information (Name, email address, phone number, etc.) and payment details processed securely by our payment partners.</p>

                <h2>3. How We Use Your Data</h2>
                <p>We use your data to provide and improve our services, process payments, and communicate with you.</p>

                <h2>4. Data Security</h2>
                <p>We implement appropriate security measures to protect your personal information.</p>

                <h2>5. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:support@tripsang.com">support@tripsang.com</a></p>
            </div>
        </div>
    );
}
