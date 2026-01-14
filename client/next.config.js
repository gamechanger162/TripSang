/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Disable static generation for pages with authentication
    output: 'standalone',
    images: {
        domains: [
            'localhost',
            'firebasestorage.googleapis.com',
            'lh3.googleusercontent.com',
            'images.unsplash.com'
        ],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.cloudinary.com'
            }
        ]
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL
    }
}

module.exports = nextConfig
