import { z } from 'zod';
import { IntentTrack, IntentOperationType } from './intents.types';

const intentTrackValues = Object.values(IntentTrack) as [number, ...number[]];
const operationTypeValues = Object.values(IntentOperationType) as [number, ...number[]];

export const createIntentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be under 200 characters'),
  description: z.string().max(1000).optional().or(z.literal('')),
  track: z.number().refine((v) => intentTrackValues.includes(v), 'Select a track'),
  operationType: z.number().refine((v) => operationTypeValues.includes(v), 'Select an operation type'),
  parentIntentId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  keywords: z.string().max(2000).optional().or(z.literal('')),
  patternsJson: z.string().optional().or(z.literal('')),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  apiEndpoint: z.string().max(500).optional().or(z.literal('')),
  apiMethod: z.string().optional().or(z.literal('')),
  apiParametersJson: z.string().optional().or(z.literal('')),
  searchScope: z.string().max(500).optional().or(z.literal('')),
  staticResponseText: z.string().max(5000).optional().or(z.literal('')),
  handoffTarget: z.string().max(200).optional().or(z.literal('')),
});
export type CreateIntentFormData = z.infer<typeof createIntentSchema>;

export const updateIntentSchema = createIntentSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateIntentFormData = z.infer<typeof updateIntentSchema>;

export const bulkImportSchema = z.object({
  jsonData: z.string().min(1, 'Paste JSON data or upload a file'),
});
export type BulkImportFormData = z.infer<typeof bulkImportSchema>;
