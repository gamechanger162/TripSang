import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getConversations,
    getOrCreateConversation,
    getMessageHistory,
    markConversationAsRead,
    getUnreadCount
} from '../controllers/messageController.js';

const router = express.Router();

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations for logged-in user
 * @access  Private
 */
router.get('/conversations', authenticate, getConversations);

/**
 * @route   GET /api/messages/conversation/:userId
 * @desc    Get or create conversation with specific user
 * @access  Private
 */
router.get('/conversation/:userId', authenticate, getOrCreateConversation);

/**
 * @route   GET /api/messages/:conversationId/history
 * @desc    Get message history for conversation
 * @access  Private
 */
router.get('/:conversationId/history', authenticate, getMessageHistory);

/**
 * @route   POST /api/messages/mark-read
 * @desc    Mark conversation as read
 * @access  Private
 */
router.post('/mark-read', authenticate, markConversationAsRead);

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get total unread message count
 * @access  Private
 */
router.get('/unread-count', authenticate, getUnreadCount);

export default router;
