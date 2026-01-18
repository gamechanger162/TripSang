'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    const getErrorMessage = () => {
        switch (error) {
            case 'AccessDenied':
                return {
                    title: 'Access Denied',
                    message: 'You cancelled the sign-in, or the OAuth provider denied access.',
                    suggestion: 'Please try signing in again.'
                };
            case 'Configuration':
                return {
                    title: 'Configuration Error',
                    message: 'There is a problem with the server configuration.',
                    suggestion: 'Please contact support.'
                };
            case 'Verification':
                return {
                    title: 'Verification Error',
                    message: 'The verification token has expired or has already been used.',
                    suggestion: 'Please request a new verification link.'
                };
            default:
                return {
                    title: 'Authentication Error',
                    message: 'An error occurred during authentication.',
                    suggestion: 'Please try again or contact support if the problem persists.'
                };
        }
    };

    const errorInfo = getErrorMessage();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <div className="text-center">
                    {/* Error Icon */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                        <svg
                            className="h-10 w-10 text-red-600 dark:text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>

                    {/* Error Title */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {errorInfo.title}
                    </h2>

                    {/* Error Message */}
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {errorInfo.message}
                    </p>

                    {/* Suggestion */}
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                        {errorInfo.suggestion}
                    </p>

                    {/* Error Code */}
                    {error && (
                        <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Error Code: <code className="font-mono font-semibold">{error}</code>
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Link
                            href="/auth/signin"
                            className="block w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
                        >
                            Try Again
                        </Link>
                        <Link
                            href="/"
                            className="block w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                        >
                            Go to Homepage
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    );
}
