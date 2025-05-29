import mongoose, { Document, Schema } from 'mongoose';

export interface IProposal extends Document {
  _id: string;
  gig: mongoose.Types.ObjectId;
  freelancer: mongoose.Types.ObjectId;
  coverLetter: string;
  proposedPrice: number;
  deliveryTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  clientMessage?: string; // Message from client when accepting/rejecting
  attachments?: Array<{
    url: string;
    filename: string;
    size: number;
    type: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const proposalSchema = new Schema<IProposal>({
  gig: {
    type: Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: {
    type: String,
    required: true,
    minlength: 50,
    maxlength: 2000
  },
  proposedPrice: {
    type: Number,
    required: true,
    min: 5
  },
  deliveryTime: {
    type: String,
    required: true,
    enum: ['1', '3', '7', '14', '30']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  clientMessage: {
    type: String,
    maxlength: 500
  },
  attachments: [{
    url: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true }
  }]
}, { timestamps: true });

// Indexes for performance
proposalSchema.index({ gig: 1, freelancer: 1 }, { unique: true }); // One proposal per freelancer per gig
proposalSchema.index({ gig: 1, status: 1 });
proposalSchema.index({ freelancer: 1, status: 1 });
proposalSchema.index({ createdAt: -1 });

export const Proposal = mongoose.model<IProposal>('Proposal', proposalSchema); 