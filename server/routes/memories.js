import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getTripMemories,
    createMemory,
    toggleMemoryLike,
    addComment,
    deleteMemory,
    getAllMemories
} from '../controllers/memoryController.js';

const router = express.Router();

// Gallery / Feed route
router.get('/memories/feed', getAllMemories);

// Trip memories routes
router.get('/trips/:tripId/memories', getTripMemories);
router.post('/trips/:tripId/memories', authenticate, createMemory);

// Memory interaction routes
router.post('/memories/:memoryId/like', authenticate, toggleMemoryLike);
router.post('/memories/:memoryId/comments', authenticate, addComment);
router.delete('/memories/:memoryId', authenticate, deleteMemory);

export default router;
