import express, { Request, Response } from 'express';
import * as submissionQueries from '../queries/submissionQueries';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { Types } from 'mongoose';

const router = express.Router();

// Get all submissions for the authenticated user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const submissions = await submissionQueries.getSubmissionsByUser(req.userId!);
    return res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch submissions', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get all submissions for a specific user on a specific problem (pass/fail/score history)
router.get('/user/:userId/problem/:problemId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId, problemId } = req.params;
    
    // Validate ObjectIds
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({ error: 'Invalid user ID or problem ID' });
    }

    const submissions = await submissionQueries.getSubmissionsByUser(userId);
    
    // Filter for specific problem and format response with just pass/fail/score
    const problemSubmissions = submissions
      .filter(sub => sub.problem._id.toString() === problemId)
      .map(sub => ({
        _id: sub._id,
        timestamp: sub.timestamp,
        status: sub.status,
        isAccepted: sub.status === 'Accepted',
        score: sub.score,
        passedTests: sub.passedTests,
        totalTests: sub.totalTests,
        language: sub.language,
        executionTime: sub.executionTime
      }));

    return res.json(problemSubmissions);
  } catch (error) {
    console.error('Error fetching user problem submissions:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch submissions', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get a specific submission by ID (detailed view)
router.get('/:submissionId', authenticate, async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    
    // Validate ObjectId
    if (!Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ error: 'Invalid submission ID' });
    }

    const Submission = (await import('../models/Submissions')).default;
    const submission = await Submission.findById(submissionId)
      .populate('problem', 'pid title difficulty')
      .populate('user', 'uid name email');

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    return res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch submission', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get all submissions for a specific problem (admin only)
router.get('/problem/:problemId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;
    
    if (!Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({ error: 'Invalid problem ID' });
    }

    const submissions = await submissionQueries.getSubmissionsByProblem(problemId);
    return res.json(submissions);
  } catch (error) {
    console.error('Error fetching problem submissions:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch submissions', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Delete a submission (admin only)
router.delete('/:submissionId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    
    if (!Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ error: 'Invalid submission ID' });
    }

    const submission = await submissionQueries.deleteSubmission(submissionId);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    return res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return res.status(500).json({ 
      error: 'Failed to delete submission', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export = router;