export default function TermsAndConditions() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>
            <div className="prose dark:prose-invert">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <h2>1. Agreement to Terms</h2>
                <p>By accessing our website, you agree to be bound by these Terms and Conditions and agree that you are responsible for the agreement with any applicable local laws.</p>

                <h2>2. Use License</h2>
                <p>Permission is granted to temporarily download one copy of the materials on TripSang for personal, non-commercial transitory viewing only.</p>

                <h2>3. User Account</h2>
                <p>To use certain features of the Service, you must register for an account. You agree to provide accurate information and keep it updated.</p>

                <h2>4. Payments</h2>
                <p>All payments are processed securely. Subscriptions automatically renew unless cancelled.</p>

                <h2>5. Contact Authorization</h2>
                <p>By using TripSang, you authorize us to contact you via email or phone regarding your account and trips.</p>

                <h2>6. Contact Us</h2>
                <p>For any questions regarding these terms, please contact us at: <a href="mailto:support@tripsang.com">support@tripsang.com</a></p>
            </div>
        </div>
    );
}
