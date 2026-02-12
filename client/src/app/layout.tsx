import type { Metadata } from 'next'
import './globals.css'
import ToasterProvider from '@/components/ToasterProvider'
import { Inter, Outfit } from 'next/font/google'
import dynamic from 'next/dynamic'

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
import Header from '@/components/Header';
import SmoothScrolling from '@/components/SmoothScrolling';

/* ── Lazy-load non-critical layout chrome ── */
const FloatingDock = dynamic(() => import('@/components/navigation/FloatingDock'), { ssr: false });
const SiteBanner = dynamic(() => import('@/components/SiteBanner'), { ssr: false });
const InstallPrompt = dynamic(() => import('@/components/InstallPrompt'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });

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
                {/* ── Preconnect: shave 100-300ms off first requests ── */}
                <link rel="preconnect" href="https://tripsang.onrender.com" />
                <link rel="dns-prefetch" href="https://tripsang.onrender.com" />
                <link rel="preconnect" href="https://res.cloudinary.com" />
                <link rel="dns-prefetch" href="https://res.cloudinary.com" />
                <link rel="dns-prefetch" href="https://unpkg.com" />
            </head>
            <body className="bg-dark-950 text-zinc-50 antialiased min-h-screen">
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
                        {/* <Navbar /> */}
                        {/* New Creative Header */}
                        <Header />

                        <SiteBanner />
                        {children}
                        <InstallPrompt />
                        {/* <MobileNav /> */}
                        <FloatingDock />
                        <ToasterProvider />
                        <Footer />
                    </SmoothScrolling>
                </Providers>
            </body>
        </html>
    )
}

