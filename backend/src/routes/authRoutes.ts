import express from 'express';
import {
  registerUser,
  loginUser,
  verifyToken,
  googleAuth,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerificationEmail
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/reset-password', requestPasswordReset);
router.post('/reset-password/confirm', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Protected routes
router.get('/verify', protect, verifyToken);

export default router;
