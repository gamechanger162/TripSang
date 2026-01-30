
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

        // Allow purchasing one-time even if they had a trial, but not if they are already active
        if (user.subscription.status === 'active') {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription.'
            });
        }

        const amount = 3000; // ₹30.00
        const currency = 'INR';

        const options = {
            amount: amount,
            currency: currency,
            receipt: `receipt_${userId}_${Date.now()}`,
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
        console.error('Create order error:', error);
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
