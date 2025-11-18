import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser } from '../models/Users';
import { AuthRequest, authenticate } from '../middleware/authenticate';
import { generate2FACode, verify2FACode, generateDeviceToken, verifyDeviceToken } from '../queries/authQueries';
import { getRoleForEmail } from '../utils/adminList';
import { sendVerificationEmail } from '../utils/email';

const router = express.Router();

interface SignupBody {
  name: string;
  email: string;
  password: string;
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
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email }).select('+verificationToken +verificationTokenExpiry');
    if (existingUser) {
      // If user exists but email is not verified, resend verification email
      if (!existingUser.emailVerified) {
        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        existingUser.verificationToken = verificationToken;
        existingUser.verificationTokenExpiry = verificationTokenExpiry;
        await existingUser.save();

        // Send verification email
        try {
          await sendVerificationEmail(email, verificationToken);
          console.log(`Verification email resent to existing unverified user: ${email}`);
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
        }

        return res.status(200).json({
          message: 'An account with this email already exists but is not verified. We have sent a new verification email to your inbox.',
          requiresVerification: true
        });
      }

      // User exists and is verified
      return res.status(400).json({ message: 'User already exists. Please log in.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the next uid by counting existing users
    const userCount = await User.countDocuments();
    const nextUid = userCount + 1;

    // Determine role based on admin list
    const role = getRoleForEmail(email);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user (unverified)
    const user: IUser = new User({
      uid: nextUid,
      name,
      email,
      password: hashedPassword,
      role: role,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry
    });
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail signup if email fails - user can request resend later
    }

    return res.status(201).json({
      message: 'User created successfully. Please check your email to verify your account.',
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: false
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

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        requiresVerification: true
      });
    }

    // Sync role from admin list
    const correctRole = getRoleForEmail(user.email);
    if (user.role !== correctRole) {
      user.role = correctRole;
      await user.save();
      console.log(`Updated role for ${user.email} to ${correctRole}`);
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
        console.error('Device token verification error:', err instanceof Error ? err.message : err);
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
        console.error('Failed to generate device token:', err instanceof Error ? err.message : err);
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

    // Sync role from admin list
    if (user) {
      const correctRole = getRoleForEmail(user.email);
      if (user.role !== correctRole) {
        user.role = correctRole;
        await user.save();
        console.log(`Updated role for ${user.email} to ${correctRole}`);
      }
    }

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
        console.error('Failed to generate device token after 2FA:', err instanceof Error ? err.message : err);
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

// Verify email with token
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    // Find user with this verification token (need to explicitly select the field)
    const user = await User.findOne({ 
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() } // Token not expired
    }).select('+verificationToken +verificationTokenExpiry');

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired verification token. Please request a new verification email.' 
      });
    }

    // Mark email as verified and clear the token
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    console.log(`Email verified for user: ${user.email}`);

    return res.json({ 
      message: 'Email verified successfully! You can now log in.',
      success: true
    });
  } catch (error) {
    const err = error as Error;
    console.error('Email verification error:', err);
    return res.status(500).json({ message: 'Error verifying email', error: err.message });
  }
});

// Resend verification email
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email }).select('+verificationToken +verificationTokenExpiry');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
      console.log(`Verification email resent to ${email}`);
      
      return res.json({ message: 'Verification email sent successfully' });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
    }
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ message: 'Error resending verification email', error: err.message });
  }
});

export default router;
