'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { paymentAPI } from '@/lib/api';
import { useRazorpay } from '@/hooks/useRazorpay';
import { Check, Shield, Star, Zap } from 'lucide-react';

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
                    currency: response.currency
                });
                setRazorpayKey(response.razorpayKeyId);
            }
        } catch (error: any) {
            console.error('Payment check failed:', error);
            if (error.message?.includes('already have')) {
                toast.success('You are already subscribed!');
                router.push('/dashboard');
            } else {
                toast.error('Failed to initialize subscription');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        // Logic for "Start Free Trial" button
        if (subscriptionDetails?.isTrialEligible) {
            setProcessing(true);
            try {
                const response = await paymentAPI.startTrial();
                if (response.success) {
                    toast.success('Free Trial Activated!');
                    router.push('/dashboard');
                } else {
                    toast.error(response.message || 'Failed to start trial');
                }
            } catch (error: any) {
                toast.error(error.message || 'Failed to start trial');
            } finally {
                setProcessing(false);
            }
            return;
        }

        // Logic for Paid Subscription
        if (!isRazorpayLoaded) {
            toast.error('Razorpay SDK failed to load');
            return;
        }
        if (!subscriptionDetails || !razorpayKey) {
            toast.error('Subscription details missing');
            console.error('Missing details:', { subscriptionDetails, razorpayKey });
            return;
        }

        setProcessing(true);

        const options = {
            key: razorpayKey,
            subscription_id: subscriptionDetails.id,
            name: 'TripSang',
            description: 'Monthly Premium Membership',
            image: '/logo.png', // Ensure you have a logo
            handler: async function (response: any) {
                try {
                    const verifyResponse = await paymentAPI.verifySubscription({
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_subscription_id: response.razorpay_subscription_id,
                        razorpay_signature: response.razorpay_signature,
                    });

                    if (verifyResponse.success) {
                        toast.success('Welcome to TripSang Premium!');
                        router.push('/dashboard');
                    } else {
                        toast.error('Verification failed. Please contact support.');
                    }
                } catch (error) {
                    toast.error('Verification error');
                    console.error(error);
                } finally {
                    setProcessing(false);
                }
            },
            prefill: {
                name: session?.user?.name,
                email: session?.user?.email,
                contact: (session?.user as any)?.mobileNumber || ''
            },
            theme: {
                color: '#7C3AED', // Primary Purple
            },
            modal: {
                ondismiss: function () {
                    setProcessing(false);
                }
            }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response: any) {
            toast.error(response.error.description || 'Payment Failed');
            setProcessing(false);
        });
        rzp1.open();
    };


    const checkPaymentRequirement = async () => {
        try {
            // We fetch user profile first to check trial eligibility locally or via an API check
            // Ideally backend returns eligibility, but let's assume if they haven't used trial they are eligible.
            // For now, let's just initialize subscription.

            // To support "One Month" vs "Trial", we potentially need user input.
            // But if the user is new, we default to showing Trial option.
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
                    isTrialEligible: true // Simplify: Assume everyone here is eligible for "Trial" button action if they landed here.
                    // Real check should come from separate API or user props.
                    // However, if they *clicked* "Buy One Month", we might want different flow.
                    // For now, let's show TWO buttons if possible? Or just one smart button.
                });
                setRazorpayKey(response.razorpayKeyId);
            }
        } catch (error: any) {
            console.error('Payment check failed:', error);
            if (error.message?.includes('already have')) {
                toast.success('You are already subscribed!');
                router.push('/dashboard');
            } else {
                toast.error('Failed to initialize subscription');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <p className="text-gray-500">Loading plan options...</p>
                </div>
            </div>
        );
    }

    if (skipPayment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">You're all set!</h2>
                    <p className="text-gray-600">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">

                {/* Left Side: Value Prop */}
                <div className="space-y-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                            Start Your Journey <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                                With Premium
                            </span>
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Join the most exclusive travel community.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <FeatureItem icon={<Shield className="w-6 h-6 text-green-500" />} title="Verified Community" description="Connect with verified travelers only" />
                        <FeatureItem icon={<Zap className="w-6 h-6 text-yellow-500" />} title="Unlimited Trips" description="Create and join as many trips as you want" />
                        <FeatureItem icon={<Star className="w-6 h-6 text-purple-500" />} title="Premium Badge" description="Stand out with a special profile badge" />
                    </div>
                </div>

                {/* Right Side: Payment Card */}
                <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-dark-700 relative">

                    <div className="p-8 text-center">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Monthly Membership</h3>
                        <div className="flex items-baseline justify-center my-6">
                            <span className="text-5xl font-extrabold text-primary-600">
                                {subscriptionDetails?.currency === 'INR' ? '₹' : subscriptionDetails?.currency} {subscriptionDetails?.amount || 99}
                            </span>
                            <span className="text-gray-500 ml-2">/ month</span>
                        </div>

                        <div className="space-y-3">
                            {/* TRIAL BUTTON */}
                            <button
                                onClick={async () => {
                                    setProcessing(true);
                                    try {
                                        const res = await paymentAPI.startTrial();
                                        if (res.success) {
                                            toast.success('30-Day Free Trial Activated!');
                                            router.push('/dashboard');
                                        } else {
                                            toast.error(res.message);
                                        }
                                    } catch (err: any) {
                                        toast.error(err.message);
                                    } finally {
                                        setProcessing(false);
                                    }
                                }}
                                disabled={processing}
                                className="w-full btn-outline py-3 text-lg border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                            >
                                Start 30-Day Free Trial
                            </button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Or Pay Now</span>
                                <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                            </div>

                            {/* BUY NOW BUTTON */}
                            <button
                                onClick={() => {
                                    // Manually force strict pay flow (bypass trial logic in handlePaymentWrapper if we had one, but here we just call distinct logic)
                                    // Actually, we can reuse helper but verify we want PAY mode.
                                    if (!isRazorpayLoaded) {
                                        toast.error('Razorpay SDK failed to load');
                                        return;
                                    }
                                    setProcessing(true);
                                    // ... Razorpay logic ...
                                    const options = {
                                        key: razorpayKey,
                                        subscription_id: subscriptionDetails.id,
                                        name: 'TripSang',
                                        description: 'Monthly Premium Membership',
                                        image: '/logo.png',
                                        handler: async function (response: any) {
                                            try {
                                                const verifyResponse = await paymentAPI.verifySubscription({
                                                    razorpay_payment_id: response.razorpay_payment_id,
                                                    razorpay_subscription_id: response.razorpay_subscription_id,
                                                    razorpay_signature: response.razorpay_signature,
                                                });
                                                if (verifyResponse.success) {
                                                    toast.success('Premium Activated!');
                                                    router.push('/dashboard');
                                                } else {
                                                    toast.error('Verification failed');
                                                }
                                            } catch (error) { toast.error('Verification error'); }
                                            finally { setProcessing(false); }
                                        },
                                        prefill: {
                                            name: session?.user?.name,
                                            email: session?.user?.email,
                                            contact: (session?.user as any)?.mobileNumber || ''
                                        },
                                        theme: { color: '#7C3AED' }
                                    };
                                    const rzp = new window.Razorpay(options);
                                    rzp.open();
                                }}
                                disabled={processing || !isRazorpayLoaded}
                                className="w-full btn-primary py-3 text-lg"
                            >
                                Buy 1 Month Premium
                            </button>
                        </div>

                        <p className="mt-6 text-xs text-gray-400">
                            Free trial requires no payment details. <br />
                            Paid plan auto-renews. Cancel anytime.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <p className="text-gray-500">Preparing your membership...</p>
                </div>
            </div>
        );
    }

    if (skipPayment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">You're all set!</h2>
                    <p className="text-gray-600">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">

                {/* Left Side: Value Prop */}
                <div className="space-y-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                            Start Your Journey <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                                With Premium
                            </span>
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Join the most exclusive travel community. First month is on us!
                        </p>
                    </div>

                    <div className="space-y-6">
                        <FeatureItem icon={<Shield className="w-6 h-6 text-green-500" />} title="Verified Community" description="Connect with verified travelers only" />
                        <FeatureItem icon={<Zap className="w-6 h-6 text-yellow-500" />} title="Unlimited Trips" description="Create and join as many trips as you want" />
                        <FeatureItem icon={<Star className="w-6 h-6 text-purple-500" />} title="Premium Badge" description="Stand out with a special profile badge" />
                    </div>
                </div>

                {/* Right Side: Payment Card */}
                <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-dark-700 relative">
                    {/* Badge */}
                    <div className="absolute top-0 right-0 bg-gradient-to-bl from-yellow-400 to-orange-500 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl">
                        30 DAYS FREE
                    </div>

                    <div className="p-8 text-center">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Monthly Membership</h3>
                        <div className="flex items-baseline justify-center my-6">
                            <span className="text-5xl font-extrabold text-primary-600">
                                {subscriptionDetails?.currency === 'INR' ? '₹' : subscriptionDetails?.currency} {subscriptionDetails?.amount || 99}
                            </span>
                            <span className="text-gray-500 ml-2">/ month</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-8">
                            Billed monthly after free trial ends. <br /> Cancel anytime.
                        </p>

                        <button
                            onClick={handlePayment}
                            disabled={processing || !isRazorpayLoaded}
                            className="w-full btn-primary py-4 text-lg shadow-lg shadow-primary-500/30 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Processing...' : 'Start Free Trial'}
                        </button>

                        <p className="mt-4 text-xs text-gray-400">
                            By subscribing, you agree to our Terms of Service.
                            Recurring billing, cancel anytime.
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-700/50 p-4 text-center">
                        <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                            <Shield size={16} />
                            Secured by Razorpay
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="p-2 bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
                {icon}
            </div>
            <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
        </div>
    );
}
