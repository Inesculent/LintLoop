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
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

router.get('/:pid', async (req: Request, res: Response) => {
  try {
    const problem = await problemQueries.getProblemByPid(parseInt(req.params.pid));
    res.json(problem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});


// Create a new problem
router.post('/', authenticate, requireAdmin, async (req: Request, res : Response) => {
    try {
        const problem = await problemQueries.createProblem(req.body);
        res.status(201).json(problem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create problem' });
    }
});

export = router;