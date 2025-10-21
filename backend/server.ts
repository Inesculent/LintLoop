import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import executeRoutes = require('./routes/execute');
import runSolutionRoutes = require('./routes/runSolution');
import testRoutes = require('./routes/test');
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
    endpoints: ['/health', '/api/problems', '/api/submissions', '/api/execute'],
    supportedLanguages: ['python', 'java']
  });
});

// Routes
app.use('/api/execute', executeRoutes);
app.use('/api/run-solution', runSolutionRoutes);
app.use('/api/test', testRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
});