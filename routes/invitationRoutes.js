import express from 'express';
import {
    createInvitation,
    getMyInvitations,
    getInvitationById,
    updateInvitation,
    deleteInvitation,
    uploadInvitationImage,
    getPublicInvitation,
    toggleInvitationStatus,
} from '../controllers/invitationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for viewing invitations
router.get('/public/:slug', getPublicInvitation);

// Protected routes
router.use(protect);

router.route('/')
    .get(getMyInvitations)
    .post(createInvitation);

router.post('/upload', uploadInvitationImage);

router.route('/:id')
    .get(getInvitationById)
    .put(updateInvitation)
    .delete(deleteInvitation);

router.put('/:id/status', toggleInvitationStatus);

export default router;
