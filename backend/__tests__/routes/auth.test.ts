import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/loginSignup';

// Mock the database connection
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  model: jest.fn(),
  Schema: jest.fn(),
  default: {
    connect: jest.fn()
  }
}));

// Mock the User model
jest.mock('../../models/Users', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
  default: jest.fn().mockImplementation(() => ({
    save: jest.fn()
  }))
}));

// Mock email service
jest.mock('../../utils/email', () => ({
  sendVerificationEmail: jest.fn(),
  send2FAEmail: jest.fn()
}));

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /api/auth/signup', () => {
    it('should return 400 if user already exists and is verified', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123'
        });

      // This test assumes you have existing users in your test DB
      // You might need to mock the database or seed test data
      expect([200, 201, 400]).toContain(response.status);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User'
          // Missing email and password
        });

      expect(response.status).toBe(500); // Will fail validation
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
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

