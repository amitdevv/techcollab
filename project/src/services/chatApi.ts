import { io, Socket } from 'socket.io-client';
import { api, SOCKET_URL } from '../config/api';

export interface Channel {
  _id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  members: Array<{
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    status?: 'online' | 'offline' | 'away';
  }>;
  admins: Array<{
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  }>;
  memberCount: number;
  messageCount: number;
  creator: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  lastActivity: string;
  isArchived: boolean;
  isPinned?: boolean;
  joinLink?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  sender: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    status?: 'online' | 'offline' | 'away';
  };
  channel: string;
  attachments: Array<{
    type: 'image' | 'file';
    url: string;
    name: string;
    size?: number;
  }>;
  mentions: Array<{
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  }>;
  reactions: Array<{
    emoji: string;
    users: Array<{
      _id: string;
      name: string;
      email: string;
      profilePicture?: string;
    }>;
  }>;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelData {
  name: string;
  description: string;
  type: 'public' | 'private';
  members?: string[];
}

export interface SendMessageData {
  content: string;
  type?: 'text' | 'image' | 'file';
  attachments?: Array<{
    type: 'image' | 'file';
    url: string;
    name: string;
    size?: number;
  }>;
  mentions?: string[];
}

// Socket.IO connection
let socket: Socket | null = null;

export const initializeSocket = () => {
  const userString = localStorage.getItem('user');
  if (!userString) {
    console.error('No user data found in localStorage for socket initialization');
    return null;
  }

  try {
    const user = JSON.parse(userString);
    if (!user.token) {
      console.error('No token found in user data for socket initialization');
      return null;
    }

    console.log('Initializing socket with token for user:', user.name);
    socket = io(SOCKET_URL, {
      auth: {
        token: user.token
      },
      autoConnect: true
    });

    // Add connection event listeners for debugging
    socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    socket.on('channels-joined', (data) => {
      console.log('✅ Channels joined:', data);
    });

    socket.on('channel-joined', (data) => {
      console.log('✅ Channel joined:', data);
    });

    console.log('Socket initialized with URL:', SOCKET_URL);
    return socket;
  } catch (error) {
    console.error('Error initializing socket:', error);
    return null;
  }
};

export const getSocket = () => socket;

