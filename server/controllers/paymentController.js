import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Payment, GlobalConfig, User } from '../models/index.js';

// Initialize Razorpay instance lazily
const getRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay keys are missing. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.');
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};


/**
 * Activate Free Trial (No Razorpay)
 * POST /api/payments/start-trial
 */
export const activateFreeTrial = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        const config = await GlobalConfig.getInstance();

        if (!config.enablePaidSignup) {
            return res.status(200).json({
                success: true,
                message: 'No subscription needed.'
            });
        }

        // Check if already active
        if (user.subscription.status === 'active' || user.subscription.status === 'trial') {
            return res.status(400).json({
                success: false,
                message: 'You already have an active plan.'
            });
        }

        // Check if trial was already used (prevent abuse)
        // We check if 'trialEnds' exists and is in the past
        if (user.subscription.trialEnds && new Date(user.subscription.trialEnds) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'You have already used your free trial. Please upgrade to continue.'
            });
        }

        // Activate 30-day trial
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        user.subscription = {
            status: 'trial',
            trialEnds: trialEndDate,
            currentStart: new Date(),
            currentEnd: trialEndDate
        };

        if (!user.badges.includes('Premium')) {
            user.badges.push('Premium');
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Free trial activated successfully!',
            trialEnds: trialEndDate
        });

    } catch (error) {
        console.error('Activate trial error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to activate trial.',
            error: error.message
        });
    }
};

/**
 * Create Razorpay Subscription (Monthly)
 * POST /api/payments/create-subscription
 */
export const createSubscription = async (req, res) => {
    try {
        const userId = req.user._id;
        const config = await GlobalConfig.getInstance();

        // Check if subscription system is enabled
        if (!config.enablePaidSignup) {
            return res.status(200).json({
                success: true,
                skipped: true,
                message: 'Subscription is currently disabled.'
            });
        }

        const user = await User.findById(userId);

        if (user.subscription.status === 'active') {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription.'
            });
        }

        const planId = process.env.RAZORPAY_PLAN_ID;
        if (!planId) {
            throw new Error('RAZORPAY_PLAN_ID is not configured');
        }

        // Create Subscription on Razorpay - STARTS IMMEDIATELY (Simulating "Buy One Month" / Monthly Sub)
        // Unlike the previous trial logic, this one starts charging immediately.
        // If user wants trial, they use the distinct start-trial endpoint.
        const subscriptionOptions = {
            plan_id: planId,
            total_count: 120,
            quantity: 1,
            customer_notify: 1,
            // start_at is omitted to start immediately
            notes: {
                userId: userId.toString(),
                type: 'monthly_subscription'
            }
        };

        const subscription = await getRazorpay().subscriptions.create(subscriptionOptions);
        const plan = await getRazorpay().plans.fetch(planId);

        const isTrialEligible = !user.subscription.trialEnds;

        res.status(200).json({
            success: true,
            subscriptionId: subscription.id,
            planId: planId,
            amount: plan.item.amount / 100,
            currency: plan.item.currency,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            isTrialEligible
        });

    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create subscription.',
            error: error.message
        });
    }
};

/**
 * Verify Razorpay Subscription
 * POST /api/payments/verify-subscription
 */
export const verifySubscription = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
        const userId = req.user._id;

        const body = razorpay_payment_id + '|' + razorpay_subscription_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Signature verification failed'
            });
        }

        // Signature valid, update user
        const user = await User.findById(userId);

        // Fetch subscription details to get start/end
        const subDetails = await getRazorpay().subscriptions.fetch(razorpay_subscription_id);

        user.subscription = {
            status: 'active', // It's active (even if in trial period from Razorpay perspective it's 'created' or 'authenticated', but for us they have access)
            planId: subDetails.plan_id,
            subscriptionId: razorpay_subscription_id,
            currentStart: new Date(subDetails.current_start * 1000), // This might be null if future start? Check Razorpay docs. 
            // If future start, usually current_start is null or start_at.
            // Let's use start_at for trial logic.
            currentEnd: new Date(subDetails.current_end * 1000 || (subDetails.start_at * 1000)),
            trialEnds: new Date(subDetails.start_at * 1000)
        };

        if (!user.badges.includes('Premium')) {
            user.badges.push('Premium');
        }

        await user.save();

        // Create Payment record for the Auth transaction if needed, or just log it.
        // Usually auth transaction is minimal amount.

        await Payment.create({
            userId,
            transactionId: razorpay_payment_id,
            razorpayOrderId: razorpay_subscription_id, // storing sub id here for reference
            amount: 0, // Auth only
            status: 'success',
            type: 'premium_subscription',
            metadata: {
                subscriptionId: razorpay_subscription_id
            }
        });

        res.status(200).json({
            success: true,
            message: 'Subscription activated successfully'
        });

    } catch (error) {
        console.error('Verify subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify subscription',
            error: error.message
        });
    }
};

