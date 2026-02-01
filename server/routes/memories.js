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

// Gallery / Feed route
router.get('/memories/feed', getAllMemories);

// Trip memories routes
router.get('/trips/:tripId/memories', getTripMemories);
router.post('/trips/:tripId/memories', authenticate, checkPremium, createMemory);

// Memory interaction routes
router.post('/memories/:memoryId/like', authenticate, checkPremium, toggleMemoryLike);
router.post('/memories/:memoryId/comments', authenticate, checkPremium, addComment);
router.delete('/memories/:memoryId/comments/:commentId', authenticate, checkPremium, deleteComment);
router.delete('/memories/:memoryId', authenticate, deleteMemory);

export default router;
