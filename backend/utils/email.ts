import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const send2FAEmail = async (email: string, code: string): Promise<void> => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
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
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
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

// Verify transporter configuration (useful at server startup)
export const verifyTransport = async (): Promise<void> => {
  try {
    await transporter.verify();
    // eslint-disable-next-line no-console
    console.log('Email transporter verified');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Email transporter verification failed:', err?.message ?? err);
    throw err;
  }
};
