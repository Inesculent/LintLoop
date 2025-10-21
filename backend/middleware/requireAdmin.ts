import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';

/**
 * Middleware to check if authenticated user has admin role
 * TODO: Implement actual role checking
 */
export const requireAdmin = (_req: AuthRequest, _res: Response, next: NextFunction) => {
  // TODO: Check if user is authenticated
  // if (!req.user) {
  //   return res.status(401).json({ error: 'User not authenticated' });
  // }
  
  // TODO: Check if user has admin role
  // if (req.user.role !== 'admin') {
  //   return res.status(403).json({ error: 'Forbidden: Admin access required' });
  // }

  // STUB: For now, allow all requests through
  console.warn('Admin check disabled (stub mode)');
  next();
};

