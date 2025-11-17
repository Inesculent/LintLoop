import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';

/**
 * Middleware to check if authenticated user has admin privileges
 * Admin status is checked from the user's role field in the database
 * The role is synced from admins.json during login
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  // User is authenticated and has admin role
  return next();
};




