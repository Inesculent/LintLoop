//ECHO is on.
import mongoose from "mongoose";

const problemSchema = new mongoose.Schema({
  pid: { 
    type: Number, 
    required: true, 
    unique: true },
  problemStatements: { 
    type: String, 
    required: true },
  testCases: { 
    /*could do type:[string] for an array of strings (lines of code)*/
    type: String, 
    required: true }
  /* if we wanted to do problems with different difficulty levels
  difficulty: { type: String, required: true },*/
  
});

export default mongoose.model("Problem", problemSchema);
