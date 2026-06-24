export const SessionStatus = { Active: 1, Paused: 2, AgentHandoff: 3, Expired: 4, Closed: 5, AwaitingAgent: 6 } as const;
export type SessionStatusValue = (typeof SessionStatus)[keyof typeof SessionStatus];
export const SESSION_STATUS_LABEL: Record<SessionStatusValue, string> = {
  1: 'Active', 2: 'Paused', 3: 'With Agent', 4: 'Expired', 5: 'Closed', 6: 'Needs Agent',
};
export const SESSION_STATUS_COLOR: Record<SessionStatusValue, 'success' | 'warning' | 'info' | 'muted' | 'danger'> = {
  1: 'success', 2: 'muted', 3: 'info', 4: 'muted', 5: 'muted', 6: 'danger',
};

export const MessageDirection = { Inbound: 1, Outbound: 2 } as const;
export const RoutingPath = { MenuNavigation: 1, CategoryBrowsing: 2, ServiceExecution: 3, ProductSearch: 4, CustomerSupport: 5, Outbound: 6, AgentHandoff: 7, Unmatched: 8 } as const;
export const ROUTING_PATH_LABEL: Record<number, string> = { 1: 'Menu', 2: 'Category', 3: 'Service', 4: 'Search', 5: 'Support', 6: 'Outbound', 7: 'Handoff', 8: 'Unmatched' };
export const CHANNEL_LABEL: Record<number, string> = { 1: 'WhatsApp', 2: 'Messenger', 3: 'Instagram', 4: 'Telegram', 5: 'SMS', 6: 'Voice', 7: 'WebChat', 8: 'Email' };

export interface SessionDto {
  id: string; tenantId: string; channelConnectionId: string; channel: number;
  customerId: string; status: SessionStatusValue; mode: number;
  currentFlowPosition: string | null; messageCount: number; totalTokensUsed: number;
  lastActivityAt: string; expiresAt: string; assignedAgentId: string | null;
  handoffContext: string | null; createdAt: string;
}
export interface MessageDto {
  id: string; sessionId: string; direction: number; channel: number;
  content: string | null; contentType: number; routingPath: number;
  matchedIntentId: string | null; tokensUsed: number; processingTimeMs: number;
  messageTimestamp: string; createdAt: string;
}
export interface ConversationStatsDto { sessionCount: number; messageCount: number; totalTokens: number; }
