import { Request, Response } from 'express';
import { Draft, IDraft } from '../models/Draft';
import { AuthRequest } from '../types/auth';

// Get all drafts for a user
export const getUserDrafts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { type } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const filter: any = { user: userId };
    if (type && (type === 'event' || type === 'gig')) {
      filter.type = type;
    }

    const drafts = await Draft.find(filter)
      .sort({ lastModified: -1 })
      .select('_id type title lastModified createdAt');

    res.json(drafts);
  } catch (error) {
    console.error('Error fetching user drafts:', error);
    res.status(500).json({ message: 'Failed to fetch drafts' });
  }
};

// Get a specific draft by ID
export const getDraftById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const draft = await Draft.findOne({ _id: id, user: userId });

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    res.json(draft);
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({ message: 'Failed to fetch draft' });
  }
};

// Save or update a draft
export const saveDraft = async (req: AuthRequest, res: Response) => {
  try {
    const { type, title, data } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!type || !title || !data) {
      return res.status(400).json({ message: 'Type, title, and data are required' });
    }

    if (type !== 'event' && type !== 'gig') {
      return res.status(400).json({ message: 'Type must be either "event" or "gig"' });
    }

    // Check if draft with same title and type already exists for this user
    const existingDraft = await Draft.findOne({
      user: userId,
      type,
      title: title.trim()
    });

    let draft: IDraft;

    if (existingDraft) {
      // Update existing draft
      existingDraft.data = data;
      existingDraft.lastModified = new Date();
      draft = await existingDraft.save();
    } else {
      // Create new draft
      draft = new Draft({
        user: userId,
        type,
        title: title.trim(),
        data
      });
      draft = await draft.save();
    }

    res.status(201).json({
      _id: draft._id,
      type: draft.type,
      title: draft.title,
      lastModified: draft.lastModified,
      createdAt: draft.createdAt
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ message: 'Failed to save draft' });
  }
};

// Update an existing draft
export const updateDraft = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, data } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const draft = await Draft.findOne({ _id: id, user: userId });

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    if (title) draft.title = title.trim();
    if (data) draft.data = data;
    draft.lastModified = new Date();

    await draft.save();

    res.json({
      _id: draft._id,
      type: draft.type,
      title: draft.title,
      lastModified: draft.lastModified,
      createdAt: draft.createdAt
    });
  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({ message: 'Failed to update draft' });
  }
};

// Delete a draft
export const deleteDraft = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const draft = await Draft.findOneAndDelete({ _id: id, user: userId });

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    res.json({ message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ message: 'Failed to delete draft' });
  }
};

// Delete all drafts for a user (optional utility)
export const deleteAllUserDrafts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { type } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const filter: any = { user: userId };
    if (type && (type === 'event' || type === 'gig')) {
      filter.type = type;
    }

    const result = await Draft.deleteMany(filter);

    res.json({ 
      message: 'Drafts deleted successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting drafts:', error);
    res.status(500).json({ message: 'Failed to delete drafts' });
  }
}; 