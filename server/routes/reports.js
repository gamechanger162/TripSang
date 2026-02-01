import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
    createUserReport,
    getAllReports,
    updateReportStatus,
    getUserReports
} from '../controllers/reportController.js';

const router = express.Router();

// Public routes (protected by authentication)
router.post('/user', protect, createUserReport);

// Admin routes
router.get('/', protect, adminOnly, getAllReports);
router.get('/user/:userId', protect, adminOnly, getUserReports);
router.put('/:reportId/status', protect, adminOnly, updateReportStatus);

export default router;
