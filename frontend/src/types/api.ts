// Shared TypeScript types matching backend models
// This ensures consistency between frontend and backend

export type Language = 'python' | 'java' | 'javascript';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type SubmissionStatus =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Runtime Error'
  | 'Compilation Error'
  | 'Output Limit Exceeded';

export interface Parameter {
  name: string;
  type: string;
}

export interface FunctionSignature {
  name: string;
  returnType: string;
  parameters: Parameter[];
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface Problem {
  pid: number;
  title: string;
  problemStatement: string;
  difficulty: Difficulty;
  tags: string[];
  examples: Example[];
  constraints: string[];
  functionSignatures: {
    python?: FunctionSignature;
    java?: FunctionSignature;
    javascript?: FunctionSignature;
  };
  starterCode?: {
    python?: string;
    java?: string;
    javascript?: string;
  };
  timeLimit: {
    python?: number;
    java?: number;
    javascript?: number;
    default: number;
  };
  memoryLimit: {
    python?: number;
    java?: number;
    javascript?: number;
    default: number;
  };
  hints: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ScoreBreakdown {
  correctness: number;
  performance: number;
  style: number;
  readability: number;
}

export interface FailedTestCase {
  input: any;
  expected: any;
  actual: any;
}

export interface Submission {
  _id: string;
  problem: {
    _id: string;
    pid: number;
    title: string;
    difficulty: Difficulty;
  };
  user: {
    _id: string;
    uid: number;
    name: string;
    email: string;
  };
  code: string;
  language: Language;
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  executionTime: number;
  memoryUsed?: number;
  errorMessage?: string;
  failedTestCase?: FailedTestCase;
  timestamp: string;
  score: number;
  scoreBreakdown?: ScoreBreakdown;
  feedback?: string[];
}

export interface ExecutionResult {
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  executionTime: number;
  memoryUsed?: number;
  errorMessage?: string;
  failedTestCase?: FailedTestCase;
  score?: number;
  scoreBreakdown?: ScoreBreakdown;
  // When true this result came from a full submission (Submit),
  // as opposed to an ad-hoc run/test (Run Code). Frontend uses
  // this to decide which UI pieces (overall score / breakdown)
  // to display. Optional for backward compatibility.
  isSubmission?: boolean;
  feedback?: string[];
}

export interface User {
  uid: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface UserProfile extends User {
  problemsSolved?: number;
  totalSubmissions?: number;
  acceptanceRate?: number;
}

