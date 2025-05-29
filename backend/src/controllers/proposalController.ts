import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { Proposal, IProposal } from '../models/Proposal';
import { Gig } from '../models/Gig';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import mongoose from 'mongoose';

// Submit a proposal for a gig
export const submitProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { gigId } = req.params;
    const { coverLetter, proposedPrice, deliveryTime, attachments = [] } = req.body;

    // Validate input
    if (!coverLetter || coverLetter.trim().length < 50) {
      res.status(400).json({ message: 'Cover letter must be at least 50 characters long' });
      return;
    }

    if (!proposedPrice || proposedPrice < 5) {
      res.status(400).json({ message: 'Proposed price must be at least $5' });
      return;
    }

    // Check if gig exists and is active
    const gig = await Gig.findById(gigId).populate('freelancer', 'name email');
    if (!gig) {
      res.status(404).json({ message: 'Gig not found' });
      return;
    }

    if (gig.status !== 'active') {
      res.status(400).json({ message: 'Cannot apply to inactive gig' });
      return;
    }

    // Check if user is not the gig owner
    if (gig.freelancer._id.toString() === req.user.id) {
      res.status(400).json({ message: 'Cannot apply to your own gig' });
      return;
    }

    // Check if user already submitted a proposal
    const existingProposal = await Proposal.findOne({
      gig: gigId,
      freelancer: req.user.id
    });

    if (existingProposal) {
      res.status(400).json({ message: 'You have already submitted a proposal for this gig' });
      return;
    }

    // Create proposal
    const proposal = await Proposal.create({
      gig: new mongoose.Types.ObjectId(gigId),
      freelancer: new mongoose.Types.ObjectId(req.user.id),
      coverLetter: coverLetter.trim(),
      proposedPrice: parseFloat(proposedPrice),
      deliveryTime,
      attachments,
      status: 'pending'
    });

    // Populate proposal data
    const populatedProposal = await Proposal.findById(proposal._id)
      .populate('freelancer', 'name email picture profile')
      .populate('gig', 'title price');

    // Create notification for gig owner
    await Notification.create({
      recipient: gig.freelancer._id,
      sender: new mongoose.Types.ObjectId(req.user.id),
      type: 'gig_proposal',
      title: 'New Proposal Received',
      message: `You received a new proposal for your gig "${gig.title}"`,
      data: {
        gigId: gig._id,
        proposalId: proposal._id,
        proposedPrice: proposedPrice
      }
    });

    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully',
      data: populatedProposal
    });

  } catch (error) {
    console.error('Error submitting proposal:', error);
    res.status(500).json({ message: 'Error submitting proposal' });
  }
};

