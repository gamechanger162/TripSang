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
 * Create Razorpay Order for Signup Fee
 * POST /api/payments/create-order
 */
export const createSignupOrder = async (req, res) => {
    try {
        const userId = req.user._id;

        // Step 1: Get global configuration
        const config = await GlobalConfig.getInstance();

        // Step 2: Check if paid signup is enabled
        if (!config.enablePaidSignup) {
            return res.status(200).json({
                success: true,
                skipped: true,
                message: 'Signup fee is currently disabled. No payment required.'
            });
        }

        // Step 3: Check if signup fee is set
        if (!config.signupFee || config.signupFee <= 0) {
            return res.status(200).json({
                success: true,
                skipped: true,
                message: 'Signup fee is set to zero. No payment required.'
            });
        }

        // Step 4: Check if user already paid
        const existingPayment = await Payment.findOne({
            userId,
            type: 'signup_fee',
            status: 'success'
        });

        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: 'Signup fee already paid.',
                alreadyPaid: true
            });
        }

        // Step 5: Create Razorpay order
        const amountInPaise = config.signupFee * 100; // Convert to paise
        const currency = config.signupFeeCurrency || 'INR';

        const razorpayOrder = await getRazorpay().orders.create({
            amount: amountInPaise,
            currency: currency,
            receipt: `signup_${userId}_${Date.now()}`,
            notes: {
                userId: userId.toString(),
                type: 'signup_fee',
                purpose: 'User registration fee'
            }
        });


        // Step 6: Save payment record in database
        const payment = await Payment.create({
            userId,
            transactionId: razorpayOrder.id,
            razorpayOrderId: razorpayOrder.id,
            amount: config.signupFee,
            currency: currency,
            status: 'pending',
            type: 'signup_fee',
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        // Step 7: Return order details to frontend
        res.status(200).json({
            success: true,
            skipped: false,
            order: {
                id: razorpayOrder.id,
                amount: config.signupFee,
                currency: currency,
                paymentId: payment._id
            },
            razorpayKeyId: process.env.RAZORPAY_KEY_ID // For frontend initialization
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order.',
            error: error.message
        });
    }
};

/**
 * Verify Razorpay Payment
 * POST /api/payments/verify-payment
 */
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user._id;

        // Step 1: Find payment record
        const payment = await Payment.findOne({
            razorpayOrderId: razorpay_order_id,
            userId
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment record not found.'
            });
        }

        // Step 2: Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            // Mark payment as failed
            await payment.markAsFailed('SIGNATURE_MISMATCH', 'Payment signature verification failed');

            return res.status(400).json({
                success: false,
                message: 'Payment verification failed. Signature mismatch.'
            });
        }

        // Step 3: Mark payment as successful
        await payment.markAsSuccess({
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature
        });

        // Step 4: Award badge to user
        const user = await User.findById(userId);
        if (user && !user.badges.includes('Premium')) {
            await user.addBadge('Premium');
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully.',
            payment: {
                id: payment._id,
                amount: payment.amount,
                status: payment.status,
                type: payment.type
            }
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment.',
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
