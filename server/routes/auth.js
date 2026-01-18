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
import { authenticate } from '../middleware/auth.js';

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
