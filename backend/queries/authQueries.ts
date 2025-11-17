import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/Users';
import { send2FAEmail } from '../utils/email';

export const authenticateUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return null;
  }

  return user;
};

export const generate2FACode = async (userId: string): Promise<string> => {
  const code = crypto.randomInt(100000, 999999).toString();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.twoFactorCode = await bcrypt.hash(code, 10);
  user.twoFactorCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  // Send the 2FA email asynchronously and do not block the login response.
  // Failures to send email should not prevent the user from receiving the
  // server response asking for a 2FA code (email delivery can be retried/logged).
  send2FAEmail(user.email, code).catch(err => {
    // Log the error but don't throw so the login flow doesn't hang.
    // eslint-disable-next-line no-console
    console.error('Failed to send 2FA email:', err?.message ?? err);
  });

  return code;
};

// Generate a 2FA code and do NOT auto-send it. Useful for endpoints that want
// to control when the email is sent (for example: resend endpoints that await send).
export const generate2FACodeNoSend = async (userId: string): Promise<string> => {
  const code = crypto.randomInt(100000, 999999).toString();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.twoFactorCode = await bcrypt.hash(code, 10);
  user.twoFactorCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  return code;
};

export const verify2FACode = async (userId: string, code: string): Promise<boolean> => {
  const user = await User.findById(userId)
    .select('+twoFactorCode +twoFactorCodeExpiry');

  if (!user || !user.twoFactorCode) {
    return false;
  }

  // Check if code expired
  if (user.twoFactorCodeExpiry && Date.now() > user.twoFactorCodeExpiry.getTime()) {
    return false;
  }

  // Verify code
  const isValid = await bcrypt.compare(code, user.twoFactorCode);

  if (isValid) {
    // Clear the 2FA code
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
    await user.save();
  }

  return isValid;
};

export const generateAuthToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: '24h' }
  );
};

export const toggle2FA = async (userId: string, enabled: boolean): Promise<void> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  user.twoFactorEnabled = enabled;

  if (!enabled) {
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
  }

  await user.save();
};

// Generate a long-lived device token for remembering devices.
export const generateDeviceToken = async (userId: string, daysValid = 30): Promise<string> => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

  // initialize array if missing
  // @ts-ignore
  user.trustedDevices = user.trustedDevices || [];
  // push new device token metadata
  // @ts-ignore
  user.trustedDevices.push({ tokenHash, expiresAt, createdAt: new Date(), lastUsed: new Date() });
  await user.save();

  return token;
};

// Verify a provided plain device token against stored trusted devices.
export const verifyDeviceToken = async (userId: string, token: string): Promise<boolean> => {
  const user = await User.findById(userId).select('+trustedDevices');
  if (!user || !user.trustedDevices) return false;

  const now = Date.now();
  let found = false;

  // filter out expired devices as we go
  // @ts-ignore
  const remaining: any[] = [];

  // @ts-ignore
  for (const dev of user.trustedDevices) {
    try {
      if (dev.expiresAt && now > new Date(dev.expiresAt).getTime()) {
        // expired, skip
        continue;
      }
      const match = await bcrypt.compare(token, dev.tokenHash);
      if (match) {
        found = true;
        // update lastUsed
        dev.lastUsed = new Date();
        remaining.push(dev);
        // do not break: still keep other non-expired devices
        continue;
      }
      remaining.push(dev);
    } catch (err) {
      // on error, keep the device entry (safe default)
      remaining.push(dev);
    }
  }

  // @ts-ignore
  user.trustedDevices = remaining;
  await user.save();

  return found;
};
