import { useState, useCallback } from 'react';
import axios, { AxiosProgressEvent } from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseImageUploadReturn {
  uploadImage: (file: File, options?: UploadOptions) => Promise<UploadResult>;
  deleteImage: (publicId: string) => Promise<void>;
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  error: string | null;
  clearError: () => void;
}

interface UploadOptions {
  type?: 'profile' | 'event' | 'gig' | 'general';
  folder?: string;
  onProgress?: (progress: UploadProgress) => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getAuthToken = useCallback((): string => {
    const storedToken = localStorage.getItem('token');
    const userToken = user?.token;
    const token = storedToken || userToken;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Store token in localStorage if not already there
    if (!storedToken && userToken) {
      localStorage.setItem('token', userToken);
    }

    return token;
  }, [user]);

  const validateFile = useCallback((file: File): void => {
    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png', 
      'image/gif',
      'image/webp'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are supported.');
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    // Check if file is corrupted (very basic check)
    if (file.size === 0) {
      throw new Error('File appears to be corrupted or empty.');
    }
  }, []);

  const uploadImage = useCallback(async (
    file: File, 
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(null);

    try {
      // Validate file
      validateFile(file);

      // Get authentication token
      const token = getAuthToken();

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);

      // Prepare URL with query parameters
      const params = new URLSearchParams();
      if (options.type) params.append('type', options.type);
      if (options.folder) params.append('folder', options.folder);
      
      const url = `${import.meta.env.VITE_API_URL}/api/upload/upload${params.toString() ? `?${params.toString()}` : ''}`;

      console.log('Uploading image:', {
        filename: file.name,
        size: file.size,
        type: file.type,
        uploadType: options.type,
        folder: options.folder
      });

      // Upload with progress tracking
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const progress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100)
            };
            
            setUploadProgress(progress);
            options.onProgress?.(progress);
          }
        },
        timeout: 30000, // 30 second timeout
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Upload failed');
      }

      const result: UploadResult = {
        url: response.data.url,
        publicId: response.data.public_id,
        width: response.data.width,
        height: response.data.height,
        format: response.data.format,
        bytes: response.data.bytes
      };

      console.log('Upload successful:', result);

      return result;
    } catch (err: any) {
      let errorMessage = 'Failed to upload image';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Upload timed out. Please try again.';
      } else if (err.response?.status === 413) {
        errorMessage = 'File too large. Please choose a smaller image.';
      } else if (err.response?.status === 415) {
        errorMessage = 'Unsupported file type. Please upload an image file.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      console.error('Upload error:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [isAuthenticated, validateFile, getAuthToken]);

  const deleteImage = useCallback(async (publicId: string): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    if (!publicId) {
      throw new Error('Public ID is required');
    }

    try {
      const token = getAuthToken();
      
      // Encode the public ID to handle special characters
      const encodedPublicId = encodeURIComponent(publicId);
      
      console.log('Deleting image:', publicId);

      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/upload/delete/${encodedPublicId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Delete failed');
      }

      console.log('Delete successful for:', publicId);
    } catch (err: any) {
      let errorMessage = 'Failed to delete image';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      console.error('Delete error:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, getAuthToken]);

  return { 
    uploadImage, 
    deleteImage,
    isUploading, 
    uploadProgress,
    error,
    clearError
  };
};
