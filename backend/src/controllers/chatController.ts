import { Response, Request } from 'express';
import { AuthRequest } from '../types/auth';
import { Channel, IChannel } from '../models/Channel';
import { Message, IMessage } from '../models/Message';
import { User } from '../models/User';
import mongoose from 'mongoose';
import { Chat } from '../models/Chat';
import { Gig } from '../models/Gig';

// Get all channels for a user
export const getChannels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const userId = req.user.id;

    // Get public channels and private channels where user is a member
    const channels = await Channel.find({
      $and: [
        { isArchived: false },
        {
          $or: [
            { type: 'public' },
            { type: 'private', members: userId }
          ]
        }
      ]
    })
      .populate('creator', 'name email profilePicture')
      .populate('members', 'name email profilePicture status')
      .sort({ isPinned: -1, lastActivity: -1 })
      .lean();

    // Get unread message counts for each channel
    const channelsWithUnread = await Promise.all(
      channels.map(async (channel) => {
        // For simplicity, we'll implement basic unread count
        // In a real app, you'd track user's last read message per channel
        const unreadCount = 0; // TODO: Implement proper unread tracking

        return {
          ...channel,
          unreadCount
        };
      })
    );

    res.json({
      success: true,
      data: channelsWithUnread
    });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch channels'
    });
  }
};

// Get single channel details
export const getChannel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const channelId = req.params.id;
    const userId = req.user.id;

    const channel = await Channel.findById(channelId)
      .populate('creator', 'name email profilePicture')
      .populate('members', 'name email profilePicture status')
      .populate('admins', 'name email profilePicture');

    if (!channel) {
      res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
      return;
    }

    // Check if user has access to private channel
    if (channel.type === 'private' && !channel.members.some(member => member._id.toString() === userId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied to private channel'
      });
      return;
    }

    res.json({
      success: true,
      data: channel
    });
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch channel'
    });
  }
};

// Create new channel
export const createChannel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const { name, description, type, category } = req.body;
    const userId = req.user.id;

    // Check if channel name already exists
    const existingChannel = await Channel.findOne({ name: name.toLowerCase() });
    if (existingChannel) {
      res.status(400).json({
        success: false,
        message: 'Channel name already exists'
      });
      return;
    }

    const channelData = {
      name: name.toLowerCase(),
      description,
      type: type || 'public',
      category,
      creator: new mongoose.Types.ObjectId(userId),
      members: [new mongoose.Types.ObjectId(userId)],
      admins: [new mongoose.Types.ObjectId(userId)]
    };

    const channel = new Channel(channelData);
    await channel.save();

    const populatedChannel = await Channel.findById(channel._id)
      .populate('creator', 'name email profilePicture')
      .populate('members', 'name email profilePicture status');

    res.status(201).json({
      success: true,
      data: populatedChannel,
      message: 'Channel created successfully'
    });
  } catch (error) {
    console.error('Create channel error:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as any;
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(validationError.errors).map((err: any) => err.message)
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create channel'
    });
  }
};

// Update channel
export const updateChannel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const channelId = req.params.id;
    const userId = req.user.id;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
      return;
    }

    // Check if user is admin or creator
    if (!channel.admins.some(admin => admin.toString() === userId) && channel.creator.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this channel'
      });
      return;
    }

    const updatedChannel = await Channel.findByIdAndUpdate(
      channelId,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('creator', 'name email profilePicture')
      .populate('members', 'name email profilePicture status');

    res.json({
      success: true,
      data: updatedChannel,
      message: 'Channel updated successfully'
    });
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update channel'
    });
  }
};

// Join channel
export const joinChannel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const channelId = req.params.id;
    const userId = req.user.id;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
      return;
    }

    // Check if it's a private channel
    if (channel.type === 'private') {
      res.status(403).json({
        success: false,
        message: 'Cannot join private channel without invitation'
      });
      return;
    }

    // Check if user is already a member
    if (channel.members.some(member => member.toString() === userId)) {
      res.status(400).json({
        success: false,
        message: 'Already a member of this channel'
      });
      return;
    }

    // Add user to members
    channel.members.push(new mongoose.Types.ObjectId(userId));
    await channel.save();

    const updatedChannel = await Channel.findById(channelId)
      .populate('creator', 'name email profilePicture')
      .populate('members', 'name email profilePicture status');

    res.json({
      success: true,
      data: updatedChannel,
      message: 'Successfully joined channel'
    });
  } catch (error) {
    console.error('Join channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join channel'
    });
  }
};

