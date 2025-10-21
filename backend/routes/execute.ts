import express, { Request, Response } from 'express';
const dockerUtils = require('../utils/docker');

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { code, language, problemId } = req.body;

    // Validate input
    if (!code || !language) {
      return res.status(400).json({ 
        error: 'Missing required fields: code and language' 
      });
    }

    if (language !== 'python' && language !== 'java') {
      return res.status(400).json({ 
        error: 'Unsupported language. Use "python" or "java"' 
      });
    }

    // Check if Docker is available
    const isDockerAvailable = await dockerUtils.testDockerConnection();
    if (!isDockerAvailable) {
      // Return a mock response for testing without Docker
      return res.json({
        output: `Mock execution: ${language} code would be executed here`,
        stderr: '',
        exitCode: 0,
        executionTime: 50,
        success: true
      });
    }

    // TODO: Get problem by id
    // const problem = await getProblemById(problemId);


    // Execute code
    const result = await dockerUtils.executeCode({
      code,
      language,
      problemId,
      timeout: 5000
    });

    return res.json(result);

  } catch (error) {
    console.error('Execution error:', error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    } else {
      return res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
});

export = router;
