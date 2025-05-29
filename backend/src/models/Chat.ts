import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  type: 'gig_interest' | 'general';
  gigId?: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  isActive: boolean;
  joinLink?: string; // For shareable chat links
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    type: {
      type: String,
      enum: ['gig_interest', 'general'],
      default: 'general',
      required: true
    },
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: function() {
        return this.type === 'gig_interest';
      }
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    joinLink: {
      type: String,
      unique: true,
      sparse: true // Allow null values to not conflict
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ChatSchema.index({ participants: 1 });
ChatSchema.index({ lastActivity: -1 });
ChatSchema.index({ gigId: 1 });
ChatSchema.index({ type: 1 });
ChatSchema.index({ isActive: 1 });
ChatSchema.index({ joinLink: 1 });

// Ensure participants array has exactly 2 users for direct chats
ChatSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Chat must have exactly 2 participants'));
  }
  next();
});

export const Chat = mongoose.model<IChat>('Chat', ChatSchema); 