import cloudinary from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';

interface UploadResult {
  url: string;
  public_id: string;
}

export const uploadImage = async (
  file: Express.Multer.File | undefined,
  folder: string = 'uploads'
): Promise<UploadResult> => {
  if (!file) {
    throw new Error('No file provided');
  }
  try {
    // Convert the buffer to base64
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result: UploadApiResponse = await cloudinary.uploader.upload(dataURI, {
      folder,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image');
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Image deletion error:', error);
    throw new Error('Failed to delete image');
  }
};