// Get proposals for a specific gig (for gig owners)
export const getGigProposals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { gigId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Check if user owns the gig
    const gig = await Gig.findById(gigId);
    if (!gig) {
      res.status(404).json({ message: 'Gig not found' });
      return;
    }

    if (gig.freelancer.toString() !== req.user.id) {
      res.status(403).json({ message: 'Access denied - not your gig' });
      return;
    }

    // Build filter
    const filter: any = { gig: gigId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get proposals with pagination
    const proposals = await Proposal.find(filter)
      .populate('freelancer', 'name email picture profile stats')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Proposal.countDocuments(filter);

    res.json({
      success: true,
      data: {
        proposals,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching gig proposals:', error);
    res.status(500).json({ message: 'Error fetching proposals' });
  }
};

// Get user's proposals (for freelancers)
export const getUserProposals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { status, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter: any = { freelancer: req.user.id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get proposals with pagination
    const proposals = await Proposal.find(filter)
      .populate('gig', 'title price category deliveryTime status')
      .populate({
        path: 'gig',
        populate: {
          path: 'freelancer',
          select: 'name email picture'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Proposal.countDocuments(filter);

    res.json({
      success: true,
      data: {
        proposals,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user proposals:', error);
    res.status(500).json({ message: 'Error fetching proposals' });
  }
};

// Accept a proposal
export const acceptProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { proposalId } = req.params;
    const { clientMessage } = req.body;

    const proposal = await Proposal.findById(proposalId)
      .populate('freelancer', 'name email');

    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    // Get the gig separately to ensure proper typing
    const gig = await Gig.findById(proposal.gig);
    if (!gig) {
      res.status(404).json({ message: 'Associated gig not found' });
      return;
    }

    // Check if user owns the gig
    if (gig.freelancer.toString() !== req.user.id) {
      res.status(403).json({ message: 'Access denied - not your gig' });
      return;
    }

    if (proposal.status !== 'pending') {
      res.status(400).json({ message: 'Proposal is no longer pending' });
      return;
    }

    // Update proposal status
    proposal.status = 'accepted';
    if (clientMessage) {
      proposal.clientMessage = clientMessage.trim();
    }
    await proposal.save();

    // Reject all other proposals for this gig
    await Proposal.updateMany(
      { 
        gig: proposal.gig, 
        _id: { $ne: proposalId },
        status: 'pending'
      },
      { 
        status: 'rejected',
        clientMessage: 'Another proposal was accepted for this gig'
      }
    );

    // Create notification for freelancer
    await Notification.create({
      recipient: proposal.freelancer._id,
      sender: new mongoose.Types.ObjectId(req.user.id),
      type: 'proposal_accepted',
      title: 'Proposal Accepted!',
      message: `Your proposal for "${gig.title}" has been accepted!`,
      data: {
        gigId: gig._id,
        proposalId: proposal._id
      }
    });

    // Update gig status to paused (no more applications needed)
    await Gig.findByIdAndUpdate(proposal.gig, { status: 'paused' });

    res.json({
      success: true,
      message: 'Proposal accepted successfully',
      data: proposal
    });

  } catch (error) {
    console.error('Error accepting proposal:', error);
    res.status(500).json({ message: 'Error accepting proposal' });
  }
};

// Reject a proposal
export const rejectProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { proposalId } = req.params;
    const { clientMessage } = req.body;

    const proposal = await Proposal.findById(proposalId)
      .populate('freelancer', 'name email');

    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    // Get the gig separately to ensure proper typing
    const gig = await Gig.findById(proposal.gig);
    if (!gig) {
      res.status(404).json({ message: 'Associated gig not found' });
      return;
    }

    // Check if user owns the gig
    if (gig.freelancer.toString() !== req.user.id) {
      res.status(403).json({ message: 'Access denied - not your gig' });
      return;
    }

    if (proposal.status !== 'pending') {
      res.status(400).json({ message: 'Proposal is no longer pending' });
      return;
    }

    // Update proposal status
    proposal.status = 'rejected';
    if (clientMessage) {
      proposal.clientMessage = clientMessage.trim();
    }
    await proposal.save();

    // Create notification for freelancer
    await Notification.create({
      recipient: proposal.freelancer._id,
      sender: new mongoose.Types.ObjectId(req.user.id),
      type: 'proposal_rejected',
      title: 'Proposal Update',
      message: `Your proposal for "${gig.title}" was not selected`,
      data: {
        gigId: gig._id,
        proposalId: proposal._id
      }
    });

    res.json({
      success: true,
      message: 'Proposal rejected',
      data: proposal
    });

  } catch (error) {
    console.error('Error rejecting proposal:', error);
    res.status(500).json({ message: 'Error rejecting proposal' });
  }
};

// Withdraw a proposal (for freelancers)
export const withdrawProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { proposalId } = req.params;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    // Check if user owns the proposal
    if (proposal.freelancer.toString() !== req.user.id) {
      res.status(403).json({ message: 'Access denied - not your proposal' });
      return;
    }

    if (proposal.status !== 'pending') {
      res.status(400).json({ message: 'Can only withdraw pending proposals' });
      return;
    }

    // Update proposal status
    proposal.status = 'withdrawn';
    await proposal.save();

    res.json({
      success: true,
      message: 'Proposal withdrawn successfully',
      data: proposal
    });

  } catch (error) {
    console.error('Error withdrawing proposal:', error);
    res.status(500).json({ message: 'Error withdrawing proposal' });
  }
};

// Get proposal statistics for dashboard
export const getProposalStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Get freelancer stats
    const freelancerStats = await Proposal.aggregate([
      { $match: { freelancer: userId } },
      {
        $group: {
          _id: null,
          totalProposals: { $sum: 1 },
          pendingProposals: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          acceptedProposals: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          rejectedProposals: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          withdrawnProposals: { $sum: { $cond: [{ $eq: ['$status', 'withdrawn'] }, 1, 0] } },
          avgProposedPrice: { $avg: '$proposedPrice' }
        }
      }
    ]);

    // Get client stats (proposals received on their gigs)
    const clientStats = await Proposal.aggregate([
      {
        $lookup: {
          from: 'gigs',
          localField: 'gig',
          foreignField: '_id',
          as: 'gigInfo'
        }
      },
      { $unwind: '$gigInfo' },
      { $match: { 'gigInfo.freelancer': userId } },
      {
        $group: {
          _id: null,
          totalReceived: { $sum: 1 },
          pendingReceived: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          acceptedReceived: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          rejectedReceived: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    const result = {
      freelancer: freelancerStats[0] || {
        totalProposals: 0,
        pendingProposals: 0,
        acceptedProposals: 0,
        rejectedProposals: 0,
        withdrawnProposals: 0,
        avgProposedPrice: 0
      },
      client: clientStats[0] || {
        totalReceived: 0,
        pendingReceived: 0,
        acceptedReceived: 0,
        rejectedReceived: 0
      }
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching proposal stats:', error);
    res.status(500).json({ message: 'Error fetching proposal statistics' });
  }
}; 