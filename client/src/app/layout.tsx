import type { Metadata } from 'next'
import './globals.css'
import ToasterProvider from '@/components/ToasterProvider'

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

import Providers from '@/components/Providers';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <Providers>
                    {children}
                    <ToasterProvider />
                </Providers>
            </body>
        </html>
    )
}

