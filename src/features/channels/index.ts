// ═══════════════════════════════════════════════════════════════
// Channels Feature — Public API (Barrel Export)
// ═══════════════════════════════════════════════════════════════

export {
  useChannels,
  useChannel,
  useHasActiveChannel,
  useChannelStats,
  useCreateChannel,
  useActivateChannel,
  useDeactivateChannel,
  useDeleteChannel,
  channelKeys,
} from './api/channels.queries';

export type {
  ChannelConnectionDto,
  ChannelConnectionCreateRequest,
  ChannelStatsResponse,
  ChannelTypeValue,
  ChannelConnectionStatusValue,
} from './types/channels.types';

export {
  ChannelType, CHANNEL_TYPE_LABEL, CHANNEL_TYPE_ICON, CHANNEL_TYPE_COLOR,
  ChannelConnectionStatus, CHANNEL_STATUS_LABEL, CHANNEL_STATUS_COLOR,
} from './types/channels.types';
