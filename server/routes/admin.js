import express from 'express';
import {
    getConfig,
    updateConfig,
    toggleFeature,
    getAllUsers,
    getUserById,
    blockUser,
    updateUserRole,
    getPlatformStats,
    getAllTrips,
    deleteTrip,
    grantPremium
} from '../controllers/adminController.js';
import {
    createAnnouncement,
    getAllAnnouncements,
    updateAnnouncement,
    deleteAnnouncement,
    toggleAnnouncement
} from '../controllers/announcementController.js';
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
 * @route   POST /api/admin/users/:id/grant-premium
 * @desc    Manually grant premium status
 * @access  Private (Admin only)
 */
router.post('/users/:id/grant-premium', grantPremium);

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform statistics
 * @access  Private (Admin only)
 */
router.get('/stats', getPlatformStats);

/**
 * @route   GET /api/admin/trips
 * @desc    Get all trips with filters
 * @access  Private (Admin only)
 */
router.get('/trips', getAllTrips);

/**
 * @route   DELETE /api/admin/trips/:id
 * @desc    Delete a trip (admin override)
 * @access  Private (Admin only)
 */
router.delete('/trips/:id', deleteTrip);

/**
 * ANNOUNCEMENT ROUTES
 */

/**
 * @route   POST /api/admin/announcements
 * @desc    Create new announcement
 * @access  Private (Admin only)
 */
router.post('/announcements', createAnnouncement);

/**
 * @route   GET /api/admin/announcements
 * @desc    Get all announcements
 * @access  Private (Admin only)
 */
router.get('/announcements', getAllAnnouncements);

/**
 * @route   PUT /api/admin/announcements/:id
 * @desc    Update announcement
 * @access  Private (Admin only)
 */
router.put('/announcements/:id', updateAnnouncement);

/**
 * @route   DELETE /api/admin/announcements/:id
 * @desc    Delete announcement
 * @access  Private (Admin only)
 */
router.delete('/announcements/:id', deleteAnnouncement);

/**
 * @route   PATCH /api/admin/announcements/:id/toggle
 * @desc    Toggle announcement active status
 * @access  Private (Admin only)
 */
router.patch('/announcements/:id/toggle', toggleAnnouncement);

export default router;
