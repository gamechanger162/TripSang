import type { Metadata } from 'next'
import './globals.css'
import ToasterProvider from '@/components/ToasterProvider'

const siteUrl = 'https://tripsang.com';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'TripSang - Find Your Travel Squad',
        template: '%s | TripSang'
    },
    description: 'Connect with travelers, find your squad, share costs, and experience the world together. The ultimate social network for adventure seekers.',
    keywords: ['travel', 'travel buddies', 'trip planning', 'adventure travel', 'group travel', 'travel social network', 'backpacking', 'tourism', 'travel squad', 'cost sharing'],
    authors: [{ name: 'TripSang', url: siteUrl }],
    creator: 'TripSang',
    publisher: 'TripSang',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: siteUrl,
        siteName: 'TripSang',
        title: 'TripSang - Find Your Travel Squad',
        description: 'Connect with travelers, find your squad, share costs, and experience the world together.',
        images: [
            {
                url: `${siteUrl}/og-image.png`,
                width: 1200,
                height: 630,
                alt: 'TripSang - Find Your Travel Squad',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'TripSang - Find Your Travel Squad',
        description: 'Connect with travelers, find your squad, share costs, and experience the world together.',
        images: [`${siteUrl}/og-image.png`],
        creator: '@tripsang',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: 'xcKxOdYJrFKngRFftz4MU98ttzcJlKt-ZCbuZhRZ34g',
    },
    alternates: {
        canonical: siteUrl,
    },
}

import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import SiteBanner from '@/components/SiteBanner';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <link rel="manifest" href="/manifest.json" />
            </head>
            <body className="pt-16">
                <Providers>
                    <Navbar />
                    <SiteBanner />
                    {children}
                    <ToasterProvider />
                </Providers>
            </body>
        </html>
    )
}

