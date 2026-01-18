'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SignUpPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [verifyingPhone, setVerifyingPhone] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        mobileNumber: '',
        gender: 'prefer-not-to-say',
    });

    useEffect(() => {
        // Cleanup function to reset recaptcha on unmount
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
        if (!formData.mobileNumber) {
            toast.error('Please enter a phone number');
            return;
        }

        // Simple regex to ensure it has +countrycode
        if (!formData.mobileNumber.startsWith('+')) {
            toast.error('Please enter phone number with country code (e.g., +919876543210)');
            return;
        }

        // Initialize recaptcha when user clicks verify
        initializeRecaptcha();

        setVerifyingPhone(true);

        try {
            if (!window.recaptchaVerifier) {
                throw new Error('Recaptcha not initialized');
            }

            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, formData.mobileNumber, appVerifier);
            setConfirmationResult(confirmation);
            setOtpSent(true);
            toast.success('OTP sent to your phone');
        } catch (error: any) {
            console.error('OTP sending error:', error);
            let errorMessage = 'Error sending OTP';

            // Better error messages
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
            await confirmationResult.confirm(otp);
            setIsPhoneVerified(true);
            setOtpSent(false);
            toast.success('Phone verified successfully!');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        // Phone verification temporarily disabled
        /*
        if (formData.mobileNumber && !isPhoneVerified) {
            toast.error('Please verify your phone number first');
            return;
        }
        */

        setLoading(true);

        try {
            // 1. Register User
            const registerResponse = await authAPI.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                mobileNumber: formData.mobileNumber,
                gender: formData.gender,
            });

            if (registerResponse.success) {
                toast.success('Account created! Signing you in...');

                // 2. Auto Login via NextAuth
                const result = await signIn('credentials', {
                    email: formData.email,
                    password: formData.password,
                    redirect: false,
                });

                if (result?.error) {
                    toast.error('Login failed. Please sign in manually.');
                    router.push('/auth/signin');
                } else {
                    router.push('/payment/signup');
                    router.refresh();
                }
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        signIn('google', { callbackUrl: '/' });
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
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-300">
                        Join the community of travelers
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    {/* Google Login */}
                    <button
                        onClick={handleGoogleLogin}
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
                        Sign up with Google
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-transparent text-gray-400">Or register with email</span>
                        </div>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="sr-only">Full Name</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Phone Verification Field - Temporarily disabled due to Firebase billing
                            <div className="flex gap-2">
                                <input
                                    id="mobileNumber"
                                    name="mobileNumber"
                                    type="tel"
                                    required
                                    disabled={isPhoneVerified}
                                    className={`appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm ${isPhoneVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="Mobile (+919876543210)"
                                    value={formData.mobileNumber}
                                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                                />
                                {!isPhoneVerified && (
                                    <button
                                        type="button"
                                        onClick={handleSendOTP}
                                        disabled={verifyingPhone || !formData.mobileNumber}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm whitespace-nowrap disabled:opacity-50"
                                    >
                                        {verifyingPhone ? 'Sending...' : 'Verify'}
                                    </button>
                                )}
                                {isPhoneVerified && (
                                    <span className="flex items-center justify-center px-4 text-green-500 bg-green-500/10 rounded-xl">
                                        ✓
                                    </span>
                                )}
                            </div>

                            <div id="recaptcha-container" className="flex justify-center"></div>

                            {otpSent && !isPhoneVerified && (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-300">Enter the 6-digit OTP sent to your phone:</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter OTP"
                                            maxLength={6}
                                            className="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleVerifyOTP}
                                            disabled={verifyingPhone || otp.length !== 6}
                                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm disabled:opacity-50"
                                        >
                                            {verifyingPhone ? 'Verifying...' : 'Confirm'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            */}

                            <div>
                                <label htmlFor="email-address" className="sr-only">Email address</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                                    placeholder="Email address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                                    placeholder="Confirm Password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>

                            {/* Gender Selection */}
                            <div>
                                <label htmlFor="gender" className="sr-only">Gender</label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="appearance-none relative block w-full px-4 py-3 border border-gray-600 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                                >
                                    <option value="prefer-not-to-say">Prefer not to say</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="transgender">Transgender</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link href="/auth/signin" className="font-medium text-primary-400 hover:text-primary-300">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

// Add global declaration
declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}
