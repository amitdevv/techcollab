import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken } from '../utils/generateToken';

interface ProfileSetupBody {
  email: string;
  name: string;
  username: string;
  bio: string;
  picture?: string;
}

export const setupUserProfile = async (
  req: Request<{}, {}, ProfileSetupBody>,
  res: Response
): Promise<void> => {
  try {
    const { email, name, username, bio } = req.body;

    // Check if username is already taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      res.status(400).json({ message: 'Username already taken' });
      return;
    }

    // Find and update user with both top-level and nested profile fields
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          username,
          bio, // Top-level bio for compatibility
          'profile.bio': bio, // Nested profile bio
          picture: !req.body.picture
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
            : req.body.picture
        }
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Generate token for authenticated user
    const token = generateToken(user._id.toString());

    res.json({ user, token });
  } catch (error) {
    console.error('Error in setupUserProfile:', error);
    res.status(500).json({ message: 'Error setting up user profile' });
  }
};
