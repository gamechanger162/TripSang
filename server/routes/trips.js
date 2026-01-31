import express from 'express';
import {
    createTrip,
    searchTrips,
    getTripById,
    getTripByCode,
    updateTrip,
    deleteTrip,
    joinTrip,
    leaveTrip,
    removeMember,
    toggleLike,
    getTrendingDestinations
} from '../controllers/tripController.js';
import { authenticate, optionalAuth, requireMobileVerification } from '../middleware/auth.js';
import { checkPremium } from '../middleware/checkPremium.js';

const router = express.Router();

/**
 * @route   GET /api/trips/trending
 * @desc    Get trending destinations
 * @access  Public
 */
router.get('/trending', getTrendingDestinations);

/**
 * @route   POST /api/trips/create
 * @desc    Create a new trip
 * @access  Private
 */
router.post('/create', authenticate, checkPremium, createTrip);

/**
 * @route   GET /api/trips/search
 * @desc    Search trips with filters (start, end, date, tags)
 * @access  Public (optional auth for personalization)
 */
router.get('/search', authenticate, searchTrips);

/**
 * @route   GET /api/trips/code/:code
 * @desc    Get trip by unique code
 * @access  Public
 */
router.get('/code/:code', optionalAuth, getTripByCode);

/**
 * @route   GET /api/trips/:id
 * @desc    Get trip by ID
 * @access  Public (optional auth for view tracking)
 */
router.get('/:id', authenticate, getTripById);

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
router.post('/:id/join', authenticate, checkPremium, joinTrip);

/**
 * @route   POST /api/trips/:id/leave
 * @desc    Leave a trip squad
 * @access  Private
 */
router.post('/:id/leave', authenticate, leaveTrip);

/**
 * @route   POST /api/trips/:id/remove-member
 * @desc    Remove a member from the squad
 * @access  Private
 */
router.post('/:id/remove-member', authenticate, removeMember);

/**
 * @route   POST /api/trips/:id/like
 * @desc    Like or unlike a trip
 * @access  Private
 */
router.post('/:id/like', authenticate, checkPremium, toggleLike);

export default router;
