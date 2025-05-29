/**
 * Frontend Image Utilities
 * Handles image validation, compression, and optimization
 */

export interface ImageValidationOptions {
  maxSizeInMB?: number;
  allowedTypes?: readonly string[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ImageInfo {
  width: number;
  height: number;
  size: number;
  type: string;
  aspectRatio: number;
}

/**
 * Validates an image file based on specified criteria
 */
export const validateImageFile = (
  file: File,
  options: ImageValidationOptions = {}
): { isValid: boolean; error?: string } => {
  const {
    maxSizeInMB = 10,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    minWidth,
    minHeight,
    maxWidth,
    maxHeight
  } = options;

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `File size too large. Maximum size: ${maxSizeInMB}MB`
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File appears to be empty or corrupted'
    };
  }

  return { isValid: true };
};

/**
 * Gets image dimensions and metadata
 */
export const getImageInfo = (file: File): Promise<ImageInfo> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

/**
 * Compresses an image file to reduce size while maintaining quality
 */
export const compressImage = (
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Creates a preview URL for an image file
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to create preview'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Generates optimized Cloudinary URLs with transformations
 */
export const getOptimizedImageUrl = (
  imageUrl: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    cacheBust?: boolean;
  } = {}
): string => {
  if (!imageUrl) return '';

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    cacheBust = false
  } = options;

  // If it's a Cloudinary URL, add transformations
  if (imageUrl.includes('cloudinary.com')) {
    const transformations = [];
    
    if (width || height) {
      let transform = '';
      if (width) transform += `w_${width}`;
      if (height) transform += `${transform ? ',' : ''}h_${height}`;
      if (crop) transform += `${transform ? ',' : ''}c_${crop}`;
      transformations.push(transform);
    }
    
    transformations.push(`q_${quality}`);
    transformations.push(`f_${format}`);

    // Insert transformations into Cloudinary URL
    const transformString = transformations.join('/');
    const parts = imageUrl.split('/upload/');
    if (parts.length === 2) {
      imageUrl = `${parts[0]}/upload/${transformString}/${parts[1]}`;
    }
  }

  // Add cache busting if requested
  if (cacheBust) {
    const separator = imageUrl.includes('?') ? '&' : '?';
    imageUrl += `${separator}t=${Date.now()}`;
  }

  return imageUrl;
};

/**
 * Checks if an image URL is accessible
 */
export const checkImageExists = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/**
 * Downloads an image from URL and returns as File
 */
export const downloadImageAsFile = async (url: string, filename?: string): Promise<File> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to download image');
    }
    
    const blob = await response.blob();
    const file = new File([blob], filename || 'downloaded-image.jpg', {
      type: blob.type,
      lastModified: Date.now()
    });
    
    return file;
  } catch (error) {
    throw new Error(`Failed to download image: ${error}`);
  }
};

/**
 * Common image validation presets
 */
export const ImageValidationPresets = {
  profile: {
    maxSizeInMB: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    minWidth: 100,
    minHeight: 100,
    maxWidth: 2000,
    maxHeight: 2000
  },
  event: {
    maxSizeInMB: 8,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    minWidth: 300,
    minHeight: 200,
    maxWidth: 3000,
    maxHeight: 2000
  },
  gig: {
    maxSizeInMB: 6,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    minWidth: 200,
    minHeight: 150,
    maxWidth: 2500,
    maxHeight: 1500
  }
} as const; 