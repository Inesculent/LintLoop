import express, { Request, Response } from 'express';
import { runUnitTests } from '../utils/unitTestRunner';
import { validateProblemTestCases, getTestCaseStats } from '../utils/unitTestFunctions';

const router = express.Router();

/**
 * POST /api/test
 * Run unit tests for a solution with custom or visible test cases
 */
router.post('/', async (req: Request, res: Response) => { 
  try {
    const { problemId, solutionCode, language, testCases } = req.body;

    // Validate required fields
    if (!problemId || !solutionCode || !language) {
      return res.status(400).json({
        error: 'Missing required fields: problemId, solutionCode, and language are required'
      });
    }

    // Validate language
    if (!['python', 'java', 'javascript'].includes(language)) {
      return res.status(400).json({
        error: 'Invalid language. Must be one of: python, java, javascript'
      });
    }

    // Run unit tests
    const result = await runUnitTests({
      problemId,
      solutionCode,
      language,
      testCases,
      useAllTestCases: false // Use visible test cases by default
    });

    return res.json(result);

  } catch (error) {
    console.error('Test route error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      results: [],
      passedTests: 0,
      totalTests: 0,
      status: 'Runtime Error'
    });
  }
});

/**
 * GET /api/test/validate/:problemId
 * Validate that a problem has proper test cases
 */
router.get('/validate/:problemId', async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;
    
    if (!problemId) {
      return res.status(400).json({ error: 'Problem ID is required' });
    }

    const validation = await validateProblemTestCases(problemId);
    
    if (!validation.valid) {
      return res.status(400).json(validation);
    }

    return res.json(validation);

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/test/stats/:problemId
 * Get test case statistics for a problem
 */
router.get('/stats/:problemId', async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;
    
    if (!problemId) {
      return res.status(400).json({ error: 'Problem ID is required' });
    }

    const stats = await getTestCaseStats(problemId);
    
    if (stats.error) {
      return res.status(404).json(stats);
    }

    return res.json(stats);

  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({
      total: 0,
      visible: 0,
      hidden: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/test/health
 * Health check for testing infrastructure
 */
router.get('/health', async (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    message: 'Test infrastructure is operational',
    timestamp: new Date().toISOString(),
    supportedLanguages: ['python', 'java', 'javascript']
  });
});

export = router;