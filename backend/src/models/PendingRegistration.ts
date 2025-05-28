import mongoose from 'mongoose';
import crypto from 'crypto';

// Interface for PendingRegistration document
export interface IPendingRegistration extends mongoose.Document {
  name: string;
  email: string;
  password: string; // This will be hashed
  token: string;
  expires: Date;
  verified: boolean;
}

// Interface for PendingRegistration model with static methods
interface IPendingRegistrationModel extends mongoose.Model<IPendingRegistration> {
  createPendingRegistration(name: string, email: string, hashedPassword: string): {
    verificationToken: string;
    pendingRegistration: IPendingRegistration;
  };
}

// Schema for pending registrations
const pendingRegistrationSchema = new mongoose.Schema<IPendingRegistration>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expires: {
      type: Date,
      required: true,
      default: function () {
        // Token expires in 24 hours by default
        return new Date(Date.now() + 24 * 3600000);
      },
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create and hash verification token for pending registration
pendingRegistrationSchema.statics.createPendingRegistration = function (
  name: string, 
  email: string, 
  hashedPassword: string
) {
  // Generate a random token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Hash the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Create a new pending registration document
  return {
    verificationToken,
    pendingRegistration: new this({
      name,
      email,
      password: hashedPassword,
      token: hashedToken,
      expires: new Date(Date.now() + 24 * 3600000), // 24 hours from now
    }),
  };
};

// Index to automatically delete expired documents
pendingRegistrationSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

export const PendingRegistration = mongoose.model<IPendingRegistration, IPendingRegistrationModel>('PendingRegistration', pendingRegistrationSchema);
