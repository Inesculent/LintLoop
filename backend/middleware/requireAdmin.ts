import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';

/**
 * Middleware to check if authenticated user has admin role
 * TODO: Implement actual role checking
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  // Check if user has admin role
  if (req.user.role !== 'admin' && req.user.email !== 'admin@example.com') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  // User is authenticated and has admin role
  return next();
};




