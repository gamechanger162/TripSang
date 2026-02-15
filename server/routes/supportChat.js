import express from 'express';
import { authenticate, isAdmin } from '../middleware/auth.js';
import {
    createOrGetChat,
    getMyChat,
    getAllChats,
    getChatById,
    closeChat,
    reopenChat
} from '../controllers/supportChatController.js';

const router = express.Router();

// User routes (authenticated)
router.post('/', authenticate, createOrGetChat);           // Create or get open chat
router.get('/my', authenticate, getMyChat);                 // Get my active support chat

// Admin routes (authenticated + admin)
router.get('/admin/all', authenticate, isAdmin, getAllChats);       // List all support chats
router.get('/admin/:id', authenticate, isAdmin, getChatById);      // Get specific chat
router.patch('/admin/:id/close', authenticate, isAdmin, closeChat);  // Close ticket
router.patch('/admin/:id/reopen', authenticate, isAdmin, reopenChat); // Reopen ticket

export default router;
