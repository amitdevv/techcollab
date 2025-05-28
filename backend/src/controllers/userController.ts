import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken } from '../utils/generateToken';
import { uploadImage, deleteImage } from '../utils/imageUpload';
import { AuthRequest } from '../types/auth';

// Username function removed

// Get user profile
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};

// Update user profile
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Updating profile for user:', req.params.id);
    console.log('Request body:', req.body); const updateFields: any = {};

    // Preserve picture fields if provided
    if (req.body.picture !== undefined) {
      updateFields.picture = req.body.picture;
    }
    if (req.body.picturePublicId !== undefined) {
      updateFields.picturePublicId = req.body.picturePublicId;
    }

    // Update both top-level bio and nested profile.bio for consistency
    if (req.body.bio !== undefined) {
      updateFields.bio = req.body.bio;
      updateFields['profile.bio'] = req.body.bio;
    }

    // Update nested profile fields
    if (req.body.location !== undefined) {
      updateFields['profile.location'] = req.body.location;
    }
    if (req.body.website !== undefined) {
      updateFields['profile.website'] = req.body.website;
    }
    if (req.body.github !== undefined) {
      updateFields['profile.github'] = req.body.github;
    }
    if (req.body.twitter !== undefined) {
      updateFields['profile.twitter'] = req.body.twitter;
    }
    if (req.body.linkedin !== undefined) {
      updateFields['profile.linkedin'] = req.body.linkedin;
    }
    if (req.body.skills !== undefined) {
      updateFields['profile.skills'] = req.body.skills;
    }

    console.log('Update fields:', updateFields);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    console.log('Updated user:', user);
    res.json(user);
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    res.status(500).json({ message: 'Error updating user profile' });
  }
};

// Update profile picture
export const updateProfilePicture = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    let pictureUrl;
    let publicId; if (req.file) {
      // If a file was uploaded, process it through Cloudinary
      const result = await uploadImage(req.file, 'profile-pictures');
      pictureUrl = result.url;
      publicId = result.public_id;
    } else if (req.body.picture) {
      // If a Cloudinary URL was provided directly
      pictureUrl = req.body.picture;
      publicId = req.body.publicId || null;
    } else {
      res.status(400).json({ message: 'No image file or URL provided' });
      return;
    }    // Delete old profile picture if it exists
    if (user.picturePublicId) {
      try {
        await deleteImage(user.picturePublicId);
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
      }
    }

    // Update user with new picture URL and public ID
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        picture: pictureUrl,
        picturePublicId: publicId // Always update both fields together
      },
      { new: true }
    );

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Error updating profile picture' });
  }
};

interface CreateUserBody {
  email: string;
  name: string;
  picture?: string;
  authProvider: 'google' | 'github';
}

// Create new user (used after OAuth authentication)
export const createUser = async (req: Request & { body: CreateUserBody }, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      const token = generateToken(user._id.toString());
      res.json({ user, token });
      return;
    }

    // Create new user if doesn't exist
    user = await User.create(req.body);
    const token = generateToken(user._id.toString());

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    console.error('Error in createUser:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};
