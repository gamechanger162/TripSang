'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';

interface AuthProvider {
    provider: string;
    providerId: string;
    verified: boolean;
    linkedAt: string;
}

function LinkedAccountsContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [providers, setProviders] = useState<AuthProvider[]>([]);
    const [showLinkPhone, setShowLinkPhone] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<any>(null);

    useEffect(() => {
        loadProviders();

        // Cleanup recaptcha
        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) {
                    console.log('Recaptcha cleanup:', e);
                }
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    const loadProviders = async () => {
        try {
            const data = await authAPI.getLinkedProviders();
            setProviders(data.providers || []);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load providers');
        } finally {
            setLoading(false);
        }
    };

    const initializeRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'normal',
                    callback: () => console.log('reCAPTCHA solved'),
                    'expired-callback': () => toast.error('reCAPTCHA expired')
                });
                window.recaptchaVerifier.render();
            } catch (error) {
                console.error('Recaptcha error:', error);
                toast.error('Failed to initialize verification');
            }
        }
    };

    const handleSendOTP = async () => {
        if (!phoneNumber.startsWith('+')) {
            toast.error('Please include country code (e.g., +919876543210)');
            return;
        }

        setVerifying(true);

        try {
            initializeRecaptcha();

            if (!window.recaptchaVerifier) {
                throw new Error('Recaptcha not initialized');
            }

            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(confirmation);
            setOtpSent(true);
            toast.success('OTP sent to your phone');
        } catch (error: any) {
            console.error('OTP error:', error);
            toast.error(error.message || 'Failed to send OTP');

            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                    window.recaptchaVerifier = null;
                } catch (e) {
                    console.log('Recaptcha reset error:', e);
                }
            }
        } finally {
            setVerifying(false);
        }
    };

    const handleVerifyAndLink = async () => {
        if (otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setVerifying(true);

        try {
            // Verify OTP with Firebase
            await confirmationResult.confirm(otp);

            // Call backend to link phone
            await authAPI.linkPhone(phoneNumber);

            toast.success('Phone number linked successfully!');
            setShowLinkPhone(false);
            setPhoneNumber('');
            setOtp('');
            setOtpSent(false);

            // Reload providers
            loadProviders();
        } catch (error: any) {
            console.error('Verification error:', error);
            if (error.code === 'auth/invalid-verification-code') {
                toast.error('Invalid OTP. Please try again.');
            } else if (error.message?.includes('already linked')) {
                toast.error('This phone number is already linked to another account');
            } else {
                toast.error(error.message || 'Failed to link phone number');
            }
        } finally {
            setVerifying(false);
        }
    };

    const handleUnlink = async (provider: string, providerId: string) => {
        if (providers.length <= 1) {
            toast.error('Cannot unlink your only login method');
            return;
        }

        if (!confirm(`Are you sure you want to unlink ${provider}?`)) {
            return;
        }

        try {
            await authAPI.unlinkProvider(provider, providerId);
            toast.success(`${provider} unlinked successfully`);
            loadProviders();
        } catch (error: any) {
            toast.error(error.message || 'Failed to unlink provider');
        }
    };

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'email':
                return '✉️';
            case 'google':
                return '🔵';
            case 'phone':
                return '📱';
            default:
                return '🔗';
        }
    };

    const formatProviderId = (provider: string, providerId: string) => {
        if (provider === 'phone') {
            return providerId;
        }
        return providerId;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
                    >
                        ← Back
                    </button>
                    <h1 className="text-3xl font-bold text-white">Linked Accounts</h1>
                    <p className="mt-2 text-gray-400">
                        Manage how you sign in to TripSang
                    </p>
                </div>

                {/* Current Providers */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Connected Accounts</h2>

                    <div className="space-y-4">
                        {providers.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">No connected accounts found</p>
                        ) : (
                            providers.map((p, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{getProviderIcon(p.provider)}</span>
                                        <div>
                                            <p className="text-white font-medium capitalize">{p.provider}</p>
                                            <p className="text-sm text-gray-400">
                                                {formatProviderId(p.provider, p.providerId)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Linked {new Date(p.linkedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {providers.length > 1 && (
                                        <button
                                            onClick={() => handleUnlink(p.provider, p.providerId)}
                                            className="text-red-400 hover:text-red-300 text-sm"
                                        >
                                            Unlink
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Add New Provider */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Add Login Method</h2>

                    {!showLinkPhone ? (
                        <div className="space-y-3">
                            {!providers.some(p => p.provider === 'phone') && (
                                <button
                                    onClick={() => setShowLinkPhone(true)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">📱</span>
                                        <span className="text-white">Link Phone Number</span>
                                    </div>
                                    <span className="text-gray-400">→</span>
                                </button>
                            )}

                            {providers.some(p => p.provider === 'phone') && (
                                <p className="text-gray-400 text-center py-4">
                                    All available login methods are already linked!
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {!otpSent ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="+919876543210"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        <p className="mt-1 text-xs text-gray-400">
                                            Include country code (e.g., +91 for India)
                                        </p>
                                    </div>

                                    <div id="recaptcha-container"></div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSendOTP}
                                            disabled={verifying || !phoneNumber}
                                            className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:opacity-50"
                                        >
                                            {verifying ? 'Sending...' : 'Send OTP'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowLinkPhone(false);
                                                setPhoneNumber('');
                                            }}
                                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Enter 6-digit OTP
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="000000"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl tracking-widest"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleVerifyAndLink}
                                            disabled={verifying || otp.length !== 6}
                                            className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:opacity-50"
                                        >
                                            {verifying ? 'Verifying...' : 'Verify & Link'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setOtpSent(false);
                                                setOtp('');
                                            }}
                                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl"
                                        >
                                            Back
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function LinkedAccountsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
            <LinkedAccountsContent />
        </Suspense>
    );
}

declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}
