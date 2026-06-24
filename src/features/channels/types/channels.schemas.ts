import { z } from 'zod';
import { ChannelType } from './channels.types';

export const createChannelSchema = z.object({
  channelType: z.number().refine(
    (v) => Object.values(ChannelType).includes(v as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8),
    'Select a channel type',
  ),
  channelIdentifier: z.string().min(1, 'Identifier is required').max(200),
  displayName: z.string().max(200).optional().or(z.literal('')),
  configurationJson: z.string().optional().or(z.literal('')),
});
export type CreateChannelFormData = z.infer<typeof createChannelSchema>;
