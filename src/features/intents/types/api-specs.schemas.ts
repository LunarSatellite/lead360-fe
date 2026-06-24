import { z } from 'zod';

// ─── Paste content upload schema ───

export const apiSpecUploadSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be under 200 characters'),
  description: z.string().max(1000).optional().or(z.literal('')),
  specContent: z
    .string()
    .min(1, 'Paste your OpenAPI/Swagger spec content'),
  fileFormat: z.enum(['json', 'yaml', 'auto']).optional().default('auto'),
});
export type ApiSpecUploadFormData = z.infer<typeof apiSpecUploadSchema>;

// ─── File upload schema ───

export const apiSpecFileUploadSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be under 200 characters'),
  description: z.string().max(1000).optional().or(z.literal('')),
});
export type ApiSpecFileUploadFormData = z.infer<typeof apiSpecFileUploadSchema>;
