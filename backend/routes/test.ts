import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/', async (_req: Request, res: Response) => { 


    return res.json({
        output: `Hello! This is a test route`,
        stderr: '',
        exitCode: 0,
        executionTime: 50,
        success: true
      });

});

export = router;