import { z } from 'zod';
import { BusinessType } from './auth.types';

// ─── Login ───
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Register ───
export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Enter a valid email').max(254),
  password: z.string()
    .min(8, 'At least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'One uppercase letter')
    .regex(/[a-z]/, 'One lowercase letter')
    .regex(/[0-9]/, 'One digit'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  phone: z.string().max(20).optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
export type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Forgot password ───
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ─── Reset password ───
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  email: z.string().min(1).email(),
  newPassword: z.string()
    .min(8, 'At least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'One uppercase letter')
    .regex(/[a-z]/, 'One lowercase letter')
    .regex(/[0-9]/, 'One digit'),
});
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Change password ───
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(1, 'New password is required')
    .min(8, 'At least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'One uppercase letter')
    .regex(/[a-z]/, 'One lowercase letter')
    .regex(/[0-9]/, 'One digit'),
  confirmPassword: z.string().min(1, 'New confirm Password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ─── Update profile ───
export const updateProfileSchema = z.object({
  firstName: z.string().max(100).optional().or(z.literal('')),
  lastName: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  avatarUrl: z.string().max(500).optional().or(z.literal('')),
});
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
