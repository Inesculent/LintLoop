import express, { Response } from 'express';
import Problem from '../models/Problems';
import Submission from '../models/Submissions';
import { authenticate, AuthRequest } from '../middleware/authenticate';
const dockerUtils = require('../utils/docker');
const { generateTestHarness } = require('../utils/harnessGenerator');
import { scoreSubmission } from '../utils/resultParsing';

const router = express.Router();

// Execute code with ALL test cases (for "Submit" button)
// Requires authentication
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { problemId, solutionCode, language } = req.body;
    const userId = req.userId; // From authenticate middleware

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!problemId || !solutionCode) {
      return res.status(400).json({ error: 'Missing required fields: problemId and solutionCode' });
    }

    if (!language || !['python', 'java', 'javascript'].includes(language)) {
      return res.status(400).json({ error: 'Invalid or missing language. Use "python", "java", or "javascript"' });
    }

    // Fetch problem from database
    const problem = await Problem.findOne({ pid: problemId });
    if (!problem) {
      return res.status(404).json({ error: `Problem ${problemId} not found` });
    }

    // Use ALL test cases for submission
    const allTestCases = problem.testCases;
    
    if (allTestCases.length === 0) {
      return res.status(400).json({ error: 'No test cases available for this problem' });
    }

    // Generate dynamic test harness with all test cases
    const testHarness = generateTestHarness(problem, language, allTestCases);

    // Use problem's language-specific limits (server-controlled)
    const timeout = problem.timeLimit?.[language as 'python' | 'java' | 'javascript'] 
                        || problem.timeLimit?.default 
                        || 5000;
    
    const memoryLimit = problem.memoryLimit?.[language as 'python' | 'java' | 'javascript']
                        || problem.memoryLimit?.default
                        || 256;

    // For Java, execute Solution + Main
    if (language === 'java') {
      // Optional: basic guard to ensure Solution class exists
      if (!/class\s+Solution\b/.test(solutionCode)) {
        return res.status(400).json({ error: 'solutionCode must define class Solution' });
      }

      let executionResult = await dockerUtils.executeJavaSolution({
        solutionCode,
        mainCode: testHarness,
        timeout,
        memoryLimit
      });

      // Parse JSON output if execution was successful
      console.log('Java output type:', typeof executionResult.output);
      console.log('Java output is string?', typeof executionResult.output === 'string');
      if (executionResult.success && executionResult.output) {
        if (typeof executionResult.output === 'string') {
          try {
            const parsed = JSON.parse(executionResult.output);
            executionResult = {
              ...executionResult,
              output: parsed
            };
            console.log('✅ Parsed Java execution output, type now:', typeof executionResult.output);
          } catch (e) {
            console.error('❌ Failed to parse Java execution output:', e);
            // Keep as string if not valid JSON
          }
        } else {
          console.log('ℹ️ Java output already parsed');
        }
      }

      // Score the submission using linters and grading criteria
      const gradingResult = await scoreSubmission(
        executionResult,
        solutionCode,
        language as 'python' | 'java' | 'javascript',
        timeout
      );

      // Save submission to database
      const submissionDoc = await saveSubmission({
        userId,
        problemId: problem._id,
        code: solutionCode,
        language,
        executionResult,
        gradingResult,
        testCases: allTestCases
      });

      return res.json({
        execution: executionResult,
        grading: gradingResult,
        submissionId: submissionDoc._id
      });
    }
    else if (language === 'python') {
      let executionResult = await dockerUtils.executePythonSolution({
        solutionCode,
        testHarness,
        timeout,
        memoryLimit
      });

      // Parse JSON output if execution was successful
      console.log('Python output type:', typeof executionResult.output);
      console.log('Python output is string?', typeof executionResult.output === 'string');
      if (executionResult.success && executionResult.output) {
        if (typeof executionResult.output === 'string') {
          try {
            const parsed = JSON.parse(executionResult.output);
            executionResult = {
              ...executionResult,
              output: parsed
            };
            console.log('✅ Parsed Python execution output, type now:', typeof executionResult.output);
          } catch (e) {
            console.error('❌ Failed to parse Python execution output:', e);
            // Keep as string if not valid JSON
          }
        } else {
          console.log('ℹ️ Python output already parsed');
        }
      }

      // Score the submission using linters and grading criteria
      const gradingResult = await scoreSubmission(
        executionResult,
        solutionCode,
        language as 'python' | 'java' | 'javascript',
        timeout
      );

      // Save submission to database
      const submissionDoc = await saveSubmission({
        userId,
        problemId: problem._id,
        code: solutionCode,
        language,
        executionResult,
        gradingResult,
        testCases: allTestCases
      });

      return res.json({
        execution: executionResult,
        grading: gradingResult,
        submissionId: submissionDoc._id
      });
    }

    //For other languages, we can extend this later
    return res.status(501).json({ error: `Execution for ${language} not yet implemented` });

  } catch (error) {
    console.error('RunSolution error:', error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Unknown error occurred' });
  }
});

