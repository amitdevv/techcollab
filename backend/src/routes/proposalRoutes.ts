import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  submitProposal,
  getGigProposals,
  getUserProposals,
  acceptProposal,
  rejectProposal,
  withdrawProposal,
  getProposalStats
} from '../controllers/proposalController';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Proposal management routes
router.post('/gig/:gigId', submitProposal); // Submit proposal for a gig
router.get('/gig/:gigId', getGigProposals); // Get all proposals for a gig (gig owners)
router.get('/user/my-proposals', getUserProposals); // Get user's proposals (freelancers)
router.get('/user/stats', getProposalStats); // Get proposal statistics

// Proposal action routes
router.put('/:proposalId/accept', acceptProposal); // Accept a proposal (gig owners)
router.put('/:proposalId/reject', rejectProposal); // Reject a proposal (gig owners)
router.put('/:proposalId/withdraw', withdrawProposal); // Withdraw a proposal (freelancers)

export default router; 