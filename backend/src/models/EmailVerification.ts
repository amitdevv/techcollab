import mongoose from 'mongoose';
import crypto from 'crypto';

// Interface for EmailVerification document
export interface IEmailVerification extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  token: string;
  expires: Date;
  verified: boolean;
}

// Interface for EmailVerification model with static methods
interface IEmailVerificationModel extends mongoose.Model<IEmailVerification> {
  createToken(userId: mongoose.Types.ObjectId | string): {
    verificationToken: string;
    emailVerification: IEmailVerification;
  };
}

// Schema for email verification
const emailVerificationSchema = new mongoose.Schema<IEmailVerification>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

// Create and hash verification token
emailVerificationSchema.statics.createToken = function (userId: mongoose.Types.ObjectId | string) {
  // Generate a random token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Hash the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Create a new verification document
  return {
    verificationToken,
    emailVerification: new this({
      user: userId,
      token: hashedToken,
      expires: new Date(Date.now() + 24 * 3600000), // 24 hours from now
    }),
  };
};

export const EmailVerification = mongoose.model<IEmailVerification, IEmailVerificationModel>('EmailVerification', emailVerificationSchema);
