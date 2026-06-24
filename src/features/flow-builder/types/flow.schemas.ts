import { z } from 'zod';

export const flowCreateSchema = z.object({
  name: z.string().min(1, 'Flow name is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
});
export type FlowCreateFormData = z.infer<typeof flowCreateSchema>;

export const flowNodeEditSchema = z.object({
  label: z.string().min(1, 'Label is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  responseTemplate: z.string().max(5000).optional().or(z.literal('')),
  intentId: z.string().nullable().optional(),
  apiEndpoint: z.string().max(500).optional().or(z.literal('')),
  apiMethod: z.string().optional().or(z.literal('')),
  handoffTarget: z.string().max(200).optional().or(z.literal('')),
});
export type FlowNodeEditFormData = z.infer<typeof flowNodeEditSchema>;

export const flowGenerateSchema = z.object({
  description: z.string().min(10, 'Describe your chatbot flow in at least 10 characters').max(2000),
});
export type FlowGenerateFormData = z.infer<typeof flowGenerateSchema>;
