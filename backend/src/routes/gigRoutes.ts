import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getGigs,
  getGigById,
  createGig,
  updateGig,
  deleteGig,
  getUserGigs,
  saveGigDraft,
  getGigAnalytics,
  getTrendingGigs
} from '../controllers/gigController';

const router = express.Router();

// Public routes
router.get('/', getGigs);
router.get('/trending', getTrendingGigs);
router.get('/:id', getGigById);

// Protected routes
router.post('/', protect, createGig);
router.post('/draft', protect, saveGigDraft);
router.put('/:id', protect, updateGig);
router.delete('/:id', protect, deleteGig);
router.get('/user/my-gigs', protect, getUserGigs);
router.get('/user/analytics', protect, getGigAnalytics);

export default router;
