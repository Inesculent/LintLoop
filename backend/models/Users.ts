import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: { 
    type: Number, 
    required: true, 
    unique: true },
    
  name: { 
    type: String, 
    required: true,
    maxlength:255},

  email: { 
    type: String, 
    required: true,
    maxlength: 255, 
    unique: true },

  password: { 
    type: String, 
    required: true, 
    minlength: 8, 
    maxlength:255},

  problems_solved: { 
    type: Number, 
    default: 0 }

});

export default mongoose.model("User", userSchema);