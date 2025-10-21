import User from "../models/users"; 

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

//create a new user
export const createUser = async (userData: {
  uid: number;
  name: string;
  email: string;
  password: string;
}) => {
  const newUser = new User(userData);
  return await newUser.save();
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
