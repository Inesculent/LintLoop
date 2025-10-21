import mongoose, { Schema, Document } from "mongoose";

// Interfaces for type safety
export interface ITestCase {
  input: any;
  output: any;
  explanation?: string;
  isVisible: boolean;
}

export interface IParameter {
  name: string;
  type: string;
}

export interface IFunctionSignature {
  name: string;
  returnType: string;
  parameters: IParameter[];
}

export interface IExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface IProblem extends Document {
  pid: number;
  title: string;
  problemStatement: string;
  examples: IExample[];
  constraints: string[];
  functionSignatures: {
    python?: IFunctionSignature;
    java?: IFunctionSignature;
    javascript?: IFunctionSignature;
  };
  testCases: ITestCase[];
  starterCode: {
    python?: string;
    java?: string;
    javascript?: string;
  };
  testHarness: {
    python?: string;
    java?: string;
    javascript?: string;
  };
  timeLimit: {
    python?: number;
    java?: number;
    javascript?: number;
    default?: number;
  };
  memoryLimit: {
    python?: number;
    java?: number;
    javascript?: number;
    default?: number;
  };
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  hints: string[];
  createdAt: Date;
  updatedAt: Date;
}

const testCaseSchema = new Schema<ITestCase>({
  input: {
    type: Schema.Types.Mixed,
    required: true
  },
  output: {
    type: Schema.Types.Mixed,
    required: true
  },
  explanation: String,
  isVisible: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const parameterSchema = new Schema<IParameter>({
  name: { type: String, required: true },
  type: { type: String, required: true }
}, { _id: false });

const functionSignatureSchema = new Schema<IFunctionSignature>({
  name: { type: String, required: true },
  returnType: { type: String, required: true },
  parameters: [parameterSchema]
}, { _id: false });

const problemSchema = new Schema<IProblem>({
  pid: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  title: {
    type: String,
    required: true
  },
  problemStatement: {
    type: String, 
    required: true 
  },
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: [String],
  
  functionSignatures: {
    python: functionSignatureSchema,
    java: functionSignatureSchema,
    javascript: functionSignatureSchema
  },
  
  testCases: {
    type: [testCaseSchema],
    required: true,
    validate: {
      validator: function(cases: ITestCase[]) {
        return cases.length > 0;
      },
      message: 'At least one test case is required'
    }
  },
  
  starterCode: {
    python: String,
    java: String,
    javascript: String
  },
  
  testHarness: {
    python: String,
    java: String,
    javascript: String
  },
  
  timeLimit: {
    python: Number,
    java: Number,
    javascript: Number,
    default: {
      type: Number,
      default: 5000
    }
  },
  memoryLimit: {
    python: Number,
    java: Number,
    javascript: Number,
    default: {
      type: Number,
      default: 256
    }
  },
  
  difficulty: { 
    type: String, 
    enum: ['Easy', 'Medium', 'Hard'],
    required: true 
  },
  
  tags: [String],
  hints: [String],
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

problemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IProblem>("Problem", problemSchema);