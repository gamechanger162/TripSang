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
 * Create Razorpay Subscription (Monthly with 1 month free)
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

        // Calculate trial end date (30 days from now)
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        // Create Subscription on Razorpay
        // We set start_at to 30 days in future to give 1 month free
        // Razorpay will charge the first payment at start_at
        // User auths now.
        const subscriptionOptions = {
            plan_id: planId,
            total_count: 120, // 10 years (effectively lifetime of usage)
            quantity: 1,
            customer_notify: 1,
            start_at: Math.floor(trialEndDate.getTime() / 1000), // Unix timestamp
            notes: {
                userId: userId.toString(),
                type: 'monthly_subscription'
            }
        };

        const subscription = await getRazorpay().subscriptions.create(subscriptionOptions);

        // Fetch plan details to show correct amount on frontend
        const plan = await getRazorpay().plans.fetch(planId);

        res.status(200).json({
            success: true,
            subscriptionId: subscription.id,
            planId: planId,
            amount: plan.item.amount / 100, // Amount is in paise
            currency: plan.item.currency,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID
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
            type: 'subscription_auth',
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
                return res.status(400).json({
                    success: false,
                    message: 'Invalid webhook signature'
                });
            }
        }

        // Process webhook event
        const event = req.body.event;
        const payloadData = req.body.payload.payment.entity;

        console.log('Razorpay Webhook Event:', event);

        // Find payment by order_id
        const payment = await Payment.findOne({
            razorpayOrderId: payloadData.order_id
        });

        if (!payment) {
            console.log('Payment not found for order:', payloadData.order_id);
            return res.status(200).json({ success: true }); // Always return 200 to Razorpay
        }

        // Update payment based on event
        switch (event) {
            case 'payment.captured':
                if (payment.status !== 'success') {
                    await payment.markAsSuccess({
                        razorpayPaymentId: payloadData.id
                    });
                    console.log('Payment marked as success:', payment._id);
                }
                break;

            case 'payment.failed':
                if (payment.status === 'pending') {
                    await payment.markAsFailed(
                        payloadData.error_code,
                        payloadData.error_description
                    );
                    console.log('Payment marked as failed:', payment._id);
                }
                break;

            default:
                console.log('Unhandled webhook event:', event);
        }

        // Save webhook data
        payment.webhookData = req.body;
        await payment.save();

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
