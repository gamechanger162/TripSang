'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { userAPI } from '@/lib/api';
import { Shield, Calendar, CreditCard, RotateCw, Crown, Sparkles, Zap, Users, HeadphonesIcon, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyPlanPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<any>(null);
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
            return;
        }

        if (status === 'authenticated') {
            fetchSubscription();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    // Handle redirect for non-premium users after data is loaded
    useEffect(() => {
        if (!loading && subscription !== null) {
            const isActive = subscription?.status === 'active';
            const inTrialPeriod = subscription?.status === 'trial' && subscription?.trialEnds && new Date(subscription.trialEnds) > new Date();

            if (!isActive && !inTrialPeriod) {
                setShouldRedirect(true);
                router.push('/payment/signup');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, subscription]);

    const fetchSubscription = async () => {
        try {
            // Force fresh fetch
            const response = await userAPI.getProfile(true);
            if (response.success && response.user) {
                setSubscription(response.user.subscription || { status: 'none' });
            } else {
                setSubscription({ status: 'none' });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load subscription details');
            setSubscription({ status: 'none' });
        } finally {
            setLoading(false);
        }
    };

    if (loading || shouldRedirect || status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const isActive = subscription?.status === 'active';
    const isTrial = subscription?.status === 'trial';

    // Only consider it a trial if the status is explicitly 'trial'
    const inTrialPeriod = subscription?.status === 'trial' && subscription?.trialEnds && new Date(subscription.trialEnds) > new Date();

    // Calculate days remaining
    const getDaysRemaining = () => {
        if (!subscription?.currentEnd) return 0;
        const end = new Date(subscription.currentEnd);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    };

    const daysRemaining = getDaysRemaining();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8 pt-24 pb-32">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/20 rounded-full text-primary-400 text-sm font-medium">
                        <Crown className="w-4 h-4" />
                        Premium Member
                    </div>
                    <h1 className="text-3xl font-bold text-white">My Subscription</h1>
                    <p className="text-gray-400">Manage your TripSang Premium membership</p>
                </div>

                {/* Main Status Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    {/* Header Section */}
                    <div className="relative p-6 pb-4 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                                    <Shield className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        TripSang Premium
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${inTrialPeriod
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            }`}>
                                            {inTrialPeriod ? 'FREE TRIAL' : 'ACTIVE'}
                                        </span>
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-0.5">
                                        {subscription?.subscriptionId ? 'Monthly Subscription' : inTrialPeriod ? '30-Day Free Trial' : 'Premium Pass'}
                                    </p>
                                </div>
                            </div>
                            <Sparkles className="w-8 h-8 text-primary-400/50" />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="relative p-6 grid grid-cols-2 gap-6">
                        {/* Days Remaining */}
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-primary-400" />
                                </div>
                                <span className="text-gray-400 text-sm">Days Remaining</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{daysRemaining}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Expires {subscription?.currentEnd ? new Date(subscription.currentEnd).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>

                        {/* Billing */}
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                    <RotateCw className="w-5 h-5 text-green-400" />
                                </div>
                                <span className="text-gray-400 text-sm">Next Billing</span>
                            </div>
                            <p className="text-xl font-bold text-white">
                                {inTrialPeriod ? 'No charge' : subscription?.subscriptionId ? '₹20/mo' : 'One-time'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {inTrialPeriod
                                    ? 'Trial - No payment required'
                                    : subscription?.subscriptionId
                                        ? 'Auto-renews via Razorpay'
                                        : 'Non-recurring purchase'}
                            </p>
                        </div>
                    </div>

                    {/* Trial Upgrade CTA */}
                    {inTrialPeriod && (
                        <div className="relative px-6 pb-6">
                            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-4 border border-amber-500/20">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                            <Zap className="w-5 h-5 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-amber-400 font-semibold text-sm">Trial ends in {daysRemaining} days</p>
                                            <p className="text-gray-400 text-xs">Subscribe now to continue after trial</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => router.push('/payment/signup')}
                                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        Upgrade Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Method */}
                    <div className="relative px-6 pb-6">
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-gray-700/50 flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-white">Payment Method</p>
                                <p className="text-sm text-gray-400">
                                    {inTrialPeriod
                                        ? 'No payment method added yet'
                                        : subscription?.subscriptionId
                                            ? 'Managed via Razorpay'
                                            : 'Prepaid Pass'}
                                </p>
                            </div>
                            {inTrialPeriod && (
                                <button
                                    onClick={() => router.push('/payment/signup')}
                                    className="px-4 py-2 text-sm font-medium text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 rounded-xl transition-colors"
                                >
                                    Add Method
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Premium Benefits */}
                <div className="bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Crown className="w-5 h-5 text-primary-400" />
                        Your Premium Benefits
                    </h3>
                    <div className="grid gap-3">
                        <BenefitRow icon={<Zap className="w-5 h-5" />} title="Unlimited Trip Creation" description="Create as many trips as you want" />
                        <BenefitRow icon={<Shield className="w-5 h-5" />} title="Verified Premium Badge" description="Stand out with an exclusive badge on your profile" />
                        <BenefitRow icon={<Users className="w-5 h-5" />} title="Access to Exclusive Squads" description="Join premium-only travel groups" />
                        <BenefitRow icon={<HeadphonesIcon className="w-5 h-5" />} title="Priority Support" description="Get faster responses from our support team" />
                    </div>
                </div>

                {/* Help Section */}
                <div className="text-center space-y-2">
                    <p className="text-sm text-gray-500">
                        Need to cancel? Check your email for the Razorpay management link or contact support.
                    </p>
                    <button
                        onClick={() => window.location.href = 'mailto:support@tripsang.com'}
                        className="text-sm text-primary-400 hover:text-primary-300 font-medium"
                    >
                        Contact Support →
                    </button>
                </div>
            </div>
        </div>
    );
}

function BenefitRow({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400 flex-shrink-0">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{title}</p>
                <p className="text-xs text-gray-400 truncate">{description}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
        </div>
    );
}
