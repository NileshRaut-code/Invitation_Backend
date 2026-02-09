import express from 'express';
import {
    createOrder,
    verifyPayment,
    getMyPayments,
    getAllPayments,
} from '../controllers/paymentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/my-payments', getMyPayments);
router.get('/all', admin, getAllPayments);

export default router;
