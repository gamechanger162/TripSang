import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    unfriend,
    getFriends,
    getPendingRequests,
    getSentRequests,
    getFriendshipStatus,
    getFriendsCount,
    getPendingRequestsCount
} from '../controllers/friendshipController.js';

const router = express.Router();

/**
 * @route   GET /api/friends
 * @desc    Get all friends
 * @access  Private
 */
router.get('/', authenticate, getFriends);

/**
 * @route   GET /api/friends/requests/pending
 * @desc    Get pending friend requests (received)
 * @access  Private
 */
router.get('/requests/pending', authenticate, getPendingRequests);

/**
 * @route   GET /api/friends/requests/sent
 * @desc    Get sent friend requests
 * @access  Private
 */
router.get('/requests/sent', authenticate, getSentRequests);

/**
 * @route   GET /api/friends/requests/count
 * @desc    Get pending requests count
 * @access  Private
 */
router.get('/requests/count', authenticate, getPendingRequestsCount);

/**
 * @route   GET /api/friends/status/:userId
 * @desc    Get friendship status with a specific user
 * @access  Private
 */
router.get('/status/:userId', authenticate, getFriendshipStatus);

/**
 * @route   GET /api/friends/count/:userId
 * @desc    Get friends count for a user
 * @access  Public
 */
router.get('/count/:userId', getFriendsCount);

/**
 * @route   POST /api/friends/request/:userId
 * @desc    Send a friend request
 * @access  Private
 */
router.post('/request/:userId', authenticate, sendFriendRequest);

/**
 * @route   POST /api/friends/accept/:userId
 * @desc    Accept a friend request
 * @access  Private
 */
router.post('/accept/:userId', authenticate, acceptFriendRequest);

/**
 * @route   POST /api/friends/decline/:userId
 * @desc    Decline a friend request
 * @access  Private
 */
router.post('/decline/:userId', authenticate, declineFriendRequest);

/**
 * @route   DELETE /api/friends/cancel/:userId
 * @desc    Cancel a sent friend request
 * @access  Private
 */
router.delete('/cancel/:userId', authenticate, cancelFriendRequest);

/**
 * @route   DELETE /api/friends/:userId
 * @desc    Unfriend a user
 * @access  Private
 */
router.delete('/:userId', authenticate, unfriend);

export default router;
