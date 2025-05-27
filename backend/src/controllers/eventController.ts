import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { Event, IEvent } from '../models/Event';
import { User } from '../models/User';
import mongoose from 'mongoose';

// Get all events with filtering and pagination
export const getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = { status: 'published' };

    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    // Date filter
    if (req.query.dateFilter) {
      const now = new Date();
      switch (req.query.dateFilter) {
        case 'today':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          filter.date = { $gte: today, $lt: tomorrow };
          break;
        case 'thisWeek':
          const weekStart = new Date();
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          filter.date = { $gte: weekStart, $lt: weekEnd };
          break;
        case 'thisMonth':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          filter.date = { $gte: monthStart, $lt: monthEnd };
          break;
        case 'upcoming':
          filter.date = { $gte: now };
          break;
      }
    }

    // Price filter
    if (req.query.priceMin || req.query.priceMax) {
      filter.price = {};
      if (req.query.priceMin) filter.price.$gte = parseFloat(req.query.priceMin as string);
      if (req.query.priceMax) filter.price.$lte = parseFloat(req.query.priceMax as string);
    }

    // Location filter
    if (req.query.locationType && req.query.locationType !== 'all') {
      filter['location.type'] = req.query.locationType;
    }

    if (req.query.city) {
      filter['location.city'] = new RegExp(req.query.city as string, 'i');
    }

    // Search filter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }

    // Sort options
    let sort: any = {};
    switch (req.query.sortBy) {
      case 'date':
        sort = { date: 1 };
        break;
      case 'price':
        sort = { price: 1 };
        break;
      case 'popular':
        sort = { attendeeCount: -1 };
        break;
      default:
        sort = { featured: -1, date: 1 };
    }

    const events = await Event.find(filter)
      .populate('organizer', 'name email profilePicture verified')
      .populate('attendees', 'name email profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
};

// Get single event by ID
export const getEventById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email profilePicture verified')
      .populate('attendees', 'name email profilePicture');

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event'
    });
  }
};

// Create new event
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const eventData = {
      ...req.body,
      organizer: new mongoose.Types.ObjectId(req.user.id)
    };

    const event = new Event(eventData);
    await event.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email profilePicture verified');

    res.status(201).json({
      success: true,
      data: populatedEvent,
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error('Create event error:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as any; // Cast to access mongoose validation errors
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(validationError.errors).map((err: any) => err.message)
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create event'
    });
  }
};

// Update event
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
      return;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('organizer', 'name email profilePicture verified');

    res.json({
      success: true,
      data: updatedEvent,
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Update event error:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as any; // Cast to access mongoose validation errors
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(validationError.errors).map((err: any) => err.message)
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update event'
    });
  }
};

// Delete event
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
      return;
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event'
    });
  }
};

// RSVP to event
export const rsvpEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }    // Check if event is published
    if (event.status !== 'published') {
      res.status(400).json({
        success: false,
        message: 'Cannot RSVP to unpublished event'
      });
      return;
    }

    // Check if RSVP deadline has passed
    if (event.rsvpDeadline && new Date() > event.rsvpDeadline) {
      res.status(400).json({
        success: false,
        message: 'RSVP deadline has passed'
      });
      return;
    }    // Check if event is full
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      res.status(400).json({
        success: false,
        message: 'Event is full'
      });
      return;
    }

    // Check if user is already registered
    const userId = new mongoose.Types.ObjectId(req.user.id);
    if (event.attendees.some(attendee => attendee.equals(userId))) {
      res.status(400).json({
        success: false,
        message: 'Already registered for this event'
      });
      return;
    }    // Add user to attendees
    event.attendees.push(userId);
    await event.save();

    const updatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email profilePicture verified')
      .populate('attendees', 'name email profilePicture');

    res.json({
      success: true,
      data: updatedEvent,
      message: 'Successfully registered for event'
    });
  } catch (error) {
    console.error('RSVP event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for event'
    });
  }
};

// Cancel RSVP
export const cancelRsvp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }    // Check if user is registered
    const userId = new mongoose.Types.ObjectId(req.user.id);
    if (!event.attendees.some(attendee => attendee.equals(userId))) {
      res.status(400).json({
        success: false,
        message: 'Not registered for this event'
      });
      return;
    }    // Remove user from attendees
    event.attendees = event.attendees.filter(
      attendee => !attendee.equals(userId)
    );
    await event.save();

    const updatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email profilePicture verified')
      .populate('attendees', 'name email profilePicture');

    res.json({
      success: true,
      data: updatedEvent,
      message: 'Successfully cancelled registration'
    });
  } catch (error) {
    console.error('Cancel RSVP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel registration'
    });
  }
};

// Get user's events (organized)
export const getMyEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = { organizer: new mongoose.Types.ObjectId(req.user.id) };

    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    const events = await Event.find(filter)
      .populate('organizer', 'name email profilePicture verified')
      .populate('attendees', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your events'
    });
  }
};

// Get user's registered events
export const getMyRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {
      attendees: new mongoose.Types.ObjectId(req.user.id),
      status: 'published'
    };

    const events = await Event.find(filter)
      .populate('organizer', 'name email profilePicture verified')
      .populate('attendees', 'name email profilePicture')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your registrations'
    });
  }
};

// Get event analytics for organizer
export const getEventAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const totalEvents = await Event.countDocuments({ organizer: userId });
    const publishedEvents = await Event.countDocuments({
      organizer: userId,
      status: 'published'
    });
    const completedEvents = await Event.countDocuments({
      organizer: userId,
      status: 'completed'
    });    // Get total registrations across all events
    const eventsWithAttendees = await Event.find({ organizer: userId })
      .select('attendees title date');

    const totalRegistrations = eventsWithAttendees.reduce(
      (sum, event) => sum + event.attendees.length,
      0
    );

    // Get upcoming events
    const upcomingEvents = await Event.countDocuments({
      organizer: userId,
      status: 'published',
      date: { $gte: new Date() }
    });

    // Get recent events with attendee counts
    const recentEvents = await Event.find({ organizer: userId })
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title date attendees status category');

    res.json({
      success: true,
      data: {
        overview: {
          totalEvents,
          publishedEvents,
          completedEvents,
          upcomingEvents,
          totalRegistrations
        },
        recentEvents
      }
    });
  } catch (error) {
    console.error('Get event analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event analytics'
    });
  }
};
