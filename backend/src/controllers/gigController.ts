import { Request, Response } from 'express';
import { Gig } from '../models/Gig';
import { User } from '../models/User';
import { AuthRequest } from '../types/auth';
import mongoose from 'mongoose';

// Get all gigs with filtering and pagination
export const getGigs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      priceRange,
      sortBy = 'createdAt',
      search,
      status = 'active'
    } = req.query;

    // Build filter object
    const filter: any = { status };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (priceRange && priceRange !== 'all') {
      switch (priceRange) {
        case 'low':
          filter.price = { $lte: 300 };
          break;
        case 'medium':
          filter.price = { $gte: 300, $lte: 700 };
          break;
        case 'high':
          filter.price = { $gte: 700 };
          break;
      }
    }

    if (search) {
      filter.$text = { $search: search as string };
    }

    // Build sort object
    let sort: any = {};
    switch (sortBy) {
      case 'price-low':
        sort = { price: 1 };
        break;
      case 'price-high':
        sort = { price: -1 };
        break;
      case 'rating':
        sort = { rating: -1, reviews: -1 };
        break;
      case 'relevance':
        sort = search ? { score: { $meta: 'textScore' } } : { createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const gigs = await Gig.find(filter)
      .populate('freelancer', 'name username picture profile.location')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Gig.countDocuments(filter);

    res.json({
      gigs,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalGigs: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error in getGigs:', error);
    res.status(500).json({ message: 'Error fetching gigs' });
  }
};

// Get gig by ID
export const getGigById = async (req: Request, res: Response): Promise<void> => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('freelancer', 'name username picture profile bio createdAt');

    if (!gig) {
      res.status(404).json({ message: 'Gig not found' });
      return;
    }

    // Increment view count
    await Gig.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json(gig);
  } catch (error) {
    console.error('Error in getGigById:', error);
    res.status(500).json({ message: 'Error fetching gig' });
  }
};

// Create new gig
export const createGig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { title, description, category, subCategory, price, deliveryTime, tags, images } = req.body;

    const gig = await Gig.create({
      title,
      description,
      category,
      subCategory,
      price: parseFloat(price),
      deliveryTime,
      tags: tags || [],
      images: images || [],
      freelancer: new mongoose.Types.ObjectId(req.user.id),
      status: 'active'
    });

    await gig.populate('freelancer', 'name username picture profile.location');

    // Update user's active gigs count
    await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.activeGigs': 1 } });

    res.status(201).json(gig);
  } catch (error) {
    console.error('Error in createGig:', error);
    res.status(500).json({ message: 'Error creating gig' });
  }
};

// Update gig
export const updateGig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      res.status(404).json({ message: 'Gig not found' });
      return;
    }

    // Check if user owns the gig
    if (gig.freelancer.toString() !== req.user.id) {
      res.status(403).json({ message: 'Not authorized to update this gig' });
      return;
    }

    const { title, description, category, subCategory, price, deliveryTime, tags, images, status } = req.body;

    const updatedGig = await Gig.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        category,
        subCategory,
        price: price ? parseFloat(price) : gig.price,
        deliveryTime,
        tags,
        images,
        status
      },
      { new: true, runValidators: true }
    ).populate('freelancer', 'name username picture profile.location');

    res.json(updatedGig);
  } catch (error) {
    console.error('Error in updateGig:', error);
    res.status(500).json({ message: 'Error updating gig' });
  }
};

// Delete gig
export const deleteGig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      res.status(404).json({ message: 'Gig not found' });
      return;
    }

    // Check if user owns the gig
    if (gig.freelancer.toString() !== req.user.id) {
      res.status(403).json({ message: 'Not authorized to delete this gig' });
      return;
    }

    await Gig.findByIdAndDelete(req.params.id);

    // Update user's active gigs count
    if (gig.status === 'active') {
      await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.activeGigs': -1 } });
    }

    res.json({ message: 'Gig deleted successfully' });
  } catch (error) {
    console.error('Error in deleteGig:', error);
    res.status(500).json({ message: 'Error deleting gig' });
  }
};

// Get user's gigs
export const getUserGigs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { status } = req.query;
    const filter: any = { freelancer: new mongoose.Types.ObjectId(req.user.id) };

    if (status && status !== 'all') {
      filter.status = status;
    }

    const gigs = await Gig.find(filter)
      .sort({ createdAt: -1 })
      .populate('freelancer', 'name username picture profile.location');

    res.json(gigs);
  } catch (error) {
    console.error('Error in getUserGigs:', error);
    res.status(500).json({ message: 'Error fetching user gigs' });
  }
};

// Save gig as draft
export const saveGigDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { title, description, category, subCategory, price, deliveryTime, tags, images } = req.body;

    const gig = await Gig.create({
      title,
      description,
      category,
      subCategory,
      price: price ? parseFloat(price) : 0,
      deliveryTime,
      tags: tags || [],
      images: images || [],
      freelancer: new mongoose.Types.ObjectId(req.user.id),
      status: 'draft'
    });

    await gig.populate('freelancer', 'name username picture profile.location');

    res.status(201).json(gig);
  } catch (error) {
    console.error('Error in saveGigDraft:', error);
    res.status(500).json({ message: 'Error saving gig draft' });
  }
};

// Get gig analytics for freelancer
export const getGigAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const freelancerId = new mongoose.Types.ObjectId(req.user.id);

    const analytics = await Gig.aggregate([
      { $match: { freelancer: freelancerId } },
      {
        $group: {
          _id: null,
          totalGigs: { $sum: 1 },
          activeGigs: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          totalViews: { $sum: '$views' },
          totalOrders: { $sum: '$orders' },
          avgRating: { $avg: '$rating' },
          totalRevenue: { $sum: { $multiply: ['$orders', '$price'] } }
        }
      }
    ]);

    const result = analytics[0] || {
      totalGigs: 0,
      activeGigs: 0,
      totalViews: 0,
      totalOrders: 0,
      avgRating: 0,
      totalRevenue: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Error in getGigAnalytics:', error);
    res.status(500).json({ message: 'Error fetching gig analytics' });
  }
};
