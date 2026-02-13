import express from 'express';
import {
    createSubscription,
    verifySubscription,
    getMyPayments,
    razorpayWebhook,
    getAllPayments,
    activateFreeTrial,
    createOrder,
    verifyOrder,
    getSubscriptionStatus
} from '../controllers/paymentController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/payments/create-subscription
 * @desc    Create Razorpay subscription for membership
 * @access  Private
 */
router.post('/create-subscription', authenticate, createSubscription);
router.post('/start-trial', authenticate, activateFreeTrial);

/**
 * @route   POST /api/payments/verify-subscription
 * @desc    Verify Razorpay subscription signature
 * @access  Private
 */
router.post('/verify-subscription', authenticate, verifySubscription);

router.post('/create-order', authenticate, createOrder);
router.post('/verify-order', authenticate, verifyOrder);

/**
 * @route   GET /api/payments/my-payments
 * @desc    Get current user's payment history
 * @access  Private
 */
router.get('/my-payments', authenticate, getMyPayments);

/**
 * @route   GET /api/payments/status
 * @desc    Get current user's subscription status
 * @access  Private
 */
router.get('/status', authenticate, getSubscriptionStatus);


/**
 * @route   POST /api/payments/webhook
 * @desc    Razorpay webhook for payment events
 * @access  Public (verified by signature)
 */
router.post('/webhook', razorpayWebhook);

/**
 * @route   GET /api/payments/plans
 * @desc    Get active payment plans (Public)
 * @access  Public
 */
router.get('/plans', async (req, res) => {
    try {
        const { GlobalConfig } = await import('../models/index.js');
        const config = await GlobalConfig.getInstance();
        const activePlans = (config.paymentPlans || []).filter(p => p.isActive);
        res.json({
            success: true,
            plans: activePlans.map(p => ({
                _id: p._id,
                name: p.name,
                type: p.type,
                price: p.price / 100, // Convert paise to rupees for display
                currency: p.currency,
                durationDays: p.durationDays,
                features: p.features
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch plans' });
    }
});

/**
 * @route   GET /api/payments/admin/all
 * @desc    Get all payments (Admin only)
 * @access  Private (Admin)
 */
router.get('/admin/all', authenticate, isAdmin, getAllPayments);

export default router;
