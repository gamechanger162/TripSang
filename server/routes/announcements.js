import express from 'express';
import { getActiveAnnouncement } from '../controllers/announcementController.js';

const router = express.Router();

/**
 * @route   GET /api/announcements/active
 * @desc    Get active announcement (public)
 * @access  Public
 */
router.get('/active', getActiveAnnouncement);

export default router;
