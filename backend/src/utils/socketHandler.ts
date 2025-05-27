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

// Handle user connection
const handleUserConnection = async (socket: AuthenticatedSocket) => {
  try {
    if (!socket.userId) return;

    // Store user's socket connection
    connectedUsers.set(socket.userId, socket.id);

    // Update user status to online
    await User.findByIdAndUpdate(socket.userId, {
      status: 'online',
      lastSeen: new Date()
    });

    // Notify other users about status change
    socket.broadcast.emit('user_status_change', {
      userId: socket.userId,
      status: 'online'
    });
  } catch (error) {
    console.error('Error in handleUserConnection:', error);
  }
};

// Handle user disconnection
const handleUserDisconnection = async (socket: AuthenticatedSocket) => {
  try {
    if (!socket.userId) return;

    // Remove user from connected users
    connectedUsers.delete(socket.userId);

    // Update user status to offline
    await User.findByIdAndUpdate(socket.userId, {
      status: 'offline',
      lastSeen: new Date()
    });

    // Notify other users about status change
    socket.broadcast.emit('user_status_change', {
      userId: socket.userId,
      status: 'offline'
    });
  } catch (error) {
    console.error('Error in handleUserDisconnection:', error);
  }
};

// Handle new message
const handleNewMessage = async (socket: AuthenticatedSocket, messageData: any) => {
  try {
    if (!socket.userId) return;

    const { receiver, content } = messageData;

    // Create new message
    const newMessage = await Message.create({
      sender: socket.userId,
      receiver,
      content,
      read: false
    });

    // Populate message with sender and receiver details
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name username picture')
      .populate('receiver', 'name username picture')
      .lean();

    // Send message to receiver if online
    const receiverSocketId = connectedUsers.get(receiver);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit('receive_message', populatedMessage);
    }

    // Acknowledge message receipt
    socket.emit('message_sent', populatedMessage);
  } catch (error) {
    console.error('Error in handleNewMessage:', error);
    socket.emit('message_error', { message: 'Failed to send message' });
  }
};

