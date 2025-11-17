import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const send2FAEmail = async (email: string, code: string): Promise<void> => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your 2FA Code',
      text: `Your verification code is: ${code}`,
      html: `
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>This code expires in 10 minutes.</p>
      `
    });

    // eslint-disable-next-line no-console
    console.log(`2FA email sent to ${email} (messageId=${info.messageId})`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error sending 2FA email:', err?.message ?? err);
    throw err;
  }
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
