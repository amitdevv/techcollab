import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  _id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'announcement';
  sender: mongoose.Types.ObjectId;
  channel?: mongoose.Types.ObjectId;
  chat?: mongoose.Types.ObjectId;
  attachments: Array<{
    type: 'image' | 'file';
    url: string;
    filename: string;
    size?: number;
    publicId?: string; // For Cloudinary cleanup
    thumbnailUrl?: string; // For image previews
    width?: number;
    height?: number;
  }>;
  mentions: mongoose.Types.ObjectId[];
  reactions: Array<{
    emoji: string;
    users: mongoose.Types.ObjectId[];
  }>;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  parentMessage?: mongoose.Types.ObjectId; // For thread/reply functionality
  readBy: Array<{
    user: mongoose.Types.ObjectId;
    readAt: Date;
  }>;
  // For announcements
  announcement?: {
    title: string;
    isPinned: boolean;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  };
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'announcement'],
    default: 'text'
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: 'Channel'
  },
  chat: {
    type: Schema.Types.ObjectId,
    ref: 'Chat'
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
      type: Number
    },
    publicId: {
      type: String // For Cloudinary cleanup
    },
    thumbnailUrl: {
      type: String // For image previews
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    }
  }],
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
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
  },
  parentMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  readBy: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  announcement: {
    title: {
      type: String,
      maxlength: 100
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ isDeleted: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ 'readBy.user': 1 });
messageSchema.index({ 'announcement.isPinned': 1 });

// Ensure either channel or chat is provided
messageSchema.pre('save', function(next) {
  if (!this.channel && !this.chat) {
    next(new Error('Message must belong to either a channel or a chat'));
  } else {
    next();
  }
});

export const Message = mongoose.model<IMessage>('Message', messageSchema);
