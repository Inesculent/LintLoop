import express, { Request, Response } from 'express';
import Problem from '../models/Problems';
const dockerUtils = require('../utils/docker');

const router = express.Router();

// Execute a Java Solution with server-side test harness
router.post('/', async (req: Request, res: Response) => {
  try {
    const { problemId, solutionCode, language } = req.body;

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

    // Get test harness for the language
    const testHarness = problem.testHarness?.[language as 'python' | 'java' | 'javascript'];
    if (!testHarness) {
      return res.status(400).json({ error: `No test harness configured for ${language} in problem ${problemId}` });
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
        timeout,
        memoryLimit
      });

      return res.json(result);
    }

    // For Python/JavaScript, you can extend this later
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


