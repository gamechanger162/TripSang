import { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tripsang.com'
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static routes
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: siteUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${siteUrl}/search`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${siteUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${siteUrl}/auth/signin`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${siteUrl}/auth/signup`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ]

    // Fetch dynamic trip routes
    let tripRoutes: MetadataRoute.Sitemap = []

    try {
        const response = await fetch(`${apiUrl}/api/trips/search?limit=100&sortBy=recent`, {
            next: { revalidate: 3600 }, // Revalidate every hour
        })

        if (response.ok) {
            const data = await response.json()
            const trips = data.trips || []

            tripRoutes = trips.map((trip: any) => ({
                url: `${siteUrl}/trips/${trip._id}`,
                lastModified: new Date(trip.updatedAt || trip.createdAt),
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            }))
        }
    } catch {
        console.warn('⚠️ Failed to fetch trips for sitemap, using static routes only.');
    }

    return [...staticRoutes, ...tripRoutes];
}
