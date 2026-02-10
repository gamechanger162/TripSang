import type { Metadata } from 'next'
import './globals.css'
import ToasterProvider from '@/components/ToasterProvider'
import { Inter, Outfit } from 'next/font/google'

const siteUrl = 'https://tripsang.com';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
    display: 'swap',
});

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'Tripसंग - Find Your Travel Partners',
        template: '%s | Tripसंग'
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
        siteName: 'Tripसंग',
        title: 'Tripसंग - Find Your Travel Partners',
        description: 'Connect with travelers, find your travel partners, share costs, and experience the world together.',
        images: [
            {
                url: `${siteUrl}/og-image.png`,
                width: 1200,
                height: 630,
                alt: 'Tripसंग - Find Your Travel Partners',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Tripसंग - Find Your Travel Partners',
        description: 'Connect with travelers, find your travel partners, share costs, and experience the world together.',
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
import MobileNav from '@/components/MobileNav';
import SiteBanner from '@/components/SiteBanner';
import InstallPrompt from '@/components/InstallPrompt';
import Footer from '@/components/Footer';
import SmoothScrolling from '@/components/SmoothScrolling';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
            <head>
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="apple-touch-icon" href="/icon-192.png" />
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#09090b" />
            </head>
            <body className="pt-16 pb-16 md:pb-0 bg-dark-950 text-zinc-50 antialiased">
                {/* JSON-LD Schema for Brand Identity */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@graph": [
                                {
                                    "@type": "Organization",
                                    "name": "Tripसंग",
                                    "url": "https://tripsang.com",
                                    "logo": "https://tripsang.com/logo.png",
                                    "sameAs": [
                                        "https://instagram.com/_tripsang",
                                        "https://twitter.com/tripsang",
                                        "https://facebook.com/tripsang"
                                    ],
                                    "description": "The ultimate social network for travelers. Find your travel partners, share costs, and experience the world together."
                                },
                                {
                                    "@type": "WebSite",
                                    "name": "Tripसंग",
                                    "url": "https://tripsang.com",
                                    "potentialAction": {
                                        "@type": "SearchAction",
                                        "target": "https://tripsang.com/search?q={search_term_string}",
                                        "query-input": "required name=search_term_string"
                                    }
                                }
                            ]
                        })
                    }}
                />
                <Providers>
                    <SmoothScrolling>
                        <Navbar />
                        <SiteBanner />
                        {children}
                        <InstallPrompt />
                        <MobileNav />
                        <ToasterProvider />
                        <Footer />
                    </SmoothScrolling>
                </Providers>
            </body>
        </html>
    )
}
