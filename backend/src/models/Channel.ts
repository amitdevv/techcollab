import mongoose, { Document, Schema } from 'mongoose';

export interface IChannel extends Document {
  _id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  creator: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  admins: mongoose.Types.ObjectId[];
  category?: string;
  avatar?: string;
  isPinned: boolean;
  isArchived: boolean;
  lastActivity: Date;
  messageCount: number;
  joinLink?: string; // For easy joining
  announcements: Array<{
    _id: mongoose.Types.ObjectId;
    title: string;
    content: string;
    author: mongoose.Types.ObjectId;
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  settings: {
    allowFileUploads: boolean;
    allowImageUploads: boolean;
    onlyAdminsCanPost: boolean;
    welcomeMessage?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50,
    unique: true
  },
  description: {
    type: String,
    maxlength: 200
  },
  type: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  category: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  joinLink: {
    type: String,
    unique: true,
    sparse: true // Allow null values to not conflict
  },
  announcements: [{
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPinned: {
      type: Boolean,
      default: false
    }
  }, {
    timestamps: true
  }],
  settings: {
    allowFileUploads: {
      type: Boolean,
      default: true
    },
    allowImageUploads: {
      type: Boolean,
      default: true
    },
    onlyAdminsCanPost: {
      type: Boolean,
      default: false
    },
    welcomeMessage: {
      type: String,
      maxlength: 500
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
channelSchema.index({ type: 1, isArchived: 1 });
channelSchema.index({ members: 1 });
channelSchema.index({ creator: 1 });
channelSchema.index({ joinLink: 1 });
channelSchema.index({ 'announcements.isPinned': 1 });

// Pre-save middleware to generate join link
channelSchema.pre('save', function(next) {
  if (this.isNew && !this.joinLink) {
    // Generate a unique join link
    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    this.joinLink = `join-${this.name}-${randomString}`;
  }
  next();
});

// Virtual for member count
channelSchema.virtual('memberCount').get(function() {
  return this.members?.length || 0;
});

// Ensure virtuals are included in JSON
channelSchema.set('toJSON', { virtuals: true });
channelSchema.set('toObject', { virtuals: true });

export const Channel = mongoose.model<IChannel>('Channel', channelSchema);
