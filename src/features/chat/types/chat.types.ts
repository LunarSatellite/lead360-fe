// ═══════════════════════════════════════════════════════════════
// Chat Feature — Types (matches backend spec)
// Source: /api/v1/chat/* (ChatOrchestrationController)
// ═══════════════════════════════════════════════════════════════

// Numeric enums match backend DTO encoding exactly.
export enum ChatMessageRole {
  User = 0,
  Assistant = 1,
  Tool = 2,
  System = 3,
}
export enum ChatSessionMode {
  Onboarding = 0,
  Builder = 1,
}
export enum ChatSessionStatus {
  Active = 0,
  Archived = 1,
}

// ─── DTOs mirroring the backend ChatMessage / ChatSession ───
// Note: toolCallJson / toolResultJson / inlineCardJson are STRINGIFIED JSON
// on the wire. The hook is responsible for JSON.parse() before handing a
// parsed InlineCard to renderers.

export interface InlineCard {
  // Known card types we render explicitly. Unknown types fall through to a
  // generic "✓ {summary}" renderer — keeps the UI stable as backend adds
  // new cards without requiring a frontend release.
  type: string;
  [k: string]: unknown;
}

export interface ChatMessageDto {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  toolCallJson?: string | null;
  toolResultJson?: string | null;
  inlineCardJson?: string | null;
  createdAt: string;
  promptTokens?: number | null;
  completionTokens?: number | null;
  costUsd?: number | null;
}

export interface ChatSessionDto {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  status: ChatSessionStatus;
  mode: ChatSessionMode;
  lastActivityAt: string;
  createdAt: string;
  updatedAt?: string | null;
  scopedFlowId?: string | null;
  messageCount?: number;
  totalCostUsd?: number;
}

// ─── Request bodies ───

export interface CreateSessionRequest {
  title?: string;
  scopedFlowId?: string;
}

export interface SendMessageRequest {
  content: string;
  displayContent?: string;
}

// ─── SSE events ───
// Backend envelopes every event as { eventType, payload, timestamp }.
// The discriminated union below is the parsed payload, keyed by eventType.

export interface ToolCallStartedPayload {
  name: string;
  args: unknown;
}

export interface ToolCallCompletedPayload {
  name: string;
  success: boolean;
  result: {
    summary: string;
    requiresConfirmation: boolean;
    data: unknown;
    inlineCard: InlineCard | null;
  };
}

export interface AssistantTokensPayload {
  delta: string;
}

export type AssistantDonePayload = ChatMessageDto;

export interface ErrorPayload {
  message: string;
}

export interface IngestionProgressPayload {
  stage: string;
  message: string;
}

export type ChatStreamEvent =
  | { eventType: 'ToolCallStarted'; payload: ToolCallStartedPayload }
  | { eventType: 'ToolCallCompleted'; payload: ToolCallCompletedPayload }
  | { eventType: 'AssistantTokens'; payload: AssistantTokensPayload }
  | { eventType: 'AssistantDone'; payload: AssistantDonePayload }
  | { eventType: 'Error'; payload: ErrorPayload }
  | { eventType: 'IngestionProgress'; payload: IngestionProgressPayload };

