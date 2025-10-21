import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user info
export interface AuthRequest extends Request {
  user?: {
    uid: number;
    email: string;
    role: 'admin' | 'user';
  };
}

/**
 * Middleware to verify JWT token and authenticate user
 * TODO: Implement actual JWT verification
 */
export const authenticate = async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    // TODO: Extract token from Authorization header
    // const token = req.headers.authorization?.split(' ')[1];
    
    // TODO: Verify JWT token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // TODO: Attach user info to request
    // (req as AuthRequest).user = {
    //   uid: decoded.uid,
    //   email: decoded.email,
    //   role: decoded.role
    // };

    // STUB: For now, allow all requests through
    console.warn('Authentication disabled (stub mode)');
    return next();
    
  } catch (error) {
    // TODO: Handle authentication errors
    return _res.status(401).json({ error: 'Unauthorized' });
  }
};

