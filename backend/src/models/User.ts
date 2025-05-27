import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  bio?: string;
  picture?: string;
  picturePublicId?: string;
  authProvider: 'google' | 'github' | 'password';
  providerId?: string;
  emailVerified: boolean;
  profile: {
    bio?: string;
    location?: string;
    website?: string;
    github?: string;
    twitter?: string;
    linkedin?: string;
    skills: string[];
  };
  stats: {
    activeGigs: number;
    events: number;
    messages: number;
  };
  status?: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true },
  password: { type: String },
  bio: String,
  picture: String,
  picturePublicId: String,
  authProvider: { type: String, enum: ['google', 'github', 'password'], required: true },
  providerId: String,
  emailVerified: { type: Boolean, default: false },
  profile: {
    bio: String,
    location: String,
    website: String,
    github: String,
    twitter: String,
    linkedin: String,
    skills: [String]
  },
  stats: {
    activeGigs: { type: Number, default: 0 },
    events: { type: Number, default: 0 },
    messages: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ authProvider: 1, providerId: 1 });

// Store the original picturePublicId before any modifications
userSchema.pre('save', function (next) {
  if (this.isModified('picturePublicId')) {
    (this as any)._oldPicturePublicId = this.picturePublicId;
  }
  next();
});

// Middleware to delete old profile picture from Cloudinary when updated
userSchema.post('save', async function () {
  if (this.isModified('picturePublicId')) {
    try {
      const { deleteImage } = require('../utils/imageUpload');
      const oldPictureId = (this as any)._oldPicturePublicId;
      if (oldPictureId && oldPictureId !== this.picturePublicId) {
        await deleteImage(oldPictureId);
      }
    } catch (error) {
      console.error('Error deleting old profile picture:', error);
    }
  }
});

export const User = mongoose.model<IUser>('User', userSchema);
