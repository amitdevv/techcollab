import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  _id: string;
  title: string;
  description: string;
  category: 'workshop' | 'conference' | 'networking' | 'hackathon' | 'webinar' | 'meetup' | 'other';
  date: Date;
  endDate?: Date;
  time: string;
  endTime?: string;
  location: {
    type: 'online' | 'offline' | 'hybrid';
    address?: string;
    city?: string;
    country?: string;
    meetingLink?: string;
    venue?: string;
  };
  organizer: mongoose.Types.ObjectId;
  attendees: mongoose.Types.ObjectId[];
  maxAttendees?: number;
  price: number;
  currency: string; tags: string[];
  images: Array<{
    url: string;
    publicId: string;
  }>;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  featured: boolean;
  requirements?: string[];
  agenda?: {
    time: string;
    title: string;
    description?: string;
    speaker?: string;
  }[];
  rsvpDeadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['workshop', 'conference', 'networking', 'hackathon', 'webinar', 'meetup', 'other']
  },
  date: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  time: {
    type: String,
    required: true
  },
  endTime: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['online', 'offline', 'hybrid'],
      required: true
    },
    address: String,
    city: String,
    country: String,
    meetingLink: String,
    venue: String
  },
  organizer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxAttendees: {
    type: Number,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }], images: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  requirements: [{
    type: String,
    trim: true
  }],
  agenda: [{
    time: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    speaker: String
  }],
  rsvpDeadline: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ 'location.city': 1, 'location.country': 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ featured: 1, date: 1 });

// Virtual for attendee count
eventSchema.virtual('attendeeCount').get(function () {
  return this.attendees?.length || 0;
});

// Virtual for spots remaining
eventSchema.virtual('spotsRemaining').get(function () {
  if (!this.maxAttendees) return null;
  return this.maxAttendees - (this.attendees?.length || 0);
});

// Virtual for full status
eventSchema.virtual('isFull').get(function () {
  if (!this.maxAttendees) return false;
  return (this.attendees?.length || 0) >= this.maxAttendees;
});

// Ensure virtuals are included in JSON
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

export const Event = mongoose.model<IEvent>('Event', eventSchema);
