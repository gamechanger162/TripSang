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

export default router;
