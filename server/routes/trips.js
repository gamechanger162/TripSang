import express from 'express';
import {
    createTrip,
    searchTrips,
    getTripById,
    updateTrip,
    deleteTrip,
    joinTrip,
    leaveTrip,
    toggleLike
} from '../controllers/tripController.js';
import { authenticate, optionalAuth, requireMobileVerification } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/trips/create
 * @desc    Create a new trip
 * @access  Private
 */
router.post('/create', authenticate, createTrip);

/**
 * @route   GET /api/trips/search
 * @desc    Search trips with filters (start, end, date, tags)
 * @access  Public (optional auth for personalization)
 */
router.get('/search', optionalAuth, searchTrips);

/**
 * @route   GET /api/trips/:id
 * @desc    Get trip by ID
 * @access  Public (optional auth for view tracking)
 */
router.get('/:id', optionalAuth, getTripById);

/**
 * @route   PUT /api/trips/:id
 * @desc    Update trip (creator only)
 * @access  Private
 */
router.put('/:id', authenticate, updateTrip);

/**
 * @route   DELETE /api/trips/:id
 * @desc    Delete trip (creator or admin only)
 * @access  Private
 */
router.delete('/:id', authenticate, deleteTrip);

/**
 * @route   POST /api/trips/:id/join
 * @desc    Join a trip squad
 * @access  Private
 */
router.post('/:id/join', authenticate, joinTrip);

/**
 * @route   POST /api/trips/:id/leave
 * @desc    Leave a trip squad
 * @access  Private
 */
router.post('/:id/leave', authenticate, leaveTrip);

/**
 * @route   POST /api/trips/:id/like
 * @desc    Like or unlike a trip
 * @access  Private
 */
router.post('/:id/like', authenticate, toggleLike);

export default router;
