import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  cancelRsvp,
  getMyEvents,
  getMyRegistrations,
  getEventAnalytics,
  getUpcomingEvents
} from '../controllers/eventController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/:id', getEventById);

// Protected routes
router.post('/', protect, createEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.post('/:id/rsvp', protect, rsvpEvent);
router.delete('/:id/rsvp', protect, cancelRsvp);
router.get('/user/my-events', protect, getMyEvents);
router.get('/user/my-registrations', protect, getMyRegistrations);
router.get('/user/analytics', protect, getEventAnalytics);

export default router;
