import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  createUser
} from '../controllers/userController';
import { getUserStats, refreshUserStats } from '../controllers/statsController';
import { getTopFreelancers } from '../controllers/gigController';
import { setupUserProfile } from '../controllers/profileController';
import upload from '../middleware/uploadMiddleware';

const router = express.Router();

// Public routes
router.post('/', createUser);
router.post('/setup', setupUserProfile);
router.get('/top-freelancers', getTopFreelancers);

// Protected routes
router.get('/:id', protect, getUserProfile);
router.put('/:id', protect, updateUserProfile);
router.put('/:id/picture', protect, updateProfilePicture);

// Stats routes
router.get('/:id/stats', protect, getUserStats);
router.post('/:id/stats/refresh', protect, refreshUserStats);

export default router;