// ─── Rate-limit error ───
// Thrown by sendMessageStream when backend returns HTTP 429. The chat page
// should show a countdown and disable send for retryAfterSeconds.

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Rate limited. Retry in ${retryAfterSeconds}s.`);
    this.name = 'RateLimitError';
  }
}

// ─── Quick-start options shown on empty chat ───

export interface QuickStart {
  id: string;
  title: string;
  subtitle: string;
  /** Text dropped into the composer when this option is picked. */
  promptText: string;
}

// ─── Session detail (GET /sessions/{id}) ───
// Same as ChatSessionDto but with the full message thread eager-loaded.

export interface ChatSessionDetailDto extends ChatSessionDto {
  messages: ChatMessageDto[];
}

// ─── Tool descriptor (GET /tools) ───

export interface ToolDescriptorDto {
  name: string;
  description: string;
  requiredRoles: string[];
}

// ─── Undo result (POST /sessions/{id}/undo) ───
// `undone: false` is NOT an error — it means the last action wasn't reversible.
// `summary` is user-facing copy written by the backend; show it verbatim.

export interface UndoResultDto {
  undone: boolean;
  summary: string | null;
  data?: unknown;
}

// ─── Activity feed (GET /activity) ───
// Tenant-wide list of mutating chat actions. Backend already filters out
// failed calls and read-only tools, so the client renders the list as-is.

export interface ChatActivityActorDto {
  userId: string; // Guid.Empty when CreatedBy was null
  name: string | null; // joined firstName + lastName
  email: string | null;
}

export interface ChatActivityItemDto {
  id: string;
  toolName: string;
  summary: string | null;
  success: boolean;
  durationMs: number;
  sessionId: string;
  sessionTitle: string | null;
  actor: ChatActivityActorDto;
  createdAt: string;
}

// ─── Cost-limit error sentinel ───
// The backend surfaces session/tenant cost limits as Error events with very
// specific message text. The chat page treats these specially (they're not
// retryable, the user must take action). Match prefixes, not full strings —
// the trailing $ amount may change.

export const COST_LIMIT_ERROR_PREFIXES = [
  'This session has exceeded the cost limit',
  'Your tenant has reached its daily chat-AI budget',
] as const;

export function isCostLimitError(message: string): boolean {
  return COST_LIMIT_ERROR_PREFIXES.some((p) => message.startsWith(p));
}

// ─── Onboarding interview (spec §7) ─────────────────────────────
// When session.mode === ChatSessionMode.Onboarding, the backend walks
// the business owner through a structured 8-section interview. The UI
// renders a sidebar + progress bar from these constants and from the
// progress line appended to every assistant message.

export interface OnboardingSection {
  n: number;
  title: string;
  subtitle: string;
}

export const ONBOARDING_SECTIONS: OnboardingSection[] = [
  { n: 1, title: 'About the Business', subtitle: 'What you do, who you serve, hours, location' },
  { n: 2, title: 'What Customers Ask', subtitle: 'Top questions + order/booking info needed' },
  { n: 3, title: 'Goals', subtitle: 'What the bot should achieve' },
  { n: 4, title: 'Conversation Flow', subtitle: 'Greeting, menu, info to collect, closing' },
  { n: 5, title: 'Rules & Limits', subtitle: 'Never-dos and human handoff' },
  { n: 6, title: 'Personality & Tone', subtitle: 'Voice, languages, emoji style' },
  { n: 7, title: 'Systems & Data', subtitle: 'APIs, spreadsheets, your existing tools' },
  { n: 8, title: 'Extras', subtitle: 'Policies, promotions, staff, anything else' },
];

export interface OnboardingProgress {
  currentSection: number; // 1..8
  answered: number; // 0 if not supplied by the model
  total: number; // 0 if not supplied
}

// Parser per spec §7. Matches "— Section 3/8 · 7/39 answered —" in full,
// or the shorter "— Section 3/8 —" fallback. Case-insensitive and tolerant
// of unicode em/en dashes vs hyphens (the LLM drifts).
const PROGRESS_RE = /[—–-]\s*Section\s+(\d+)\/8(?:\s*[·•]\s*(\d+)\/(\d+)\s*answered)?/i;

export function parseOnboardingProgress(content: string): OnboardingProgress | null {
  const m = content.match(PROGRESS_RE);
  if (!m) return null;
  return {
    currentSection: parseInt(m[1], 10),
    answered: m[2] ? parseInt(m[2], 10) : 0,
    total: m[3] ? parseInt(m[3], 10) : 0,
  };
}

// Strip the progress line from a message body so it can be rendered as
// chrome (progress bar) instead of inline text. Leaves the rest of the
// message untouched. Also handles the generic fallback line the backend
// injector appends when the LLM forgot to emit one.
//
// Defense-in-depth: also strips any XML fragments that leak through.
// After the emitTurn backend patch, onboarding replies arrive as clean
// text in `content` (the structured part lives in `inlineCardJson`).
// But two paths can still leak angle-bracket noise:
//   1. Builder-mode replies, which are free-form prose — if a future
//      prompt ever drifts and emits <something>, we want it gone.
//   2. Old DB rows written before the patch landed — they may contain
//      raw <turn>/<text>/<input>/<option>/<button>/<progress> fragments
//      from the legacy XML wrapper. Cleaning on read makes them render
//      normally without a backfill migration.
// We strip ONLY the wrapper-related tags. Everything else is left alone
// so a user typing about HTML in chat still works.
const LEGACY_TURN_TAGS_RE = /<\/?(?:turn|text|input|option|button|progress)\b[^>]*\/?>/gi;

export function stripProgressLine(content: string): string {
  const stripped = content
    .replace(LEGACY_TURN_TAGS_RE, '')
    .replace(PROGRESS_RE, '')
    .replace(/[—–-]\s*Onboarding interview in progress\s*[—–-]?/i, '')
    // Strip a trailing lone em-dash / en-dash / hyphen (with optional surrounding
    // whitespace) that the LLM sometimes leaves as a stub of the progress line.
    .replace(/\n+\s*[—–-]+\s*$/g, '')
    // Strip markdown bold/italic asterisks — the LLM occasionally uses **bold**
    // despite the system prompt asking for plain text, and we don't render
    // markdown in chat bubbles, so they'd show as literal asterisks.
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // If after stripping all that's left is one or two lone dash characters
  // (the LLM emitted just "—" as its whole reply), treat as empty so the
  // bubble doesn't render an artifact.
  if (/^[—–-]{1,3}$/.test(stripped)) return '';

  return stripped;
}

// ─── Onboarding accelerator (separate spec, §2) ─────────────────
// POST /api/v1/chat/sessions/{id}/documents — uploads PDF/DOCX, backend
// extracts business facts and appends a System-role note to the thread
// (in onboarding) or writes drafts directly (in builder). The result is
// returned on the same call. status="RateLimited" / "Failed" arrive
// inside a 200 response — they are NOT errors per §2; the UI shows the
// `message` field as a neutral system note and the interview continues.

export type DocumentUploadStatus = 'Completed' | 'Failed' | 'RateLimited' | 'ApiSpecParsed';

export interface DocumentUploadResultDto {
  ingestionId: string;
  fileName: string;
  format: 'pdf' | 'docx' | 'json' | 'yaml';
  status: DocumentUploadStatus;
  pagesParsed: number;
  businessName: string | null;
  businessDescription: string | null;
  hours: string | null;
  policies: string | null;
  productDraftCount: number;
  topicDraftCount: number;
  durationMs: number;
  summary: string | null;
  message: string | null;
}

// Inline cards from the new accelerator path (spec §5). Both share an
// "extraction drafts" shape; we keep them as separate type literals so
// the card renderer can switch on `type` without ambiguity. They render
// as informational previews — NO Apply/Save buttons (spec §5: "Keep it
// informational… nothing is committed until generateFlow").

export interface ExtractedBusiness {
  name?: string;
  description?: string;
  type?: string;
}

export interface WebsiteExtractionDraftsCard {
  type: 'WebsiteExtractionDrafts';
  ingestionId: string;
  url: string;
  pagesFetched: number;
  business: ExtractedBusiness | null;
  hours: string | null;
  policies: string | null;
  productCount: number;
  topicCount: number;
}

export interface DocumentExtractionDraftsCard {
  type: 'DocumentExtractionDrafts';
  ingestionId: string;
  fileName: string;
  format: 'pdf' | 'docx';
  pagesParsed: number;
  business: ExtractedBusiness | null;
  hours: string | null;
  policies: string | null;
  productCount: number;
  topicCount: number;
}

export interface ProposedMenuEndpoint {
  method: string;
  path: string;
}

export interface ProposedMenuTopic {
  name: string;
  description: string | null;
  endpoints: ProposedMenuEndpoint[];
}

// Shown right after a chat-uploaded API spec is parsed — Capability Map + Intent
// Suggestions already ran, this is the grouped result: one row per proposed bot
// menu topic with the exact endpoints backing it. Nothing is built yet — the
// owner still has to say "yes" or tweak it first.
export interface ProposedBotMenuCard {
  type: 'ProposedBotMenu';
  specId: string;
  specName: string;
  endpointCount: number;
  topics: ProposedMenuTopic[];
  reviewPath: string;
}

// ─── Typed input-control cards (spec: Inline UI Cards) ─────────────────────
// The backend attaches one of these to any assistant message to collect
// structured input from the user. The frontend renders the right control and
// sends the user's answer back as a normal chat message.

export interface OptionItem {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface RadioCard {
  type: 'Radio';
  questionId: string;
  options: OptionItem[];
  allowOther?: boolean;
}

export interface DropdownCard {
  type: 'Dropdown';
  questionId: string;
  options: OptionItem[];
  placeholder?: string;
  allowOther?: boolean;
}

export interface MultiSelectCard {
  type: 'MultiSelect';
  questionId: string;
  options: OptionItem[];
  minSelections?: number;
  maxSelections?: number;
}

export interface SliderCard {
  type: 'Slider';
  questionId: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export interface DateCard {
  type: 'Date';
  questionId: string;
  minDate?: string;
  maxDate?: string;
}

export interface ButtonRowCard {
  type: 'ButtonRow';
  questionId?: string;
  buttons: {
    value: string;
    label: string;
    style: 'primary' | 'secondary' | 'ghost' | 'danger';
  }[];
}

export interface FreeTextCard {
  type: 'FreeText';
  questionId: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}

export type InputCardVariant =
  | FreeTextCard
  | RadioCard
  | DropdownCard
  | MultiSelectCard
  | SliderCard
  | DateCard
  | ButtonRowCard;

// Client-side validation thresholds (spec §2 / §8 / §9). Centralised so
// the file-picker accept attribute and the runtime guard agree.
export const ACCELERATOR_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCELERATOR_ACCEPT = '.pdf,.docx,.txt,.md,.csv,.json';
export const ACCELERATOR_EXTENSIONS = ['pdf', 'docx', 'txt', 'md', 'csv', 'json'] as const;

type AcceleratorExt = (typeof ACCELERATOR_EXTENSIONS)[number];

// Convenience guard reused by the upload caller. Returns null when the
// file is acceptable, or a user-facing message describing the rejection.
export function validateAcceleratorFile(file: File): string | null {
  if (file.size === 0) return 'That file looks empty. Try again.';
  if (file.size > ACCELERATOR_MAX_BYTES) {
    return 'File too large — max 10 MB.';
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ACCELERATOR_EXTENSIONS.includes(ext as AcceleratorExt)) {
    return 'Supported formats: PDF, DOCX, TXT, MD, CSV, JSON.';
  }
  return null;
}