export const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Frontend URL
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  // Authentication middleware for socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.id).select('name email picture status');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.id;
      socket.user = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        status: user.status || 'online'
      };
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('User connected:', socket.userId);

    // Handle initial connection
    if (socket.userId) {
      handleUserConnection(socket);
    }

    // Handle messages
    socket.on('send_message', (data: { receiver: string, content: string }) => {
      if (socket.userId) {
        handleNewMessage(socket, data);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
      if (socket.userId) {
        handleUserDisconnection(socket);
      }
    });
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(`User ${authSocket.user?.name} connected with socket ID: ${socket.id}`);

    // Join user to their channels
    socket.on('join-channels', async () => {
      try {
        const channels = await Channel.find({
          $and: [
            { isArchived: false },
            {
              $or: [
                { type: 'public' },
                { type: 'private', members: new mongoose.Types.ObjectId(authSocket.userId!) }
              ]
            }
          ]
        }).select('_id name');

        channels.forEach(channel => {
          socket.join(`channel:${channel._id}`);
        });

        // Join user's personal room for notifications
        socket.join(`user:${authSocket.userId}`);

        console.log(`User ${authSocket.user?.name} joined ${channels.length} channels`);
      } catch (error) {
        console.error('Error joining channels:', error);
      }
    });

    // Handle joining a specific channel
    socket.on('join-channel', async (channelId: string) => {
      try {
        const channel = await Channel.findById(channelId);
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        // Check if user has access
        if (channel.type === 'private' && !channel.members.some(member => member.toString() === authSocket.userId)) {
          socket.emit('error', { message: 'Access denied to private channel' });
          return;
        }

        socket.join(`channel:${channelId}`);
        socket.emit('channel-joined', { channelId });
      } catch (error) {
        console.error('Error joining channel:', error);
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    // Handle leaving a channel
    socket.on('leave-channel', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      socket.emit('channel-left', { channelId });
    });

    // Handle sending messages
    socket.on('send-message', async (data: {
      channelId: string;
      content: string;
      type?: string;
      attachments?: any[];
    }) => {
      try {
        const { channelId, content, type = 'text', attachments = [] } = data;

        // Validate channel access
        const channel = await Channel.findById(channelId);
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        if (channel.type === 'private' && !channel.members.some(member => member.toString() === authSocket.userId)) {
          socket.emit('error', { message: 'Access denied to private channel' });
          return;
        }

        // Create message
        const messageData = {
          content,
          sender: new mongoose.Types.ObjectId(authSocket.userId!),
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

        // Populate message for broadcasting
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name email profilePicture status')
          .populate('mentions', 'name email profilePicture')
          .lean();

        // Broadcast to all users in the channel
        io.to(`channel:${channelId}`).emit('new-message', populatedMessage);

        // Update channel's last activity for all members
        io.to(`channel:${channelId}`).emit('channel-updated', {
          channelId,
          lastActivity: new Date(),
          messageCount: channel.messageCount + 1
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message reactions
    socket.on('add-reaction', async (data: {
      messageId: string;
      emoji: string;
    }) => {
      try {
        const { messageId, emoji } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Find existing reaction with this emoji
        const existingReaction = message.reactions.find(r => r.emoji === emoji);

        if (existingReaction) {
          // Check if user already reacted with this emoji
          if (existingReaction.users.some(user => user.toString() === authSocket.userId)) {
            // Remove user's reaction
            existingReaction.users = existingReaction.users.filter(
              u => u.toString() !== authSocket.userId
            );

            // Remove reaction if no users left
            if (existingReaction.users.length === 0) {
              message.reactions = message.reactions.filter(r => r.emoji !== emoji);
            }
          } else {
            // Add user's reaction
            existingReaction.users.push(new mongoose.Types.ObjectId(authSocket.userId!));
          }
        } else {
          // Create new reaction
          message.reactions.push({
            emoji,
            users: [new mongoose.Types.ObjectId(authSocket.userId!)]
          });
        }

        await message.save();

        // Populate and broadcast updated message
        const updatedMessage = await Message.findById(messageId)
          .populate('sender', 'name email profilePicture status')
          .populate('reactions.users', 'name email profilePicture')
          .lean();

        io.to(`channel:${message.channel}`).emit('message-updated', updatedMessage);

      } catch (error) {
        console.error('Error adding reaction:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (channelId: string) => {
      socket.to(`channel:${channelId}`).emit('user-typing', {
        userId: authSocket.userId,
        userName: authSocket.user?.name,
        channelId
      });
    });

    socket.on('typing-stop', (channelId: string) => {
      socket.to(`channel:${channelId}`).emit('user-stopped-typing', {
        userId: authSocket.userId,
        channelId
      });
    });

    // Handle user status updates
    socket.on('update-status', async (status: string) => {
      try {
        await User.findByIdAndUpdate(authSocket.userId, { status });

        // Broadcast status update to all connected users
        socket.broadcast.emit('user-status-updated', {
          userId: authSocket.userId,
          status
        });
      } catch (error) {
        console.error('Error updating status:', error);
      }
    });

    // Required Socket.IO event handlers
    socket.on('connect_user', handleUserConnection);
    socket.on('disconnect_user', handleUserDisconnection);
    socket.on('send_message', handleNewMessage);

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${authSocket.user?.name} disconnected`);

      try {
        // Update user status to offline if no other connections
        const userSockets = await io.in(`user:${authSocket.userId}`).allSockets();
        if (userSockets.size === 0) {
          await User.findByIdAndUpdate(authSocket.userId, {
            status: 'offline',
            lastSeen: new Date()
          });

          // Broadcast offline status
          socket.broadcast.emit('user-status-updated', {
            userId: authSocket.userId,
            status: 'offline'
          });
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });

  return io;
};
