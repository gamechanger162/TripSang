import express from 'express';
import { contactSupport } from '../controllers/supportController.js';
// We might want to add rate limiting here to prevent spam, but assuming simple use case first.

const router = express.Router();

// POST /api/support/contact
router.post('/contact', contactSupport);

export default router;
