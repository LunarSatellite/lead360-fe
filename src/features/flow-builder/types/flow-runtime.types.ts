// ═══════════════════════════════════════════════════════════════
// Flow Runtime — Types (matches backend FlowRuntimeController)
// ═══════════════════════════════════════════════════════════════

export const FlowRuntimeStatus = {
  Response: 1,
  CollectingParams: 2,
  Greeting: 3,
  AgentHandoff: 4,
  NoActiveFlow: 5,
  Error: 6,
} as const;
export type FlowRuntimeStatusValue = (typeof FlowRuntimeStatus)[keyof typeof FlowRuntimeStatus];

export interface FlowMessageRequest {
  SessionId: string;
  Message: string;
  /** Human-readable button label sent alongside the value for CRM topic detection. */
  ButtonLabel?: string;
}

export interface FlowMenuItemDto {
  label: string;
  value: string;
  icon?: string;
  /** Subtitle shown in WhatsApp list rows (price, item count, etc.) */
  description?: string;
  /** Section header for grouping in WhatsApp list messages */
  section?: string;
  intentId?: string;
  hasSubMenu: boolean;
}

export interface FlowApiCallResult {
  success: boolean;
  statusCode: number;
  formattedResponse?: string;
  error?: string;
  responseTimeMs: number;
}

export interface FlowRuntimeResult {
  status: FlowRuntimeStatusValue;
  response: string;
  menuItems?: FlowMenuItemDto[];
  /** Header image URL — used for catalog item detail with photo */
  imageUrl?: string;
  /** Product cards sent before the main list (e.g. top-3 items with Order/View buttons) */
  additionalMessages?: FlowRuntimeResult[];
  currentNodeKey?: string;
  nodeType?: string;
  intentName?: string;
  intentId?: string;
  intentConfidence: number;
  slotPrompt?: string;
  apiCall?: FlowApiCallResult;
  flowPath: string[];
  totalTimeMs: number;
  /** Human-readable label for the user's message — replaces raw cat:/item:/order: values in the chat bubble. */
  userMessageDisplay?: string;
}