/**
 * Get User Payment History
 * GET /api/payments/my-payments
 */
export const getMyPayments = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type, status, page = 1, limit = 20 } = req.query;

        const filter = { userId };
        if (type) filter.type = type;
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const payments = await Payment.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-webhookData -razorpaySignature');

        const total = await Payment.countDocuments(filter);

        res.status(200).json({
            success: true,
            payments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalPayments: total,
                paymentsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment history.',
            error: error.message
        });
    }
};

/**
 * Razorpay Webhook Handler
 * POST /api/payments/webhook
 */
export const razorpayWebhook = async (req, res) => {
    try {
        // Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (webhookSecret) {
            const signature = req.headers['x-razorpay-signature'];
            const body = JSON.stringify(req.body);

            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(body)
                .digest('hex');

            if (signature !== expectedSignature) {
                console.error('Invalid webhook signature');
                return res.status(400).json({
                    success: false,
                    message: 'Invalid webhook signature'
                });
            }
        }

        // Process webhook event
        const event = req.body.event;
        const payload = req.body.payload;

        console.log('Razorpay Webhook Event:', event);

        // Handle Subscription Events
        if (event.startsWith('subscription.')) {
            const subEntity = payload.subscription.entity;
            const subscriptionId = subEntity.id;

            // Find user by subscription ID
            const user = await User.findOne({ 'subscription.subscriptionId': subscriptionId });

            if (user) {
                switch (event) {
                    case 'subscription.charged':
                        // Payment successful for a subscription cycle
                        console.log(`Subscription charged for user: ${user._id}`);

                        user.subscription.status = 'active';
                        // Update dates from the subscription entity
                        // Razorpay gives unix timestamps
                        user.subscription.currentStart = new Date(subEntity.current_start * 1000);
                        user.subscription.currentEnd = new Date(subEntity.current_end * 1000);

                        // Ensure they have the badge
                        if (!user.badges.includes('Premium')) {
                            user.badges.push('Premium');
                        }

                        await user.save();

                        // Record the payment
                        // The payment entity might be available in payload.payment
                        if (payload.payment) {
                            const paymentEntity = payload.payment.entity;

                            // Check if payment already recorded
                            const existingPayment = await Payment.findOne({ transactionId: paymentEntity.id });
                            if (!existingPayment) {
                                await Payment.create({
                                    userId: user._id,
                                    transactionId: paymentEntity.id,
                                    razorpayOrderId: paymentEntity.order_id, // Might be null for recurring
                                    amount: paymentEntity.amount / 100,
                                    currency: paymentEntity.currency,
                                    status: 'success',
                                    type: 'premium_subscription',
                                    method: paymentEntity.method,
                                    notes: `Subscription Charge: ${subscriptionId}. ${paymentEntity.description || ''}`,
                                    webhookData: req.body
                                });
                            }
                        }
                        break;

                    case 'subscription.cancelled':
                        console.log(`Subscription cancelled for user: ${user._id}`);
                        user.subscription.status = 'cancelled';
                        // We usually keep the badge until the currentEnd date, 
                        // but strictly speaking, the status is cancelled.
                        // Logic for badge removal could be a daily cron job checking dates.
                        await user.save();
                        break;

                    case 'subscription.halted':
                        console.log(`Subscription halted for user: ${user._id}`);
                        user.subscription.status = 'past_due';
                        // Remove premium badge immediately if payment failed multiple times
                        user.removeBadge('Premium');
                        await user.save();
                        break;

                    case 'subscription.completed':
                        console.log(`Subscription completed for user: ${user._id}`);
                        user.subscription.status = 'inactive';
                        user.removeBadge('Premium');
                        await user.save();
                        break;
                }
            } else {
                console.warn(`No user found for subscription ID: ${subscriptionId}`);
            }
        }

        // Handle standalone Payment Events (if relevant)
        else if (event.startsWith('payment.')) {
            const paymentEntity = payload.payment.entity;

            // Try to find payment by order_id (for one-time payments)
            // Or transactionId if we already created it
            const payment = await Payment.findOne({
                $or: [
                    { razorpayOrderId: paymentEntity.order_id },
                    { transactionId: paymentEntity.id }
                ]
            });

            if (payment) {
                if (event === 'payment.captured' && payment.status !== 'success') {
                    await payment.markAsSuccess({
                        razorpayPaymentId: paymentEntity.id
                    });
                } else if (event === 'payment.failed' && payment.status === 'pending') {
                    await payment.markAsFailed(
                        paymentEntity.error_code,
                        paymentEntity.error_description
                    );
                }

                // Update webhook data
                payment.webhookData = req.body;
                await payment.save();
            }
        }

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
            success: false,
            message: 'Webhook processing failed',
            error: error.message
        });
    }
};

