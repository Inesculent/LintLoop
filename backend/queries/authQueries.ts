import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
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

  await send2FAEmail(user.email, code);
  
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
