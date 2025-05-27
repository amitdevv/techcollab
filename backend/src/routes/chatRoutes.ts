import express from 'express';
import {
  getChannels,
  getChannel,
  createChannel,
  updateChannel,
  joinChannel,
  leaveChannel,
  getMessages,
  sendMessage,
  addReaction,
  getChatUsers
} from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Channel routes
router.get('/channels', getChannels);
router.get('/channels/:id', getChannel);
router.post('/channels', createChannel);
router.put('/channels/:id', updateChannel);
router.post('/channels/:id/join', joinChannel);
router.post('/channels/:id/leave', leaveChannel);

// Message routes
router.get('/channels/:id/messages', getMessages);
router.post('/messages', sendMessage);
router.post('/messages/:messageId/reactions', addReaction);

// User routes
router.get('/users', getChatUsers);
router.get('/messages/:userId', getMessages);
router.post('/messages', sendMessage);

export default router;