/**
 * Admin: Get All Payments
 * GET /api/payments/admin/all
 */
export const getAllPayments = async (req, res) => {
    try {
        const {
            type,
            status,
            userId,
            startDate,
            endDate,
            page = 1,
            limit = 20
        } = req.query;

        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;
        if (userId) filter.userId = userId;

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const payments = await Payment.find(filter)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Payment.countDocuments(filter);

        // Calculate revenue
        const revenueData = await Payment.aggregate([
            { $match: { ...filter, status: 'success' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const revenue = revenueData.length > 0 ? revenueData[0] : { totalRevenue: 0, count: 0 };

        res.status(200).json({
            success: true,
            payments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalPayments: total
            },
            revenue: {
                total: revenue.totalRevenue,
                successfulPayments: revenue.count
            }
        });

    } catch (error) {
        console.error('Get all payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payments.',
            error: error.message
        });
    }
};

/**
 * Create Razorpay Order (One Time Payment)
 * POST /api/payments/create-order
 */
export const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const config = await GlobalConfig.getInstance();

        if (!config.enablePaidSignup) {
            return res.status(200).json({
                success: true,
                skipped: true,
                message: 'Payment is currently disabled.'
            });
        }

        const user = await User.findById(userId);

        // Allow purchasing one-time even if they had a trial, but not if they are already active with a SUB
        // Standard User can buy this to activate.
        if (user.subscription.status === 'active') {
            // If active via sub, don't allow? Or extend?
            // For simplicity, block if active.
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription.'
            });
        }

        const amount = 3000; // ₹30.00
        const currency = 'INR';

        // Shorten receipt ID (Max 40 chars)
        // UserID (24) + "_" + ts (~13) = 38 chars. It fits.
        // But let's be safe: `rcpt_${userId.toString().slice(-8)}_${Date.now()}`
        const receiptId = `rcpt_${userId.toString().slice(-8)}_${Date.now()}`;

        const options = {
            amount: amount,
            currency: currency,
            receipt: receiptId,
            notes: {
                userId: userId.toString(),
                type: 'one_time_premium'
            }
        };

        const order = await getRazorpay().orders.create(options);

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: amount / 100,
            currency: currency,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        // Detailed logging for debugging
        console.error('Create order error failed.');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.error) {
            console.error('Razorpay Error Description:', error.error.description);
            console.error('Razorpay Error Source:', error.error.source);
            console.error('Razorpay Error Step:', error.error.step);
            console.error('Razorpay Error Reason:', error.error.reason);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create order.',
            error: error.message
        });
    }
};

/**
 * Verify Razorpay Order (One Time)
 * POST /api/payments/verify-order
 */
export const verifyOrder = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const userId = req.user._id;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Signature verification failed'
            });
        }

        // Signature valid, update user
        const user = await User.findById(userId);

        // One Time Payment gives 30 days
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        user.subscription = {
            status: 'active',
            // No planId or subscriptionId for one-time
            currentStart: startDate,
            currentEnd: endDate,
            trialEnds: user.subscription.trialEnds // Keep trial history if exists
        };

        if (!user.badges.includes('Premium')) {
            user.badges.push('Premium');
        }

        await user.save();

        await Payment.create({
            userId,
            transactionId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            amount: 30, // We know it's 30
            status: 'success',
            type: 'one_time_premium',
            notes: 'One Time 30 Days Pass'
        });

        res.status(200).json({
            success: true,
            message: 'One-time pass activated successfully'
        });

    } catch (error) {
        console.error('Verify order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify order',
            error: error.message
        });
    }
};
