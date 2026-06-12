import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRepository } from '../repositories/userRepository';
import { TokenService } from '../services/tokenService';
import { MailService } from '../services/mailService';
import { NotificationRepository } from '../repositories/notificationRepository';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { logger } from '../utils/logger';

// Helper to set refresh token in cookie
const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password, avatarUrl } = req.body;

      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Default avatar if none provided
      const finalAvatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

      // Create user
      const user = await UserRepository.create({
        username,
        email,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
        avatarUrl: finalAvatar
      });

      // Send email (runs in background, doesn't block response)
      MailService.sendVerificationEmail(user.email, user.username, verificationToken)
        .catch(err => logger.error('Verification email error:', err));

      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.'
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        res.status(400).json({ success: false, message: 'Invalid or missing token.' });
        return;
      }

      const user = await UserRepository.findByVerificationToken(token);
      if (!user) {
        res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
        return;
      }

      // Update user
      await UserRepository.update(user._id, {
        isVerified: true,
        verificationToken: undefined
      });

      res.status(200).json({
        success: true,
        message: 'Email verified successfully! You can now log in.'
      });
    } catch (error) {
      next(error);
    }
  }

  static async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ success: false, message: 'Email address is required.' });
        return;
      }

      const user = await UserRepository.findByEmail(email);
      if (!user) {
        // Return 200 for security reasons to prevent email enumeration
        res.status(200).json({
          success: true,
          message: 'If the account exists, a new verification link has been sent.'
        });
        return;
      }

      if (user.isVerified) {
        res.status(400).json({
          success: false,
          message: 'This account has already been verified. Please log in.'
        });
        return;
      }

      // Generate a new verification token or use the existing one
      let verificationToken = user.verificationToken;
      if (!verificationToken) {
        verificationToken = crypto.randomBytes(32).toString('hex');
        await UserRepository.update(user._id, { verificationToken });
      }

      // Send the verification email
      MailService.sendVerificationEmail(user.email, user.username, verificationToken)
        .catch(err => logger.error('Resend verification email error:', err));

      res.status(200).json({
        success: true,
        message: 'A new verification link has been sent to your email.'
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await UserRepository.findByEmail(email);
      if (!user || !user.password) {
        res.status(400).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      if (!user.isVerified) {
        res.status(403).json({
          success: false,
          isNotVerified: true,
          message: 'Please verify your email address before logging in.'
        });
        return;
      }

      // Generate tokens
      const { accessToken, refreshToken } = TokenService.generateTokens(user);

      // Save refresh token
      await UserRepository.update(user._id, { refreshToken });

      // Set cookie
      setRefreshTokenCookie(res, refreshToken);

      res.status(200).json({
        success: true,
        accessToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({ success: false, message: 'Refresh token required.' });
        return;
      }

      const decoded = TokenService.verifyRefreshToken(refreshToken);
      if (!decoded) {
        res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
        return;
      }

      const user = await UserRepository.findById(decoded.userId);
      if (!user || user.refreshToken !== refreshToken) {
        res.status(401).json({ success: false, message: 'Token reuse detected or user not found.' });
        return;
      }

      // Generate new tokens
      const tokens = TokenService.generateTokens(user);
      await UserRepository.update(user._id, { refreshToken: tokens.refreshToken });

      setRefreshTokenCookie(res, tokens.refreshToken);

      res.status(200).json({
        success: true,
        accessToken: tokens.accessToken
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      const user = await UserRepository.findByEmail(email);
      if (!user) {
        // Return 200 for security reasons to prevent email enumeration
        res.status(200).json({
          success: true,
          message: 'If that email address exists, a password reset link has been sent.'
        });
        return;
      }

      // Generate reset token
      const resetPasswordToken = crypto.randomBytes(32).toString('hex');
      const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

      await UserRepository.update(user._id, {
        resetPasswordToken,
        resetPasswordExpires
      });

      // Send email
      MailService.sendResetPasswordEmail(user.email, user.username, resetPasswordToken)
        .catch(err => logger.error('Password reset email error:', err));

      res.status(200).json({
        success: true,
        message: 'If that email address exists, a password reset link has been sent.'
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;

      const user = await UserRepository.findByResetPasswordToken(token);
      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Password reset token is invalid or has expired.'
        });
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Save user updates
      await UserRepository.update(user._id, {
        password: hashedPassword,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined
      });

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. You can now log in.'
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (userId) {
        await UserRepository.update(userId, { refreshToken: undefined });
      }

      res.clearCookie('refreshToken');
      res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await UserRepository.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const notifications = await NotificationRepository.listUserNotifications(userId);
      res.status(200).json({
        success: true,
        notifications
      });
    } catch (error) {
      next(error);
    }
  }

  static async markNotificationRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await NotificationRepository.markAsRead(id);
      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      res.status(200).json({
        success: true,
        notification
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllNotificationsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await NotificationRepository.markAllAsRead(userId);
      res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UserRepository.listAll();
      res.status(200).json({
        success: true,
        users: users.map(u => ({
          id: u._id,
          username: u.username,
          email: u.email,
          avatarUrl: u.avatarUrl
        }))
      });
    } catch (error) {
      next(error);
    }
  }
}
