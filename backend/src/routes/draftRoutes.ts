import express from 'express';
import {
  getUserDrafts,
  getDraftById,
  saveDraft,
  updateDraft,
  deleteDraft,
  deleteAllUserDrafts
} from '../controllers/draftController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/drafts - Get all drafts for the authenticated user
router.get('/', getUserDrafts);

// GET /api/drafts/:id - Get a specific draft by ID
router.get('/:id', getDraftById);

// POST /api/drafts - Save a new draft or update existing one with same title/type
router.post('/', saveDraft);

// PUT /api/drafts/:id - Update an existing draft
router.put('/:id', updateDraft);

// DELETE /api/drafts/:id - Delete a specific draft
router.delete('/:id', deleteDraft);

// DELETE /api/drafts - Delete all drafts (with optional type filter)
router.delete('/', deleteAllUserDrafts);

export default router; 