'use client';

import { useState, useEffect } from 'react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ConfirmationResult } from 'firebase/auth';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function VerifyPhonePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    // Check auth
    useEffect(() => {
        if (status === 'unauthenticated') {
            toast.error('Please login first');
            router.push('/auth/signin');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) {
                    console.log('Recaptcha cleanup error:', e);
                }
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    const initializeRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'normal',
                    'callback': (response: any) => {
                        console.log('reCAPTCHA solved');
                    },
                    'expired-callback': () => {
                        toast.error('reCAPTCHA expired. Please try again.');
                    }
                });
                window.recaptchaVerifier.render();
            } catch (error: any) {
                console.error('Recaptcha initialization error:', error);
                toast.error('Failed to initialize verification. Please refresh the page.');
            }
        }
    };

    // Format phone number with country code
    const formatPhoneNumber = (phone: string): string => {
        const cleaned = phone.replace(/\D/g, '');
        if (!cleaned.startsWith('91') && cleaned.length === 10) {
            return '+91' + cleaned;
        }
        if (!cleaned.startsWith('+')) {
            return '+' + cleaned;
        }
        return cleaned;
    };

    // Send OTP
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phoneNumber || phoneNumber.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }

        // Initialize recaptcha when user clicks
        initializeRecaptcha();

        setLoading(true);

        try {
            if (!window.recaptchaVerifier) {
                throw new Error('Recaptcha not initialized');
            }

            const formattedPhone = formatPhoneNumber(phoneNumber);
            console.log('Sending OTP to:', formattedPhone);

            const confirmation = await signInWithPhoneNumber(
                auth,
                formattedPhone,
                window.recaptchaVerifier
            );

            setConfirmationResult(confirmation);
            setStep('otp');
            toast.success('OTP sent successfully!');
        } catch (error: any) {
            console.error('Error sending OTP:', error);

            let errorMessage = 'Failed to send OTP';

            if (error.code === 'auth/invalid-phone-number') {
                errorMessage = 'Invalid phone number format';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many requests. Please try again later.';
            } else if (error.code === 'auth/captcha-check-failed') {
                errorMessage = 'Captcha verification failed. Please try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);

            // Reset reCAPTCHA
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                    window.recaptchaVerifier = null;
                } catch (e) {
                    console.log('Recaptcha reset error:', e);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        if (!confirmationResult) {
            toast.error('No confirmation result. Please resend OTP.');
            return;
        }

        setLoading(true);

        try {
            // Verify OTP with Firebase
            const result = await confirmationResult.confirm(otp);
            console.log('Firebase verification successful:', result.user.uid);

            toast.success('Phone verified with Firebase!');

            // Now save verification status to backend
            try {
                const response = await authAPI.verifyMobile({
                    mobileNumber: formatPhoneNumber(phoneNumber),
                    verificationCode: otp,
                });

                if (response.success) {
                    toast.success('Phone number verified successfully! You now have the Verified badge.');

                    // Redirect to dashboard
                    setTimeout(() => {
                        router.push('/dashboard');
                        router.refresh();
                    }, 1500);
                } else {
                    toast.error(response.message || 'Failed to save verification to backend');
                }
            } catch (backendError: any) {
                console.error('Backend verification error:', backendError);
                toast.error('Firebase verification succeeded, but backend save failed');
            }
        } catch (error: any) {
            console.error('Error verifying OTP:', error);

            let errorMessage = 'Invalid OTP. Please try again.';

            if (error.code === 'auth/invalid-verification-code') {
                errorMessage = 'Invalid OTP code';
            } else if (error.code === 'auth/code-expired') {
                errorMessage = 'OTP expired. Please request a new one.';
            }

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = () => {
        setStep('phone');
        setOtp('');
        setConfirmationResult(null);
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            } catch (e) {
                console.log('Recaptcha clear error:', e);
            }
        }
        toast('Ready to resend OTP', { icon: '📱' });
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4 pt-20">
            <div className="card max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full mb-4">
                        <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Verify Phone Number
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {step === 'phone'
                            ? 'Get a verified badge on your profile'
                            : 'Enter the 6-digit code sent to your phone'}
                    </p>
                </div>

                {step === 'phone' ? (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Phone Number
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="9876543210"
                                className="input-field"
                                disabled={loading}
                                required
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Enter 10-digit mobile number (Indian numbers)
                            </p>
                        </div>

                        {/* Recaptcha Container */}
                        <div id="recaptcha-container" className="flex justify-center"></div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Sending...
                                </span>
                            ) : (
                                'Send OTP'
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Enter OTP
                            </label>
                            <input
                                id="otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                className="input-field text-center text-2xl tracking-widest"
                                disabled={loading}
                                maxLength={6}
                                required
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Sent to {formatPhoneNumber(phoneNumber)}
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="btn-primary w-full disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        <button
                            type="button"
                            onClick={handleResendOTP}
                            className="btn-outline w-full"
                            disabled={loading}
                        >
                            Resend OTP
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Skip for now →
                    </button>
                </div>
            </div>
        </div>
    );
}

declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}
