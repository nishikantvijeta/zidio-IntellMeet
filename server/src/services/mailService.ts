import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class MailService {
  private static getTransporter() {
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      return nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      });
    }
    return null;
  }

  static async sendVerificationEmail(email: string, username: string, token: string): Promise<void> {
    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
    const verificationUrl = `${serverUrl}/api/auth/verify?token=${token}`;
    
    // We also want a link that points to the client's verification route
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const clientUrl = `${clientBaseUrl}/verify?token=${token}`;
    
    const transporter = this.getTransporter();
    const SMTP_FROM = process.env.SMTP_FROM || '"IntellMeet" <no-reply@intellmeet.com>';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4F46E5; text-align: center;">Welcome to IntellMeet</h2>
        <p>Hi ${username},</p>
        <p>Thank you for signing up for IntellMeet, the AI-Powered Enterprise Meeting Platform. Please click the button below to verify your email address and activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${clientUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${clientUrl}">${clientUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: SMTP_FROM,
          to: email,
          subject: 'Verify Your IntellMeet Account',
          html: htmlContent
        });
        logger.info(`Verification email sent to ${email}`);
        logger.info(`Verification Link (Client): ${clientUrl}`);
        logger.info(`Verification Link (API-Direct): ${verificationUrl}`);
        return;
      } catch (err) {
        logger.error(`Failed to send email via SMTP: ${err}. Falling back to console log.`);
      }
    }

    // Console fallback
    logger.warn('\n' + '='.repeat(80));
    logger.warn(`DEVELOPMENT MODE: VERIFICATION EMAIL FOR ${email.toUpperCase()}`);
    logger.warn(`Username: ${username}`);
    logger.warn(`Token: ${token}`);
    logger.warn(`Verification Link (Client): ${clientUrl}`);
    logger.warn(`Verification Link (API-Direct): ${verificationUrl}`);
    logger.warn('='.repeat(80) + '\n');
  }

  static async sendResetPasswordEmail(email: string, username: string, token: string): Promise<void> {
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const clientUrl = `${clientBaseUrl}/reset-password?token=${token}`;
    const transporter = this.getTransporter();
    const SMTP_FROM = process.env.SMTP_FROM || '"IntellMeet" <no-reply@intellmeet.com>';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4F46E5; text-align: center;">Reset Your Password</h2>
        <p>Hi ${username},</p>
        <p>We received a request to reset your password for your IntellMeet account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${clientUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>This password reset link is valid for 1 hour. If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${clientUrl}">${clientUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: SMTP_FROM,
          to: email,
          subject: 'Reset Your IntellMeet Password',
          html: htmlContent
        });
        logger.info(`Password reset email sent to ${email}`);
        logger.info(`Reset Link (Client): ${clientUrl}`);
        return;
      } catch (err) {
        logger.error(`Failed to send password reset email via SMTP: ${err}. Falling back to console log.`);
      }
    }

    // Console fallback
    logger.warn('\n' + '='.repeat(80));
    logger.warn(`DEVELOPMENT MODE: PASSWORD RESET EMAIL FOR ${email.toUpperCase()}`);
    logger.warn(`Username: ${username}`);
    logger.warn(`Token: ${token}`);
    logger.warn(`Reset Link (Client): ${clientUrl}`);
    logger.warn('='.repeat(80) + '\n');
  }
}
