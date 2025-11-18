import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/loginSignup';
import User from '../../models/Users';

// Mock the database connection
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  model: jest.fn(),
  Schema: jest.fn(),
  default: {
    connect: jest.fn()
  }
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(false)
}));

// Mock the User model
jest.mock('../../models/Users', () => {
  const mockUserConstructor: any = jest.fn().mockImplementation((userData) => {
    return {
      ...userData,
      _id: 'mock-id-123',
      save: jest.fn().mockResolvedValue({
        ...userData,
        _id: 'mock-id-123'
      })
    };
  });
  
  // Add static methods
  mockUserConstructor.findOne = jest.fn();
  mockUserConstructor.countDocuments = jest.fn();
  mockUserConstructor.findById = jest.fn();
  
  return {
    __esModule: true,
    default: mockUserConstructor
  };
});

// Mock email service
jest.mock('../../utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  send2FAEmail: jest.fn().mockResolvedValue(undefined)
}));

// Mock admin list utility
jest.mock('../../utils/adminList', () => ({
  getRoleForEmail: jest.fn().mockReturnValue('user')
}));

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const mockUser = User as jest.Mocked<typeof User>;

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks for User model methods
    mockUser.countDocuments = jest.fn().mockResolvedValue(0);
    mockUser.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    }) as any;
  });

  describe('POST /api/auth/signup', () => {
    it('should return 400 if user already exists and is verified', async () => {
      // Mock findOne to return an existing verified user
      mockUser.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: '123',
          email: 'existing@example.com',
          emailVerified: true
        })
      }) as any;

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      // Mock no existing user
      mockUser.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      }) as any;

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User'
          // Missing email and password
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      // Mock no user found
      mockUser.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      }) as any;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/verify-email/:token', () => {
    it('should return 400 for invalid token', async () => {
      // Mock no user found with this token
      mockUser.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      }) as any;

      const response = await request(app)
        .get('/api/auth/verify-email/invalid-token-12345');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should return 400 if email is not provided', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email is required');
    });

    it('should return 404 for non-existent user', async () => {
      // Mock no user found
      mockUser.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      }) as any;

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({
          email: 'nonexistent-user-12345@example.com'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });
});

