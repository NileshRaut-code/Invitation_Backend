import express from 'express';
import {
    submitRSVP,
    getRSVPsByInvitation,
    exportRSVPsCSV,
} from '../controllers/rsvpController.js';
import { protect } from '../middleware/authMiddleware.js';
import { rsvpLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public route for submitting RSVP (with rate limiting)
router.post('/', rsvpLimiter, submitRSVP);

// Protected routes
router.get('/invitation/:invitationId', protect, getRSVPsByInvitation);
router.get('/invitation/:invitationId/export', protect, exportRSVPsCSV);

export default router;
