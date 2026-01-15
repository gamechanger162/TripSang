'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    // Check if we are on the homepage
    const isHomePage = pathname === '/';

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Determine nav classes based on route and scroll
    const navBackground = scrolled || !isHomePage
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-100 dark:border-gray-800'
        : 'bg-transparent';

    const linkColor = scrolled || !isHomePage
        ? 'text-gray-700 dark:text-gray-200 hover:text-primary-600'
        : 'text-gray-200 hover:text-white';

    const logoClass = scrolled || !isHomePage
        ? 'text-transparent bg-gradient-to-r from-primary-600 to-indigo-600'
        : 'text-white';

    const menuIconColor = scrolled || !isHomePage ? 'text-gray-700 dark:text-gray-200' : 'text-white';

    const navLinks = [
        { name: 'Explore', href: '/search' },
        { name: 'Create Trip', href: '/trips/create' },
    ];

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${navBackground}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <span className={`text-2xl font-bold bg-clip-text ${logoClass}`}>
                                TripSang
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`text-sm font-medium transition-colors ${linkColor}`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {status === 'authenticated' ? (
                            <div className="relative ml-4">
                                <button
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="flex items-center gap-2 focus:outline-none"
                                >
                                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden ring-2 ring-primary-500">
                                        {session.user?.image ? (
                                            <Image
                                                src={session.user.image}
                                                alt="Profile"
                                                width={32}
                                                height={32}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span className="text-primary-700 font-bold">
                                                {session.user?.name?.[0] || 'U'}
                                            </span>
                                        )}
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 border border-gray-100 dark:border-gray-700">
                                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                                            <p className="text-xs text-gray-500">Signed in as</p>
                                            <p className="text-sm font-medium truncate">{session.user?.name}</p>
                                        </div>

                                        <Link
                                            href={session.user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            onClick={() => setProfileMenuOpen(false)}
                                        >
                                            Dashboard
                                        </Link>

                                        <button
                                            onClick={() => signOut()}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/auth/signin"
                                    className={`text-sm font-medium ${linkColor}`}
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-full shadow-lg transition-transform hover:scale-105"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className={`p-2 rounded-md ${menuIconColor}`}
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-gray-900 shadow-xl border-t border-gray-200 dark:border-gray-800">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        {status === 'authenticated' ? (
                            <>
                                <Link
                                    href={session.user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                                >
                                    Sign out
                                </button>
                            </>
                        ) : (
                            <div className="mt-4 space-y-2 px-3">
                                <Link
                                    href="/auth/signin"
                                    className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="block w-full text-center px-4 py-2 border border-transparent rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
