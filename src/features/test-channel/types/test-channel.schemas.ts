import { z } from 'zod';

// ─── Send message form ───
export const sendMessageSchema = z.object({
  text: z.string().min(1, 'Message cannot be empty'),
  interactiveReplyId: z.string().optional(),
});
export type SendMessageFormData = z.infer<typeof sendMessageSchema>;

// ─── Start session form ───
export const startSessionSchema = z.object({
  tenantId: z.string().uuid('Select a tenant'),
  senderId: z.string().max(200).optional().or(z.literal('')),
});
export type StartSessionFormData = z.infer<typeof startSessionSchema>;
