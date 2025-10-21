import Problem, { IProblem } from "../models/Problems"
import { FilterQuery } from "mongoose";

//get all of the problems (maybe filter by difficulty or tags
export const getAllProblems = async (filters: {
  difficulty?: string;
  tags?: string[];
} = {}): Promise<IProblem[]> => {
  const query: FilterQuery<any> = {};

  if (filters.difficulty) {
    query.difficulty = filters.difficulty;
  }

  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }

  return await Problem.find(query).sort({ pid: 1 }); // sort by pid ascending
};

//get one problem by the problem ID
export const getProblemByPid = async (pid: number): Promise<IProblem | null> => {
  return await Problem.findOne({ pid });
};

// add a new problem
export const createProblem = async (problemData: any): Promise<IProblem> => {
  const problem = new Problem(problemData);
  return await problem.save();
};

//update existing problem
export const updateProblemByPid = async (pid: number, updates: any): Promise<IProblem | null> => {
  return await Problem.findOneAndUpdate(
    { pid },
    { $set: updates, updatedAt: new Date() },
    { new: true } // return the updated problem
  );
};

// delete a problem by pid
export const deleteProblemByPid = async (pid: number): Promise<IProblem | null> => {
  return await Problem.findOneAndDelete({ pid });
};

// search by title or tags
export const searchProblems = async (query: string): Promise<IProblem[]> => {
  return await Problem.find({
    $or: [
      { title: { $regex: query, $options: "i" } }, // case-insensitive match
      { tags: { $regex: query, $options: "i" } }
    ]
  });
};
