// ═══════════════════════════════════════════════════════════════
// Test Channel — Type Definitions (simulator only)
// Source: /api/v1/test-channel/*
// Channel connection types live in features/channels/types/
// ═══════════════════════════════════════════════════════════════

// ─── Routing Path (used in debug info) ───

export const RoutingPath = {
  MenuNavigation: 1, CategoryBrowsing: 2, ServiceExecution: 3,
  ProductSearch: 4, CustomerSupport: 5, Outbound: 6,
  AgentHandoff: 7, Unmatched: 8,
} as const;
export type RoutingPathValue = (typeof RoutingPath)[keyof typeof RoutingPath];

export const ROUTING_PATH_LABEL: Record<string, string> = {
  MenuNavigation: 'Menu Navigation', CategoryBrowsing: 'Category Browsing',
  ServiceExecution: 'Service Execution', ProductSearch: 'Product Search',
  CustomerSupport: 'Customer Support', Outbound: 'Outbound',
  AgentHandoff: 'Agent Handoff', Unmatched: 'Unmatched',
};

export const ROUTING_PATH_COLOR: Record<string, 'success' | 'brand' | 'info' | 'warning' | 'danger' | 'muted'> = {
  MenuNavigation: 'success', CategoryBrowsing: 'info',
  ServiceExecution: 'brand', ProductSearch: 'brand',
  CustomerSupport: 'info', Outbound: 'warning',
  AgentHandoff: 'danger', Unmatched: 'muted',
};

// ─── Message Content Type ───

export const MessageContentType = {
  Text: 1, Interactive: 2, Image: 3, Document: 4, Audio: 5,
  Video: 6, Location: 7, Contact: 8, Sticker: 9, Reaction: 10,
} as const;
export type MessageContentTypeValue = (typeof MessageContentType)[keyof typeof MessageContentType];

// ─── TestMessageRequest (POST /api/v1/test-channel/message) ───

export interface TestMessageRequest {
  tenantId: string;
  senderId: string;
  text: string;
  interactiveReplyId?: string | null;
  contentType?: MessageContentTypeValue;
}

// ─── TestInteractiveItem ───

export interface TestInteractiveItem {
  id: string | null;
  title: string | null;
  description: string | null;
}

// ─── TestProductCard ───

export interface TestProductCard {
  id: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
}

// ─── TestMessageResponse ───

export interface TestMessageResponse {
  replyText: string | null;
  buttons: TestInteractiveItem[] | null;
  listItems: TestInteractiveItem[] | null;
  products: TestProductCard[] | null;
  mediaUrl: string | null;
  mediaMimeType: string | null;
  sessionId: string;
  responseType: string | null;
  routingPath: string | null;
  matchedIntent: string | null;
  conversationMode: string | null;
  currentFlowPosition: string | null;
  messageCount: number;
  tokensUsed: number;
  processingTimeMs: number;
  collectedVariables: Record<string, string> | null;
  sessionStatus: string | null;
}

// ─── TestSessionStartRequest ───

export interface TestSessionStartRequest {
  tenantId: string;
  senderId?: string | null;
}

// ─── TestChatMessage ───

export interface TestChatMessage {
  role: string | null;
  content: string | null;
  responseType: string | null;
  routingPath: string | null;
  timestamp: string;
}

// ─── TestSessionStateResponse ───

export interface TestSessionStateResponse {
  sessionId: string;
  tenantId: string;
  customerId: string | null;
  mode: string | null;
  status: string | null;
  currentFlowPosition: string | null;
  collectedVariables: Record<string, string> | null;
  messageCount: number;
  totalTokensUsed: number;
  lastActivityAt: string;
  history: TestChatMessage[] | null;
}

// ─── Local UI types (frontend-only) ───

export interface ChatBubble {
  id: string;
  role: 'user' | 'bot';
  text: string;
  buttons?: TestInteractiveItem[];
  listItems?: TestInteractiveItem[];
  products?: TestProductCard[];
  mediaUrl?: string | null;
  debug?: MessageDebugInfo;
  timestamp: string;
  /** Indicates this message was sent via voice input */
  isVoice?: boolean;
  /** Base64 TTS audio data for bot responses */
  audioData?: string | null;
  /** MIME type of the audio data */
  audioMimeType?: string | null;
}

export interface MessageDebugInfo {
  routingPath: string | null;
  matchedIntent: string | null;
  responseType: string | null;
  processingTimeMs: number;
  tokensUsed: number;
  conversationMode: string | null;
  currentFlowPosition: string | null;
  sessionStatus: string | null;
  collectedVariables: Record<string, string> | null;
}

export interface ScenarioPreset {
  label: string;
  description: string;
  messages: string[];
  icon: string;
  color: 'brand' | 'success' | 'info' | 'warning' | 'danger';
}

export type TestChannelSetupStatus = 'checking' | 'no-connection' | 'connecting' | 'ready' | 'error';
