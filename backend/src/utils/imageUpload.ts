import cloudinary from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';

interface UploadResult {
  url: string;
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

interface UploadOptions {
  folder?: string;
  transformation?: any[];
  publicId?: string;
  overwrite?: boolean;
  quality?: string | number;
  format?: string;
  eager?: any[]; // For generating additional transformations
}

export const uploadImage = async (
  file: Express.Multer.File | undefined,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 10MB.');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are supported.');
  }

  try {
    // Convert the buffer to base64
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    // Default upload options
    const uploadOptions = {
      folder: options.folder || 'techcollab',
      resource_type: 'auto' as const,
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
      quality: options.quality || 'auto:good',
      fetch_format: 'auto',
      overwrite: options.overwrite || false,
      unique_filename: true,
      use_filename: false,
      // Add cache control and versioning
      invalidate: true,
      // Auto-optimize for web
      transformation: options.transformation || [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
        { flags: 'progressive' }
      ],
      ...options
    };

    console.log('Uploading image with options:', { 
      folder: uploadOptions.folder, 
      size: file.size, 
      type: file.mimetype 
    });

    // Upload to Cloudinary
    const result: UploadApiResponse = await cloudinary.uploader.upload(dataURI, uploadOptions);

    console.log('Upload successful:', { 
      publicId: result.public_id, 
      url: result.secure_url,
      format: result.format,
      bytes: result.bytes
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error: any) {
    console.error('Image upload error:', error);
    
    // Handle specific Cloudinary errors
    if (error.http_code) {
      switch (error.http_code) {
        case 400:
          throw new Error('Invalid image file or upload parameters');
        case 401:
          throw new Error('Cloudinary authentication failed');
        case 403:
          throw new Error('Upload not allowed - check Cloudinary settings');
        case 420:
          throw new Error('Upload rate limit exceeded');
        default:
          throw new Error(`Cloudinary error: ${error.message}`);
      }
    }
    
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  if (!publicId) {
    throw new Error('No public ID provided');
  }

  try {
    console.log('Deleting image:', publicId);
    
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true // Clear CDN cache
    });
    
    console.log('Delete result:', result);
    
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Failed to delete image: ${result.result}`);
    }
  } catch (error: any) {
    console.error('Image deletion error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

// Specialized upload functions with optimized settings
export const uploadProfileImage = async (file: Express.Multer.File): Promise<UploadResult> => {
  return uploadImage(file, {
    folder: 'techcollab/profiles',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    overwrite: false
  });
};

export const uploadEventImage = async (file: Express.Multer.File): Promise<UploadResult> => {
  return uploadImage(file, {
    folder: 'techcollab/events',
    transformation: [
      { width: 800, height: 600, crop: 'fill' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  });
};

export const uploadGigImage = async (file: Express.Multer.File): Promise<UploadResult> => {
  return uploadImage(file, {
    folder: 'techcollab/gigs',
    transformation: [
      { width: 600, height: 400, crop: 'fill' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  });
};

// Utility function to generate optimized URLs
export const getOptimizedImageUrl = (
  publicId: string, 
  options: { width?: number; height?: number; crop?: string; quality?: string } = {}
): string => {
  if (!publicId) return '';
  
  const { width = 400, height = 400, crop = 'fill', quality = 'auto:good' } = options;
  
  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: 'auto',
    secure: true,
    // Add cache busting
    version: Date.now()
  });
};