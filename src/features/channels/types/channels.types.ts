// ═══════════════════════════════════════════════════════════════
// Channels Feature — Type Definitions (matches Swagger spec)
// Source: /api/v1/channels/*
// ═══════════════════════════════════════════════════════════════
// ─── ChannelType (Swagger enum 1-8) ───

export const ChannelType = {
  WhatsApp: 1, Messenger: 2, Instagram: 3, Telegram: 4,
  SMS: 5, Voice: 6, WebChat: 7, Email: 8, Viber:9,
} as const;
export type ChannelTypeValue = (typeof ChannelType)[keyof typeof ChannelType];

export const CHANNEL_TYPE_LABEL: Record<ChannelTypeValue, string> = {
  [ChannelType.WhatsApp]: 'WhatsApp',
  [ChannelType.Messenger]: 'Messenger',
  [ChannelType.Instagram]: 'Instagram',
  [ChannelType.Telegram]: 'Telegram',
  [ChannelType.SMS]: 'SMS',
  [ChannelType.Voice]: 'Voice',
  [ChannelType.WebChat]: 'Web Chat',
  [ChannelType.Email]: 'Email',
  [ChannelType.Viber]: 'Viber',
};

export const CHANNEL_TYPE_ICON: Record<ChannelTypeValue, string> = {
  [ChannelType.WhatsApp]: 'Phone',
  [ChannelType.Messenger]: 'MessageCircle',
  [ChannelType.Instagram]: 'Camera',
  [ChannelType.Telegram]: 'Send',
  [ChannelType.SMS]: 'MessageSquare',
  [ChannelType.Voice]: 'PhoneCall',
  [ChannelType.WebChat]: 'Globe',
  [ChannelType.Email]: 'Mail',
  [ChannelType.Viber]: 'MessageSquare',
};

export const CHANNEL_TYPE_COLOR: Record<ChannelTypeValue, 'success' | 'brand' | 'info' | 'warning' | 'danger' | 'muted'> = {
  [ChannelType.WhatsApp]: 'success',
  [ChannelType.Messenger]: 'info',
  [ChannelType.Instagram]: 'danger',
  [ChannelType.Telegram]: 'info',
  [ChannelType.SMS]: 'brand',
  [ChannelType.Voice]: 'warning',
  [ChannelType.WebChat]: 'info',
  [ChannelType.Email]: 'muted',
  [ChannelType.Viber]: 'success',
};

// ─── ChannelConnectionStatus (Swagger enum 1-4) ───

export const ChannelConnectionStatus = {
  Pending: 1, Active: 2, Disconnected: 3, Error: 4,
} as const;
export type ChannelConnectionStatusValue = (typeof ChannelConnectionStatus)[keyof typeof ChannelConnectionStatus];

export const CHANNEL_STATUS_LABEL: Record<ChannelConnectionStatusValue, string> = {
  [ChannelConnectionStatus.Pending]: 'Pending',
  [ChannelConnectionStatus.Active]: 'Active',
  [ChannelConnectionStatus.Disconnected]: 'Disconnected',
  [ChannelConnectionStatus.Error]: 'Error',
};

export const CHANNEL_STATUS_COLOR: Record<ChannelConnectionStatusValue, 'warning' | 'success' | 'muted' | 'danger'> = {
  [ChannelConnectionStatus.Pending]: 'warning',
  [ChannelConnectionStatus.Active]: 'success',
  [ChannelConnectionStatus.Disconnected]: 'muted',
  [ChannelConnectionStatus.Error]: 'danger',
};

// ─── ChannelConnectionDto (GET /api/v1/channels, /channels/{id}) ───

export interface ChannelConnectionDto {
  id: string;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  tenantId: string;
  channelType: ChannelTypeValue;
  status: ChannelConnectionStatusValue;
  channelIdentifier: string | null;
  displayName: string | null;
  webhookUrl: string | null;
  lastMessageReceivedAt: string | null;
}

// ─── ChannelConnectionCreateRequest (POST /api/v1/channels) ───

export interface ChannelConnectionCreateRequest {
  tenantId: string;
  channelType: ChannelTypeValue;
  channelIdentifier: string;
  displayName?: string | null;
  configurationJson?: string | null;
}

// ─── Channel stats response (GET /api/v1/channels/stats) ───

export interface ChannelStatsResponse {
  WhatsApp: number;
  Messenger: number;
  Instagram: number;
  Telegram: number;
  SMS: number;
  Voice: number;
  WebChat: number;
  Email: number;
}
