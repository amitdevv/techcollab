import express from 'express';
import {
  // Inbox chat functions
  createOrGetChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  // Community chat functions
  getChannels,
  getChannel,
  createChannel,
  updateChannel,
  joinChannel,
  leaveChannel,
  getMessages,
  sendChannelMessage,
  // New announcement functions
  createAnnouncement,
  getChannelAnnouncements,
  // New join link functions
  joinChannelViaLink,
  joinChatViaLink,
  generateChannelJoinLink,
  getChatJoinLink
} from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ============ INBOX CHAT ROUTES ============
// Chat management
router.post('/create', createOrGetChat);          // Create or get existing chat
router.get('/user', getUserChats);                    // Get all user's chats
router.get('/:chatId/messages', getChatMessages); // Get messages in a chat
router.post('/:chatId/messages', sendMessage);    // Send a message
router.patch('/:chatId/read', markMessagesAsRead); // Mark messages as read

// Message management
router.delete('/messages/:messageId', deleteMessage); // Delete a message

// ============ COMMUNITY CHAT ROUTES ============
// Channel management
router.get('/channels', getChannels);                    // Get all channels
router.get('/channels/:id', getChannel);                 // Get single channel
router.post('/channels', createChannel);                 // Create channel
router.put('/channels/:id', updateChannel);              // Update channel
router.post('/channels/:id/join', joinChannel);          // Join channel
router.post('/channels/:id/leave', leaveChannel);        // Leave channel
router.get('/channels/:id/messages', getMessages);       // Get channel messages
router.post('/channels/:id/messages', sendChannelMessage); // Send message to channel

// New announcement routes
router.post('/channels/:channelId/announcements', createAnnouncement);
router.get('/channels/:channelId/announcements', getChannelAnnouncements);

// New join link routes
router.post('/channels/:channelId/join-link', generateChannelJoinLink);
router.post('/join/channel/:joinLink', joinChannelViaLink);
router.get('/chats/:chatId/join-link', getChatJoinLink);
router.post('/join/chat/:joinLink', joinChatViaLink);

export default router;
