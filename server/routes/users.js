import express from 'express';
import {
    getUserProfile,
    getMyProfile,
    updateUserProfile,
    getUserTrips
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
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, updateUserProfile);

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
