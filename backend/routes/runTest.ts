import express, { Request, Response } from 'express';
import Problem from '../models/Problems';
const dockerUtils = require('../utils/docker');

const router = express.Router();

function parseExecutionResult(result: any) {
  if (result.success && result.output) {
    try {
      result.output = JSON.parse(result.output);
    } catch (e) {
      // Keep as string if not valid JSON (e.g., compilation errors)
    }
  }
  return result;
}
// Execute code with CLIENT-PROVIDED test cases (for "Run" button)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { problemId, solutionCode, language, testCases } = req.body;

    if (!problemId || !solutionCode) {
      return res.status(400).json({ error: 'Missing required fields: problemId and solutionCode' });
    }

    if (!language || !['python', 'java', 'javascript'].includes(language)) {
      return res.status(400).json({ error: 'Invalid or missing language. Use "python", "java", or "javascript"' });
    }

    // Fetch problem from database (for metadata like function signatures)
    const problem = await Problem.findOne({ pid: problemId });
    if (!problem) {
      return res.status(404).json({ error: `Problem ${problemId} not found` });
    }

    // Use test cases from client (frontend sends these - can be modified by user)
    // If no test cases provided, fall back to visible test cases from DB
    const testCasesToRun = testCases && testCases.length > 0 
      ? testCases 
      : problem.testCases.filter(tc => tc.isVisible);
    
    if (testCasesToRun.length === 0) {
      return res.status(400).json({ error: 'No test cases provided' });
    }

    // Use pre-generated test harness from problem
    const testHarness = problem.testHarness?.[language as 'python' | 'java' | 'javascript'];
    if (!testHarness) {
      return res.status(500).json({ 
        error: `No test harness available for ${language}. Please contact an administrator.` 
      });
    }

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

      const result = await dockerUtils.executeJavaSolution({
        solutionCode,
        mainCode: testHarness,
        testCases: testCasesToRun,
        timeout,
        memoryLimit
      });

      const parsedResult = parseExecutionResult(result);

      return res.json(parsedResult);
    }
    else if (language === 'python') {
      const result = await dockerUtils.executePythonSolution({
        solutionCode,
        testHarness,
        testCases: testCasesToRun,
        timeout,
        memoryLimit
      });
      
      const parsedResult = parseExecutionResult(result);

      return res.json(parsedResult);
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

export = router;


