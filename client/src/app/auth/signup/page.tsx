'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';
import PhoneInput from '@/components/PhoneInput';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, CheckCircle, ArrowRight, Sparkles, Shield } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SignUpPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const nameRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [verifyingPhone, setVerifyingPhone] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [showTrialDialog, setShowTrialDialog] = useState(false);
    const [trialEndsDate, setTrialEndsDate] = useState<string>('');
    const [emailValid, setEmailValid] = useState<boolean | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        mobileNumber: '',
        gender: 'prefer-not-to-say',
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    // Auto-focus first field
    useEffect(() => {
        if (nameRef.current && status === 'unauthenticated') {
            nameRef.current.focus();
        }
    }, [status]);

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

    const validateEmail = (email: string) => {
        if (!email) { setEmailValid(null); return; }
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setEmailValid(re.test(email));
    };

    // Show loading while checking auth
    if (status === 'loading' || status === 'authenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            </div>
        );
    }

    const resetRecaptcha = () => {
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {
                console.log('Recaptcha clear error:', e);
            }
            window.recaptchaVerifier = null;
        }
        const container = document.getElementById('recaptcha-container');
        if (container) {
            container.innerHTML = '';
        }
    };

    const initializeRecaptcha = () => {
        resetRecaptcha();
        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'normal',
                'callback': (response: any) => {
                    console.log('reCAPTCHA solved');
                },
                'expired-callback': () => {
                    console.log('reCAPTCHA expired');
                    toast.error('reCAPTCHA expired. Please try again.');
                    resetRecaptcha();
                }
            });
            window.recaptchaVerifier.render();
        } catch (error: any) {
            console.error('Recaptcha initialization error:', error);
            toast.error('Failed to initialize verification. Please refresh the page.');
        }
    };

    const handleSendOTP = async () => {
        if (!formData.mobileNumber) {
            toast.error('Please enter a phone number');
            return;
        }

        if (!formData.mobileNumber.startsWith('+')) {
            toast.error('Please enter phone number with country code (e.g., +919876543210)');
            return;
        }

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

        if (formData.mobileNumber && !isPhoneVerified) {
            toast.error('Please verify your phone number first');
            return;
        }

        setLoading(true);

        try {
            const registerResponse = await authAPI.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                mobileNumber: formData.mobileNumber,
                gender: formData.gender,
            });

            if (registerResponse.success) {
                const result = await signIn('credentials', {
                    email: formData.email,
                    password: formData.password,
                    redirect: false,
                });

                if (result?.error) {
                    toast.error('Login failed. Please sign in manually.');
                    router.push('/auth/signin');
                } else {
                    if (registerResponse.trialActivated && registerResponse.trialEndsAt) {
                        setTrialEndsDate(new Date(registerResponse.trialEndsAt).toLocaleDateString());
                        setShowTrialDialog(true);
                    } else {
                        toast.success('Account created! Welcome to TripSang!');
                        router.push('/');
                        router.refresh();
                    }
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
        <div className="min-h-screen flex bg-zinc-950">
            {/* Left Side — 3D Mesh Globe */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-[15%] left-[15%] w-[500px] h-[500px] bg-orange-500/[0.06] blur-[120px] rounded-full" />
                    <div className="absolute bottom-[15%] right-[15%] w-[400px] h-[400px] bg-teal-500/[0.08] blur-[100px] rounded-full" />
                </div>

                <div className="absolute inset-0 bg-grid opacity-20" />

                {/* CSS Mesh Globe */}
                <div className="relative">
                    <div className="mesh-globe" />
                    <div className="absolute inset-[-30px] border border-orange-500/10 rounded-full animate-[meshRotate_25s_linear_infinite]" />
                    <div className="absolute inset-[-60px] border border-white/5 rounded-full animate-[meshRotate_30s_linear_infinite_reverse]" style={{ borderStyle: 'dashed' }} />
                </div>

                <div className="absolute bottom-12 left-12 right-12">
                    <p className="text-zinc-600 text-sm">Join the community</p>
                    <h2 className="font-display text-3xl font-bold text-white mt-1">Trip<span className="text-teal-400">संग</span></h2>
                    <p className="text-zinc-500 text-sm mt-2">Find your travel tribe. Adventure together.</p>
                </div>
            </div>

            {/* Right Side — Glass Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative overflow-y-auto">
                <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-teal-500/[0.04] blur-[100px] rounded-full" />

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="glass-card p-8 md:p-10 w-full max-w-md relative z-10"
                >
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="lg:hidden mb-4">
                            <Image src="/logo-new.png" alt="Tripसंग" width={160} height={54} className="object-contain mx-auto" />
                        </div>
                        <h1 className="font-display text-2xl font-bold text-white">Create Account</h1>
                        <p className="text-zinc-500 text-sm mt-1">Join thousands of verified travelers</p>
                    </div>

                    {/* Google Login */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl font-medium text-sm transition-all mb-4"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign up with Google
                    </button>

                    {/* Divider */}
                    <div className="relative mb-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/[0.06]" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-zinc-950/80 text-zinc-600 uppercase tracking-wider">or with email</span>
                        </div>
                    </div>

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        {/* Name */}
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                ref={nameRef}
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="glass-input !pl-10"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {/* Phone Verification */}
                        <div className="flex gap-2">
                            <PhoneInput
                                value={formData.mobileNumber}
                                onChange={(value) => setFormData({ ...formData, mobileNumber: value })}
                                placeholder="Phone number"
                                disabled={isPhoneVerified}
                                id="mobileNumber"
                                name="mobileNumber"
                                required
                            />
                            {!isPhoneVerified && (
                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    disabled={verifyingPhone || !formData.mobileNumber}
                                    className="btn-glass px-4 py-2 text-sm whitespace-nowrap disabled:opacity-50 !rounded-xl"
                                >
                                    {verifyingPhone ? 'Sending...' : 'Verify'}
                                </button>
                            )}
                            {isPhoneVerified && (
                                <span className="flex items-center justify-center px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                </span>
                            )}
                        </div>

                        <div id="recaptcha-container" className="flex justify-center" />

                        {/* OTP Input */}
                        <AnimatePresence>
                            {otpSent && !isPhoneVerified && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 overflow-hidden"
                                >
                                    <p className="text-sm text-zinc-400">Enter the 6-digit OTP sent to your phone:</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter OTP"
                                            maxLength={6}
                                            className="glass-input text-center font-mono tracking-widest"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleVerifyOTP}
                                            disabled={verifyingPhone || otp.length !== 6}
                                            className="btn-primary px-4 py-2 text-sm disabled:opacity-50 !rounded-xl"
                                        >
                                            {verifyingPhone ? 'Verifying...' : 'Confirm'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email */}
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                required
                                className="glass-input !pl-10 !pr-10"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={(e) => {
                                    setFormData({ ...formData, email: e.target.value });
                                    validateEmail(e.target.value);
                                }}
                            />
                            {emailValid === true && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                </motion.div>
                            )}
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="glass-input !pl-10"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        {/* Confirm Password */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                className="glass-input !pl-10"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                </motion.div>
                            )}
                        </div>

                        {/* Gender */}
                        <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className="glass-input"
                        >
                            <option value="prefer-not-to-say">Prefer not to say</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="transgender">Transgender</option>
                        </select>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Create Account <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-zinc-500 mt-5">
                        Already have an account?{' '}
                        <Link href="/auth/signin" className="text-teal-400 hover:text-teal-300 font-medium">
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>

            {/* Trial Welcome Dialog */}
            <AnimatePresence>
                {showTrialDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-strong rounded-3xl p-8 max-w-md mx-4 relative overflow-hidden"
                        >
                            {/* Mesh glow */}
                            <div className="absolute top-0 left-0 w-32 h-32 bg-teal-500/20 blur-[60px] rounded-full" />
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-500/20 blur-[60px] rounded-full" />

                            <div className="relative z-10">
                                <div className="flex justify-center mb-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center animate-glow-pulse">
                                        <CheckCircle className="w-10 h-10 text-white" />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-center text-white mb-2 font-display">
                                    Welcome to TripSang! 🎉
                                </h2>

                                <p className="text-center text-zinc-400 mb-6">
                                    Your account has been created successfully!
                                </p>

                                <div className="glass-card rounded-xl p-4 mb-6 border-emerald-500/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-emerald-400 font-bold">30-Day Free Trial Activated!</p>
                                            <p className="text-zinc-500 text-sm">Enjoy all premium features until {trialEndsDate}</p>
                                        </div>
                                    </div>
                                </div>

                                <ul className="space-y-2.5 mb-6">
                                    {['Unlimited Trip Creation', 'Premium Badge on Profile', 'Access to Exclusive Squads', 'Priority Support'].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2.5 text-zinc-300 text-sm">
                                            <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => {
                                        setShowTrialDialog(false);
                                        router.push('/');
                                        router.refresh();
                                    }}
                                    className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2"
                                >
                                    Start Exploring <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Add global declaration
declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}
