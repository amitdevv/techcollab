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
  }
}, {
  timestamps: true
});

// Indexes for better query performance
channelSchema.index({ type: 1, isArchived: 1 });
channelSchema.index({ members: 1 });
channelSchema.index({ creator: 1 });
channelSchema.index({ isPinned: 1, lastActivity: -1 });
channelSchema.index({ name: 'text', description: 'text' });

// Virtual for member count
channelSchema.virtual('memberCount').get(function() {
  return this.members?.length || 0;
});

// Ensure virtuals are included in JSON
channelSchema.set('toJSON', { virtuals: true });
channelSchema.set('toObject', { virtuals: true });

export const Channel = mongoose.model<IChannel>('Channel', channelSchema);
