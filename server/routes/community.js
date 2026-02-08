import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    requirePremium,
    getMyCommunities,
    discoverCommunities,
    createCommunity,
    getCommunityDetails,
    getCommunityMessages,
    sendCommunityMessage,
    joinCommunity,
    requestToJoin,
    leaveCommunity,
    updateCommunitySettings,
    removeMember,
    approveRequest,
    rejectRequest,
    deleteCommunity
} from '../controllers/communityController.js';

const router = express.Router();

// All community routes require authentication
router.use(authenticate);

// All community routes require premium membership
router.use(requirePremium);

// Get user's communities
router.get('/', getMyCommunities);

// Discover public communities
router.get('/discover', discoverCommunities);

// Create new community
router.post('/create', createCommunity);

// Get specific community details
router.get('/:id', getCommunityDetails);

// Get community messages
router.get('/:id/messages', getCommunityMessages);

// Send community message
router.post('/:id/messages', sendCommunityMessage);

// Join public community
router.post('/:id/join', joinCommunity);

// Request to join private community
router.post('/:id/request', requestToJoin);

// Leave community
router.post('/:id/leave', leaveCommunity);

// Update community settings (admin only)
router.put('/:id/settings', updateCommunitySettings);

// Remove member (admin only)
router.delete('/:id/members/:userId', removeMember);

// Approve join request (admin only)
router.put('/:id/requests/:userId/approve', approveRequest);

// Reject join request (admin only)
router.put('/:id/requests/:userId/reject', rejectRequest);

// Delete community (admin only)
router.delete('/:id', deleteCommunity);

export default router;
