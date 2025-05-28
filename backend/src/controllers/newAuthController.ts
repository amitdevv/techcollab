import { Request, Response } from 'express';
import axios from 'axios';
import { User } from '../models/User';
import { generateToken } from '../utils/generateToken';
import { AuthRequest } from '../types/auth';

// Verify token validity
export const verifyToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // If we reached here, the token is valid (validated by auth middleware)
    const user = await User.findById(req.user?.id);

    if (!user) {
      res.status(404).json({ valid: false, message: 'User not found' });
      return;
    }

    res.json({
      valid: true,
      user
    });
  } catch (error) {
    console.error('Error in verifyToken:', error);
    res.status(500).json({ valid: false, message: 'Error verifying token' });
  }
};

// Handle Google OAuth login/signup
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ message: 'No token provided' });
      return;
    }

    // Verify the Google token with Google's API
    const googleResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`
    );

    const { email, name, sub, picture } = googleResponse.data;

    if (!email) {
      res.status(400).json({ message: 'Email not provided by Google' });
      return;
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, update fields if necessary
      if (!user.picture && picture) {
        user.picture = picture;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name: name || 'Google User',
        email,
        picture,
        authProvider: 'google',
        providerId: sub,
        emailVerified: true, // Google OAuth users are automatically verified
        profile: {
          skills: []
        }
      });
    }

    // Generate JWT token
    const jwtToken = generateToken(user._id.toString());

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        token: jwtToken
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Error in Google auth:', error);
    res.status(500).json({ message: 'Error authenticating with Google' });
  }
};
