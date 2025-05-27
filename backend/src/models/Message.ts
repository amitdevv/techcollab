import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  _id: string;
  content: string;
  sender: mongoose.Types.ObjectId;
  channel: mongoose.Types.ObjectId;
  parentMessage?: mongoose.Types.ObjectId; // For replies/threads
  type: 'text' | 'image' | 'file' | 'system';
  read: boolean; // Whether the message has been read
  readBy: mongoose.Types.ObjectId[]; // Array of users who have read the message
  attachments: {
    type: 'image' | 'file';
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }[];
  reactions: {
    emoji: string;
    users: mongoose.Types.ObjectId[];
  }[];
  mentions: mongoose.Types.ObjectId[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  content: {
    type: String,
    required: true,
    maxlength: 4000
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  parentMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  read: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    }
  }],
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    users: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ parentMessage: 1 });
messageSchema.index({ mentions: 1 });
messageSchema.index({ 'reactions.users': 1 });

// Virtual for reaction counts
messageSchema.virtual('reactionCounts').get(function () {
  const counts: { [key: string]: number } = {};
  this.reactions?.forEach(reaction => {
    counts[reaction.emoji] = reaction.users?.length || 0;
  });
  return counts;
});

// Ensure virtuals are included in JSON
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
