export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

export interface ApiResponse {
  message: string;
  description: string;
  endpoints: string[];
}

export interface Problem {
  _id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  testCases: TestCase[];
  starterCode: {
    python: string;
    java: string;
  };
}

export interface TestCase {
  input: string;
  expected: string;
  hidden?: boolean;
}

export interface Submission {
  userId: string;
  problemId: string;
  code: string;
  language: 'python' | 'java';
  score: number;
  breakdown: ScoreBreakdown;
  createdAt: Date;
}

export interface ScoreBreakdown {
  correctness: number;
  performance: number;
  style: number;
  readability: number;
}

export interface ExecutionResult {
  output: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  success: boolean;
}

export interface GradingResult {
  totalScore: number;
  breakdown: ScoreBreakdown;
  testResults: TestResult[];
  feedback: string[];
  status: 'PASSED' | 'FAILED';
}

export interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  executionTime: number;
}