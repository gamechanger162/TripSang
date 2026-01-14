import express from 'express';
import {
    createSignupOrder,
    verifyPayment,
    getMyPayments,
    razorpayWebhook,
    getAllPayments
} from '../controllers/paymentController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/payments/create-order
 * @desc    Create Razorpay order for signup fee
 * @access  Private
 * 
 * Checks GlobalConfig:
 * - If enablePaidSignup = false, returns { skipped: true }
 * - If enablePaidSignup = true, creates Razorpay order
 */
router.post('/create-order', authenticate, createSignupOrder);

/**
 * @route   POST /api/payments/verify-payment
 * @desc    Verify Razorpay payment signature
 * @access  Private
 */
router.post('/verify-payment', authenticate, verifyPayment);

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
