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
    getTrendingDestinations,
    getMyTrips
} from '../controllers/tripController.js';
import { getTripMemories, createMemory } from '../controllers/memoryController.js';
import { authenticate, optionalAuth, requireMobileVerification } from '../middleware/auth.js';
import { checkPremium } from '../middleware/checkPremium.js';
import { Trip, Message } from '../models/index.js';

const router = express.Router();

/**
 * @route   GET /api/trips/my-trips
 * @desc    Get current user's trips (created and joined)
 * @access  Private
 */
router.get('/my-trips', authenticate, getMyTrips);

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
router.get('/search', optionalAuth, searchTrips);

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

/**
 * @route   GET /api/trips/:id/memories
 * @desc    Get memories for a trip
 * @access  Public
 */
router.get('/:id/memories', getTripMemories);

/**
 * @route   POST /api/trips/:id/memories
 * @desc    Create a memory for a trip
 * @access  Private
 */
router.post('/:id/memories', authenticate, checkPremium, createMemory);

/**
 * @route   GET /api/trips/:tripId/chat
 * @desc    Get squad chat messages for a trip
 * @access  Private (members only)
 */
router.get('/:tripId/chat', authenticate, async (req, res) => {
    try {
        const { tripId } = req.params;
        const userId = req.user._id;

        // Verify trip exists and user is a member
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }

        const isMember = trip.squadMembers.some(id => id.toString() === userId.toString());
        const isCreator = trip.creator.toString() === userId.toString();

        if (!isMember && !isCreator) {
            return res.status(403).json({ success: false, message: 'You must be a squad member to view chat' });
        }

        // Fetch messages with populated sender info
        const messages = await Message.find({ tripId })
            .populate('senderId', 'name profilePicture')
            .populate('replyTo', 'senderName message type imageUrl')
            .sort({ timestamp: 1 })
            .limit(200);

        // Get pinned message if exists
        let pinnedMessage = null;
        if (trip.pinnedMessage) {
            pinnedMessage = await Message.findById(trip.pinnedMessage)
                .populate('senderId', 'name profilePicture');
        }

        res.json({
            success: true,
            messages,
            trip: {
                title: trip.title,
                coverPhoto: trip.coverPhoto,
                _id: trip._id,
                creator: trip.creator, // Return creator ID
                // Include location for map integration
                startPoint: trip.startPoint,
                endPoint: trip.endPoint,
                waypoints: trip.waypoints || []
            },
            pinnedMessage: pinnedMessage ? {
                _id: pinnedMessage._id,
                message: pinnedMessage.message,
                senderName: pinnedMessage.senderId?.name || pinnedMessage.senderName,
                type: pinnedMessage.type,
                imageUrl: pinnedMessage.imageUrl,
                timestamp: pinnedMessage.timestamp,
                pinnedBy: trip.pinnedBy // Return who pinned it
            } : null
        });
    } catch (error) {
        console.error('Get squad chat error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch chat messages' });
    }
});

export default router;
