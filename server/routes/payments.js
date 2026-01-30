import express from 'express';
import {
    createSubscription,
    verifySubscription,
    getMyPayments,
    razorpayWebhook,
    getAllPayments,
    activateFreeTrial
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

/**
 * @route   GET /api/payments/my-payments
 * @desc    Get current user's payment history
 * @access  Private
 */
router.get('/my-payments', authenticate, getMyPayments);

/**
 * @route   POST /api/payments/webhook
 * @desc    Razorpay webhook for payment events
 * @access  Public (verified by signature)
 */
router.post('/webhook', razorpayWebhook);

/**
 * @route   GET /api/payments/admin/all
 * @desc    Get all payments (Admin only)
 * @access  Private (Admin)
 */
router.get('/admin/all', authenticate, isAdmin, getAllPayments);

export default router;
