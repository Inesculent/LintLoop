import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  uid: number;
  name: string;
  email: string;
  password: string;
  problems_solved: number;
}

const userSchema = new mongoose.Schema({
  uid: { 
    type: Number, 
    required: true, 
    unique: true 
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
  }
}, 

export default mongoose.model<IUser>("User", userSchema);

});
