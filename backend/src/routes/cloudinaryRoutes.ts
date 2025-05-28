import express from 'express';
import { uploadImage, deleteImage } from '../controllers/cloudinaryController';
import { protect } from '../middleware/authMiddleware';
import multer from 'multer';

const router = express.Router();

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

// Routes for image upload and deletion
router.post('/upload', protect, upload.single('file'), uploadImage); // Changed from 'image' to 'file'
router.delete('/delete/:publicId', protect, deleteImage);

export default router;