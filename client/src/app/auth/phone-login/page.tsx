'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function PhoneLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const [phoneNumber, setPhoneNumber] = useState('');
    const [verifyingPhone, setVerifyingPhone] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [userName, setUserName] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');

    useEffect(() => {
        // Cleanup recaptcha on unmount
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
                        console.log('reCAPTCHA expired');
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

    const handleSendOTP = async () => {
        if (!phoneNumber) {
            toast.error('Please enter a phone number');
            return;
        }

        if (!phoneNumber.startsWith('+')) {
            toast.error('Please enter phone number with country code (e.g., +919876543210)');
            return;
        }

        setVerifyingPhone(true);

        try {
            // First check if phone exists in database
            const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/phone/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber })
            });

            const checkData = await checkResponse.json();

            // Check if requires signup (new user)
            if (checkData.requiresSignup || !checkData.exists) {
                setIsNewUser(true);
                toast.success('New number! Please provide your email to continue.');
            } else {
                setIsNewUser(false);
            }

            // Store user name for display
            setUserName(checkData.userName);

            // Clear existing recaptcha before reinitializing
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                    window.recaptchaVerifier = null;
                } catch (e) {
                    console.log('Recaptcha cleanup before init:', e);
                }
            }

            // Initialize recaptcha with retry
            initializeRecaptcha();

            // Wait a moment for recaptcha to render
            await new Promise(resolve => setTimeout(resolve, 500));

            if (!window.recaptchaVerifier) {
                toast.error('Please complete the captcha verification');
                setVerifyingPhone(false);
                return;
            }

            // Send OTP via Firebase
            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(confirmation);
            setOtpSent(true);
            toast.success('OTP sent to your phone');

        } catch (error: any) {
            console.error('OTP sending error:', error);
            let errorMessage = 'Error sending OTP';

            if (error.code === 'auth/invalid-phone-number') {
                errorMessage = 'Invalid phone number format';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many requests. Please try again in a few minutes.';
            } else if (error.code === 'auth/captcha-check-failed') {
                errorMessage = 'Captcha verification failed. Please refresh and try again.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your connection.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);

            // Reset recaptcha on error
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                    window.recaptchaVerifier = null;
                } catch (e) {
                    console.log('Recaptcha reset error:', e);
                }
            }
        } finally {
            setVerifyingPhone(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setVerifyingPhone(true);

        try {
            // Verify OTP with Firebase
            await confirmationResult.confirm(otp);

            // Call backend to complete login
            const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/phone/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber,
                    ...(isNewUser && { email, name: name || undefined })
                })
            });

            const loginData = await loginResponse.json();

            if (!loginResponse.ok) {
                // Check if email is required
                if (loginData.requiresEmail) {
                    toast.error('Please provide your email address to continue');
                } else {
                    toast.error(loginData.message || 'Login failed');
                }
                return;
            }

            // Use NextAuth signIn for proper session management
            const result = await signIn('phone-credentials', {
                phoneNumber,
                email: isNewUser ? email : undefined,
                name: isNewUser ? name : undefined,
                redirect: false,
            });

            if (result?.error) {
                toast.error(result.error || 'Login failed');
                return;
            }

            toast.success(loginData.isNewUser ? 'Account created!' : 'Login successful!');

            // Redirect to callback URL or home
            setTimeout(() => {
                router.push(callbackUrl);
                router.refresh();
            }, 500);

        } catch (error: any) {
            console.error('OTP verification error:', error);
            if (error.code === 'auth/invalid-verification-code') {
                toast.error('Invalid OTP. Please check and try again.');
            } else {
                toast.error('Verification failed. Please try again.');
            }
        } finally {
            setVerifyingPhone(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <Image
                    src="/hero-bg.jpg"
                    alt="Background"
                    fill
                    className="object-cover opacity-30"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900" />
            </div>

            <div className="max-w-md w-full space-y-8 relative z-10 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        Login with Phone
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-300">
                        {otpSent ? `Verify OTP sent to ${phoneNumber}` : 'Enter your phone number to continue'}
                    </p>
                    {userName && (
                        <p className="mt-2 text-center text-sm text-primary-400 font-medium">
                            Welcome back, {userName}!
                        </p>
                    )}
                </div>

                <div className="mt-8 space-y-6">
                    {!otpSent ? (
                        <>
                            {/* Phone Number Input */}
                            <div>
                                <label htmlFor="phoneNumber" className="sr-only">Phone Number</label>
                                <div className="flex gap-2">
                                    <input
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        type="tel"
                                        required
                                        className="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                                        placeholder="Phone (+919876543210)"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSendOTP();
                                            }
                                        }}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-400">
                                    Format: +[country code][number] (e.g., +919876543210)
                                </p>
                            </div>

                            {/* reCAPTCHA Container */}
                            <div id="recaptcha-container" className="flex justify-center"></div>

                            {/* Send OTP Button */}
                            <button
                                onClick={handleSendOTP}
                                disabled={verifyingPhone || !phoneNumber}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {verifyingPhone ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        </>
                    ) : (
                        <>
                            {/* OTP Input */}
                            <div className="space-y-2">
                                <p className="text-sm text-gray-300">Enter the 6-digit OTP sent to your phone:</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter OTP"
                                        maxLength={6}
                                        className="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl tracking-widest"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && otp.length === 6) {
                                                handleVerifyOTP();
                                            }
                                        }}
                                        autoFocus
                                    />
                                </div>

                                {/* Email and Name for new users */}
                                {isNewUser && (
                                    <>
                                        <div>
                                            <label htmlFor="email" className="sr-only">Email address</label>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                placeholder="Email address (required)"
                                                className="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="name" className="sr-only">Name</label>
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                placeholder="Your name (optional)"
                                                className="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Verify OTP Button */}
                            <button
                                onClick={handleVerifyOTP}
                                disabled={verifyingPhone || otp.length !== 6 || (isNewUser && !email)}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {verifyingPhone ? 'Verifying...' : 'Verify OTP'}
                            </button>

                            {/* Resend OTP */}
                            <button
                                onClick={() => {
                                    setOtpSent(false);
                                    setOtp('');
                                    setConfirmationResult(null);
                                    // Clear recaptcha
                                    if (window.recaptchaVerifier) {
                                        try {
                                            window.recaptchaVerifier.clear();
                                            window.recaptchaVerifier = null;
                                        } catch (e) {
                                            console.log('Recaptcha clear error:', e);
                                        }
                                    }
                                }}
                                className="w-full text-center text-sm text-gray-400 hover:text-gray-200 transition-colors"
                            >
                                Change Phone Number
                            </button>
                        </>
                    )}

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-transparent text-gray-400">Or</span>
                        </div>
                    </div>

                    {/* Other Login Options */}
                    <div className="space-y-3">
                        <Link
                            href="/auth/signin"
                            className="w-full flex justify-center py-3 px-4 border border-gray-600 text-sm font-medium rounded-xl text-gray-300 hover:bg-gray-800/50 transition-all"
                        >
                            Login with Email/Password
                        </Link>

                        <button
                            onClick={() => signIn('google', { callbackUrl })}
                            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-gray-900 bg-white hover:bg-gray-50 transition-colors shadow-lg"
                        >
                            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Login with Google
                        </button>
                    </div>

                    <p className="text-center text-sm text-gray-400">
                        Don't have an account?{' '}
                        <Link href="/auth/signup" className="font-medium text-primary-400 hover:text-primary-300">
                            Sign up here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

// Wrap with Suspense to fix build error
export default function PhoneLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-white">Loading...</div>
            </div>
        }>
            <PhoneLoginContent />
        </Suspense>
    );
}

// Add global declaration
declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}
