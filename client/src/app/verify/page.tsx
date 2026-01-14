'use client';

import { useState, useEffect } from 'react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { ConfirmationResult } from 'firebase/auth';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function VerifyPhonePage() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

    // Initialize reCAPTCHA
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Create invisible reCAPTCHA
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {
                console.log('reCAPTCHA solved');
            },
            'expired-callback': () => {
                toast.error('reCAPTCHA expired. Please try again.');
            },
        });

        setRecaptchaVerifier(verifier);

        return () => {
            verifier.clear();
        };
    }, []);

    // Format phone number with country code
    const formatPhoneNumber = (phone: string): string => {
        // Remove any non-digit characters
        const cleaned = phone.replace(/\D/g, '');

        // Add +91 if not present (Indian numbers)
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

        if (!recaptchaVerifier) {
            toast.error('reCAPTCHA not initialized. Please refresh the page.');
            return;
        }

        setLoading(true);

        try {
            const formattedPhone = formatPhoneNumber(phoneNumber);
            console.log('Sending OTP to:', formattedPhone);

            const confirmation = await signInWithPhoneNumber(
                auth,
                formattedPhone,
                recaptchaVerifier
            );

            setConfirmationResult(confirmation);
            setStep('otp');
            toast.success('OTP sent successfully!');
        } catch (error: any) {
            console.error('Error sending OTP:', error);

            let errorMessage = 'Failed to send OTP. Please try again.';

            if (error.code === 'auth/invalid-phone-number') {
                errorMessage = 'Invalid phone number format';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many requests. Please try again later.';
            }

            toast.error(errorMessage);

            // Reset reCAPTCHA
            recaptchaVerifier?.clear();
            const newVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
            });
            setRecaptchaVerifier(newVerifier);
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
                    verificationCode: otp, // Backend might not use this, but sending anyway
                });

                if (response.success) {
                    toast.success('Phone number verified successfully!');

                    // Redirect to dashboard or home
                    setTimeout(() => {
                        router.push('/dashboard');
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
        toast('Ready to resend OTP', { icon: '📱' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
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
                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Verify Phone Number
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {step === 'phone'
                            ? 'Enter your phone number to receive an OTP'
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
                            disabled={loading}
                            className="btn-primary w-full"
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

                {/* Invisible reCAPTCHA container */}
                <div id="recaptcha-container" />

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
