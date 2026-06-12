import { z } from 'zod';

export const signupSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters').trim(),
  email: z.string().email('Please enter a valid email address').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  avatarUrl: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim(),
  password: z.string().min(1, 'Password is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
