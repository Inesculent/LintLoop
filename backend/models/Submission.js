//ECHO is on.
import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  pid: { 
    type: Number, 
    required: true, 
    ref:'Problems' }, //foreign key to problems
  sid:{
    type: Number, 
    required:true, 
    unique: true},
  uid: { 
    type: Number, 
    required: true, 
    ref:'User' }, //user id
  code: { 
    type: String, 
    required: true }, 
  timestamp: { 
    type: Date, 
    default: Date.now }, 
  submissionCounter: { 
    type: Number, 
    default: 1 },    
  score: { 
    type: Number, 
    default: 0 },

});

export default mongoose.model("Submission", submissionSchema);
