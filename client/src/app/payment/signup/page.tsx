'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { paymentAPI } from '@/lib/api';
import { useRazorpay } from '@/hooks/useRazorpay';

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
    const [orderDetails, setOrderDetails] = useState<any>(null);
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
            const response = await paymentAPI.createSignupOrder();

            if (response.skipped) {
                setSkipPayment(true);
                toast.success(response.message || 'No payment required');
                setTimeout(() => router.push('/dashboard'), 1500);
            } else {
                setOrderDetails(response.order);
                setRazorpayKey(response.razorpayKeyId);
            }
        } catch (error: any) {
            console.error('Payment check failed:', error);
            if (error.message?.includes('already paid')) {
                toast.success('You have already paid the membership fee');
                router.push('/dashboard');
            } else {
                toast.error('Failed to initialize payment');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = () => {
        if (!isRazorpayLoaded) {
            toast.error('Razorpay SDK failed to load');
            return;
        }
        if (!orderDetails || !razorpayKey) {
            toast.error('Payment details missing');
            return;
        }

        setProcessing(true);

        const options = {
            key: razorpayKey,
            amount: orderDetails.amount * 100, // Amount is in paise for frontend display sometimes, but order already has it? 
            // Wait, backend createSignupOrder returns: amount (in rupees usually for display) but Razorpay order needs paise.
            // Let's check backend response structure.
            // Backend: amount: config.signupFee, order.amount (from razorpay) is in paise.
            // Actually, backend response: order: { id: razorpayOrder.id, amount: config.signupFee, currency... }
            // BUT Razorpay options expects 'order_id'.

            currency: orderDetails.currency,
            name: 'Tripसंग',
            description: 'Membership Fee',
            order_id: orderDetails.id,
            handler: async function (response: any) {
                try {
                    const verifyResponse = await paymentAPI.verifyPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    });

                    if (verifyResponse.success) {
                        toast.success('Payment successful! Welcome to Tripसंग.');
                        router.push('/dashboard');
                    } else {
                        toast.error('Payment verification failed');
                    }
                } catch (error) {
                    toast.error('Payment verification failed');
                    console.error(error);
                } finally {
                    setProcessing(false);
                }
            },
            prefill: {
                name: session?.user?.name,
                email: session?.user?.email,
            },
            theme: {
                color: '#3B82F6',
            },
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response: any) {
            toast.error(response.error.description || 'Payment Failed');
            setProcessing(false);
        });
        rzp1.open();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (skipPayment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Redirecting...</h2>
                    <p className="mt-2 text-gray-600">No payment required.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-primary-600 px-6 py-8 text-center">
                    <h2 className="text-3xl font-bold text-white">One-Time Membership</h2>
                    <p className="mt-2 text-primary-100">Unlock full access to Tripसंग</p>
                </div>

                <div className="px-6 py-8">
                    <div className="flex justify-center mb-8">
                        <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                            {orderDetails?.currency === 'INR' ? '₹' : orderDetails?.currency} {orderDetails?.amount}
                        </span>
                        <span className="self-end text-lg text-gray-500 mb-2 ml-1">/ lifetime</span>
                    </div>

                    <ul className="space-y-4 mb-8 text-gray-600 dark:text-gray-300">
                        <li className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Create unlimited trips
                        </li>
                        <li className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Join exclusive squads
                        </li>
                        <li className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Verified Premium Badge
                        </li>
                    </ul>

                    <button
                        onClick={handlePayment}
                        disabled={processing || !isRazorpayLoaded}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? 'Processing...' : 'Pay Now'}
                    </button>

                    <p className="mt-4 text-xs text-center text-gray-400">
                        Secure payment powered by Razorpay
                    </p>
                </div>
            </div>
        </div>
    );
}
