import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkPremium } from '../middleware/checkPremium.js';
import {
    getConversations,
    getOrCreateConversation,
    getMessageHistory,
    markConversationAsRead,
    getUnreadCount,
    blockUser,
    unblockUser,
    getBlockStatus,
    getBlockedUsers,
    deleteMessage
} from '../controllers/messageController.js';

const router = express.Router();

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations for logged-in user
 * @access  Private
 */
// Removed checkPremium from all routes below
router.get('/conversations', authenticate, getConversations);
router.get('/blocked-users', authenticate, getBlockedUsers);
router.get('/block-status/:userId', authenticate, getBlockStatus);
router.get('/conversation/:userId', authenticate, getOrCreateConversation);
router.get('/:conversationId/history', authenticate, getMessageHistory);
router.post('/mark-read', authenticate, markConversationAsRead);
router.get('/unread-count', authenticate, getUnreadCount);
router.post('/block/:userId', authenticate, blockUser);
router.post('/unblock/:userId', authenticate, unblockUser);
router.delete('/:messageId', authenticate, deleteMessage);

export default router;
