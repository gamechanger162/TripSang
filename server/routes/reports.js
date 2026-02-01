import express from 'express';
import { authenticate, isAdmin } from '../middleware/auth.js';
import {
    createUserReport,
    getAllReports,
    updateReportStatus,
    getUserReports
} from '../controllers/reportController.js';

const router = express.Router();

// Public routes (protected by authentication)
router.post('/user', authenticate, createUserReport);

// Admin routes
router.get('/', authenticate, isAdmin, getAllReports);
router.get('/user/:userId', authenticate, isAdmin, getUserReports);
router.put('/:reportId/status', authenticate, isAdmin, updateReportStatus);

export default router;
