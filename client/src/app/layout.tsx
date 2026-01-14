import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'TripSang - Travel Social Network',
    description: 'Connect with travelers, share experiences, and discover amazing destinations',
    keywords: ['travel', 'social network', 'trips', 'tourism', 'adventure'],
    authors: [{ name: 'TripSang Team' }],
    openGraph: {
        title: 'TripSang - Travel Social Network',
        description: 'Connect with travelers, share experiences, and discover amazing destinations',
        type: 'website'
    }
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    )
}
