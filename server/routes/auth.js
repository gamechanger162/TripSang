import express from 'express';
import {
    register,
    login,
    checkEmail,
    googleLogin,
    verifyMobile,
    getCurrentUser,
    logout
} from '../controllers/authController.js';
import { checkPhoneExists, phoneLogin } from '../controllers/phoneAuthController.js';
import { getLinkedProviders, linkPhone, linkGoogle, unlinkProvider } from '../controllers/accountLinkController.js';
import { authenticate } from '../middleware/auth.js';
import { otpRateLimiter, phoneLoginRateLimiter, linkAccountRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/check-email
 * @desc    Check if email exists
 * @access  Public
 */
router.post('/check-email', checkEmail);

/**
 * @route   POST /api/auth/google-login
 * @desc    Login with Google
 * @access  Public
 */
router.post('/google-login', googleLogin);

/**
 * @route   POST /api/auth/verify-mobile
 * @desc    Verify user's mobile number
 * @access  Private (requires authentication)
 */
router.post('/verify-mobile', authenticate, verifyMobile);

/**
 * @route   POST /api/auth/phone/check
 * @desc    Check if phone number exists (with rate limiting)
 * @access  Public
 */
router.post('/phone/check', otpRateLimiter, checkPhoneExists);

/**
 * @route   POST /api/auth/phone/login
 * @desc    Login with phone number after Firebase OTP verification (with rate limiting)
 * @access  Public
 */
router.post('/phone/login', phoneLoginRateLimiter, phoneLogin);

/**
 * @route   GET /api/auth/account/providers
 * @desc    Get all linked auth providers for current user
 * @access  Private
 */
router.get('/account/providers', authenticate, getLinkedProviders);

/**
 * @route   POST /api/auth/account/link-phone
 * @desc    Link phone number to existing account (with rate limiting)
 * @access  Private
 */
router.post('/account/link-phone', authenticate, linkAccountRateLimiter, linkPhone);

/**
 * @route   POST /api/auth/account/link-google
 * @desc    Link Google account to existing account
 * @access  Private
 */
router.post('/account/link-google', authenticate, linkGoogle);

/**
 * @route   POST /api/auth/account/unlink
 * @desc    Unlink an auth provider (must keep at least one)
 * @access  Private
 */
router.post('/account/unlink', authenticate, unlinkProvider);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   POST /api/auth/test-email
 * @desc    Test SMTP configuration (admin only)
 * @access  Private
 */
router.post('/test-email', authenticate, async (req, res) => {
    try {
        const { testSMTPConnection, sendEmail } = await import('../utils/email.js');

        // First test the connection
        const connectionTest = await testSMTPConnection();
        if (!connectionTest.success) {
            return res.status(500).json({
                success: false,
                message: 'SMTP connection failed',
                error: connectionTest.error
            });
        }

        // Send a test email to the logged-in user
        const result = await sendEmail({
            to: req.user.email,
            subject: '✅ TripSang Email Test',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Email Configuration Test</h2>
                    <p>If you're reading this, your SMTP is working correctly! 🎉</p>
                    <p>Sent at: ${new Date().toISOString()}</p>
                </div>
            `
        });

        if (result.success) {
            res.json({
                success: true,
                message: `Test email sent to ${req.user.email}`,
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send test email',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Email test failed',
            error: error.message
        });
    }
});

export default router;
