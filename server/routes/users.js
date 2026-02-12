import express from 'express';
import {
    getUserProfile,
    getMyProfile,
    updateUserProfile,
    getUserTrips,
    submitVerificationRequest,
    deleteMyAccount,
    discoverUsers
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getMyProfile);

/**
 * @route   DELETE /api/users/me
 * @desc    Delete own account permanently
 * @access  Private
 */
router.delete('/me', authenticate, deleteMyAccount);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, updateUserProfile);

/**
 * @route   POST /api/users/verify-request
 * @desc    Submit ID verification
 * @access  Private
 */
router.post('/verify-request', authenticate, submitVerificationRequest);

/**
 * @route   GET /api/users/discover
 * @desc    Discover users for Explore page
 * @access  Private
 */
router.get('/discover', authenticate, discoverUsers);

/**
 * @route   GET /api/users/trips
 * @desc    Get user's trips
 * @access  Private
 */
router.get('/trips', authenticate, getUserTrips);

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID
 * @access  Public
 */
router.get('/:id', getUserProfile);

export default router;