// Leave channel
export const leaveChannel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const channelId = req.params.id;
    const userId = req.user.id;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
      return;
    }

    // Check if user is a member
    if (!channel.members.some(member => member.toString() === userId)) {
      res.status(400).json({
        success: false,
        message: 'Not a member of this channel'
      });
      return;
    }

    // Remove user from members and admins
    channel.members = channel.members.filter(member => member.toString() !== userId);
    channel.admins = channel.admins.filter(admin => admin.toString() !== userId);

    await channel.save();

    res.json({
      success: true,
      message: 'Successfully left channel'
    });
  } catch (error) {
    console.error('Leave channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave channel'
    });
  }
};

// Get messages for a channel
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const channelId = req.params.id;
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Check if user has access to channel
    const channel = await Channel.findById(channelId);
    if (!channel) {
      res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
      return;
    }

    if (channel.type === 'private' && !channel.members.some(member => member.toString() === userId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied to private channel'
      });
      return;
    }

    const messages = await Message.find({
      channel: channelId,
      isDeleted: false
    })
      .populate('sender', 'name email profilePicture status')
      .populate('mentions', 'name email profilePicture')
      .populate('reactions.users', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Message.countDocuments({
      channel: channelId,
      isDeleted: false
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
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
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

// Send message to channel
export const sendChannelMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const { channelId } = req.params;
    const { content, type = 'text', attachments = [], mentions = [] } = req.body;
    const userId = req.user.id;

    // Validate content
    if (!content && (!attachments || attachments.length === 0)) {
      res.status(400).json({
        success: false,
        message: 'Message content or attachments required'
      });
      return;
    }

    // Check if channel exists and user is member
    const channel = await Channel.findById(channelId);
    if (!channel) {
      res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
      return;
    }

    // Check if user is member (for private channels)
    if (channel.type === 'private' && !channel.members.some(member => member.toString() === userId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied to private channel'
      });
      return;
    }

    // Check if only admins can post
    if (channel.settings?.onlyAdminsCanPost && 
        !channel.admins.some(admin => admin.toString() === userId) && 
        channel.creator.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Only admins can post in this channel'
      });
      return;
    }

    // Create message
    const messageData = {
      content: content || '',
      type,
      sender: new mongoose.Types.ObjectId(userId),
      channel: new mongoose.Types.ObjectId(channelId),
      attachments,
      mentions: mentions.map((id: string) => new mongoose.Types.ObjectId(id)),
      readBy: [{ user: new mongoose.Types.ObjectId(userId) }]
    };

    const message = new Message(messageData);
    await message.save();

    // Populate message
    await message.populate('sender', 'name email profilePicture status');
    await message.populate('mentions', 'name email profilePicture');

    // Update channel activity
    channel.lastActivity = new Date();
    channel.messageCount += 1;
    await channel.save();

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Send channel message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Get users available for chat
// NOTE: This function uses old direct message structure, replaced by inbox functions

// Get direct messages between two users  
// NOTE: This function uses old direct message structure, replaced by inbox functions

// Send a direct message
// NOTE: This function uses old direct message structure, replaced by inbox functions

