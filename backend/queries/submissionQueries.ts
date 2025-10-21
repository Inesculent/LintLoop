import Submission from "../models/Submissions";
import { Types } from "mongoose";

//Add a new submission
export const addSubmission = async (submissionData: any) => {
  return await Submission.create(submissionData);
};

//Get all submissions for a specific user
export const getSubmissionsByUser = async (userId: string) => {
  return await Submission.find({ user: new Types.ObjectId(userId) })
    .populate("problem", "pid title difficulty")
    .sort({ timestamp: -1 }); // newest first
};

//Get all submissions for a specific problem
export const getSubmissionsByProblem = async (problemId: string) => {
  return await Submission.find({ problem: new Types.ObjectId(problemId) })
    .populate("user", "uid name email")
    .sort({ timestamp: -1 });
};

//Get the latest submission for a user on a specific problem
export const getLatestSubmission = async (userId: string, problemId: string) => {
  return await Submission.findOne({
    user: new Types.ObjectId(userId),
    problem: new Types.ObjectId(problemId)
  })
    .sort({ timestamp: -1 });
};

// Delete a submission (optional- admin use)
export const deleteSubmission = async (submissionId: string) => {
  return await Submission.findByIdAndDelete(submissionId);
};

//Count problems a user has solved (Accepted)
export const countAcceptedSubmissions = async (userId: string) => {
  return await Submission.countDocuments({
    user: new Types.ObjectId(userId),
    status: "Accepted"
  });
};
