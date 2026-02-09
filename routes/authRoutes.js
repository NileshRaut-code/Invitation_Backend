import express from 'express';
import {
    authUser,
    registerUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    getUsers,
    forgotPassword,
    resetPassword,
    refreshAccessToken,
    changePassword,
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public auth routes with stricter rate limiting
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, authUser);
router.post('/logout', logoutUser);
router.post('/refresh', refreshAccessToken);
router.post('/forgotpassword', passwordResetLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', passwordResetLimiter, resetPassword);

// Protected routes
router
    .route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.put('/password', protect, changePassword);

// Admin routes
router.route('/users').get(protect, admin, getUsers);

export default router;
