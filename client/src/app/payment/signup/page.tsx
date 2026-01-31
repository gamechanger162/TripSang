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
                    currency: response.currency,
                    isTrialEligible: response.isTrialEligible
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

    const handleSubscription = async () => {
        if (!isRazorpayLoaded) {
            toast.error('Razorpay SDK failed to load');
            return;
        }
        setProcessing(true);

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
    };

    const handleOneTimePayment = async () => {
        if (!isRazorpayLoaded) {
            toast.error('Razorpay SDK failed to load');
            return;
        }
        setProcessing(true);

        try {
            const orderResponse = await paymentAPI.createOrder();
            if (!orderResponse.success) {
                toast.error(orderResponse.message);
                setProcessing(false);
                return;
            }

            const options = {
                key: orderResponse.razorpayKeyId,
                amount: orderResponse.amount * 100, // Razorpay takes paise
                currency: orderResponse.currency,
                name: 'TripSang',
                description: '1 Month Premium Pass',
                image: '/logo.png',
                order_id: orderResponse.orderId,
                handler: async function (response: any) {
                    try {
                        const verifyResponse = await paymentAPI.verifyOrder({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        if (verifyResponse.success) {
                            toast.success('30-Day Pass Activated!');
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
            rzp.on('payment.failed', function (response: any) {
                toast.error(response.error.description || 'Payment Failed');
                setProcessing(false);
            });
            rzp.open();

        } catch (error: any) {
            console.error(error);
            toast.error('Failed to create order');
            setProcessing(false);
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
        return <div className="min-h-screen flex items-center justify-center"><p>Redirecting to dashboard...</p></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-start">

                {/* Left Side: Value Prop */}
                <div className="space-y-8 sticky top-8">
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

                {/* Right Side: Payment Options */}
                <div className="space-y-6">

                    {/* Free Trial Option - Always show for reviewer/testing visibility if needed, or stick to eligibility logic. 
                        For "Reviewer can't find it", it implies they logged in with an account that used it or logic is failing.
                        Let's force show it if subscriptionDetails is loaded, but handle error if clicked and not eligible. 
                    */}
                    <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 relative overflow-hidden">
                        {(subscriptionDetails?.isTrialEligible) && (
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                BEST WAY TO START
                            </div>
                        )}
                        <h3 className="text-lg font-bold">30-Day Free Trial</h3>
                        <p className="text-sm text-gray-500 mb-4">Experience Premium for free. No card required.</p>
                        <button
                            onClick={async () => {
                                setProcessing(true);
                                try {
                                    const res = await paymentAPI.startTrial();
                                    if (res.success) {
                                        toast.success('Trial Activated!');
                                        router.push('/dashboard');
                                    } else {
                                        toast.error(res.message || 'Trial not available');
                                    }
                                } catch (err: any) {
                                    toast.error(err.message || 'Trial failed');
                                } finally {
                                    setProcessing(false);
                                }
                            }}
                            disabled={processing || !subscriptionDetails?.isTrialEligible}
                            className={`w-full btn-outline py-2.5 text-primary-600 border-primary-600 hover:bg-primary-50 ${!subscriptionDetails?.isTrialEligible ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Start Free Trial
                        </button>
                    </div>

                    {/* Monthly Subscription (Recurring) */}
                    <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg border-2 border-primary-500 relative">
                        <div className="absolute top-0 center bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-b-lg left-1/2 -translate-x-1/2">
                            POPULAR
                        </div>
                        <div className="flex justify-between items-center mb-2 mt-2">
                            <h3 className="text-xl font-bold">Monthly</h3>
                            <div>
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">₹20</span>
                                <span className="text-sm text-gray-500">/mo</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">Auto-renews every month. Cancel anytime.</p>

                        <button
                            onClick={handleSubscription}
                            disabled={processing || !isRazorpayLoaded}
                            className="w-full btn-primary py-3"
                        >
                            Subscribe Monthly
                        </button>
                    </div>

                    {/* One Time Pass */}
                    <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-bold">1 Month Pass</h3>
                            <div>
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">₹30</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">One-time payment for 30 days access. No auto-renewal.</p>

                        <button
                            onClick={handleOneTimePayment}
                            disabled={processing || !isRazorpayLoaded}
                            className="w-full py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-700 font-semibold"
                        >
                            Buy 1 Month Pass
                        </button>
                    </div>

                    <p className="text-center text-xs text-gray-400">
                        Secured by Razorpay • Cancel anytime
                    </p>

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
