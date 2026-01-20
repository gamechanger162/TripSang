import { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tripsang.com'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/auth/',
                    '/dashboard/',
                    '/admin/',
                    '/messages/',
                    '/friends/',
                    '/settings/',
                    '/verify/',
                    '/payment/',
                ],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: [
                    '/api/',
                    '/auth/',
                    '/dashboard/',
                    '/admin/',
                    '/messages/',
                    '/friends/',
                    '/settings/',
                    '/verify/',
                    '/payment/',
                ],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    }
}
