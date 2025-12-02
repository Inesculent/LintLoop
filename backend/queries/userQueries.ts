import User, { IUser } from "../models/Users"; 
import Submission from "../models/Submissions";

//get all users
export const getAllUsers = async () =>{
  return await User.find();
};

//find user by email
export const getUserByEmail = async (email: string) => {
  return await User.findOne({ email });
};

//find user by uid
export const getUserByUid = async (uid: number) =>{
  return await User.findOne({ uid });
};

//find user by username
export const getUserByUsername = async (username: string) => {
  return await User.findOne({ username });
};


export const createUser = async (userData: {
  uid: number;
  username: string;
  bio: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}) => {
  const newUser = new User(userData);
  return await newUser.save();
};

export const updateUser = async (uid: number, updateData: Partial<IUser>) => {
  return await User.findOneAndUpdate(
    { uid },
    { $set: updateData },
    { new: true }
  );
};






//update a user's problems_solved count
export const updateProblemsSolved = async (uid: number, newCount: number) => {
  return await User.findOneAndUpdate(
    { uid },
    { $set: { problems_solved: newCount } },
    { new: true } // return the updated user
  );
};

//delete a user (admin use)
export const deleteUser = async (uid: number) => {
  return await User.findOneAndDelete({ uid });
};

export const getRecentActivity = async (uid: number, limit: number = 10) => {
  return await Submission.find({ user: uid })
  .populate("problem", "name difficulty")
  .sort({ timestamp: -1 })
  .limit(limit)
  .select('problem status timestamp score');
};
