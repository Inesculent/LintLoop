import { Resend } from 'resend';

// Lazy-load Resend instance
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Email service not configured. Please set RESEND_API_KEY in environment variables.');
  }
  return new Resend(apiKey);
}

export const send2FAEmail = async (email: string, code: string): Promise<void> => {
  const resend = getResendClient();
  
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'LintLoop <onboarding@resend.dev>',
    to: email,
    subject: 'Your 2FA Code',
    text: `Your verification code is: ${code}`,
    html: `
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code expires in 10 minutes.</p>
    `
  });
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const resend = getResendClient();
  
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'LintLoop <onboarding@resend.dev>',
    to: email,
    subject: 'Verify Your Email - LintLoop',
    text: `Please verify your email by clicking this link: ${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to LintLoop!</h2>
        <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
        <p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
            Verify Email
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">This link expires in 24 hours.</p>
      </div>
    `
  });
};

// Verify Resend configuration (useful at server startup)
export const verifyTransport = async (): Promise<void> => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    // eslint-disable-next-line no-console
    console.log('Resend email service initialized');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Email service initialization failed:', err instanceof Error ? err.message : err);
    throw err;
  }
};
