import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    requirePremium,
    getMyCommunities,
    discoverCommunities,
    createCommunity,
    getCommunityDetails,
    getCommunityMessages,
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
router.post('/:id/messages', async (req, res) => {
    try {
        const { id: communityId } = req.params;
        const { message, type = 'text', imageUrl } = req.body;
        const userId = req.user._id;

        const { Community, CommunityMessage } = await import('../models/index.js');

        // Verify user is a member
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ success: false, message: 'Community not found' });
        }

        const isMember = community.members.includes(userId);
        if (!isMember) {
            return res.status(403).json({ success: false, message: 'You must be a member to send messages' });
        }

        // Create message
        const newMessage = await CommunityMessage.create({
            communityId,
            senderId: userId,
            message,
            type,
            imageUrl
        });

        const populatedMessage = await CommunityMessage.findById(newMessage._id)
            .populate('senderId', 'name profilePicture');

        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error('Send community message error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

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
