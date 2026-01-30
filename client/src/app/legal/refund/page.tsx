export default function RefundPolicy() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8">Cancellation and Refund Policy</h1>
            <div className="prose dark:prose-invert">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <h2>1. Subscription Cancellations</h2>
                <p>You may cancel your subscription at any time. Your subscription will remain active until the end of the current billing cycle. We do not provide refunds for partial subscription periods.</p>

                <h2>2. One-Time Purchases</h2>
                <p>One-time passes (e.g., 30-Day Pass) are non-refundable once activated.</p>

                <h2>3. Trip Cancellations</h2>
                <p>Trip cancellations are subject to the specific policy of the trip organizer or vendor. Please check individual trip details.</p>

                <h2>4. Refunds</h2>
                <p>If you believe you have been charged in error, please contact support immediately. Approved refunds are processed within 5-7 business days.</p>

                <h2>5. Contact Us</h2>
                <p>If you have any questions about our Returns and Refunds Policy, please contact us at: <a href="mailto:support@tripsang.com">support@tripsang.com</a></p>
            </div>
        </div>
    );
}
