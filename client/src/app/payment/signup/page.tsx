'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { paymentAPI, clearSessionCache } from '@/lib/api';
import { useRazorpay } from '@/hooks/useRazorpay';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Shield, Star, Zap, Crown, ArrowLeft, Lock, Sparkles, Users, MapPin } from 'lucide-react';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function SignupPaymentPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const isRazorpayLoaded = useRazorpay();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
    const [razorpayKey, setRazorpayKey] = useState<string>('');
    const [skipPayment, setSkipPayment] = useState(false);
    const [hoveredPlan, setHoveredPlan] = useState<'monthly' | 'pass' | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
            return;
        }
        if (status === 'authenticated') {
            checkPaymentRequirement();
        }
    }, [status]);

    const checkPaymentRequirement = async () => {
        try {
            const response = await paymentAPI.createSubscription();
            if (response.skipped) {
                setSkipPayment(true);
                toast.success(response.message || 'No payment required');
                setTimeout(() => router.push('/dashboard'), 1500);
            } else {
                setSubscriptionDetails({
                    id: response.subscriptionId,
                    planId: response.planId,
                    amount: response.amount,
                    currency: response.currency,
                    isTrialEligible: response.isTrialEligible
                });
                setRazorpayKey(response.razorpayKeyId);
            }
        } catch (error: any) {
            console.error('Payment check failed:', error);
            if (!error.message?.includes('already have')) {
                toast.error('Failed to initialize subscription');
            }
        } finally {
            setLoading(false);
        }
    };

    const verifyWithRetry = async (verifyFn: () => Promise<any>, maxRetries = 2): Promise<any> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await verifyFn();
            } catch (err: any) {
                console.error(`Verification attempt ${attempt} failed:`, err?.message || err);
                if (attempt === maxRetries) throw err;
                clearSessionCache();
                await new Promise(r => setTimeout(r, 1500));
            }
        }
    };

    const handleSubscription = async () => {
        if (!isRazorpayLoaded) { toast.error('Razorpay SDK failed to load'); return; }
        setProcessing(true);
        const options = {
            key: razorpayKey,
            subscription_id: subscriptionDetails.id,
            name: 'TripSang',
            description: 'Monthly Premium Membership',
            image: '/logo-new.png',
            handler: async function (response: any) {
                const verifyToast = toast.loading('Verifying payment...');
                try {
                    const verifyResponse = await verifyWithRetry(() =>
                        paymentAPI.verifySubscription({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_signature: response.razorpay_signature,
                        })
                    );
                    if (verifyResponse.success) {
                        toast.success('Premium Activated!', { id: verifyToast });
                        router.push('/dashboard');
                    } else {
                        toast.error('Verification failed. Contact support if charged.', { id: verifyToast });
                    }
                } catch (err: any) {
                    toast.success('Payment received! Redirecting...', { id: verifyToast });
                    setTimeout(() => router.push('/dashboard'), 2000);
                } finally { setProcessing(false); }
            },
            modal: { ondismiss: () => setProcessing(false) },
            prefill: { name: session?.user?.name, email: session?.user?.email, contact: (session?.user as any)?.mobileNumber || '' },
            theme: { color: '#14b8a6' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    const handleOneTimePayment = async () => {
        if (!isRazorpayLoaded) { toast.error('Razorpay SDK failed to load'); return; }
        setProcessing(true);
        try {
            const orderResponse = await paymentAPI.createOrder();
            if (!orderResponse.success) { toast.error(orderResponse.message); setProcessing(false); return; }
            const options = {
                key: orderResponse.razorpayKeyId,
                amount: orderResponse.amount * 100,
                currency: orderResponse.currency,
                name: 'TripSang',
                description: '1 Month Premium Pass',
                image: '/logo-new.png',
                order_id: orderResponse.orderId,
                handler: async function (response: any) {
                    const verifyToast = toast.loading('Verifying payment...');
                    try {
                        const verifyResponse = await verifyWithRetry(() =>
                            paymentAPI.verifyOrder({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                            })
                        );
                        if (verifyResponse.success) {
                            toast.success('30-Day Pass Activated!', { id: verifyToast });
                            router.push('/dashboard');
                        } else {
                            toast.error('Verification failed. Contact support if charged.', { id: verifyToast });
                        }
                    } catch (err: any) {
                        toast.success('Payment received! Redirecting...', { id: verifyToast });
                        setTimeout(() => router.push('/dashboard'), 2000);
                    } finally { setProcessing(false); }
                },
                modal: { ondismiss: () => setProcessing(false) },
                prefill: { name: session?.user?.name, email: session?.user?.email, contact: (session?.user as any)?.mobileNumber || '' },
                theme: { color: '#14b8a6' }
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response: any) => { toast.error(response.error.description || 'Payment Failed'); setProcessing(false); });
            rzp.open();
        } catch (error: any) { console.error(error); toast.error('Failed to create order'); setProcessing(false); }
    };

    // ─── Loading ─────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-2 border-teal-500/20" />
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-400 animate-spin" />
                        <Crown className="absolute inset-0 m-auto w-6 h-6 text-teal-400 animate-pulse" />
                    </div>
                    <p className="text-zinc-500 text-sm font-medium tracking-wide">Loading premium plans...</p>
                </div>
            </div>
        );
    }

    if (skipPayment) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center"><Check className="w-8 h-8 text-teal-400" /></div>
                    <p className="text-white font-medium">Redirecting to dashboard...</p>
                </motion.div>
            </div>
        );
    }

    const features = [
        { icon: Shield, title: 'Verified Community', desc: 'Connect with verified travelers only', color: 'from-emerald-500 to-green-600' },
        { icon: Zap, title: 'Unlimited Trips', desc: 'Create and join as many trips as you want', color: 'from-amber-500 to-yellow-600' },
        { icon: Users, title: 'Squad Chat', desc: 'Real-time group chat with your travel squad', color: 'from-blue-500 to-cyan-600' },
        { icon: MapPin, title: 'Live Route Maps', desc: 'Collaborative route planning with waypoints', color: 'from-rose-500 to-pink-600' },
        { icon: Star, title: 'Premium Badge', desc: 'Stand out with a verified premium profile', color: 'from-purple-500 to-violet-600' },
        { icon: Sparkles, title: 'Early Access', desc: 'Be first to try new features and updates', color: 'from-teal-500 to-cyan-600' },
    ];

    // ─── Main Render ─────────────────────────────────────────
    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-teal-500/30 overflow-hidden relative">
            {/* Ambient background glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-500/[0.04] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/[0.04] rounded-full blur-[120px]" />
            </div>

            {/* Back button */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 pt-8">
                <button onClick={() => router.back()} className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-20">
                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold tracking-wide mb-6">
                        <Crown className="w-3.5 h-3.5" /> PREMIUM MEMBERSHIP
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
                        Unlock the Full
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400">
                            Travel Experience
                        </span>
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                        Join India&apos;s most exclusive travel community. Plan trips, find squads, and explore together.
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-20"
                >
                    {/* Monthly Subscription */}
                    <motion.div
                        onHoverStart={() => setHoveredPlan('monthly')}
                        onHoverEnd={() => setHoveredPlan(null)}
                        className="relative group"
                    >
                        {/* Popular badge */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                            <div className="px-4 py-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-[11px] font-bold tracking-wider text-black shadow-lg shadow-teal-500/30">
                                RECOMMENDED
                            </div>
                        </div>

                        <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-teal-500/50 to-teal-500/10 overflow-hidden">
                            <div className="rounded-2xl bg-zinc-900/90 backdrop-blur-xl p-8 h-full">
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.06] to-transparent rounded-2xl pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                                            <Zap className="w-5 h-5 text-black" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white">Monthly</h3>
                                            <p className="text-xs text-zinc-500">Auto-renews monthly</p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-5xl font-extrabold text-white">₹20</span>
                                            <span className="text-zinc-500 text-sm">/month</span>
                                        </div>
                                        <p className="text-zinc-500 text-sm mt-1">Cancel anytime, no commitments</p>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {['All premium features', 'Priority support', 'Auto-renews for convenience', 'Cancel anytime'].map((feat, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                                                <div className="w-5 h-5 rounded-full bg-teal-500/15 flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3 h-3 text-teal-400" />
                                                </div>
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={handleSubscription}
                                        disabled={processing || !isRazorpayLoaded}
                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-bold text-sm tracking-wide hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'Processing...' : 'Subscribe Monthly'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* One-Time Pass */}
                    <motion.div
                        onHoverStart={() => setHoveredPlan('pass')}
                        onHoverEnd={() => setHoveredPlan(null)}
                        className="relative group"
                    >
                        <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-white/[0.03] overflow-hidden">
                            <div className="rounded-2xl bg-zinc-900/80 backdrop-blur-xl p-8 h-full">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center">
                                            <Star className="w-5 h-5 text-zinc-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white">1-Month Pass</h3>
                                            <p className="text-xs text-zinc-500">One-time purchase</p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-5xl font-extrabold text-white">₹30</span>
                                            <span className="text-zinc-500 text-sm">one-time</span>
                                        </div>
                                        <p className="text-zinc-500 text-sm mt-1">30 days of full access</p>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {['All premium features', 'No auto-renewal', '30 days of access', 'Buy more anytime'].map((feat, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                                                <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3 h-3 text-zinc-500" />
                                                </div>
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={handleOneTimePayment}
                                        disabled={processing || !isRazorpayLoaded}
                                        className="w-full py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-bold text-sm tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'Processing...' : 'Buy 1-Month Pass'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="max-w-3xl mx-auto mb-16"
                >
                    <h2 className="text-center text-sm font-semibold text-zinc-500 tracking-widest uppercase mb-8">Everything Included</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {features.map((feat, i) => (
                            <motion.div
                                key={feat.title}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + i * 0.08 }}
                                className="group rounded-xl bg-white/[0.02] border border-white/[0.05] p-5 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
                            >
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${feat.color} flex items-center justify-center mb-3 shadow-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
                                    <feat.icon className="w-4.5 h-4.5 text-white" />
                                </div>
                                <h4 className="font-semibold text-white text-sm mb-1">{feat.title}</h4>
                                <p className="text-[13px] text-zinc-500 leading-relaxed">{feat.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Trust Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-2 text-zinc-600 text-xs">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Secured by Razorpay • 256-bit SSL encryption • Cancel anytime</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
