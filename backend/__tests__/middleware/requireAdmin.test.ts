import { Response, NextFunction } from 'express';
import { requireAdmin } from '../../middleware/requireAdmin';
import { AuthRequest } from '../../middleware/authenticate';

describe('requireAdmin Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  it('should return 401 if user is not authenticated', () => {
    mockReq.user = undefined;

    requireAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 if user is not an admin', () => {
    mockReq.user = {
      uid: 1,
      email: 'user@example.com',
      role: 'user'
    };

    requireAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden: Admin access required' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() if user is an admin', () => {
    mockReq.user = {
      uid: 1,
      email: 'admin@example.com',
      role: 'admin'
    };

    requireAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});

