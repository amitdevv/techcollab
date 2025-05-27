import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import axios from 'axios';
import crypto from 'crypto';
import { User } from '../models/User';
import { PasswordReset } from '../models/PasswordReset';
import { EmailVerification } from '../models/EmailVerification';
import { generateToken } from '../utils/generateToken';
import { AuthRequest } from '../types/auth';
import { sendEmail } from '../utils/sendEmail';
import config from '../config/config';

// Register user with email, username, and password
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ message: 'Please provide username, email, and password' });
      return;
    }

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [
        { email },
        { username }
      ]
    });

    if (userExists) {
      if (userExists.email === email) {
        res.status(400).json({ message: 'Email is already registered' });
      } else {
        res.status(400).json({ message: 'Username is already taken' });
      }
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: username, // Use username as name initially
      username,
      email,
      password: hashedPassword,
      authProvider: 'password',
      emailVerified: false, // New users start with unverified email
      profile: {
        skills: []
      }
    });    // Create email verification token
    const { verificationToken, emailVerification } = EmailVerification.createToken(user._id);
    await emailVerification.save();

    // Create verification URL
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;

    // Create email content
    const text = `Welcome to ${config.appName}! Please verify your email address by clicking the link below:
    
    ${verificationUrl}
    
    This link will expire in 24 hours.`;

    const html = `
    <h2>Welcome to ${config.appName}!</h2>
    <p>Please verify your email address by clicking the button below:</p>
    <p><a href="${verificationUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Verify Email Address</a></p>
    <p>This link will expire in 24 hours.</p>
    <p>If you did not create an account, please ignore this email.</p>
    `;

    // Send verification email
    await sendEmail(
      email,
      `Welcome to ${config.appName} - Verify Your Email`,
      text,
      html
    );

    // Generate JWT token
    const token = generateToken(user._id.toString());

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(201).json({
      user: {
        ...userWithoutPassword,
        token
      },
      token,
      message: 'Registration successful! Please check your email to verify your account.'
    });
  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

// Login user with email/username and password
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      res.status(400).json({ message: 'Please provide username/email and password' });
      return;
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail },
        { username: usernameOrEmail }
      ]
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if user has a password (users created via OAuth might not)
    if (!user.password) {
      res.status(401).json({
        message: 'This account was created with a social login. Please use that method to sign in.'
      });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    // Don't send password in response
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.json({
      user: {
        ...userWithoutPassword,
        token
      },
      token
    });
  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

// Verify token validity
export const verifyToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // If we reached here, the token is valid (validated by auth middleware)
    const user = await User.findById(req.user?.id);

    if (!user) {
      res.status(404).json({ valid: false, message: 'User not found' });
      return;
    }

    // Don't send password in response
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.json({
      valid: true,
      user: userWithoutPassword
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

    // Return user data
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
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

// Request password reset
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Please provide an email address' });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Don't reveal if user exists or not for security reasons
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
      return;
    }

    // Check if user was created with OAuth provider
    if (user.authProvider !== 'password' && !user.password) {
      res.status(400).json({
        message: 'This account was created using a social login. Please use that method to sign in.'
      });
      return;
    }

    // Create a password reset token
    const { resetToken, passwordReset } = PasswordReset.createToken(user._id);
    await passwordReset.save();

    // Create reset URL
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    // Create email content
    const text = `You are receiving this email because you (or someone else) has requested the reset of a password. 
    Please click the link below to reset your password. This link will expire in 1 hour.
    
    ${resetUrl}
    
    If you did not request this, please ignore this email and your password will remain unchanged.`;

    const html = `
    <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
    <p>Please click the link below to reset your password. This link will expire in 1 hour.</p>
    <p><a href="${resetUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `;

    // Send email
    await sendEmail(
      email,
      'Password Reset Request',
      text,
      html
    );

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ message: 'Error requesting password reset' });
  }
};

// Reset password with token
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ message: 'Please provide token and password' });
      return;
    }

    // Hash the token to compare with the one in DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find valid password reset token
    const passwordReset = await PasswordReset.findOne({
      token: hashedToken,
      expires: { $gt: Date.now() },
      used: false,
    });

    if (!passwordReset) {
      res.status(400).json({ message: 'Invalid or expired password reset token' });
      return;
    }

    // Find the user
    const user = await User.findById(passwordReset.user);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password
    user.password = hashedPassword;
    user.authProvider = 'password'; // Ensure authProvider is set to password
    await user.save();

    // Mark token as used
    passwordReset.used = true;
    await passwordReset.save();

    // Generate new JWT token
    const jwtToken = generateToken(user._id.toString());

    // Send confirmation email
    const text = `Your password has been changed successfully.`;
    const html = `<p>Your password has been changed successfully.</p>`;

    await sendEmail(
      user.email,
      'Password Changed Successfully',
      text,
      html
    );

    res.json({
      success: true,
      message: 'Password reset successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        picture: user.picture,
        token: jwtToken
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

// Verify email with token
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ message: 'Verification token is required' });
      return;
    }

    // Hash the token to compare with the one in DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find valid verification token
    const emailVerification = await EmailVerification.findOne({
      token: hashedToken,
      expires: { $gt: Date.now() },
      verified: false,
    });

    if (!emailVerification) {
      res.status(400).json({
        message: 'Invalid or expired verification token. Please request a new verification email.'
      });
      return;
    }

    // Find the user
    const user = await User.findById(emailVerification.user);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Update user verification status
    user.emailVerified = true;
    await user.save();

    // Mark token as verified
    emailVerification.verified = true;
    await emailVerification.save();

    // Generate JWT token
    const jwtToken = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Email verification successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        picture: user.picture,
        emailVerified: true,
        token: jwtToken
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Error verifying email' });
  }
};

// Resend verification email
export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a verification email has been sent.'
      });
      return;
    }

    // Check if email is already verified
    if (user.emailVerified) {
      res.status(400).json({ message: 'Email is already verified' });
      return;
    }

    // Delete any existing verification tokens
    await EmailVerification.deleteMany({ user: user._id });

    // Create new verification token
    const { verificationToken, emailVerification } = EmailVerification.createToken(user._id);
    await emailVerification.save();

    // Create verification URL
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;

    // Create email content
    const text = `Please verify your email address by clicking the link below:
    
    ${verificationUrl}
    
    This link will expire in 24 hours.`;

    const html = `
    <h2>Email Verification</h2>
    <p>Please verify your email address by clicking the button below:</p>
    <p><a href="${verificationUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Verify Email Address</a></p>
    <p>This link will expire in 24 hours.</p>
    <p>If you did not request this verification email, please ignore it.</p>
    `;

    // Send verification email
    await sendEmail(
      email,
      'Verify Your Email Address',
      text,
      html
    );

    res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ message: 'Error sending verification email' });
  }
};
