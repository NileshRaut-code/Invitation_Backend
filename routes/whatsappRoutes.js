import express from 'express';
import {
    getGuestList,
    saveGuestList,
    sendBlast,
} from '../controllers/whatsappController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/guests/:invitationId', getGuestList);
router.put('/guests/:invitationId', saveGuestList);
router.post('/blast/:invitationId', sendBlast);

export default router;
