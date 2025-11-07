import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import executeRoutes = require('./routes/execute');
import runSolutionRoutes = require('./routes/runSolution');
import runTestRoutes = require('./routes/runTest');
import testRoutes = require('./routes/test');
import problemRoutes = require('./routes/problems');
import authRoutes from './routes/loginSignup';
import { authenticate, AuthRequest } from './middleware/authenticate';
import User from './models/Users';

const dockerUtils = require('./utils/docker');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
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
app.use('/api/test', authenticate, testRoutes);
app.use('/api/problems', authenticate, problemRoutes);

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
