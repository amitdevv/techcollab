import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { Gig } from '../models/Gig';
import { User } from '../models/User';

// Send gig interest notification
export const sendGigInterestNotification = async (req: Request, res: Response) => {
  try {
    const { gigId, message } = req.body;
    const interestedUserId = req.user?.id;

    if (!gigId) {
      return res.status(400).json({ error: 'Gig ID is required' });
    }

    // Get the gig and its creator
    const gig = await Gig.findById(gigId).populate('freelancer', 'name email');
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    // Get the interested user's details
    const interestedUser = await User.findById(interestedUserId).select('name email picture');
    if (!interestedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow users to express interest in their own gigs
    if (gig.freelancer._id.toString() === interestedUserId) {
      return res.status(400).json({ error: 'You cannot express interest in your own gig' });
    }

    // Check if user already expressed interest
    const existingNotification = await Notification.findOne({
      recipient: gig.freelancer._id,
      sender: interestedUserId,
      type: 'gig_interest',
      'data.gigId': gigId
    });

    if (existingNotification) {
      return res.status(400).json({ error: 'You have already expressed interest in this gig' });
    }

    // Create notification
    const notification = new Notification({
      recipient: gig.freelancer._id,
      sender: interestedUserId,
      type: 'gig_interest',
      title: `Someone is interested in your gig!`,
      message: message || `${interestedUser.name} is interested in your gig: "${gig.title}". View their profile to connect and collaborate.`,
      data: {
        gigId: gigId,
        gigTitle: gig.title,
        interestedUserName: interestedUser.name,
        interestedUserPicture: interestedUser.picture
      }
    });

    await notification.save();

    res.status(201).json({
      message: 'Interest notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Error sending gig interest notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

// Get user notifications
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const filter: any = { recipient: userId };
    if (unreadOnly === 'true') {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .populate('sender', 'name picture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalNotifications = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      read: false 
    });

    res.json({
      notifications,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalNotifications / Number(limit)),
        totalNotifications,
        hasNext: skip + notifications.length < totalNotifications,
        hasPrev: Number(page) > 1
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
}; 