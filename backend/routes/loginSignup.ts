import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/Users';

const router = express.Router();

interface SignupBody {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

interface LoginBody {
  email: string;
  password: string;
}

// Signup route
router.post('/signup', async (req: Request<{}, {}, SignupBody>, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the next uid by counting existing users
    const userCount = await User.countDocuments();
    const nextUid = userCount + 1;

    // Create new user
    const user: IUser = new User({
      uid: nextUid,
      name,
      email,
      password: hashedPassword,
      role: role
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ message: 'Error creating user', error: err.message });
  }
});

// Login route
router.post('/login', async (req: Request<{}, {}, LoginBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

export default router;