// Create or get existing chat between two users
export const createOrGetChat = async (req: AuthRequest, res: Response) => {
  try {
    const { recipientId, gigId } = req.body;
    const senderId = req.user?.id;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    if (senderId === recipientId) {
      return res.status(400).json({ error: 'Cannot create chat with yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Check if chat already exists between these users
    let chat = await Chat.findOne({
      participants: { $all: [senderId, recipientId] },
      ...(gigId && { gigId })
    }).populate('participants', 'name email picture')
      .populate('lastMessage')
      .populate('gigId', 'title');

    if (!chat) {
      // Validate gig if provided
      if (gigId) {
        const gig = await Gig.findById(gigId);
        if (!gig) {
          return res.status(404).json({ error: 'Gig not found' });
        }
      }

      // Create new chat
      chat = new Chat({
        participants: [senderId, recipientId],
        type: gigId ? 'gig_interest' : 'general',
        gigId: gigId || undefined,
        lastActivity: new Date()
      });

      await chat.save();
      await chat.populate('participants', 'name email picture');
      if (gigId) {
        await chat.populate('gigId', 'title');
      }

      // Generate join link for the chat
      const joinLink = `join-chat-${chat._id}-${Math.random().toString(36).substring(2, 15)}`;
      chat.joinLink = joinLink;
      await chat.save();
    }

    res.status(201).json({
      message: 'Chat created or retrieved successfully',
      chat
    });
  } catch (error) {
    console.error('Error creating/getting chat:', error);
    res.status(500).json({ error: 'Failed to create or get chat' });
  }
};

// Get all chats for a user
export const getUserChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const chats = await Chat.find({
      participants: userId,
      isActive: true
    })
      .populate('participants', 'name email picture')
      .populate('lastMessage')
      .populate('gigId', 'title')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get unread message counts for each chat
    const chatsWithUnreadCounts = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          'readBy.user': { $ne: userId },
          isDeleted: false
        });

        return {
          ...chat.toObject(),
          unreadCount
        };
      })
    );

    const totalChats = await Chat.countDocuments({
      participants: userId,
      isActive: true
    });

    res.json({
      chats: chatsWithUnreadCounts,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalChats / Number(limit)),
        totalChats,
        hasNext: skip + chats.length < totalChats,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

// Get messages in a chat
export const getChatMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant in this chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.find({
      chat: chatId,
      isDeleted: false
    })
      .populate('sender', 'name email picture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalMessages = await Message.countDocuments({
      chat: chatId,
      isDeleted: false
    });

    res.json({
      messages: messages.reverse(), // Reverse to show chronological order
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalMessages / Number(limit)),
        totalMessages,
        hasNext: skip + messages.length < totalMessages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Send a message
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text' } = req.body;
    const senderId = req.user?.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user is participant in this chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: senderId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    // Create new message
    const message = new Message({
      chat: chatId,
      sender: senderId,
      content: content.trim(),
      type,
      readBy: [{ user: senderId, readAt: new Date() }] // Mark as read by sender
    });

    await message.save();
    await message.populate('sender', 'name email picture');

    // Update chat's last message and activity
    chat.lastMessage = new mongoose.Types.ObjectId(message._id.toString());
    chat.lastActivity = new Date();
    await chat.save();

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;

    // Verify user is participant in this chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    // Mark all unread messages in this chat as read by this user
    await Message.updateMany(
      {
        chat: chatId,
        'readBy.user': { $ne: userId },
        isDeleted: false
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

// Delete a message
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    const message = await Message.findOne({
      _id: messageId,
      sender: userId
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or access denied' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Create announcement in channel
export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const { channelId } = req.params;
    const { title, content, isPinned = false, priority = 'normal' } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!title || !content) {
      res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
      return;
    }

    // Check if channel exists and user is admin
    const channel = await Channel.findById(channelId);
    if (!channel) {
      res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
      return;
    }

    // Check if user is admin or creator
    if (!channel.admins.some(admin => admin.toString() === userId) && 
        channel.creator.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Only admins can create announcements'
      });
      return;
    }

    // Create announcement message
    const message = new Message({
      content,
      type: 'announcement',
      sender: new mongoose.Types.ObjectId(userId),
      channel: new mongoose.Types.ObjectId(channelId),
      announcement: {
        title,
        isPinned,
        priority
      },
      readBy: [{ user: new mongoose.Types.ObjectId(userId) }]
    });

    await message.save();
    await message.populate('sender', 'name email profilePicture');

    // Update channel activity
    channel.lastActivity = new Date();
    await channel.save();

    res.status(201).json({
      success: true,
      data: message,
      message: 'Announcement created successfully'
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement'
    });
  }
};

