import express from 'express';
import { aiSearch, getSearchSuggestions } from '../controllers/aiSearchController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// AI search endpoint (protected)
router.post('/search', protect, aiSearch);

// Search suggestions endpoint (public)
router.get('/suggestions', getSearchSuggestions);

export default router; 