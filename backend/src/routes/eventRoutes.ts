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
  getEventAnalytics
} from '../controllers/eventController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// User event routes (protected)
router.get('/user/my-events', protect, getMyEvents);
router.get('/user/registrations', protect, getMyRegistrations);
router.get('/user/analytics', protect, getEventAnalytics);

// Event management (protected)
router.post('/', protect, createEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);

// RSVP management (protected)
router.post('/:id/rsvp', protect, rsvpEvent);
router.delete('/:id/rsvp', protect, cancelRsvp);

export default router;
