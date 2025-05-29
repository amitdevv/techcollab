import axios from 'axios';

// Get the base API URL from environment variable with fallback
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create and configure a base axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      const user = JSON.parse(userString);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
  }
  return config;
});

// Helper to create auth header for one-off requests
export const createAuthHeader = () => {
  try {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      const token = user.token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
  }
  return {};
};

// Socket.IO URL - strips '/api' from the API URL
export const SOCKET_URL = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL;
