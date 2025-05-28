import express from 'express';
import {
  verifyToken,
  googleAuth
} from '../controllers/newAuthController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Google OAuth authentication route
router.post('/google', googleAuth);

// Protected route to verify JWT token
router.get('/verify', protect, verifyToken);

export default router;
