// ═══════════════════════════════════════════════════════════════
// Test Channel Feature — Public API (Barrel Export)
// Simulator only. Channel CRUD is in features/channels/.
// ═══════════════════════════════════════════════════════════════

export {
  useSendTestMessage,
  useStartTestSession,
  useResetTestSession,
  useTestSession,
  useTestChannelConnection,
  useTestChannelStatus,
  testChannelKeys,
} from './api/test-channel.queries';

export type {
  TestMessageRequest,
  TestMessageResponse,
  TestSessionStartRequest,
  TestSessionStateResponse,
  TestChatMessage,
  TestInteractiveItem,
  TestProductCard,
  ChatBubble,
  MessageDebugInfo,
  ScenarioPreset,
} from './types/test-channel.types';

export {
  RoutingPath, ROUTING_PATH_LABEL, ROUTING_PATH_COLOR,
  MessageContentType,
} from './types/test-channel.types';
