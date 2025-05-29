import axios from 'axios';
import { api } from '../config/api';

// Create axios instance with auth for inbox specifically
const inboxApi = axios.create({
  baseURL: `${api.defaults.baseURL}/api/chat`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
inboxApi.interceptors.request.use((config) => {
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      const user = JSON.parse(userString);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
  return config;
});

export interface InboxUser {
  _id: string;
  name: string;
  email: string;
  picture?: string;
}

export interface InboxGig {
  _id: string;
  title: string;
}

export interface InboxMessage {
  _id: string;
  chat: string;
  sender: InboxUser;
  content: string;
  type: 'text' | 'image' | 'file';
  readBy: {
    user: string;
    readAt: string;
  }[];
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InboxChat {
  _id: string;
  participants: InboxUser[];
  type: 'gig_interest' | 'general';
  gigId?: InboxGig;
  lastMessage?: InboxMessage;
  lastActivity: string;
  isActive: boolean;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InboxChatResponse {
  chats: InboxChat[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalChats: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface InboxMessagesResponse {
  messages: InboxMessage[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalMessages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Create or get existing chat
export const createOrGetChat = async (recipientId: string, gigId?: string) => {
  try {
    const response = await inboxApi.post('/create', {
      recipientId,
      gigId
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating/getting chat:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to create or get chat');
  }
};

// Get all chats for user
export const getUserChats = async (page: number = 1, limit: number = 20): Promise<InboxChatResponse> => {
  try {
    const response = await inboxApi.get('/user', {
      params: { page, limit }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching chats:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch chats');
  }
};

// Get messages in a chat
export const getChatMessages = async (chatId: string, page: number = 1, limit: number = 50): Promise<InboxMessagesResponse> => {
  try {
    const response = await inboxApi.get(`/${chatId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching messages:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch messages');
  }
};

// Send a message
export const sendMessage = async (chatId: string, content: string, type: string = 'text') => {
  try {
    const response = await inboxApi.post(`/${chatId}/messages`, {
      content,
      type
    });
    return response.data;
  } catch (error: any) {
    console.error('Error sending message:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to send message');
  }
};

// Mark messages as read
export const markMessagesAsRead = async (chatId: string) => {
  try {
    const response = await inboxApi.patch(`/${chatId}/read`);
    return response.data;
  } catch (error: any) {
    console.error('Error marking messages as read:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to mark messages as read');
  }
};

// Delete a message
export const deleteMessage = async (messageId: string) => {
  try {
    const response = await inboxApi.delete(`/messages/${messageId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting message:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to delete message');
  }
}; 