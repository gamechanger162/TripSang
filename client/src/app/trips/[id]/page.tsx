import { Metadata } from 'next'
import { TripDetailsClient } from './TripDetailsClient'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tripsang.com'
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Define the Trip interface for metadata
interface TripData {
    _id: string
    title: string
    description?: string
    coverPhoto?: string
    startPoint: { name: string }
    endPoint: { name: string }
    startDate: string
    endDate: string
    tags: string[]
    creator: { name: string }
}

// Fetch trip data for metadata generation
async function getTripData(id: string): Promise<TripData | null> {
    try {
        const response = await fetch(`${apiUrl}/api/trips/${id}`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        })

        if (!response.ok) {
            return null
        }

        const data = await response.json()
        return data.trip || null
    } catch (error) {
        console.error('Error fetching trip for metadata:', error)
        return null
    }
}

// Generate dynamic metadata for each trip
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>
}): Promise<Metadata> {
    const { id } = await params
    const trip = await getTripData(id)

    if (!trip) {
        return {
            title: 'Trip Not Found',
            description: 'The requested trip could not be found.',
        }
    }

    // Create a compelling description
    const tripDescription = trip.description
        ? trip.description.slice(0, 160)
        : `Join ${trip.creator.name} on an adventure from ${trip.startPoint.name} to ${trip.endPoint.name}. ${trip.tags.slice(0, 3).join(', ')}`

    // Format dates for display
    const startDate = new Date(trip.startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
    const endDate = new Date(trip.endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })

    return {
        title: trip.title,
        description: tripDescription,
        keywords: [
            ...trip.tags,
            'travel',
            'trip',
            'adventure',
            trip.startPoint.name,
            trip.endPoint.name,
        ],
        openGraph: {
            type: 'article',
            url: `${siteUrl}/trips/${id}`,
            title: trip.title,
            description: tripDescription,
            siteName: 'Tripसंग',
            images: trip.coverPhoto
                ? [
                    {
                        url: trip.coverPhoto,
                        width: 1200,
                        height: 630,
                        alt: trip.title,
                    },
                ]
                : [`${siteUrl}/og-image.png`],
            publishedTime: trip.startDate,
            authors: [trip.creator.name],
            tags: trip.tags,
        },
        twitter: {
            card: 'summary_large_image',
            title: trip.title,
            description: tripDescription,
            images: trip.coverPhoto ? [trip.coverPhoto] : [`${siteUrl}/og-image.png`],
        },
        alternates: {
            canonical: `${siteUrl}/trips/${id}`,
        },
        other: {
            'trip:dates': `${startDate} - ${endDate}`,
            'trip:route': `${trip.startPoint.name} → ${trip.endPoint.name}`,
        },
    }
}

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'

// Page component that renders the client component
export default function TripPage() {
    return <TripDetailsClient />
}
