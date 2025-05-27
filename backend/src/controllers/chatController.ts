import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { Channel, IChannel } from '../models/Channel';
import { Message, IMessage } from '../models/Message';
import { User } from '../models/User';
import mongoose from 'mongoose';

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

// Send message (this will be handled by socket.io, but keeping for API consistency)
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const { channelId, content, type = 'text', attachments = [] } = req.body;
    const userId = req.user.id;

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

    const messageData = {
      content,
      sender: new mongoose.Types.ObjectId(userId),
      channel: new mongoose.Types.ObjectId(channelId),
      type,
      attachments
    };

    const message = new Message(messageData);
    await message.save();

    // Update channel last activity and message count
    await Channel.findByIdAndUpdate(channelId, {
      lastActivity: new Date(),
      $inc: { messageCount: 1 }
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profilePicture status')
      .populate('mentions', 'name email profilePicture');

    res.status(201).json({
      success: true,
      data: populatedMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Add reaction to message
export const addReaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const messageId = req.params.messageId;
    const { emoji } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404).json({
        success: false,
        message: 'Message not found'
      });
      return;
    }

    // Find existing reaction with this emoji
    const existingReaction = message.reactions.find(r => r.emoji === emoji);

    if (existingReaction) {
      // Check if user already reacted with this emoji
      if (existingReaction.users.some(user => user.toString() === userId)) {
        // Remove user's reaction
        existingReaction.users = existingReaction.users.filter(
          u => u.toString() !== userId
        );

        // Remove reaction if no users left
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add user's reaction
        existingReaction.users.push(new mongoose.Types.ObjectId(userId));
      }
    } else {
      // Create new reaction
      message.reactions.push({
        emoji,
        users: [new mongoose.Types.ObjectId(userId)]
      });
    }

    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'name email profilePicture status')
      .populate('reactions.users', 'name email profilePicture');

    res.json({
      success: true,
      data: updatedMessage,
      message: 'Reaction updated successfully'
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reaction'
    });
  }
};

// Get users available for chat
export const getChatUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Get all users except the current user
    const users = await User.find(
      { _id: { $ne: req.user.id } },
      'name username email picture status lastSeen'
    ).lean();

    // Get last message for each user
    const usersWithLastMessage = await Promise.all(
      users.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: req.user?.id, receiver: user._id },
            { sender: user._id, receiver: req.user?.id }
          ]
        })
          .sort({ createdAt: -1 })
          .select('content createdAt read')
          .lean();

        return {
          ...user,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: lastMessage.createdAt,
            unread: !lastMessage.read && lastMessage.sender.toString() === user._id.toString()
          } : null
        };
      })
    );

    res.json(usersWithLastMessage);
  } catch (error) {
    console.error('Error in getChatUsers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get direct messages between two users
export const getDirectMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    })
      .sort({ createdAt: 1 })
      .lean();

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userId,
        receiver: req.user.id,
        read: false
      },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    console.error('Error in getDirectMessages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Send a direct message
export const sendDirectMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { receiver, content } = req.body;
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const newMessage = await Message.create({
      sender: req.user.id,
      receiver,
      content,
      read: false
    });

    // Populate sender and receiver details if needed
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name username picture')
      .populate('receiver', 'name username picture')
      .lean();

    // Emit socket event for real-time updates
    req.app.get('io').to(receiver).emit('receive_message', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error in sendDirectMessage:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
