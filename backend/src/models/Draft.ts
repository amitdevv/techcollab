import mongoose, { Document, Schema } from 'mongoose';

export interface IDraft extends Document {
  _id: string;
  user: mongoose.Types.ObjectId;
  type: 'event' | 'gig';
  title: string;
  data: object; // The draft form data
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
}

const draftSchema = new Schema<IDraft>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['event', 'gig'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Index for better query performance
draftSchema.index({ user: 1, type: 1 });
draftSchema.index({ user: 1, lastModified: -1 });

// Update lastModified on save
draftSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

export const Draft = mongoose.model<IDraft>('Draft', draftSchema); 