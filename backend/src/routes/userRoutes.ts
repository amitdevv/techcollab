import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  createUser,
  checkUsername
} from '../controllers/userController';
import { setupUserProfile } from '../controllers/profileController';
import upload from '../middleware/uploadMiddleware';

const router = express.Router();

// Public routes
router.post('/', createUser);
router.post('/setup', setupUserProfile);
router.get('/check-username/:username', checkUsername);

// Protected routes
router.get('/:id', protect, getUserProfile);
router.put('/:id', protect, updateUserProfile);
router.put('/:id/picture', protect, updateProfilePicture);

export default router;
