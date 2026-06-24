// ═══════════════════════════════════════════════════════════════
// Agents Feature — Public API barrel
//
// Only exports things other features genuinely need to import.
// Pages and components are NOT re-exported because they're loaded
// via React Router's lazy() — direct imports would defeat code
// splitting.
// ═══════════════════════════════════════════════════════════════

// ── Inline card renderer (consumed by features/chat/pages/ChatPage.tsx) ──
export { AgentCreatedCardRenderer } from './components/AgentCreatedCard';

// ── Types (consumed by chat for the inline card payload shape) ──
export type {
  AgentCreatedCard,
  AgentTypeName,
  AgentTriggerKindName,
  AgentTargetKindName,
} from './types/agents.types';
