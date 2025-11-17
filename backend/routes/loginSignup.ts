import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/Users';
import { AuthRequest, authenticate } from '../middleware/authenticate';
import { generate2FACode, verify2FACode, generateDeviceToken, verifyDeviceToken } from '../queries/authQueries';

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
  rememberDevice?: boolean;
  deviceToken?: string;
}

interface Verify2FABody {
  userId: string;
  code: string;
  rememberDevice?: boolean;
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

// Login route - now with 2FA support
router.post('/login', async (req: Request<{}, {}, LoginBody>, res: Response) => {
  try {
    const { email, password, rememberDevice, deviceToken } = req.body as LoginBody;

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

    // If a device token was provided, verify it to bypass 2FA
    if (deviceToken) {
      try {
        const ok = await verifyDeviceToken(user._id.toString(), deviceToken);
        if (ok) {
          const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
          );

          return res.json({
            message: 'Login successful (trusted device)',
            token,
            user: {
              id: user._id,
              uid: user.uid,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });
        }
      } catch (err) {
        // If verification fails, continue with normal flow
        // eslint-disable-next-line no-console
        console.error('Device token verification error:', err?.message ?? err);
      }
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate and send 2FA code
      await generate2FACode(user._id.toString());

      return res.json({
        message: '2FA code sent to email',
        requiresTwoFactor: true,
        userId: user._id
      });
    }

    // If 2FA not enabled, return token directly
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // If user asked to remember this device, generate a device token
    if (rememberDevice) {
      try {
        const deviceTokenPlain = await generateDeviceToken(user._id.toString());
        return res.json({
          message: 'Login successful',
          token,
          deviceToken: deviceTokenPlain,
          user: {
            id: user._id,
            uid: user.uid,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      } catch (err) {
        // If generating device token fails, still return successful login
        // eslint-disable-next-line no-console
        console.error('Failed to generate device token:', err?.message ?? err);
      }
    }

    return res.json({
      message: 'Login successful',
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
    return res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

// Verify 2FA code
router.post('/verify-2fa', async (req: Request<{}, {}, Verify2FABody>, res: Response) => {
  try {
    const { userId, code, rememberDevice } = req.body as Verify2FABody;

    if (!userId || !code) {
      return res.status(400).json({ message: 'User ID and code required' });
    }

    const isValid = await verify2FACode(userId, code);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid or expired code' });
    }

    // Generate JWT token after successful verification
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // Get user details
    const user = await User.findById(userId);

    const response: any = {
      message: 'Login successful',
      token,
      user: {
        id: user?._id,
        uid: user?.uid,
        name: user?.name,
        email: user?.email,
        role: user?.role
      }
    };

    // If user opted to remember this device, generate a device token and return it
    if (rememberDevice) {
      try {
        const deviceTokenPlain = await generateDeviceToken(userId);
        response.deviceToken = deviceTokenPlain;
      } catch (err) {
        // log and continue
        // eslint-disable-next-line no-console
        console.error('Failed to generate device token after 2FA:', err?.message ?? err);
      }
    }

    return res.json(response);
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ message: 'Error verifying 2FA code', error: err.message });
  }
});

// Enable 2FA (protected route)
router.post('/enable-2fa', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.twoFactorEnabled = true;
    await user.save();

    return res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ message: 'Error enabling 2FA', error: err.message });
  }
});

// Disable 2FA (protected route)
router.post('/disable-2fa', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
    await user.save();

    return res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ message: 'Error disabling 2FA', error: err.message });
  }
});

export default router;
