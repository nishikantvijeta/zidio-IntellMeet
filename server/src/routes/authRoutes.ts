import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateMiddleware';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/authSchemas';

const router = Router();

router.post('/signup', validateRequest(signupSchema), AuthController.signup);
router.get('/verify', AuthController.verifyEmail);
router.post('/signup/resend', AuthController.resendVerification);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), AuthController.resetPassword);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/profile', authenticate, AuthController.getProfile);
router.get('/notifications', authenticate, AuthController.getNotifications);
router.put('/notifications', authenticate, AuthController.markAllNotificationsRead);
router.put('/notifications/:id', authenticate, AuthController.markNotificationRead);
router.get('/users', authenticate, AuthController.listUsers);

export default router;
