import { z } from 'zod';
import { UserRole } from '@/features/auth/types/auth.types';

export const createInvitationSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email').max(254),
  role: z.number().refine(
    (v) => Object.values(UserRole).includes(v as 1 | 2 | 3 | 4),
    'Select a role',
  ),
  personalMessage: z.string().max(500).optional().or(z.literal('')),
});
export type CreateInvitationFormData = z.infer<typeof createInvitationSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  email: z.string().min(1).email(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  password: z.string()
    .min(8, 'At least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'One uppercase letter')
    .regex(/[a-z]/, 'One lowercase letter')
    .regex(/[0-9]/, 'One digit'),
  phone: z.string().max(20).optional().or(z.literal('')),
});
export type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;
