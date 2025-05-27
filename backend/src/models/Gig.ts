import mongoose, { Document, Schema } from 'mongoose';

export interface IGig extends Document {
  _id: string;
  title: string;
  description: string;
  category: 'web' | 'mobile' | 'design' | 'data' | 'devops' | 'writing' | 'marketing';
  subCategory: 'frontend' | 'backend' | 'fullstack' | 'wordpress' | 'ecommerce' | 'ios' | 'android' | 'ui' | 'ux' | 'graphic' | 'logo' | 'analysis' | 'ml' | 'visualization' | 'cicd' | 'cloud' | 'infrastructure' | 'copywriting' | 'technical' | 'content' | 'seo' | 'social' | 'ads';
  price: number;
  deliveryTime: '1' | '3' | '7' | '14' | '30';
  tags: string[];
  images: string[];
  freelancer: mongoose.Types.ObjectId;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  rating: number;
  reviews: number;
  orders: number;
  views: number;
  favorites: number;
  createdAt: Date;
  updatedAt: Date;
}

const gigSchema = new Schema<IGig>({
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['web', 'mobile', 'design', 'data', 'devops', 'writing', 'marketing']
  },
  subCategory: {
    type: String,
    required: true,
    enum: ['frontend', 'backend', 'fullstack', 'wordpress', 'ecommerce', 'ios', 'android', 'ui', 'ux', 'graphic', 'logo', 'analysis', 'ml', 'visualization', 'cicd', 'cloud', 'infrastructure', 'copywriting', 'technical', 'content', 'seo', 'social', 'ads']
  },
  price: { type: Number, required: true, min: 5 },
  deliveryTime: {
    type: String,
    required: true,
    enum: ['1', '3', '7', '14', '30']
  },
  tags: [{ type: String, maxlength: 5 }],
  images: [String], // URLs to uploaded images
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  favorites: { type: Number, default: 0 }
}, { timestamps: true });

// Index for search and filtering
gigSchema.index({ title: 'text', description: 'text', tags: 'text' });
gigSchema.index({ category: 1, subCategory: 1 });
gigSchema.index({ price: 1 });
gigSchema.index({ rating: -1 });
gigSchema.index({ createdAt: -1 });
gigSchema.index({ freelancer: 1 });
gigSchema.index({ status: 1 });

export const Gig = mongoose.model<IGig>('Gig', gigSchema);
