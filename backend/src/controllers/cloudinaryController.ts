import { Request, Response } from 'express';
import { 
  uploadImage as uploadToCloudinary, 
  deleteImage as deleteFromCloudinary, 
  uploadProfileImage, 
  uploadEventImage, 
  uploadGigImage 
} from '../utils/imageUpload';

// Upload chat image with optimized settings
export const uploadChatImage = async (file: Express.Multer.File): Promise<any> => {
  return uploadToCloudinary(file, {
    folder: 'techcollab/chat-images',
    transformation: [
      { width: 800, height: 600, crop: 'limit' }, // Don't crop, just limit size
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    // Generate thumbnail for quick preview
    eager: [
      { width: 200, height: 150, crop: 'fill', quality: 'auto:low' }
    ]
  });
};

// Generic image upload
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
      return;
    }

    // Get upload type from query params
    const uploadType = req.query.type as string;
    const folder = req.query.folder as string;

    let result;
    
    // Use specialized upload function based on type
    switch (uploadType) {
      case 'profile':
        result = await uploadProfileImage(req.file);
        break;
      case 'event':
        result = await uploadEventImage(req.file);
        break;
      case 'gig':
        result = await uploadGigImage(req.file);
        break;
      case 'chat':
        result = await uploadChatImage(req.file);
        break;
      default:
        // Generic upload
        result = await uploadToCloudinary(req.file, { 
          folder: folder || 'techcollab/general' 
        });
        break;
    }

    // Format response for chat images
    const response: any = {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      message: 'Image uploaded successfully'
    };

    // Add thumbnail URL for chat images
    if (uploadType === 'chat' && result.eager && result.eager.length > 0) {
      response.thumbnailUrl = result.eager[0].secure_url;
    }

    res.json(response);
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error);
    
    // Return appropriate error status based on error type
    let statusCode = 500;
    if (error.message.includes('Invalid file type')) statusCode = 400;
    if (error.message.includes('File size too large')) statusCode = 413;
    if (error.message.includes('authentication failed')) statusCode = 401;
    if (error.message.includes('not allowed')) statusCode = 403;
    
    res.status(statusCode).json({ 
      success: false, 
      message: error.message || 'Error uploading image',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete image from Cloudinary
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      res.status(400).json({ 
        success: false, 
        message: 'No public ID provided' 
      });
      return;
    }

    // Decode the public ID if it was URL encoded
    const decodedPublicId = decodeURIComponent(publicId);
    
    await deleteFromCloudinary(decodedPublicId);
    
    res.json({ 
      success: true, 
      message: 'Image deleted successfully',
      public_id: decodedPublicId
    });
  } catch (error: any) {
    console.error('Error deleting from Cloudinary:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error deleting image',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Batch delete images
export const batchDeleteImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicIds } = req.body;

    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'No public IDs provided' 
      });
      return;
    }

    const results = [];
    const errors = [];

    for (const publicId of publicIds) {
      try {
        await deleteFromCloudinary(publicId);
        results.push({ publicId, status: 'deleted' });
      } catch (error: any) {
        errors.push({ publicId, error: error.message });
      }
    }

    res.json({ 
      success: errors.length === 0, 
      message: `Processed ${publicIds.length} images`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error in batch delete:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error deleting images'
    });
  }
};