// Get channel announcements
export const getChannelAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    // Check if channel exists and user has access
    const channel = await Channel.findById(channelId);
    if (!channel) {
      res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
      return;
    }

    // Check access for private channels
    if (channel.type === 'private' && !channel.members.some(member => member.toString() === userId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied to private channel'
      });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Get announcements
    const announcements = await Message.find({
      channel: channelId,
      type: 'announcement',
      isDeleted: false
    })
      .populate('sender', 'name email profilePicture')
      .sort({ 'announcement.isPinned': -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Message.countDocuments({
      channel: channelId,
      type: 'announcement',
      isDeleted: false
    });

    res.json({
      success: true,
      data: {
        announcements,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          hasNext: skip + announcements.length < total,
          hasPrev: Number(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get channel announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements'
    });
  }
};

// Join channel via link
export const joinChannelViaLink = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const { joinLink } = req.params;
    const userId = req.user.id;

    // Find channel by join link
    const channel = await Channel.findOne({ joinLink });
    if (!channel) {
      res.status(404).json({
        success: false,
        message: 'Invalid join link'
      });
      return;
    }

    // Check if user is already a member
    if (channel.members.some(member => member.toString() === userId)) {
      res.status(400).json({
        success: false,
        message: 'Already a member of this channel'
      });
      return;
    }

    // Add user to members
    channel.members.push(new mongoose.Types.ObjectId(userId));
    await channel.save();

    const updatedChannel = await Channel.findById(channel._id)
      .populate('creator', 'name email profilePicture')
      .populate('members', 'name email profilePicture status');

    // Send welcome message if configured
    if (channel.settings?.welcomeMessage) {
      const welcomeMessage = new Message({
        content: channel.settings.welcomeMessage,
        type: 'text',
        sender: channel.creator,
        channel: channel._id,
        readBy: [{ user: new mongoose.Types.ObjectId(userId) }]
      });
      await welcomeMessage.save();
    }

    res.json({
      success: true,
      data: updatedChannel,
      message: 'Successfully joined channel'
    });

  } catch (error) {
    console.error('Join channel via link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join channel'
    });
  }
};

// Join chat via link
export const joinChatViaLink = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const { joinLink } = req.params;
    const userId = req.user.id;

    // Find chat by join link
    const chat = await Chat.findOne({ joinLink })
      .populate('participants', 'name email picture')
      .populate('gigId', 'title');

    if (!chat) {
      res.status(404).json({
        success: false,
        message: 'Invalid join link'
      });
      return;
    }

    // Check if user is already a participant
    if (chat.participants.some(participant => participant._id.toString() === userId)) {
      res.status(400).json({
        success: false,
        message: 'Already a participant in this chat'
      });
      return;
    }

    // Add user to participants
    chat.participants.push(new mongoose.Types.ObjectId(userId));
    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
      .populate('participants', 'name email picture')
      .populate('lastMessage')
      .populate('gigId', 'title');

    res.json({
      success: true,
      data: updatedChat,
      message: 'Successfully joined chat'
    });

  } catch (error) {
    console.error('Join chat via link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join chat'
    });
  }
};

// Generate new join link for channel
export const generateChannelJoinLink = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const { channelId } = req.params;
    const userId = req.user.id;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
      return;
    }

    // Check if user is admin or creator
    if (!channel.admins.some(admin => admin.toString() === userId) && 
        channel.creator.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Only admins can generate join links'
      });
      return;
    }

    // Generate new join link
    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newJoinLink = `join-${channel.name}-${randomString}`;
    
    channel.joinLink = newJoinLink;
    await channel.save();

    res.json({
      success: true,
      data: { joinLink: newJoinLink },
      message: 'New join link generated successfully'
    });

  } catch (error) {
    console.error('Generate join link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate join link'
    });
  }
};

// Get chat join link
export const getChatJoinLink = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
      return;
    }

    // Check if user is participant
    if (!chat.participants.some(participant => participant.toString() === userId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied - not a participant'
      });
      return;
    }

    // Generate join link if it doesn't exist
    if (!chat.joinLink) {
      const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      chat.joinLink = `join-chat-${chat._id}-${randomString}`;
      await chat.save();
    }

    res.json({
      success: true,
      data: { joinLink: chat.joinLink },
      message: 'Join link retrieved successfully'
    });

  } catch (error) {
    console.error('Get chat join link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get join link'
    });
  }
};
