import express from 'express';
import { uploadImage, deleteImage, batchDeleteImages } from '../controllers/cloudinaryController';
import { protect } from '../middleware/authMiddleware';
import multer from 'multer';

const router = express.Router();

// Enhanced multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Single file upload
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  }
});

// Multiple file upload for batch operations
const uploadMultiple = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Routes
router.post('/upload', protect, upload.single('file'), uploadImage);
router.delete('/delete/:publicId', protect, deleteImage);
router.delete('/batch-delete', protect, batchDeleteImages);

// Batch upload endpoint
router.post('/batch-upload', protect, uploadMultiple.array('files', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        // Use the upload controller logic here
        // This is simplified - you might want to extract this to a service
        const { uploadImage: uploadToCloudinary } = require('../utils/imageUpload');
        const result = await uploadToCloudinary(file, { folder: 'techcollab/batch' });
        
        results.push({
          filename: file.originalname,
          url: result.secure_url,
          public_id: result.public_id
        });
      } catch (error: any) {
        errors.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    res.json({
      success: errors.length === 0,
      message: `Processed ${req.files.length} files`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Batch upload failed'
    });
  }
});

export default router;