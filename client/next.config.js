const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    disable: process.env.NODE_ENV === "development",
    workboxOptions: {
        disableDevLogs: true,
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
    output: 'standalone',

    // ── Performance: tree-shake barrel exports ──
    experimental: {
        optimizePackageImports: ['lucide-react', 'framer-motion', '@react-three/drei'],
    },

    // ── Remove console.log in production builds ──
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
    },

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'plus.unsplash.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                pathname: '/**',
            },
        ],
        // ── Serve modern formats automatically ──
        formats: ['image/avif', 'image/webp'],
    },

    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    },

    // ── Webpack: split heavy vendors into cacheable chunks ──
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.optimization.splitChunks = {
                ...config.optimization.splitChunks,
                cacheGroups: {
                    ...config.optimization.splitChunks?.cacheGroups,
                    three: {
                        test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
                        name: 'vendor-three',
                        chunks: 'all',
                        priority: 30,
                    },
                    motion: {
                        test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
                        name: 'vendor-motion',
                        chunks: 'all',
                        priority: 25,
                    },
                    firebase: {
                        test: /[\\/]node_modules[\\/]firebase[\\/]/,
                        name: 'vendor-firebase',
                        chunks: 'all',
                        priority: 25,
                    },
                    maps: {
                        test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
                        name: 'vendor-maps',
                        chunks: 'all',
                        priority: 20,
                    },
                },
            };
        }
        return config;
    },
    async redirects() {
        return [
            {
                source: '/create-trip',
                destination: '/trips/create',
                permanent: true,
            },
        ];
    },
}

module.exports = withPWA(nextConfig);
