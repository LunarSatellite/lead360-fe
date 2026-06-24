// ═══════════════════════════════════════════════════════════════
// Agents Feature — Zod schemas (form validation)
// Used by:
//   - Editor modal (Slice 2): createAgentSchema / updateAgentSchema
//   - Approval landing page (Slice 1): respondSchema (note only;
//     decision + token come from the URL, not a form)
//   - Run detail drawer (Slice 3): cancelRunSchema, overrideRespondSchema
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import {
  AgentType,
  AgentTriggerKind,
  AgentTargetKind,
  ApprovalDecision,
} from './agents.types';

// ─── Helpers ───────────────────────────────────────────────────

// Coerces string|number into one of the numeric enum values. Useful
// because <select> elements deliver strings even when the option
// values are typed as numbers.
function enumValue<T extends number>(values: readonly T[]) {
  return z.coerce
    .number()
    .int()
    .refine((n): n is T => (values as readonly number[]).includes(n), {
      message: 'Invalid selection',
    });
}

const agentTypeSchema = enumValue([
  AgentType.Approval,
  AgentType.Notification,
  AgentType.Escalation,
  AgentType.DataCollection,
  AgentType.Reminder,
  AgentType.Fulfillment,
] as const);

const triggerKindSchema = enumValue([
  AgentTriggerKind.Manual,
  AgentTriggerKind.IntentMatched,
  AgentTriggerKind.FlowNodeReached,
  AgentTriggerKind.CustomerReply,
  AgentTriggerKind.Threshold,
  AgentTriggerKind.Scheduled,
] as const);

const targetKindSchema = enumValue([
  AgentTargetKind.User,
  AgentTargetKind.Role,
  AgentTargetKind.Email,
  AgentTargetKind.Webhook,
  AgentTargetKind.Channel,
] as const);

const decisionSchema = enumValue([
  ApprovalDecision.Approved,
  ApprovalDecision.Rejected,
] as const);

// Treat empty string as "not provided" so optional fields don't fail.
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v));

// JSON sanity check — the editor's "advanced" textareas accept raw JSON.
// Allow empty (the backend treats null/empty as "no payload").
const optionalJson = z
  .string()
  .trim()
  .optional()
  .refine(
    (v) => {
      if (!v) return true;
      try {
        JSON.parse(v);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Must be valid JSON.' },
  )
  .transform((v) => (v === '' ? undefined : v));

// ─── Create agent ──────────────────────────────────────────────

export const createAgentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be 80 characters or fewer.'),
  description: optionalString.pipe(z.string().max(500).optional()),
  botId: optionalString,
  agentType: agentTypeSchema,
  triggerKind: triggerKindSchema,
  triggerJson: optionalJson,
  targetKind: targetKindSchema,
  targetRef: optionalString,
  configJson: optionalJson,
  enabled: z.boolean().default(true),
});

export type CreateAgentFormData = z.infer<typeof createAgentSchema>;

// ─── Update agent ──────────────────────────────────────────────

export const updateAgentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be 80 characters or fewer.')
    .optional(),
  description: optionalString.pipe(z.string().max(500).optional()),
  triggerKind: triggerKindSchema.optional(),
  triggerJson: optionalJson,
  targetKind: targetKindSchema.optional(),
  targetRef: optionalString,
  configJson: optionalJson,
  enabled: z.boolean().optional(),
});

export type UpdateAgentFormData = z.infer<typeof updateAgentSchema>;

// ─── Respond to a run — approver path (token from URL) ─────────
// Used by the approval landing page. The approver only writes an
// optional note; decision + token come from the URL, not the form.

export const approverRespondSchema = z.object({
  note: optionalString.pipe(z.string().max(1000).optional()),
});

export type ApproverRespondFormData = z.infer<typeof approverRespondSchema>;

// ─── Respond to a run — admin override path (no token) ─────────
// Used by the run detail drawer in Slice 3. Admin must pick a
// decision explicitly and is encouraged to leave a note.

export const overrideRespondSchema = z.object({
  decision: decisionSchema,
  note: optionalString.pipe(z.string().max(1000).optional()),
});

export type OverrideRespondFormData = z.infer<typeof overrideRespondSchema>;

// ─── Cancel a run ──────────────────────────────────────────────

export const cancelRunSchema = z.object({
  reason: optionalString.pipe(z.string().max(500).optional()),
});

export type CancelRunFormData = z.infer<typeof cancelRunSchema>;

// ─── Fire an agent manually ────────────────────────────────────

export const fireAgentSchema = z.object({
  sessionId: optionalString,
  summary: z
    .string()
    .trim()
    .max(200, 'Summary must be 200 characters or fewer.')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  triggerPayloadJson: optionalJson,
  expiresInHours: z.coerce
    .number()
    .int()
    .positive()
    .max(720, 'Up to 30 days (720 hours).')
    .optional(),
});

export type FireAgentFormData = z.infer<typeof fireAgentSchema>;
