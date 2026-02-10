'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, CheckCircle, Sparkles, Phone, ArrowRight } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SignInPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [emailValid, setEmailValid] = useState<boolean | null>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    // Auto-focus first field
    useEffect(() => {
        if (emailRef.current && status === 'unauthenticated') {
            emailRef.current.focus();
        }
    }, [status]);

    // Real-time email validation
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                toast.error('Invalid email or password');
            } else {
                toast.success('Welcome back!');
                router.push('/');
                router.refresh();
            }
        } catch (error) {
            toast.error('Something went wrong');
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
                {/* Mesh gradients */}
                <div className="absolute inset-0">
                    <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-teal-500/[0.08] blur-[120px] rounded-full" />
                    <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-orange-500/[0.06] blur-[100px] rounded-full" />
                </div>

                {/* Grid pattern */}
                <div className="absolute inset-0 bg-grid opacity-20" />

                {/* CSS Mesh Globe */}
                <div className="relative">
                    <div className="mesh-globe" />
                    {/* Orbiting rings */}
                    <div className="absolute inset-[-30px] border border-teal-500/10 rounded-full animate-[meshRotate_25s_linear_infinite]" />
                    <div className="absolute inset-[-60px] border border-white/5 rounded-full animate-[meshRotate_30s_linear_infinite_reverse]" style={{ borderStyle: 'dashed' }} />
                </div>

                {/* Brand text */}
                <div className="absolute bottom-12 left-12 right-12">
                    <p className="text-zinc-600 text-sm">Welcome back to</p>
                    <h2 className="font-display text-3xl font-bold text-white mt-1">Trip<span className="text-teal-400">संग</span></h2>
                    <p className="text-zinc-500 text-sm mt-2">Your journey continues here.</p>
                </div>
            </div>

            {/* Right Side — Glass Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
                {/* Subtle glow */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-teal-500/[0.04] blur-[100px] rounded-full" />

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="glass-card p-8 md:p-10 w-full max-w-md relative z-10"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="lg:hidden mb-4">
                            <Image src="/logo-new.png" alt="Tripसंग" width={160} height={54} className="object-contain mx-auto" />
                        </div>
                        <h1 className="font-display text-2xl font-bold text-white">Sign In</h1>
                        <p className="text-zinc-500 text-sm mt-1">Enter your credentials to continue</p>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-3 mb-6">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl font-medium text-sm transition-all"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        <Link
                            href="/auth/phone-login"
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 btn-glass rounded-xl text-sm"
                        >
                            <Phone className="w-4 h-4" />
                            Continue with Phone
                        </Link>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/[0.06]" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-zinc-950/80 text-zinc-600 uppercase tracking-wider">or with email</span>
                        </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email field */}
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                ref={emailRef}
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="glass-input !pl-10 !pr-10"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={(e) => {
                                    setFormData({ ...formData, email: e.target.value });
                                    validateEmail(e.target.value);
                                }}
                            />
                            {/* Real-time validation checkmark */}
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

                        {/* Password field */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="glass-input !pl-10"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        {/* Magic Link option */}
                        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-white/[0.02] rounded-lg px-3 py-2.5 border border-white/[0.04]">
                            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                            <span>Prefer passwordless? </span>
                            <Link href="/auth/phone-login" className="text-teal-400 hover:text-teal-300 font-medium">
                                Use Magic Link via Phone
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Sign In <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-sm text-zinc-500 mt-6">
                        Don&apos;t have an account?{' '}
                        <Link href="/auth/signup" className="text-teal-400 hover:text-teal-300 font-medium">
                            Sign up
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
