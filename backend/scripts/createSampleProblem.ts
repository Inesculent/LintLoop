import mongoose from 'mongoose';
import Problem from '../models/Problems';
import dotenv from 'dotenv';

dotenv.config();

async function createSampleProblem() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lintloop';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const sampleProblem = {
      pid: 1,
      title: "Two Sum",
      problemStatement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
      examples: [
        {
          input: "[2,7,11,15], target = 9",
          output: "[0,1]",
          explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]"
        }
      ],
      constraints: [
        "2 <= nums.length <= 10^4",
        "-10^9 <= nums[i] <= 10^9",
        "-10^9 <= target <= 10^9",
        "Only one valid answer exists"
      ],
      functionSignatures: {
        python: {
          name: "twoSum",
          returnType: "List[int]",
          parameters: [
            { name: "nums", type: "List[int]" },
            { name: "target", type: "int" }
          ]
        },
        javascript: {
          name: "twoSum",
          returnType: "number[]",
          parameters: [
            { name: "nums", type: "number[]" },
            { name: "target", type: "number" }
          ]
        }
      },
      testCases: [
        {
          input: { nums: [2,7,11,15], target: 9 },
          output: [0,1],
          isVisible: true
        },
        {
          input: { nums: [3,2,4], target: 6 },
          output: [1,2],
          isVisible: true
        }
      ],
      starterCode: {
        python: "def twoSum(nums: List[int], target: int) -> List[int]:\n    # Write your code here\n    pass",
        javascript: "function twoSum(nums: number[], target: number): number[] {\n    // Write your code here\n}"
      },
      difficulty: "Easy",
      tags: ["Array", "Hash Table"],
      hints: ["Try using a hash table to store complements"]
    };

    await Problem.create(sampleProblem);
    console.log('Sample problem created successfully');
  } catch (error) {
    console.error('Error creating sample problem:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSampleProblem();