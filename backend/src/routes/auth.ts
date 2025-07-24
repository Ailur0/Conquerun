import express from 'express';
import { register, login, profile } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateJWT, profile);

export default router;
