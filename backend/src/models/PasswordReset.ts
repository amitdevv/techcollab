import mongoose from 'mongoose';
import crypto from 'crypto';

// Interface for PasswordReset document
export interface IPasswordReset extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  token: string;
  expires: Date;
  used: boolean;
}

// Interface for PasswordReset model with static methods
interface IPasswordResetModel extends mongoose.Model<IPasswordReset> {
  createToken(userId: mongoose.Types.ObjectId | string): {
    resetToken: string;
    passwordReset: IPasswordReset;
  };
}

// Schema for password reset
const passwordResetSchema = new mongoose.Schema<IPasswordReset>(
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
        // Token expires in 1 hour by default
        return new Date(Date.now() + 3600000);
      },
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create and hash reset token
passwordResetSchema.statics.createToken = function (userId: mongoose.Types.ObjectId | string) {
  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Create a new password reset document
  return {
    resetToken,
    passwordReset: new this({
      user: userId,
      token: hashedToken,
      expires: new Date(Date.now() + 3600000), // 1 hour from now
    }),
  };
};

export const PasswordReset = mongoose.model<IPasswordReset, IPasswordResetModel>('PasswordReset', passwordResetSchema);
