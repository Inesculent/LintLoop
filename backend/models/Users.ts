import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  uid: number;
  name: string;
  email: string;
  password: string;
  problems_solved: number;
  role: 'admin' | 'user';
  twoFactorEnabled: boolean;
  twoFactorCode?: string;
  twoFactorCodeExpiry?: Date;
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
});

export default mongoose.model<IUser>("User", userSchema);
