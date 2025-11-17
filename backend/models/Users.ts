import mongoose, { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  uid: number;
  name: string;
  email: string;
  password: string;
  problems_solved: number;
  role: 'admin' | 'user';
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  twoFactorEnabled: boolean;
  twoFactorCode?: string;
  twoFactorCodeExpiry?: Date;
  trustedDevices?: Array<{
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    lastUsed?: Date;
  }>;
}

const userSchema = new mongoose.Schema({
  uid: {
    type: Number,
    required: true,
    unique: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'user'],
    default: 'user'
  },
  name: {
    type: String,
    required: true,
    maxlength: 255
  },
  email: {
    type: String,
    required: true,
    maxlength: 255,
    unique: true,
    lowercase: true,  // acts as a toLower
    trim: true        // clears the whitespace
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 255
  },
  problems_solved: {
    type: Number,
    default: 0
  },

  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorCode: {
    type: String,
    select: false  // Don't return this in queries by default
  },
  twoFactorCodeExpiry: {
    type: Date,
    select: false  // Don't return this in queries by default
  }
  ,
  trustedDevices: [{
    tokenHash: { type: String },
    expiresAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    lastUsed: { type: Date }
  }]
});

// Cascade delete: Remove all submissions when a user is deleted
userSchema.pre('findOneAndDelete', async function (next) {
  try {
    const user = await this.model.findOne(this.getFilter());
    if (user) {
      // Delete all submissions associated with this user
      await mongoose.model('Submission').deleteMany({ user: user._id });
      console.log(`Deleted submissions for user ${user.uid}`);
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

export default mongoose.model<IUser>("User", userSchema);
