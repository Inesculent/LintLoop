import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import executeRoutes = require('./routes/execute');
import runSolutionRoutes = require('./routes/runSolution');
import runTestRoutes = require('./routes/runTest');
import problemRoutes = require('./routes/problems');
import submissionRoutes = require('./routes/submissions');
import userRoutes from './routes/user';
import authRoutes from './routes/loginSignup';
import { authenticate, AuthRequest } from './middleware/authenticate';
import User from './models/Users';
import { verifyTransport } from './utils/email';

const dockerUtils = require('./utils/docker');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://www.inesculent.dev', 'https://inesculent.dev']
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// MongoDB connection
const connectDB = async (): Promise<void> => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');
    } else {
      console.log('No MongoDB URI - running without database');
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error('MongoDB connection error:', err.message);
    }
  }
};

// Initialize Docker
const initDocker = async (): Promise<void> => {
  if (process.env.DOCKER_ENABLED === 'true') {
    const isConnected = await dockerUtils.testDockerConnection();
    if (isConnected) {
      console.log('Docker connected');
      // Pull images in background
      dockerUtils.pullImages().catch((err: Error) => console.error('Failed to pull images:', err));
    } else {
      console.warn('Docker not available - code execution will not work');
    }
  }
};

connectDB();
initDocker();
// Verify email transport (logs success/failure) but do not crash server if verification fails.
verifyTransport().catch(() => {
  // eslint-disable-next-line no-console
  console.error('Warning: email transport verification failed. 2FA emails may not be delivered.');
});

// Basic route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'LinterLoop API',
    description: 'Code practice platform with automated style and performance grading',
    endpoints: ['/health', '/api/auth/signup', '/api/auth/login', '/api/problems', '/api/submissions', '/api/execute'],
    supportedLanguages: ['python', 'java']
  });
});

// Auth routes (public - no authentication required)
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/execute', authenticate, executeRoutes);
app.use('/api/run-solution', authenticate, runSolutionRoutes);
app.use('/api/run-test', authenticate, runTestRoutes);
app.use('/api/problems', authenticate, problemRoutes);
app.use('/api/submissions', authenticate, submissionRoutes);
// User management routes (profile updates, delete account)
app.use('/api/users', authenticate, userRoutes);

// Example: Protected profile endpoint
app.get('/api/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Start server
const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
  console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('Server accessible at http://0.0.0.0:' + PORT);
});
