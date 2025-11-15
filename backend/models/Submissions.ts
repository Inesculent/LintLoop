import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({

  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  code: { 
    type: String, 
    required: true 
  },
  
  language: {
    type: String,
    required: true,
    enum: ['python', 'java', 'javascript']
  },
  
  status: {
    type: String,
    required: true,
    enum: [
      'Accepted',
      'Wrong Answer',
      'Time Limit Exceeded',
      'Memory Limit Exceeded',
      'Runtime Error',
      'Compilation Error',
      'Output Limit Exceeded'
    ]
  },
  
  // Test case results
  passedTests: {
    type: Number,
    required: true,
    default: 0
  },
  
  totalTests: {
    type: Number,
    required: true
  },
  
  // Performance metrics
  executionTime: {
    type: Number,  // in milliseconds
    required: true
  },
  
  memoryUsed: {
    type: Number,  // in MB (optional, if you track this)
  },
  
  // Error details (if any)
  errorMessage: {
    type: String
  },
  
  // First failing test case (for Wrong Answer status)
  failedTestCase: {
    input: mongoose.Schema.Types.Mixed,
    expected: mongoose.Schema.Types.Mixed,
    actual: mongoose.Schema.Types.Mixed
  },
  
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  
  // Overall score (0-100)
  score: {
    type: Number,
    default: 0
  },
  
  // Detailed score breakdown
  scoreBreakdown: {
    correctness: { type: Number, default: 0 },  // 0-100
    performance: { type: Number, default: 0 },  // 0-100
    style: { type: Number, default: 0 },        // 0-100
    readability: { type: Number, default: 0 }   // 0-100
  },
  
  // Feedback from grading system
  feedback: {
    type: [String],
    default: []
  }
});

// Index for faster queries
submissionSchema.index({ user: 1, problem: 1 });
submissionSchema.index({ user: 1, timestamp: -1 });
submissionSchema.index({ problem: 1, status: 1 });

// Virtual for acceptance
submissionSchema.virtual('isAccepted').get(function() {
  return this.status === 'Accepted';
});

export default mongoose.model("Submission", submissionSchema);