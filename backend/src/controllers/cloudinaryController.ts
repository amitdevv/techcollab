import { Request, Response } from 'express';
import { uploadImage as uploadToCloudinary, deleteImage as deleteFromCloudinary } from '../utils/imageUpload';

// Upload image to Cloudinary
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // Upload the file to Cloudinary using our utility
    const result = await uploadToCloudinary(req.file, 'techcollab'); res.json({
      success: true,
      url: result.url,
      public_id: result.public_id, // ensure consistent naming with Cloudinary's response
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
};

// Delete image from Cloudinary
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      res.status(400).json({ message: 'No public ID provided' });
      return;
    }

    await deleteFromCloudinary(publicId);
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
};