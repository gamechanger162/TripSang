import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    createReview,
    getUserReviews,
    getPendingReviews,
    deleteReview
} from '../controllers/reviewController.js';

const router = express.Router();

// Protected routes (require authentication)
router.post('/create', protect, createReview);
router.get('/pending', protect, getPendingReviews);
router.get('/user/:userId', getUserReviews); // Public - anyone can see reviews
router.delete('/:id', protect, deleteReview);

export default router;