/**
 * Helper function to save submission to database
 */
async function saveSubmission({
  userId,
  problemId,
  code,
  language,
  executionResult,
  gradingResult,
  testCases
}: {
  userId: string;
  problemId: any;
  code: string;
  language: string;
  executionResult: any;
  gradingResult: any;
  testCases: any[];
}) {
  // Parse test results from execution output
  let parsedOutput: any = {};
  try {
    // If output is already an object, use it directly
    if (typeof executionResult.output === 'object') {
      parsedOutput = executionResult.output;
    } else {
      parsedOutput = JSON.parse(executionResult.output);
    }
  } catch (e) {
    // If parsing fails, use empty object
  }

  const passedTests = parsedOutput.passedTests || 0;
  const totalTests = parsedOutput.totalTests || testCases.length;

  // Determine status based on execution and grading
  let status = 'Wrong Answer';
  if (!executionResult.success) {
    if (executionResult.stderr?.toLowerCase().includes('compilation')) {
      status = 'Compilation Error';
    } else if (executionResult.stderr?.toLowerCase().includes('timeout')) {
      status = 'Time Limit Exceeded';
    } else if (executionResult.stderr?.toLowerCase().includes('memory')) {
      status = 'Memory Limit Exceeded';
    } else {
      status = 'Runtime Error';
    }
  } else if (gradingResult.status === 'PASSED') {
    status = 'Accepted';
  } else if (passedTests < totalTests) {
    status = 'Wrong Answer';
  }

  // Calculate average execution time
  const avgExecutionTime = gradingResult.testResults.length > 0
    ? gradingResult.testResults.reduce((sum: number, r: any) => sum + r.executionTime, 0) / gradingResult.testResults.length
    : executionResult.executionTime || 0;

  // Find first failing test case
  let failedTestCase = null;
  if (status === 'Wrong Answer' && parsedOutput.results) {
    const firstFailed = parsedOutput.results.find((r: any) => !r.passed);
    if (firstFailed) {
      failedTestCase = {
        input: firstFailed.input || 'N/A',
        expected: firstFailed.expected || 'N/A',
        actual: firstFailed.actual || 'N/A'
      };
    }
  }

  // Create submission document
  const submission = await Submission.create({
    user: userId,
    problem: problemId,
    code,
    language,
    status,
    passedTests,
    totalTests,
    executionTime: Math.round(avgExecutionTime),
    errorMessage: executionResult.stderr || null,
    failedTestCase,
    score: gradingResult.totalScore,
    scoreBreakdown: {
      correctness: gradingResult.breakdown.correctness,
      performance: gradingResult.breakdown.performance,
      style: gradingResult.breakdown.style,
      readability: gradingResult.breakdown.readability
    },
    feedback: gradingResult.feedback
  });

  return submission;
}

export = router;


