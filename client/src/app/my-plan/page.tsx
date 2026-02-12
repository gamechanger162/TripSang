'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { userAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
    Shield, Calendar, CreditCard, RotateCw, Crown, Sparkles,
    Zap, Users, HeadphonesIcon, CheckCircle2, ArrowRight, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Animation variants ─── */
const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function MyPlanPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<any>(null);

    // Debug: log session status
    useEffect(() => {
        console.log('[MyPlan] Session status:', status, 'Session:', session?.user?.email);
    }, [status, session]);

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/auth/signin'); return; }
        if (status === 'authenticated') fetchSubscription();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    // Safety timeout: never stay stuck on loading for more than 5s
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.warn('[MyPlan] Loading timeout reached, forcing render');
                setLoading(false);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [loading]);

    const fetchSubscription = async () => {
        try {
            const response = await userAPI.getProfile(true);
            console.log('[MyPlan] Profile response:', response);
            if (response.success && response.user) {
                setSubscription(response.user.subscription || { status: 'none' });
            } else {
                setSubscription({ status: 'none' });
            }
        } catch (error) {
            console.error('[MyPlan] Error fetching profile:', error);
            toast.error('Failed to load subscription details');
            setSubscription({ status: 'none' });
        } finally {
            setLoading(false);
        }
    };

    /* ─── Loading state (shows spinner but max 5 seconds) ─── */
    if (loading && status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <motion.div
                    className="w-12 h-12 rounded-xl border-2 border-teal-400 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
            </div>
        );
    }

    const inTrialPeriod = subscription?.status === 'trial' && subscription?.trialEnds && new Date(subscription.trialEnds) > new Date();

    const getDaysRemaining = () => {
        if (!subscription?.currentEnd) return 0;
        const end = new Date(subscription.currentEnd);
        const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    };
    const daysRemaining = getDaysRemaining();
    const totalDays = 30;

    const benefits = [
        { icon: Zap, title: 'Unlimited Trip Creation', desc: 'Create as many trips as you want', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
        { icon: Shield, title: 'Verified Premium Badge', desc: 'Stand out with an exclusive badge', color: '#14B8A6', bg: 'rgba(20,184,166,0.1)' },
        { icon: Users, title: 'Exclusive Squads', desc: 'Join premium-only travel groups', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
        { icon: HeadphonesIcon, title: 'Priority Support', desc: 'Faster responses from our team', color: '#F472B6', bg: 'rgba(244,114,182,0.1)' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 pt-20 pb-28">
            <motion.div
                className="max-w-2xl mx-auto space-y-5"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {/* ═══════ Header ═══════ */}
                <motion.div variants={fadeUp} className="text-center space-y-3">
                    <motion.div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
                        style={{
                            background: 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(139,92,246,0.15))',
                            border: '1px solid rgba(20,184,166,0.2)',
                            color: '#5EEAD4',
                        }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <Crown className="w-4 h-4" />
                        Premium Member
                    </motion.div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                        My Subscription
                    </h1>
                    <p className="text-zinc-400 text-sm">Manage your TripSang Premium membership</p>
                </motion.div>

                {/* ═══════ Main Status Card ═══════ */}
                <motion.div
                    variants={fadeUp}
                    className="relative overflow-hidden rounded-[20px]"
                    style={{
                        background: 'linear-gradient(145deg, rgba(22,18,30,0.75), rgba(12,10,18,0.85))',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                >
                    {/* Gradient orbs */}
                    <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.15), transparent 70%)' }} />
                    <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)' }} />

                    {/* Top row: plan name + status */}
                    <div className="relative p-5 pb-4 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, #14B8A6, #8B5CF6)',
                                        boxShadow: '0 4px 20px rgba(20,184,166,0.25)',
                                    }}
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Shield className="w-6 h-6 text-white" />
                                </motion.div>
                                <div>
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        TripSang Premium
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${inTrialPeriod
                                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                            }`}>
                                            {inTrialPeriod ? 'Trial' : 'Active'}
                                        </span>
                                    </h2>
                                    <p className="text-zinc-500 text-xs mt-0.5">
                                        {subscription?.subscriptionId ? 'Monthly Subscription' : inTrialPeriod ? '30-Day Free Trial' : 'Premium Pass'}
                                    </p>
                                </div>
                            </div>
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Sparkles className="w-6 h-6 text-teal-400/40" />
                            </motion.div>
                        </div>
                    </div>

                    {/* ── Time remaining ── */}
                    <div className="relative p-5 space-y-4">
                        <div className="flex items-center gap-5">
                            {/* Circular progress */}
                            <div className="relative w-20 h-20 shrink-0">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                                    <motion.circle
                                        cx="40" cy="40" r="34" fill="none"
                                        stroke="url(#progressGrad)"
                                        strokeWidth="5" strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 34}`}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - (daysRemaining / totalDays)) }}
                                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                                    />
                                    <defs>
                                        <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#14B8A6" />
                                            <stop offset="100%" stopColor="#8B5CF6" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-bold text-white">{daysRemaining}</span>
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-wide">days</span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-1.5">
                                <p className="text-sm font-medium text-white/80">Time Remaining</p>
                                <p className="text-xs text-zinc-500">
                                    {subscription?.currentEnd
                                        ? `Expires ${new Date(subscription.currentEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                                        : 'N/A'}
                                </p>
                                {/* Linear progress */}
                                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: 'linear-gradient(90deg, #14B8A6, #8B5CF6)' }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.round((daysRemaining / totalDays) * 100)}%` }}
                                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <motion.div
                                className="rounded-2xl p-3.5"
                                style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.05)' }}
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-7 h-7 rounded-lg bg-teal-500/15 flex items-center justify-center">
                                        <CreditCard size={14} className="text-teal-400" />
                                    </div>
                                    <span className="text-[11px] text-zinc-500 font-medium">Billing</span>
                                </div>
                                <p className="text-base font-bold text-white">
                                    {inTrialPeriod ? 'Free' : subscription?.subscriptionId ? '₹20/mo' : 'One-time'}
                                </p>
                                <p className="text-[10px] text-zinc-600 mt-0.5">
                                    {inTrialPeriod ? 'No payment required' : subscription?.subscriptionId ? 'Auto-renews' : 'Non-recurring'}
                                </p>
                            </motion.div>

                            <motion.div
                                className="rounded-2xl p-3.5"
                                style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.05)' }}
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
                                        <RotateCw size={14} className="text-violet-400" />
                                    </div>
                                    <span className="text-[11px] text-zinc-500 font-medium">Next Renewal</span>
                                </div>
                                <p className="text-base font-bold text-white">
                                    {subscription?.currentEnd
                                        ? new Date(subscription.currentEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                        : 'N/A'}
                                </p>
                                <p className="text-[10px] text-zinc-600 mt-0.5">
                                    {inTrialPeriod ? 'Trial period' : 'Via Razorpay'}
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* ═══════ Trial Upgrade CTA ═══════ */}
                {inTrialPeriod && (
                    <motion.div
                        variants={fadeUp}
                        className="relative overflow-hidden rounded-2xl p-4"
                        style={{
                            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.08))',
                            border: '1px solid rgba(245,158,11,0.15)',
                        }}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <Zap className="w-5 h-5 text-amber-400" />
                                </motion.div>
                                <div>
                                    <p className="text-amber-300 font-semibold text-sm">Trial ends in {daysRemaining} days</p>
                                    <p className="text-zinc-500 text-xs">Subscribe to continue</p>
                                </div>
                            </div>
                            <motion.button
                                onClick={() => router.push('/payment/signup')}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0"
                                style={{
                                    background: 'linear-gradient(135deg, #F59E0B, #EA580C)',
                                    boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Upgrade
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* ═══════ Benefits ═══════ */}
                <motion.div
                    variants={fadeUp}
                    className="rounded-[20px] p-5"
                    style={{
                        background: 'linear-gradient(145deg, rgba(22,18,30,0.75), rgba(12,10,18,0.85))',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                >
                    <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4 text-teal-400" />
                        Your Benefits
                    </h3>
                    <div className="grid gap-2">
                        {benefits.map((b) => (
                            <motion.div
                                key={b.title}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                                whileHover={{ x: 4 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: b.bg }}>
                                    <b.icon size={16} style={{ color: b.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white leading-tight">{b.title}</p>
                                    <p className="text-[11px] text-zinc-500">{b.desc}</p>
                                </div>
                                <CheckCircle2 size={16} className="text-emerald-400/60 shrink-0" />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ═══════ Extend Subscription ═══════ */}
                <motion.div
                    variants={fadeUp}
                    className="relative overflow-hidden rounded-2xl p-5"
                    style={{
                        background: 'linear-gradient(135deg, rgba(20,184,166,0.06), rgba(139,92,246,0.06))',
                        border: '1px solid rgba(20,184,166,0.12)',
                    }}
                >
                    <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-400" />
                        Need More Time?
                    </h3>
                    <p className="text-zinc-500 text-xs mb-4">
                        Extend your premium access. Days are added to your current plan.
                    </p>
                    <motion.button
                        onClick={() => router.push('/payment/signup')}
                        className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                        style={{
                            background: 'linear-gradient(135deg, #14B8A6, #8B5CF6)',
                            boxShadow: '0 4px 20px rgba(20,184,166,0.2)',
                        }}
                        whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(20,184,166,0.3)' }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <RotateCw size={16} />
                        Extend Subscription
                        <ArrowRight size={14} />
                    </motion.button>
                </motion.div>

                {/* ═══════ Payment Method ═══════ */}
                <motion.div
                    variants={fadeUp}
                    className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                    <div className="w-11 h-11 rounded-xl bg-zinc-700/50 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-white text-sm">Payment Method</p>
                        <p className="text-xs text-zinc-500">
                            {inTrialPeriod ? 'No payment method added yet' : subscription?.subscriptionId ? 'Managed via Razorpay' : 'Prepaid Pass'}
                        </p>
                    </div>
                    {inTrialPeriod && (
                        <motion.button
                            onClick={() => router.push('/payment/signup')}
                            className="px-3 py-1.5 text-xs font-medium text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 rounded-xl transition-colors"
                            whileTap={{ scale: 0.95 }}
                        >
                            Add
                        </motion.button>
                    )}
                </motion.div>

                {/* ═══════ Help ═══════ */}
                <motion.div variants={fadeUp} className="text-center space-y-2 pb-2">
                    <p className="text-[11px] text-zinc-600">
                        Need to cancel? Check your email for the Razorpay link or contact us.
                    </p>
                    <motion.button
                        onClick={() => window.location.href = '/help-support'}
                        className="text-xs text-teal-400 hover:text-teal-300 font-medium inline-flex items-center gap-1"
                        whileHover={{ x: 4 }}
                    >
                        Contact Support <ArrowRight size={12} />
                    </motion.button>
                </motion.div>
            </motion.div>
        </div>
    );
}
