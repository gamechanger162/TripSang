import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    createReview,
    getUserReviews,
    getPendingReviews,
    deleteReview
} from '../controllers/reviewController.js';

const router = express.Router();

// Create review (requires authentication)
router.post('/create', authenticate, createReview);
router.get('/pending', authenticate, getPendingReviews);
router.get('/user/:userId', getUserReviews); // Public - anyone can see reviews
router.delete('/:id', authenticate, deleteReview);

export default router;
