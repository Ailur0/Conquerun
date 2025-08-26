import { Router } from 'express';
import { updateProfile, changePassword } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, updateProfile);

// @route   PUT /api/user/password
// @desc    Change user password
// @access  Private
router.put('/password', authMiddleware, changePassword);

export default router;
