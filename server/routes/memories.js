import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkPremium } from '../middleware/checkPremium.js';
import {
    getTripMemories,
    createMemory,
    toggleMemoryLike,
    addComment,
    deleteComment,
    deleteMemory,
    getAllMemories
} from '../controllers/memoryController.js';

const router = express.Router();

// Gallery / Feed route - accessible at /api/memories/feed
router.get('/feed', getAllMemories);

// Memory interaction routes - accessible at /api/memories/:memoryId/...
router.post('/:memoryId/like', authenticate, checkPremium, toggleMemoryLike);
router.post('/:memoryId/comments', authenticate, checkPremium, addComment);
router.delete('/:memoryId/comments/:commentId', authenticate, checkPremium, deleteComment);
router.delete('/:memoryId', authenticate, deleteMemory);

export default router;
