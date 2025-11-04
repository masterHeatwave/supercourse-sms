import nodemailer from 'nodemailer';
import { config } from '@config/config';
import { logger } from './logger';
import { EmailOptions } from '@utils/sendEmail.interface';

const transport = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  auth: {
    user: config.SMTP_EMAIL,
    pass: config.SMTP_PASSWORD,
  },
});

transport
  .verify()
  .then((res: unknown) => logger.info(`SMTP CONNECT: ${res}`))
  .catch((err: Error) => logger.error('SMTP ERROR', err));

const sendEmail = async (options: EmailOptions): Promise<void> => {
  let message = {
    from: `Super Course <${config.FROM_EMAIL}>`,
    to: 'super-int-test@softweb.gr',
    cc: ['swp1@supercourse.gr', 'efthymis@softweb.gr'],
    subject: options.subject,
    html: options.html,
  };
  if (config.NODE_ENV !== 'production') {
    message = {
      from: `Super Course <${config.FROM_EMAIL}>`,
      to: 'kourouklis@softweb.gr',
      cc: ['koukis@softweb.gr'],
      subject: options.subject,
      html: options.html,
    };
  }

  const info = await transport.sendMail(message);
  if (config.NODE_ENV !== 'test') {
    logger.info('Message sent: %s', info);
  }
};

const sendVerificationEmail = async (verificationToken: string, origin: string, email: string): Promise<void> => {
  let message: string;

  if (origin) {
    const verifyUrl = `${origin}/auth/verify-email?token=${verificationToken}`;
    message = `
      <p>Thank you for joining us!</p>
      <p>Click the link below to verify your email address and complete your registration:</p>
      <p><a href="${verifyUrl}" style="color: #4CAF50; text-decoration: none;">Verify My Email</a></p>
    `;
  } else {
    message = `
      <p>Thank you for joining us!</p>
      <p>Please copy the token below and use it with the <code>/auth/verify-email</code> API route to verify your email address:</p>
      <p><code>${verificationToken}</code></p>
    `;
  }

  await sendEmail({
    to: email,
    subject: 'Verify Your Email for Our Service',
    html: `
      <h4 style="color: #333;">Email Verification Needed</h4>
      ${message}
      <p>Welcome aboard!<br>The Souper Course Team</p>
    `,
  });
};

const sendPasswordResetEmail = async (resetToken: string, email: string): Promise<void> => {
  const resetUrl = `${config.WEB_HOST}/reset-password?pin=${resetToken}&email=${email}`;
  const message = `
    <p>Hello,</p>
    <p>It looks like you requested a password reset. Click the link below to proceed:</p>
    <p><a href="${resetUrl}" style="color: #4CAF50; text-decoration: none;">Reset My Password</a></p>
    <p>This link is valid for the next 24 hours. If you didn’t request a reset, you can safely ignore this email.</p>
    <p>Take care,<br>Souper Course Support Team</p>
  `;

  logger.info(resetUrl); // This logging is important for debugging.

  await sendEmail({
    to: email,
    subject: `Password Reset for Souper Course`,
    html: `<h4 style="color: #333;">Password Reset Request</h4>${message}`,
  });
};

const sendEmailToCreatePassword = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${config.WEB_HOST}/reset-password?pin=${resetToken}&email=${email}`;

  const message = `
    <p>Hi there,</p>
    <p>You’re almost there! Click the link below to set your password. Remember, this link is only active for 24 hours:</p>
    <p><a href="${resetUrl}" style="color: #4CAF50;">Create My Password</a></p>
    <p>If you didn’t request this email, no worries! Just ignore it.</p>
    <p>Best regards,<br>Super Course Team</p>
  `;

  await sendEmail({
    to: email,
    subject: `Set Your Password for Super Course`,
    html: `<h4 style="color: #333;">Welcome to Super Course!</h4>${message}`,
  });
};

const sendRegistrationEmail = async (email: string, password: string, customerSlug: string): Promise<void> => {
  const loginUrl = `${config.WEB_HOST}/register?context=${customerSlug}`;

  const message = `
    <p>Welcome to Your SMS Dashboard!</p>
    <p>Your school registration has been completed successfully.</p>
    
    <h3>Login Details:</h3>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Password:</strong> ${password}</p>
    
    <h3>Access Your Dashboard:</h3>
    <p>Click the link below to access your SMS dashboard:</p>
    <p><a href="${loginUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px;">Access Dashboard</a></p>
    
    <p>Or copy and paste this link into your browser: ${loginUrl}</p>
    
    <p><strong>Important:</strong> Please keep these credentials secure and consider changing your password after your first login.</p>
    
    <p>Best regards,<br>The SuperCourse SMS Team</p>
  `;

  await sendEmail({
    to: email,
    subject: `SMS Dashboard Access - Welcome!`,
    html: `<h4 style="color: #333;">Welcome to SMS Dashboard!</h4>${message}`,
  });
};

export {
  transport,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmailToCreatePassword,
  sendRegistrationEmail,
};
