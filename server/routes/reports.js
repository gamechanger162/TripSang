const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
    createUserReport,
    getAllReports,
    updateReportStatus,
    getUserReports
} = require('../controllers/reportController');

// Public routes (protected by authentication)
router.post('/user', protect, createUserReport);

// Admin routes
router.get('/', protect, adminOnly, getAllReports);
router.get('/user/:userId', protect, adminOnly, getUserReports);
router.put('/:reportId/status', protect, adminOnly, updateReportStatus);

module.exports = router;