export const ensureSocketConnected = () => {
  if (socket && !socket.connected) {
    console.log('Reconnecting socket...');
    socket.connect();
    return new Promise<boolean>(resolve => {
      // Wait for the socket to connect with a timeout
      const timeout = setTimeout(() => {
        console.log('Socket reconnection timeout');
        resolve(false);
      }, 3000);

      socket!.once('connect', () => {
        clearTimeout(timeout);
        console.log('Socket reconnected successfully');
        resolve(true);
      });
    });
  }
  return Promise.resolve(socket ? socket.connected : false);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// REST API calls

// Get all channels
export const getChannels = async () => {
  const response = await api.get('/api/chat/channels');
  return response.data;
};

// Get single channel
export const getChannel = async (id: string) => {
  const response = await api.get(`/api/chat/channels/${id}`);
  return response.data;
};

// Create channel
export const createChannel = async (channelData: CreateChannelData) => {
  const response = await api.post('/api/chat/channels', channelData);
  return response.data;
};

// Update channel
export const updateChannel = async (id: string, channelData: Partial<CreateChannelData>) => {
  const response = await api.put(`/api/chat/channels/${id}`, channelData);
  return response.data;
};

// Delete channel
export const deleteChannel = async (id: string) => {
  const response = await api.delete(`/api/chat/channels/${id}`);
  return response.data;
};

// Join channel
export const joinChannel = async (id: string) => {
  const response = await api.post(`/api/chat/channels/${id}/join`);
  return response.data;
};

// Leave channel
export const leaveChannel = async (id: string) => {
  const response = await api.post(`/api/chat/channels/${id}/leave`);
  return response.data;
};

// Get messages
export const getMessages = async (channelId: string, page = 1, limit = 50) => {
  const response = await api.get(`/api/chat/channels/${channelId}/messages`, {
    params: { page, limit }
  });
  return response.data;
};

// Send message
export const sendMessage = async (channelId: string, messageData: SendMessageData) => {
  const response = await api.post(`/api/chat/channels/${channelId}/messages`, messageData);
  return response.data;
};

// Update message
export const updateMessage = async (messageId: string, content: string) => {
  const response = await api.put(`/api/chat/messages/${messageId}`, { content });
  return response.data;
};

// Delete message
export const deleteMessage = async (messageId: string) => {
  const response = await api.delete(`/api/chat/messages/${messageId}`);
  return response.data;
};

// Join link functions
export const generateChannelJoinLink = async (channelId: string) => {
  const response = await api.post(`/api/chat/channels/${channelId}/join-link`);
  return response.data;
};

export const joinChannelViaLink = async (joinLink: string) => {
  const response = await api.post(`/api/chat/join/channel/${joinLink}`);
  return response.data;
};

export const getChatJoinLink = async (chatId: string) => {
  const response = await api.get(`/api/chat/chats/${chatId}/join-link`);
  return response.data;
};

export const joinChatViaLink = async (joinLink: string) => {
  const response = await api.post(`/api/chat/join/chat/${joinLink}`);
  return response.data;
};

// Announcement functions
export const createAnnouncement = async (channelId: string, data: {
  title: string;
  content: string;
  isPinned?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}) => {
  const response = await api.post(`/api/chat/channels/${channelId}/announcements`, data);
  return response.data;
};

export const getChannelAnnouncements = async (channelId: string, page = 1, limit = 10) => {
  const response = await api.get(`/api/chat/channels/${channelId}/announcements`, {
    params: { page, limit }
  });
  return response.data;
};

// Socket.IO event handlers
export const joinChannelSocket = (channelId: string) => {
  if (socket) {
    socket.emit('join-channel', channelId);
  }
};

export const leaveChannelSocket = (channelId: string) => {
  if (socket) {
    socket.emit('leave-channel', channelId);
  }
};

export const sendMessageSocket = (channelId: string, messageData: SendMessageData) => {
  return new Promise<Message>((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not connected'));
      return;
    }

    // Listen for response
    socket.once('message-sent', (response) => {
      if (response.success) {
        resolve(response.message);
      } else {
        reject(new Error(response.error || 'Failed to send message'));
      }
    });

    // Send the message
    socket.emit('send-message', {
      channelId,
      ...messageData
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Message send timeout'));
    }, 10000);
  });
};

export const addReactionSocket = (messageId: string, emoji: string) => {
  if (socket) {
    socket.emit('add-reaction', { messageId, emoji });
  }
};

// Update user status
export const updateUserStatus = (status: 'online' | 'away' | 'offline') => {
  if (socket) {
    socket.emit('update-status', { status });
  }
};

// Socket.IO event listeners
export const onNewMessage = (callback: (message: Message) => void) => {
  if (socket) {
    socket.on('new-message', callback);
  }
};

export const onMessageUpdated = (callback: (message: Message) => void) => {
  if (socket) {
    socket.on('message-updated', callback);
  }
};

export const onChannelUpdated = (callback: (data: { channelId: string; lastActivity: string; messageCount: number }) => void) => {
  if (socket) {
    socket.on('channel-updated', callback);
  }
};

export const onUserStatusUpdated = (callback: (data: { userId: string; status: string }) => void) => {
  if (socket) {
    socket.on('user-status-updated', callback);
  }
};

export const onError = (callback: (error: { message: string }) => void) => {
  if (socket) {
    socket.on('error', callback);
  }
};

// Cleanup function
export const removeAllListeners = () => {
  if (socket) {
    socket.removeAllListeners('new-message');
    socket.removeAllListeners('message-updated');
    socket.removeAllListeners('channel-updated');
    socket.removeAllListeners('user-status-updated');
    socket.removeAllListeners('error');
    socket.removeAllListeners('message-sent');
  }
}; 