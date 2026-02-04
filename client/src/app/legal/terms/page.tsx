export default function TermsOfService() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">Terms of Service</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="text-sm text-gray-500 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">1. Agreement to Terms</h2>
                    <p>These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and TripSang ("we", "us", or "our"), concerning your access to and use of the <strong>tripsang.com</strong> website.</p>
                    <p className="mt-2">You agree that by accessing the Website, you have read, understood, and agreed to be bound by all of these Terms of Service. If you do not agree with all of these Terms of Service, then you are expressly prohibited from using the Website and you must discontinue use immediately.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">2. User Representations</h2>
                    <p>By using the Website, you represent and warrant that:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li>All registration information you submit will be true, accurate, current, and complete.</li>
                        <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
                        <li>You have the legal capacity and you agree to comply with these Terms of Service.</li>
                        <li>You are not under the age of 18 (or the age of majority in your jurisdiction).</li>
                        <li>You will not use the Website for any illegal or unauthorized purpose.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">3. User Registration & Security</h2>
                    <p>You may be required to register with the Website. You agree to keep your password confidential and will be responsible for all use of your account and password.</p>
                    <p className="mt-2 text-indigo-600 dark:text-indigo-400 font-medium">Phone Number Verification:</p>
                    <p>To enhance security, we may implement phone number verification for account creation or access to specific features. You agree to provide a valid phone number if requested and authorize us to verify this number via SMS OTP.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">4. Prohibited Activities</h2>
                    <p>You may not access or use the Website for any purpose other than that for which we make the Website available. The Website may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</p>
                    <p className="mt-2">As a user of the Website, you agree not to:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li>Systematically retrieve data or other content from the Website to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
                        <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
                        <li>Circumvent, disable, or otherwise interfere with security-related features of the Website.</li>
                        <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Website.</li>
                        <li>Use any information obtained from the Website in order to harass, abuse, or harm another person.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">5. User Generated Contributions</h2>
                    <p>The Website may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Website, including but not limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">6. Payment & Refund Policy</h2>
                    <p>All payments made on TripSang for premium features or subscriptions are subject to our specific Refund Policy. Please review our Refund Policy page for details on cancellations and refunds.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">7. Contact Us</h2>
                    <p>In order to resolve a complaint regarding the Website or to receive further information regarding use of the Website, please contact us at:</p>
                    <p className="mt-2 font-medium">support@tripsang.com</p>
                </section>
            </div>
        </div>
    );
}
