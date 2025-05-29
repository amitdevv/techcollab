import { api } from '../config/api';

interface AuthResponse {
  user: {
    _id: string;
    email: string;
    name: string;
    picture?: string;
    token: string;
  };
  token: string;
}

// Login with Google OAuth
export const loginWithGoogle = async (token: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/api/auth/google', { token });

    // Store the token in localStorage for future API calls
    localStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data;
  } catch (error) {
    console.error('Error in Google login:', error);
    throw error;
  }
};

// Verify token validity
export const verifyToken = async (token: string): Promise<{ valid: boolean; user?: any }> => {
  try {
    const response = await api.get('/api/auth/verify-token', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying token:', error);
    return { valid: false };
  }
};

// Request password reset
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post('/api/auth/reset-password', { email });
    return response.data;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw error;
  }
};

// Confirm password reset
export const confirmPasswordReset = async (token: string, newPassword: string): Promise<{ success: boolean; message: string; user?: any }> => {
  try {
    const response = await api.post('/api/auth/reset-password/confirm', { token, password: newPassword });
    return response.data;
  } catch (error) {
    console.error('Error confirming password reset:', error);
    throw error;
  }
};

// Verify email
export const verifyEmail = async (token: string): Promise<{ success: boolean; message: string; user?: any }> => {
  try {
    const response = await api.post('/api/auth/verify-email', { token });
    return response.data;
  } catch (error) {
    console.error('Error verifying email:', error);
    throw error;
  }
};

// Resend verification email
export const resendVerificationEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post('/api/auth/resend-verification', { email });
    return response.data;
  } catch (error) {
    console.error('Error resending verification email:', error);
    throw error;
  }
};

// Check email availability
export const checkEmailAvailability = async (email: string): Promise<{ available: boolean; message: string }> => {
  try {
    const response = await api.post('/api/auth/check-email', { email });
    return response.data;
  } catch (error) {
    console.error('Error checking email availability:', error);
    throw error;
  }
};

// Send registration verification code
export const sendRegistrationCode = async (userData: SignupData): Promise<{ success: boolean; message: string; email: string; expiresIn: number }> => {
  try {
    const response = await api.post('/api/auth/send-registration-code', userData);
    return response.data;
  } catch (error) {
    console.error('Error sending registration code:', error);
    throw error;
  }
};

// Verify registration code and create account
export const verifyRegistrationCode = async (email: string, code: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/api/auth/verify-registration-code', { email, code });

    // Store the token in localStorage for future API calls
    localStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data;
  } catch (error) {
    console.error('Error verifying registration code:', error);
    throw error;
  }
};

// Send login verification code
export const sendLoginCode = async (email: string): Promise<{ success: boolean; message: string; email: string; expiresIn: number }> => {
  try {
    const response = await api.post('/api/auth/send-login-code', { email });
    return response.data;
  } catch (error) {
    console.error('Error sending login code:', error);
    throw error;
  }
};

// Verify login code
export const verifyLoginCode = async (email: string, code: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/api/auth/verify-login-code', { email, code });

    // Store the token in localStorage for future API calls
    localStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data;
  } catch (error) {
    console.error('Error verifying login code:', error);
    throw error;
  }
};

// Resend verification code
export const resendVerificationCode = async (email: string, type: 'registration' | 'login' | 'password_reset'): Promise<{ success: boolean; message: string; email: string; expiresIn: number }> => {
  try {
    const response = await api.post('/api/auth/resend-code', { email, type });
    return response.data;
  } catch (error) {
    console.error('Error resending verification code:', error);
    throw error;
  }
};

// Send verification code
export const sendVerificationCode = async (email: string): Promise<VerificationResponse> => {
  try {
    const response = await api.post('/api/auth/send-code', { email });
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
};

// Verify code and login/register
export const verifyCode = async (email: string, code: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/api/auth/verify-code', { email, code });

    // Store the token in localStorage for future API calls
    localStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data;
  } catch (error) {
    console.error('Error verifying code:', error);
    throw error;
  }
};
