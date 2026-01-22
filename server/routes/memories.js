import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getTripMemories,
    createMemory,
    toggleMemoryLike,
    addComment,
    deleteMemory
} from '../controllers/memoryController.js';

const router = express.Router();

// Trip memories routes
router.get('/trips/:tripId/memories', getTripMemories);
router.post('/trips/:tripId/memories', protect, createMemory);

// Memory interaction routes
router.post('/memories/:memoryId/like', protect, toggleMemoryLike);
router.post('/memories/:memoryId/comments', protect, addComment);
router.delete('/memories/:memoryId', protect, deleteMemory);

export default router;
