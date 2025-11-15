import Problem from "../models/Problems";
const dockerUtils = require('./docker');
const { generateTestHarness } = require('./harnessGenerator');

export interface TestResult {
  testNumber: number;
  passed: boolean;
  actual?: string;
  expected?: string;
  executionTime?: number;
  error?: string;
}

export interface ExecutionTestResult {
  results: TestResult[];
  passedTests: number;
  totalTests: number;
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Compilation Error';
  executionTime?: number;
  error?: string;
}

interface RunUnitTestsParams {
  problemId: string;
  solutionCode: string;
  language: 'python' | 'java' | 'javascript';
  testCases?: any[];
  useAllTestCases?: boolean;
}

/**
 * Runs unit tests for a given problem solution
 * @param params - Test execution parameters
 * @returns Test execution results with detailed feedback
 */
export async function runUnitTests({
  problemId,
  solutionCode,
  language,
  testCases,
  useAllTestCases = false
}: RunUnitTestsParams): Promise<ExecutionTestResult> {
  try {
    // Fetch problem from database
    const problem = await Problem.findOne({ pid: problemId });
    if (!problem) {
      return {
        results: [],
        passedTests: 0,
        totalTests: 0,
        status: 'Runtime Error',
        error: `Problem ${problemId} not found`
      };
    }

    // Determine which test cases to use
    let testCasesToRun;
    if (testCases && testCases.length > 0) {
      testCasesToRun = testCases;
    } else if (useAllTestCases) {
      testCasesToRun = problem.testCases;
    } else {
      testCasesToRun = problem.testCases.filter(tc => tc.isVisible);
    }

    if (testCasesToRun.length === 0) {
      return {
        results: [],
        passedTests: 0,
        totalTests: 0,
        status: 'Runtime Error',
        error: 'No test cases available'
      };
    }

    // Generate test harness
    const testHarness = generateTestHarness(problem, language, testCasesToRun);

    // Get problem limits
    const timeout = problem.timeLimit?.[language] 
                        || problem.timeLimit?.default 
                        || 5000;
    
    const memoryLimit = problem.memoryLimit?.[language]
                        || problem.memoryLimit?.default
                        || 256;

    // Execute based on language
    let result;
    if (language === 'java') {
      if (!/class\s+Solution\b/.test(solutionCode)) {
        return {
          results: [],
          passedTests: 0,
          totalTests: 0,
          status: 'Compilation Error',
          error: 'solutionCode must define class Solution'
        };
      }

      result = await dockerUtils.executeJavaSolution({
        solutionCode,
        mainCode: testHarness,
        timeout,
        memoryLimit
      });
    } else if (language === 'python') {
      result = await dockerUtils.executePythonSolution({
        solutionCode,
        testHarness,
        timeout,
        memoryLimit
      });
    } else {
      return {
        results: [],
        passedTests: 0,
        totalTests: 0,
        status: 'Runtime Error',
        error: `Execution for ${language} not yet implemented`
      };
    }

    // Parse execution result
    if (!result.success) {
      return {
        results: [],
        passedTests: 0,
        totalTests: testCasesToRun.length,
        status: result.stderr.toLowerCase().includes('compilation') 
          ? 'Compilation Error' 
          : 'Runtime Error',
        error: result.stderr || result.output || 'Execution failed',
        executionTime: result.executionTime
      };
    }

    // Try to parse JSON output from test harness
    try {
      const output = JSON.parse(result.output);
      return {
        results: output.results || [],
        passedTests: output.passedTests || 0,
        totalTests: output.totalTests || testCasesToRun.length,
        status: output.status || 'Wrong Answer',
        executionTime: result.executionTime
      };
    } catch (parseError) {
      // If JSON parsing fails, return raw output
      return {
        results: [],
        passedTests: 0,
        totalTests: testCasesToRun.length,
        status: 'Runtime Error',
        error: 'Failed to parse test results: ' + result.output,
        executionTime: result.executionTime
      };
    }

  } catch (error) {
    return {
      results: [],
      passedTests: 0,
      totalTests: 0,
      status: 'Runtime Error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Validates test case format
 */
export function validateTestCase(testCase: any): boolean {
  return testCase 
    && typeof testCase === 'object' 
    && testCase.input 
    && testCase.output !== undefined;
}

/**
 * Validates multiple test cases
 */
export function validateTestCases(testCases: any[]): { valid: boolean; error?: string } {
  if (!Array.isArray(testCases)) {
    return { valid: false, error: 'Test cases must be an array' };
  }

  if (testCases.length === 0) {
    return { valid: false, error: 'At least one test case is required' };
  }

  for (let i = 0; i < testCases.length; i++) {
    if (!validateTestCase(testCases[i])) {
      return { valid: false, error: `Invalid test case at index ${i}` };
    }
  }

  return { valid: true };
}
