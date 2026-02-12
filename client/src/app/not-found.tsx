import { Compass, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {/* Animated compass icon */}
                <div className="mx-auto w-24 h-24 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-8 animate-pulse">
                    <Compass className="w-12 h-12 text-teal-400" />
                </div>

                <h1 className="text-7xl font-bold text-white mb-2 tracking-tight">404</h1>
                <h2 className="text-xl font-semibold text-zinc-300 mb-3">Page Not Found</h2>
                <p className="text-zinc-500 mb-8 leading-relaxed">
                    Looks like this trail doesn&apos;t exist. Let&apos;s get you back on track.
                </p>

                <div className="flex gap-3 justify-center">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-semibold transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Home
                    </Link>
                    <Link
                        href="/search"
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium transition-colors"
                    >
                        <Compass className="w-4 h-4" />
                        Explore
                    </Link>
                </div>
            </div>
        </div>
    );
}
