export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-100">Privacy Policy</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="text-sm text-gray-400 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-100">1. Introduction</h2>
                    <p className="text-gray-300">Welcome to TripSang. Your privacy is critically important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website <strong>tripsang.com</strong>.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-100">2. Information We Collect</h2>
                    <p className="text-gray-300">We may collect information about you in a variety of ways. The information we may collect on the Website includes:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-2 text-gray-300">
                        <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and demographic information that you voluntarily give to us when you register with the Website.</li>
                        <li><strong>Phone Number Verification:</strong> To ensure the safety and authenticity of our community, we may require phone number verification. This number is used for account security and verification purposes only.</li>
                        <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Website, such as your IP address, browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Website.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-100">3. How We Use Your Information</h2>
                    <p className="text-gray-300">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Website to:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-2 text-gray-300">
                        <li>Create and manage your account.</li>
                        <li>Process payments and refunds (processed securely by our third-party payment partners).</li>
                        <li>Email you regarding your account or order.</li>
                        <li>Enable user-to-user communications.</li>
                        <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-100">4. Disclosure of Your Information</h2>
                    <p className="text-gray-300">We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-2 text-gray-300">
                        <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
                        <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-100">5. Security of Your Information</h2>
                    <p className="text-gray-300">We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-100">6. Contact Us</h2>
                    <p className="text-gray-300">If you have questions or comments about this Privacy Policy, please contact us at:</p>
                    <p className="mt-2 font-medium text-gray-300">support@tripsang.com</p>
                </section>
            </div>
        </div>
    );
}
