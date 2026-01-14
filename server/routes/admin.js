import express from 'express';
import {
    getConfig,
    updateConfig,
    toggleFeature,
    getAllUsers,
    getUserById,
    blockUser,
    updateUserRole,
    getPlatformStats
} from '../controllers/adminController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);

/**
 * @route   GET /api/admin/config
 * @desc    Get global configuration
 * @access  Private (Admin only)
 */
router.get('/config', getConfig);

/**
 * @route   PUT /api/admin/config
 * @desc    Update global configuration (turn Ads ON/OFF, etc.)
 * @access  Private (Admin only)
 */
router.put('/config', updateConfig);

/**
 * @route   PATCH /api/admin/config/toggle/:feature
 * @desc    Toggle specific feature
 * @access  Private (Admin only)
 */
router.patch('/config/toggle/:feature', toggleFeature);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and filters
 * @access  Private (Admin only)
 */
router.get('/users', getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID with statistics
 * @access  Private (Admin only)
 */
router.get('/users/:id', getUserById);

/**
 * @route   PUT /api/admin/users/:id/block
 * @desc    Block or unblock a user
 * @access  Private (Admin only)
 */
router.put('/users/:id/block', blockUser);

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role (user, guide, admin)
 * @access  Private (Admin only)
 */
router.put('/users/:id/role', updateUserRole);

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform statistics
 * @access  Private (Admin only)
 */
router.get('/stats', getPlatformStats);

export default router;
