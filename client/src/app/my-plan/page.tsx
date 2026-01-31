'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { userAPI } from '@/lib/api';
import { Check, Shield, Calendar, CreditCard, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyPlanPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<any>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
            return;
        }

        if (status === 'authenticated') {
            fetchSubscription();
        }
    }, [status]);

    const fetchSubscription = async () => {
        try {
            // Force fresh fetch by appending timestamp if API supported it, but userAPI.getProfile 
            // likely hits an endpoint that we can't easily modify params for without seeing api.ts.
            // Assuming getProfile hits /api/users/me, let's just rely on the fact we are calling it fresh here.

            const response = await userAPI.getProfile();
            if (response.success && response.user) {
                setSubscription(response.user.subscription);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load subscription details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const isActive = subscription?.status === 'active';
    const isTrial = subscription?.status === 'trial'; // unlikely given Razorpay structure but good to handle if we add manual logic

    // Fallback if status is active but we are in trial period based on dates
    const inTrialPeriod = (subscription?.status === 'trial' || (isActive && subscription?.trialEnds)) && new Date(subscription.trialEnds) > new Date();

    if (!isActive && !inTrialPeriod) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-900 px-4 py-8">
                <div className="max-w-md mx-auto card p-8 text-center bg-white dark:bg-dark-800 rounded-2xl shadow-xl">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-gray-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">No Active Plan</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        You are currently on the free tier. Upgrade to Premium to unlock all features.
                    </p>
                    <button
                        onClick={() => router.push('/payment/signup')}
                        className="btn-primary w-full py-3"
                    >
                        View Plans & Upgrade
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 px-4 py-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold px-2">My Subscription</h1>

                {/* Status Card */}
                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg border border-gray-100 dark:border-dark-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-6 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    TripSang Premium
                                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                                        {inTrialPeriod ? 'TRIAL' : 'ACTIVE'}
                                    </span>
                                </h2>
                                <p className="text-primary-100 text-sm mt-1">Monthly Membership</p>
                            </div>
                            <Shield className="w-8 h-8 text-white/80" />
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-dark-900 rounded-lg">
                                <Calendar className="w-5 h-5 text-primary-500 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase">Start Date</p>
                                    <p className="font-semibold">
                                        {subscription?.currentStart ? new Date(subscription.currentStart).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-dark-900 rounded-lg">
                                <RotateCw className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase">Renews On</p>
                                    <p className="font-semibold">
                                        {subscription?.currentEnd ? new Date(subscription.currentEnd).toLocaleDateString() : 'N/A'}
                                    </p>
                                    {inTrialPeriod ? (
                                        <span className="text-xs text-orange-500 font-medium block mt-1">
                                            Free trial ends on this date.
                                            <br />
                                            <button
                                                onClick={() => router.push('/payment/signup')}
                                                className="text-primary-600 hover:text-primary-700 underline mt-1"
                                            >
                                                Subscribe now to avoid interruption
                                            </button>
                                        </span>
                                    ) : (
                                        <span className="text-xs text-green-500 font-medium block mt-1">
                                            Auto-renews via Razorpay
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="flex items-center gap-3 p-4 border border-gray-100 dark:border-dark-700 rounded-xl">
                            <CreditCard className="w-6 h-6 text-gray-400" />
                            <div className="flex-1">
                                <p className="font-medium">Payment Method</p>
                                <p className="text-sm text-gray-500">
                                    {inTrialPeriod ? 'No payment method added yet' : 'Managed via Razorpay'}
                                </p>
                            </div>
                            {inTrialPeriod && (
                                <button
                                    onClick={() => router.push('/payment/signup')}
                                    className="text-xs btn-outline py-1 px-3"
                                >
                                    Add Method
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Features List */}
                <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold mb-4">Your Premium Benefits</h3>
                    <ul className="space-y-3">
                        <FeatureRow text="Unlimited Trip Creation" />
                        <FeatureRow text="Verified Premium Badge" />
                        <FeatureRow text="Access to Exclusive Squads" />
                        <FeatureRow text="Priority Support" />
                    </ul>
                </div>

                {/* Cancel Info */}
                <p className="text-center text-xs text-gray-400">
                    To cancel your subscription, please contact support or check your email for the Razorpay management link.
                </p>
            </div>
        </div>
    );
}

function FeatureRow({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-green-600" />
            </div>
            {text}
        </li>
    );
}
