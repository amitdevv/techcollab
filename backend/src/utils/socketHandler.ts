import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { Channel } from '../models/Channel';
import mongoose from 'mongoose';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    _id: string;
    email: string;
    name: string;
    status?: 'online' | 'offline' | 'away' | 'busy';
  };
}

// Store connected users
const connectedUsers = new Map<string, string>(); // userId -> socketId

export const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://techcollab.vercel.app', 'https://*.vercel.app']
        : ['http://localhost:5173', 'http://localhost:3000'],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware for socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log('Socket authentication attempt with token:', token ? 'present' : 'missing');

      if (!token) {
        console.error('No token provided for socket authentication');
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.id).select('name email profilePicture status');

      if (!user) {
        console.error('User not found for token:', decoded.id);
        return next(new Error('User not found'));
      }

      socket.userId = decoded.id;
      socket.user = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        status: user.status || 'online'
      };

      console.log('Socket authentication successful for user:', user.name);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Single connection handler
  io.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.name} (${socket.userId}) connected with socket ID: ${socket.id}`);

    // Store user's socket connection
    if (socket.userId) {
      connectedUsers.set(socket.userId, socket.id);

      // Update user status to online
      try {
        await User.findByIdAndUpdate(socket.userId, {
          status: 'online',
          lastSeen: new Date()
        });

        // Notify other users about status change
        socket.broadcast.emit('user-status-updated', {
          userId: socket.userId,
          status: 'online'
        });

        // Join user's personal room
        socket.join(`user:${socket.userId}`);

        console.log(`User ${socket.user?.name} status updated to online`);
      } catch (error) {
        console.error('Error updating user status on connection:', error);
      }
    }

    // Auto-join user to their channels
    socket.on('join-channels', async () => {
      try {
        if (!socket.userId) {
          console.error('No userId on socket when joining channels');
          return;
        }

        const channels = await Channel.find({
          $and: [
            { isArchived: false },
            {
              $or: [
                { type: 'public' },
                { type: 'private', members: new mongoose.Types.ObjectId(socket.userId) }
              ]
            }
          ]
        }).select('_id name type');

        console.log(`User ${socket.user?.name} joining ${channels.length} channels`);

        channels.forEach(channel => {
          socket.join(`channel:${channel._id}`);
          console.log(`User ${socket.user?.name} joined channel: ${channel.name} (${channel._id})`);
        });

        socket.emit('channels-joined', {
          count: channels.length,
          channels: channels.map(c => ({ id: c._id, name: c.name, type: c.type }))
        });

        console.log(`User ${socket.user?.name} joined ${channels.length} channels successfully`);
      } catch (error) {
        console.error('Error joining channels:', error);
        socket.emit('error', { message: 'Failed to join channels' });
      }
    });

    // Handle joining a specific channel
    socket.on('join-channel', async (channelId: string) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        console.log(`User ${socket.user?.name} attempting to join channel: ${channelId}`);

        const channel = await Channel.findById(channelId);
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        // Check if user has access
        if (channel.type === 'private' && !channel.members.some(member => member.toString() === socket.userId)) {
          socket.emit('error', { message: 'Access denied to private channel' });
          return;
        }

        socket.join(`channel:${channelId}`);
        socket.emit('channel-joined', { channelId, channelName: channel.name });
        console.log(`User ${socket.user?.name} joined channel ${channel.name} (${channelId})`);
      } catch (error) {
        console.error('Error joining channel:', error);
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    // Handle leaving a channel
    socket.on('leave-channel', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      socket.emit('channel-left', { channelId });
      console.log(`User ${socket.user?.name} left channel ${channelId}`);
    });

    // Handle sending messages to channels
    socket.on('send-message', async (data: {
      channelId: string;
      content: string;
      type?: string;
      attachments?: any[];
    }) => {
      try {
        const { channelId, content, type = 'text', attachments = [] } = data;
        console.log(`User ${socket.user?.name} sending message to channel ${channelId}: "${content}"`);

        if (!socket.userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Validate channel access
        const channel = await Channel.findById(channelId);
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        if (channel.type === 'private' && !channel.members.some(member => member.toString() === socket.userId)) {
          socket.emit('error', { message: 'Access denied to private channel' });
          return;
        }

        // Create message
        const messageData = {
          content,
          sender: new mongoose.Types.ObjectId(socket.userId),
          channel: new mongoose.Types.ObjectId(channelId),
          type,
          attachments,
          timestamp: new Date()
        };

        const message = new Message(messageData);
        await message.save();

        // Update channel last activity and message count
        await Channel.findByIdAndUpdate(channelId, {
          lastActivity: new Date(),
          $inc: { messageCount: 1 }
        });

        // Populate message for broadcasting
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name email profilePicture status')
          .populate('mentions', 'name email profilePicture')
          .lean();

        // Broadcast to all users in the channel
        console.log(`Broadcasting message from ${socket.user?.name} to channel ${channelId}`);
        io.to(`channel:${channelId}`).emit('new-message', populatedMessage);

        // Update channel's last activity for all members
        io.to(`channel:${channelId}`).emit('channel-updated', {
          channelId,
          lastActivity: new Date(),
          messageCount: channel.messageCount + 1
        });

        // Send confirmation to sender
        socket.emit('message-sent', {
          success: true,
          message: populatedMessage
        });

        console.log(`Message broadcasted successfully to channel ${channelId} by ${socket.user?.name}`);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
        socket.emit('message-sent', {
          success: false,
          error: 'Failed to send message'
        });
      }
    });

    // Handle direct messages (legacy support)
    socket.on('send_message', async (data: { receiver: string, content: string }) => {
      try {
        // NOTE: Legacy direct message support disabled - use inbox chat system instead
        socket.emit('message_error', { message: 'Please use the inbox chat system for direct messages' });
        return;

        /*
        if (!socket.userId) return;

        const { receiver, content } = data;
        console.log(`Direct message from ${socket.user?.name} to ${receiver}: "${content}"`);

        // Create new message
        const newMessage = await Message.create({
          sender: socket.userId,
          receiver,
          content,
          read: false,
          timestamp: new Date()
        });

        // Populate message with sender and receiver details
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'name email profilePicture')
          .populate('receiver', 'name email profilePicture')
          .lean();

        // Send message to receiver if online
        const receiverSocketId = connectedUsers.get(receiver);
        if (receiverSocketId) {
          socket.to(receiverSocketId).emit('receive_message', populatedMessage);
          console.log(`Direct message delivered to ${receiver}`);
        } else {
          console.log(`Receiver ${receiver} is offline, message stored`);
        }

        // Acknowledge message receipt
        socket.emit('message_sent', populatedMessage);
        */
      } catch (error) {
        console.error('Error in direct message:', error);
        socket.emit('message_error', { message: 'Failed to send message' });
      }
    });

    // Handle message reactions
    socket.on('add-reaction', async (data: {
      messageId: string;
      emoji: string;
    }) => {
      try {
        // NOTE: Reactions feature disabled for inbox messages - only available for community chat
        socket.emit('error', { message: 'Reactions not supported for inbox messages' });
        return;

        /*
        const { messageId, emoji } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Find existing reaction with this emoji
        const existingReaction = message.reactions?.find(r => r.emoji === emoji);

        if (existingReaction) {
          // Check if user already reacted with this emoji
          if (existingReaction.users.some(user => user.toString() === socket.userId)) {
            // Remove user's reaction
            existingReaction.users = existingReaction.users.filter(
              u => u.toString() !== socket.userId
            );

            // Remove reaction if no users left
            if (existingReaction.users.length === 0) {
              message.reactions = message.reactions?.filter(r => r.emoji !== emoji) || [];
            }
          } else {
            // Add user's reaction
            existingReaction.users.push(new mongoose.Types.ObjectId(socket.userId));
          }
        } else {
          // Create new reaction
          if (!message.reactions) message.reactions = [];
          message.reactions.push({
            emoji,
            users: [new mongoose.Types.ObjectId(socket.userId)]
          });
        }

        await message.save();

        // Populate and broadcast updated message
        const updatedMessage = await Message.findById(messageId)
          .populate('sender', 'name email profilePicture status')
          .populate('reactions.users', 'name email profilePicture')
          .lean();

        io.to(`channel:${message.channel}`).emit('message-updated', updatedMessage);
        */

      } catch (error) {
        console.error('Error adding reaction:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (channelId: string) => {
      socket.to(`channel:${channelId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.user?.name,
        channelId
      });
    });

    socket.on('typing-stop', (channelId: string) => {
      socket.to(`channel:${channelId}`).emit('user-stopped-typing', {
        userId: socket.userId,
        channelId
      });
    });

    // Handle user status updates
    socket.on('update-status', async (status: string) => {
      try {
        if (!socket.userId) return;

        await User.findByIdAndUpdate(socket.userId, { status });

        // Broadcast status update to all connected users
        socket.broadcast.emit('user-status-updated', {
          userId: socket.userId,
          status
        });

        console.log(`User ${socket.user?.name} status updated to ${status}`);
      } catch (error) {
        console.error('Error updating status:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user?.name} disconnected`);

      try {
        if (socket.userId) {
          // Remove user from connected users map
          connectedUsers.delete(socket.userId);

          // Check if user has other connections
          const userSockets = await io.in(`user:${socket.userId}`).allSockets();
          if (userSockets.size === 0) {
            // Update user status to offline if no other connections
            await User.findByIdAndUpdate(socket.userId, {
              status: 'offline',
              lastSeen: new Date()
            });

            // Broadcast offline status
            socket.broadcast.emit('user-status-updated', {
              userId: socket.userId,
              status: 'offline'
            });

            console.log(`User ${socket.user?.name} status updated to offline`);
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });

    // Auto-join channels when user connects
    if (socket.userId) {
      socket.emit('request-channel-join');
    }
  });

  const frontendUrl = process.env.NODE_ENV === 'production' ? 'https://techcollab.vercel.app' : 'http://localhost:5173';
  console.log(`Socket.IO server initialized with CORS for ${frontendUrl}`);
  return io;
};
