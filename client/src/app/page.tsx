export default function HomePage() {
    return (
        <main style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <h1 style={{ fontSize: '4rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                🌍 TripSang
            </h1>
            <p style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.9 }}>
                Your Travel Social Network
            </p>
            <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '2rem',
                borderRadius: '1rem',
                backdropFilter: 'blur(10px)',
                maxWidth: '600px'
            }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>✅ Setup Complete!</h2>
                <ul style={{ textAlign: 'left', lineHeight: '2' }}>
                    <li>✓ Next.js 14 (App Router)</li>
                    <li>✓ Express + Socket.io Backend</li>
                    <li>✓ MongoDB Integration Ready</li>
                    <li>✓ Firebase + NextAuth v5</li>
                    <li>✓ Razorpay Payments</li>
                </ul>
            </div>
        </main>
    )
}
