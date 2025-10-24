import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user info
export interface AuthRequest extends Request {
  userId?: string;  // MongoDB _id
  user?: {
    uid: number;
    email: string;
    role: 'admin' | 'user';
  };
}

interface JwtPayload {
  userId: string;
}

/**
 * Middleware to verify JWT token and authenticate user
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    
    // Attach user ID to request
    req.userId = decoded.userId;
    
    // If you want to attach full user info, fetch from database:
    // const user = await User.findById(decoded.userId);
    // if (!user) {
    //   res.status(401).json({ error: 'User not found' });
    //   return;
    // }
    // req.user = {
    //   uid: user.uid,
    //   email: user.email,
    //   role: user.role || 'user'
    // };
    
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
