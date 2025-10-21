import express, { Request, Response } from 'express';
import * as problemQueries from '../queries/problemQueries';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';



const router = express.Router();


router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      difficulty: req.query.difficulty as string | undefined,
      tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags as string[] : [req.query.tags as string]) : undefined
    };
    const problems = await problemQueries.getAllProblems(filters);
    res.json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/:pid', async (req: Request, res: Response) => {
  try {
    const problem = await problemQueries.getProblemByPid(parseInt(req.params.pid));
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    res.json(problem);
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ error: 'Failed to fetch problem', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});


// Create a new problem
router.post('/', authenticate, requireAdmin, async (req: Request, res : Response) => {
    try {
        const problem = await problemQueries.createProblem(req.body);
        res.status(201).json(problem);
    } catch (error) {
        console.error('Error creating problem:', error);
        res.status(500).json({ error: 'Failed to create problem', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

export = router;