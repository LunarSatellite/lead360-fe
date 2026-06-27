import {
  useState, useCallback, useContext, useMemo, createContext, useRef,
} from 'react';
import { useUsers } from '@/features/auth/api/auth.queries';
import { createPortal } from 'react-dom';
import {
  ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState,
  addEdge, Handle, Position, MarkerType,
  type NodeProps, type Node, type Edge,
  type OnNodesChange, type OnEdgesChange, type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Plus, X, Loader2, ArrowLeft, Save, Settings,
  ToggleLeft, ToggleRight, Activity, Trash2, Play,
  Zap, CheckSquare, Globe, GitBranch,
  Clock, ThumbsUp, CircleDot, AlertCircle, CheckCircle2,
  ChevronRight, Search, Brain, Send, Sparkles,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  useWorkflows, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow,
  useRunWorkflow, useWorkflowExecutions, useGenerateWorkflow, useChatWorkflow,
  useDealStages, useNurtureSequences, useWorkflowTriggerDefinitions,
} from '../api/crm.queries';
import { useProcessDefinitions } from '../api/process-workflow.queries';
import type { ProcessDefinitionDto } from '../types/process-workflow.types';
import type {
  CrmWorkflowSummaryDto, CrmWorkflowCreateRequest, CrmWorkflowUpdateRequest,
  CrmWorkflowStepRequest, CrmDealStageSummaryDto, NurtureSequenceDto,
} from '../types/crm.types';
import type { UserDto } from '@/features/auth/types/auth.types';
import {
  CrmWorkflowTriggerType, CrmWorkflowActionType,
  CRM_WORKFLOW_TRIGGER_LABELS, CRM_WORKFLOW_ACTION_LABELS,
  CRM_WORKFLOW_EXECUTION_STATUS_LABELS,
} from '../types/crm.types';

// ── Canvas CSS — cleaner n8n-inspired style ────────────────────────────────────
const CANVAS_CSS = `
.crm-wf .react-flow__edge-path { stroke: #3A5A4C; stroke-width: 1.5; fill: none; }
.crm-wf .react-flow__edge.animated .react-flow__edge-path { stroke-dasharray: 6; animation: dashmove 0.8s linear infinite; }
.crm-wf .react-flow__edge.selected .react-flow__edge-path { stroke: #00FFA3; stroke-width: 2; }
.crm-wf .react-flow__connectionline { stroke: #00FFA3; stroke-width: 1.5; stroke-dasharray: 6 4; }
@keyframes dashmove { to { stroke-dashoffset: -12; } }
@keyframes nodeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
.crm-wf .react-flow__node { animation: nodeIn 150ms ease-out; }
.crm-wf .react-flow__handle { opacity: 0; transition: opacity 120ms; width: 8px !important; height: 8px !important; border: 2px solid #0A0F0D !important; }
.crm-wf .react-flow__node:hover .react-flow__handle,
.crm-wf .react-flow__node.selected .react-flow__handle { opacity: 1; }
.crm-wf .react-flow__handle:hover { opacity: 1 !important; }
.crm-wf .react-flow__controls { box-shadow: none !important; }
.crm-wf .react-flow__controls-button {
  background: var(--bg-shell, #0F1E1A) !important; border: 1px solid #14302A !important;
  color: #7A9B8E !important; border-radius: 6px !important; margin-bottom: 2px; width: 28px; height: 28px;
}
.crm-wf .react-flow__controls-button:hover { background: #1A332C !important; color: #00D98A !important; }
.crm-wf .wf-edge-add { opacity: 0; transition: opacity 150ms; pointer-events: all; }
.crm-wf .react-flow__edge:hover .wf-edge-add { opacity: 1; }
.react-flow__edge-label { font-size: 10px; font-weight: 700; pointer-events: none; }
`;

// ── Node catalogue ────────────────────────────────────────────────────────────
type NodeKind = 'trigger' | 'action' | 'condition' | 'delay' | 'end' | 'ai' | 'api';
type IconT = React.ComponentType<{ className?: string; strokeWidth?: number }>;

type PaletteItem = {
  subtype: string; label: string; hint: string; Icon: IconT;
  kind: NodeKind; border: string; headerBorder: string; iconBg: string; iconText: string;
  handleColor: string;
};

const PALETTE_GROUPS: { category: string; items: PaletteItem[] }[] = [
  {
    category: 'Triggers',
    items: [
      { subtype: 'trigger', label: 'Trigger', hint: 'Starts the workflow', Icon: Zap, kind: 'trigger', border: 'border-blue-700', headerBorder: 'border-blue-800', iconBg: 'bg-blue-950', iconText: 'text-blue-400', handleColor: '#3B82F6' },
    ],
  },
  {
    category: 'Actions',
    items: [
      { subtype: 'action', label: 'Action', hint: 'Perform a CRM action', Icon: CheckSquare, kind: 'action', border: 'border-emerald-700', headerBorder: 'border-emerald-800', iconBg: 'bg-emerald-950', iconText: 'text-emerald-400', handleColor: '#10B981' },
    ],
  },
  {
    category: 'Conditions',
    items: [
      { subtype: 'condition', label: 'Condition', hint: 'Branch the workflow', Icon: GitBranch, kind: 'condition', border: 'border-amber-700', headerBorder: 'border-amber-800', iconBg: 'bg-amber-950', iconText: 'text-amber-400', handleColor: '#D97706' },
    ],
  },
  {
    category: 'AI',
    items: [
      { subtype: 'ai', label: 'AI', hint: 'AI-powered processing', Icon: Brain, kind: 'ai', border: 'border-purple-700', headerBorder: 'border-purple-800', iconBg: 'bg-purple-950', iconText: 'text-purple-400', handleColor: '#7C3AED' },
    ],
  },
  {
    category: 'API',
    items: [
      { subtype: 'api', label: 'API', hint: 'Call an external endpoint', Icon: Globe, kind: 'api', border: 'border-cyan-700', headerBorder: 'border-cyan-800', iconBg: 'bg-cyan-950', iconText: 'text-cyan-400', handleColor: '#0891B2' },
    ],
  },
  {
    category: 'Flow Controls',
    items: [
      { subtype: 'wait',     label: 'Wait / Delay', hint: 'Pause N minutes',   Icon: Clock,      kind: 'delay', border: 'border-purple-700',    headerBorder: 'border-purple-800',    iconBg: 'bg-purple-950',    iconText: 'text-purple-400',    handleColor: '#7C3AED' },
      { subtype: 'approval', label: 'Approval',     hint: 'Wait for approval', Icon: ThumbsUp,   kind: 'delay', border: 'border-purple-700',    headerBorder: 'border-purple-800',    iconBg: 'bg-purple-950',    iconText: 'text-purple-400',    handleColor: '#7C3AED' },
      { subtype: 'end',      label: 'End Workflow', hint: 'Finish here',       Icon: CircleDot,  kind: 'end',   border: 'border-border-medium', headerBorder: 'border-border-subtle', iconBg: 'bg-bg-elevated',   iconText: 'text-text-muted',    handleColor: '#4A5C52' },
    ],
  },
];

// Flat lookup by subtype
const META: Record<string, PaletteItem> = {};
PALETTE_GROUPS.forEach((g) => g.items.forEach((item) => { META[item.subtype] = item; }));

// ── Type mappings (fixed) ─────────────────────────────────────────────────────
const SUBTYPE_TO_TRIGGER: Record<string, CrmWorkflowTriggerType> = {
  lead_created:    CrmWorkflowTriggerType.LeadScoreThreshold,
  contact_created: CrmWorkflowTriggerType.FunnelStageChanged,
  deal_updated:    CrmWorkflowTriggerType.DealStageChanged,
  ticket_created:  CrmWorkflowTriggerType.SupportCaseCreated,
  form_submitted:  CrmWorkflowTriggerType.Manual,
  custom_event:    CrmWorkflowTriggerType.Manual,
  lead_score:      CrmWorkflowTriggerType.LeadScoreThreshold,
};
const TRIGGER_TO_SUBTYPE: Record<number, string> = {
  [CrmWorkflowTriggerType.FunnelStageChanged]:  'contact_created',
  [CrmWorkflowTriggerType.DealStageChanged]:    'deal_updated',
  [CrmWorkflowTriggerType.SupportCaseCreated]:  'ticket_created',
  [CrmWorkflowTriggerType.SupportCaseEscalated]:'ticket_created',
  [CrmWorkflowTriggerType.LeadScoreThreshold]:  'lead_score',
  [CrmWorkflowTriggerType.TaskDueSoon]:         'custom_event',
  [CrmWorkflowTriggerType.Manual]:              'custom_event',
};
const SUBTYPE_TO_ACTION: Record<string, CrmWorkflowActionType> = {
  send_email:    CrmWorkflowActionType.SendEmail,
  send_sms:      CrmWorkflowActionType.SendNotification,
  create_task:   CrmWorkflowActionType.CreateTask,
  update_record: CrmWorkflowActionType.UpdateFunnelStage,
  assign_owner:  CrmWorkflowActionType.AssignToUser,
  create_note:   CrmWorkflowActionType.CreateTask,
  create_ticket: CrmWorkflowActionType.CreateTask,
  webhook:       CrmWorkflowActionType.SendNotification,
};
const ACTION_TO_SUBTYPE: Record<number, string> = {
  [CrmWorkflowActionType.CreateTask]:        'create_task',
  [CrmWorkflowActionType.SendNotification]:  'notify',
  [CrmWorkflowActionType.UpdateFunnelStage]: 'update_record',
  [CrmWorkflowActionType.AssignToUser]:      'assign_owner',
  [CrmWorkflowActionType.CreateNurtureEntry]:'create_task',
  [CrmWorkflowActionType.SendEmail]:         'send_email',
};

// ── Validation ────────────────────────────────────────────────────────────────
function validateNode(node: Node): string[] {
  const sub = node.data.subtype as string;
  const cfg = (node.data.config as Record<string, string>) ?? {};
  const errors: string[] = [];
  if (['send_email', 'send_sms'].includes(sub) && !cfg.value) errors.push('Message body is required');
  if (sub === 'webhook' && !cfg.url) errors.push('Endpoint URL is required');
  if (['if_else', 'lead_score', 'status_check', 'field_comparison'].includes(sub)) {
    if (!cfg.field) errors.push('Field name is required');
    if (!cfg.value) errors.push('Comparison value is required');
  }
  if (sub === 'assign_owner' && !cfg.value) errors.push('Team member is required');
  if (sub === 'update_record' && !cfg.field) errors.push('Field to update is required');
  // AI nodes
  if (node.type === 'ai' && !cfg.prompt && sub !== 'ai_classify') errors.push('AI instructions are required');
  if (sub === 'ai_classify' && !cfg.categories) errors.push('Categories are required');
  // API nodes
  if (node.type === 'api' && !cfg.url) errors.push('Endpoint URL is required');
  return errors;
}

// ── Builder context ───────────────────────────────────────────────────────────
interface ICtx {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  getErrors: (id: string) => string[];
  onInsertAfterEdge: (edgeId: string, x: number, y: number) => void;
}
const Ctx = createContext<ICtx>({ selectedId: null, onSelect: () => {}, onDelete: () => {}, getErrors: () => [], onInsertAfterEdge: () => {} });

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM NODES — all module-level, flow-builder visual style
// ═══════════════════════════════════════════════════════════════════════════════

function NodeIssuePill({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 px-2 py-[3px] rounded-full text-[10px] font-bold bg-red-500 text-white z-20 whitespace-nowrap">
      ● Needs setup
    </div>
  );
}

function NodeCard({ id, meta, children, sourceHandles = 1 }: {
  id: string; meta: PaletteItem; children: React.ReactNode; sourceHandles?: 1 | 2;
}) {
  const { selectedId, onSelect, getErrors } = useContext(Ctx);
  const sel = selectedId === id;
  const errors = getErrors(id);
  const hasError = errors.length > 0;
  return (
    <div className="relative" onClick={() => onSelect(id)} style={{ paddingTop: hasError ? 20 : 0 }}>
      <NodeIssuePill errors={errors} />
      <Handle type="target" position={Position.Top} style={{ background: meta.handleColor }} />
      <div
        className={`w-[170px] bg-bg-card rounded-lg border hover:brightness-110 transition-all cursor-pointer select-none overflow-hidden ${hasError ? 'border-red-500' : sel ? 'border-brand' : 'border-border-subtle'}`}
        style={{ boxShadow: sel ? '0 0 0 1.5px rgba(0,217,138,0.25)' : '0 2px 8px rgba(0,0,0,0.25)' }}
      >
        {/* Left accent strip */}
        <div className="flex">
          <div className="w-[3px] shrink-0" style={{ background: hasError ? '#EF4444' : meta.handleColor }} />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
      {sourceHandles === 1 && (
        <Handle type="source" position={Position.Bottom} style={{ background: meta.handleColor }} />
      )}
      {sourceHandles === 2 && (
        <>
          <Handle id="true" type="source" position={Position.Bottom}
            style={{ bottom: -5, left: '28%', background: '#22C55E' }} />
          <Handle id="false" type="source" position={Position.Bottom}
            style={{ bottom: -5, left: '72%', background: '#EF4444' }} />
        </>
      )}
    </div>
  );
}

function NodeHeader({ meta, label, badge }: { meta: PaletteItem; label: string; badge?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-2">
      <div className={`w-[18px] h-[18px] rounded flex items-center justify-center shrink-0 ${meta.iconBg}`}>
        <meta.Icon className={`w-2.5 h-2.5 ${meta.iconText}`} strokeWidth={2.5} />
      </div>
      <span className="text-[11px] font-semibold text-text-primary truncate leading-tight">{label}</span>
      {badge && (
        <span className={`ml-auto px-1 py-[1px] rounded text-[9px] font-medium ${meta.iconBg} ${meta.iconText}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

function TriggerNode({ id, data }: NodeProps) {
  const meta = META[data.subtype as string] ?? META['trigger'];
  const desc = (data.config as Record<string, string>)?.description ?? '';
  return (
    <NodeCard id={id} meta={meta}>
      <NodeHeader meta={meta} label={(data.label as string) || 'Trigger'} />
      {desc && <div className="px-2.5 pb-2"><p className="text-[9px] text-text-secondary leading-snug line-clamp-2">{desc}</p></div>}
    </NodeCard>
  );
}

function ActionNode({ id, data }: NodeProps) {
  const meta = META[data.subtype as string] ?? META['action'];
  const cfg = (data.config as Record<string, string>) ?? {};
  const desc = cfg.description ?? '';
  const actionType = cfg.actionType ?? '';
  return (
    <NodeCard id={id} meta={meta}>
      <NodeHeader meta={meta} label={(data.label as string) || 'Action'} />
      {desc ? (
        <div className="px-2.5 pb-2"><p className="text-[9px] text-text-secondary leading-snug line-clamp-2">{desc}</p></div>
      ) : actionType ? (
        <div className="px-2.5 pb-2"><span className="px-1 py-[1px] rounded bg-emerald-950 text-emerald-400 text-[8px] font-medium">{actionType}</span></div>
      ) : null}
    </NodeCard>
  );
}

function ConditionNode({ id, data }: NodeProps) {
  const meta = META[data.subtype as string] ?? META['condition'];
  const cfg = (data.config as Record<string, string>) ?? {};
  const desc = cfg.description ?? '';
  const condType = cfg.conditionType ?? '';
  return (
    <NodeCard id={id} meta={meta} sourceHandles={2}>
      <NodeHeader meta={meta} label={(data.label as string) || 'Condition'} badge={condType || 'Branch'} />
      {desc && <div className="px-2.5 pb-2"><p className="text-[9px] text-text-secondary leading-snug line-clamp-2">{desc}</p></div>}
    </NodeCard>
  );
}

function DelayNode({ id, data }: NodeProps) {
  const meta = META[data.subtype as string] ?? META['wait'];
  const cfg = (data.config as Record<string, string>) ?? {};
  const mins = cfg.delayMinutes ?? '';
  return (
    <NodeCard id={id} meta={meta}>
      <NodeHeader meta={meta} label={(data.label as string) || meta.label} />
      {(data.subtype as string) === 'wait' && mins && Number(mins) > 0 ? (
        <div className="px-2.5 pb-2"><p className="text-[9px] text-purple-400">{mins} min</p></div>
      ) : null}
    </NodeCard>
  );
}

const TRIGGER_BADGE_COLORS: Record<number, string> = {
  1: 'bg-brand-soft text-brand border-border-glow',
  2: 'bg-success-soft text-success border-[rgba(34,197,94,0.2)]',
  3: 'bg-bg-elevated text-text-secondary border-border-subtle',
  4: 'bg-danger-soft text-danger border-[rgba(244,63,94,0.2)]',
  5: 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.2)]',
  6: 'bg-bg-elevated text-text-muted border-border-subtle',
  7: 'bg-bg-card text-text-muted border-border-subtle',
};
const EXEC_STATUS_COLORS: Record<number, string> = {
  1: 'bg-bg-elevated text-text-secondary border-border-subtle',
  2: 'bg-brand-soft text-brand border-border-glow',
  3: 'bg-success-soft text-success border-[rgba(34,197,94,0.2)]',
  4: 'bg-danger-soft text-danger border-[rgba(244,63,94,0.2)]',
  5: 'bg-bg-elevated text-text-muted border-border-subtle',
};

const CONDITION_HINTS: Partial<Record<CrmWorkflowTriggerType, string>> = {
  [CrmWorkflowTriggerType.FunnelStageChanged]: '{"toStage":"Hot"} — fire only when stage reaches this value',
  [CrmWorkflowTriggerType.DealStageChanged]: '{"toStage":"Closed Won"} — optional stage filter',
  [CrmWorkflowTriggerType.LeadScoreThreshold]: '{"threshold":80} — fires once when score crosses this number',
};

const ACTION_CONFIG_HINTS: Partial<Record<CrmWorkflowActionType, string>> = {
  [CrmWorkflowActionType.AssignToUser]: '{"userId":"<user-guid>"}',
  [CrmWorkflowActionType.CreateTask]: '{"title":"Follow up","description":"...","priority":"High"}',
  [CrmWorkflowActionType.SendNotification]: '{"title":"Alert","body":"...","userId":"<user-guid or omit for all>"}',
  [CrmWorkflowActionType.UpdateFunnelStage]: '{"newStage":"Qualified"}',
  [CrmWorkflowActionType.CreateNurtureEntry]: '{"sequenceId":"<sequence-guid>"}',
};

const EMPTY_STEP = (): CrmWorkflowStepRequest => ({ stepOrder: 1, actionType: 'create_task', actionConfigJson: '{}', delayMinutes: 0 });

// ── Missing node components ────────────────────────────────────────────────────
function AiNode({ id, data }: NodeProps) {
  const desc = (data.config as Record<string, string>)?.description;
  return (
    <NodeCard id={id} meta={META[(data.subtype as string)] ?? META['ai']}>
      <NodeHeader meta={META[(data.subtype as string)] ?? META['ai']} label={(data.label as string) || 'AI'} />
      {desc && <div className="px-2.5 pb-2"><p className="text-[9px] text-text-secondary leading-snug line-clamp-2">{desc}</p></div>}
    </NodeCard>
  );
}

function ApiNode({ id, data }: NodeProps) {
  const desc = (data.config as Record<string, string>)?.description;
  return (
    <NodeCard id={id} meta={META[(data.subtype as string)] ?? META['api']}>
      <NodeHeader meta={META[(data.subtype as string)] ?? META['api']} label={(data.label as string) || 'API'} />
      {desc && <div className="px-2.5 pb-2"><p className="text-[9px] text-text-secondary leading-snug line-clamp-2">{desc}</p></div>}
    </NodeCard>
  );
}

function EndNode({ id, data }: NodeProps) {
  return (
    <NodeCard id={id} meta={META['end']}>
      <NodeHeader meta={META['end']} label={(data.label as string) || 'End'} />
    </NodeCard>
  );
}

const nodeTypes = { trigger: TriggerNode, action: ActionNode, condition: ConditionNode, delay: DelayNode, ai: AiNode, api: ApiNode, end: EndNode };
const edgeTypes = {};
const MARKER_END = { type: MarkerType.ArrowClosed, color: '#3A5A4C', width: 12, height: 12 };
const DEFAULT_EDGE_OPTS = { type: 'default', animated: false, style: { stroke: '#3A5A4C', strokeWidth: 1.5 }, markerEnd: MARKER_END };

// ── Graph utilities ────────────────────────────────────────────────────────────
function makeEdge(source: string, target: string, sourceHandle?: string, label?: string): Edge {
  const e: Edge = { id: `e-${source}-${target}`, source, target, sourceHandle, type: 'default', markerEnd: MARKER_END, style: { stroke: '#3A5A4C', strokeWidth: 1.5 } };
  if (label) {
    e.label = label;
    e.labelStyle = { fill: sourceHandle === 'true' ? '#22C55E' : '#EF4444', fontWeight: 700, fontSize: 10 };
    e.labelBgStyle = { fill: '#0A0F0D', fillOpacity: 0.85 };
    e.labelBgPadding = [4, 2];
    e.labelBgBorderRadius = 4;
  }
  return e;
}

function autoLayout(nodes: Node[], edges: Edge[]): Node[] {
  const childrenOf = new Map<string, { id: string; handle?: string }[]>();
  for (const e of edges) {
    const list = childrenOf.get(e.source) ?? [];
    list.push({ id: e.target, handle: e.sourceHandle ?? undefined });
    childrenOf.set(e.source, list);
  }
  const pos = new Map<string, { x: number; y: number }>();
  function walk(id: string, depth: number, xOffset: number): void {
    if (pos.has(id)) return;
    const y = pos.size * 110 + 20;
    pos.set(id, { x: depth * 240 + xOffset, y });
    const kids = childrenOf.get(id) ?? [];
    const trueKid = kids.find((k) => k.handle === 'true');
    const falseKid = kids.find((k) => k.handle === 'false');
    const linearKids = kids.filter((k) => k.handle === undefined || (k.handle !== 'true' && k.handle !== 'false'));
    if (trueKid) walk(trueKid.id, depth + 1, xOffset - 120);
    if (falseKid) walk(falseKid.id, depth + 1, xOffset + 120);
    for (const k of linearKids) walk(k.id, depth + 1, xOffset);
  }
  const start = nodes.find((n) => !edges.some((e) => e.target === n.id))?.id ?? nodes[0]?.id;
  if (start) walk(start, 0, 0);
  return nodes.map((n) => {
    const p = pos.get(n.id);
    return { ...n, position: p ?? n.position };
  });
}

// triggerType → the dot-notation API string the backend stores and matches against.
const TRIGGER_TO_API: Record<number, string> = {
  [CrmWorkflowTriggerType.DealStageChanged]:    'deal.stage_changed',
  [CrmWorkflowTriggerType.FunnelStageChanged]:  'funnel.stage_changed',
  [CrmWorkflowTriggerType.LeadScoreThreshold]:  'lead.score_threshold',
  [CrmWorkflowTriggerType.SupportCaseCreated]:  'support_case.created',
  [CrmWorkflowTriggerType.SupportCaseEscalated]:'support_case.escalated',
  [CrmWorkflowTriggerType.TaskDueSoon]:         'task.due_soon',
  [CrmWorkflowTriggerType.AgentHandoffRequested]:'agent.handoff_requested',
  [CrmWorkflowTriggerType.Manual]:              'manual',
  [CrmWorkflowTriggerType.LeadReEngaged]:       'lead.re_engaged',
};

const API_TO_TRIGGER: Record<string, CrmWorkflowTriggerType> = Object.fromEntries(
  Object.entries(TRIGGER_TO_API).map(([k, v]) => [v, Number(k) as CrmWorkflowTriggerType])
);

function stepsToGraph(steps: Array<CrmWorkflowStepRequest | { id?: string; stepOrder: number; actionType: string; actionConfigJson?: string | null; delayMinutes?: number }> | undefined, triggerType: CrmWorkflowTriggerType | string, conditionsJson = ''): { nodes: Node[]; edges: Edge[] } {
  // Preserve the dot-notation string directly; only fall back to numeric→string mapping when given a numeric enum.
  const apiTriggerType: string = typeof triggerType === 'string' ? triggerType : (TRIGGER_TO_API[triggerType] ?? 'manual');
  const nodes: Node[] = [
    { id: 'node-trigger', type: 'trigger', position: { x: 0, y: 0 }, data: { subtype: 'trigger', label: 'Trigger', config: { apiTriggerType, conditionsJson } } },
    { id: 'node-end', type: 'end', position: { x: 0, y: 240 }, data: { subtype: 'end', label: 'End' } },
  ];
  const edges: Edge[] = [];
  if (steps && steps.length > 0) {
    let prevId = 'node-trigger';
    steps.forEach((s, i) => {
      const id = `node-step-${i}`;
      // Carry the form's real action type + config JSON so the save round-trips it.
      nodes.push({ id, type: 'action', position: { x: 0, y: (i + 1) * 120 }, data: { subtype: 'action', label: `Step ${i + 1}`, config: { apiActionType: String(s.actionType), apiConfigJson: s.actionConfigJson ?? '' } } });
      edges.push(makeEdge(prevId, id));
      prevId = id;
    });
    if (prevId !== 'node-end') edges.push(makeEdge(prevId, 'node-end'));
  }
  return { nodes, edges };
}

function graphToSteps(nodes: Node[], edges: Edge[]): CrmWorkflowStepRequest[] {
  const sorted = nodes.filter((n) => n.type !== 'trigger' && n.type !== 'end');
  return sorted.map((n, i) => {
    const cfg = (n.data.config as Record<string, any>) ?? {};
    // Form-built nodes carry apiActionType/apiConfigJson; canvas-configured nodes carry actionType.
    if (cfg.apiActionType != null) {
      return {
        stepOrder: i + 1,
        actionType: String(cfg.apiActionType),
        actionConfigJson: (cfg.apiConfigJson as string) ?? '{}',
        delayMinutes: 0,
      };
    }
    if (cfg.actionType != null) {
      // Build config JSON from canvas-set fields, excluding UI-only keys
      const { actionType: _at, description: _d, ...rest } = cfg;
      return {
        stepOrder: i + 1,
        actionType: String(cfg.actionType),
        actionConfigJson: Object.keys(rest).length ? JSON.stringify(rest) : '{}',
        delayMinutes: 0,
      };
    }
    return {
      stepOrder: i + 1,
      actionType: 'create_task',
      actionConfigJson: JSON.stringify(cfg),
      delayMinutes: 0,
    };
  });
}

// ── Floating Palette ───────────────────────────────────────────────────────────
type InsertTarget = { edgeId: string; x: number; y: number } | null;

function FloatingPalette() {
  const [q, setQ] = useState('');
  const allItems = PALETTE_GROUPS.flatMap((g) => g.items);
  const visible = q ? allItems.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())) : allItems;

  return (
    <div
      className="absolute left-4 top-3 z-10 w-[148px] bg-bg-shell rounded-xl flex flex-col overflow-hidden"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)', border: '1px solid #14302A', maxHeight: 'calc(100% - 24px)' }}
    >
      <div className="px-3 pt-3 pb-2 shrink-0">
        <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-2">Drag to canvas</p>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bg border border-border-subtle">
          <Search className="w-2.5 h-2.5 text-text-muted shrink-0" strokeWidth={2} />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
            className="bg-transparent text-[10px] text-text-primary placeholder:text-text-muted focus:outline-none flex-1 min-w-0 w-0"
          />
          {q && (
            <button onClick={() => setQ('')} className="text-text-muted hover:text-text-primary">
              <ChevronRight className="w-2.5 h-2.5 rotate-180" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 pb-2 flex flex-col gap-0.5">
        {visible.length === 0 && (
          <p className="text-[10px] text-text-muted px-2 py-3 text-center">No blocks match</p>
        )}
        {visible.map(({ subtype, label, Icon, iconBg, iconText }) => (
          <div
            key={subtype}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('application/wf-block', subtype); e.dataTransfer.effectAllowed = 'copy'; }}
            className="flex items-center gap-2 px-2 py-[7px] rounded-lg cursor-grab active:cursor-grabbing hover:bg-brand-soft transition-colors group"
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${iconBg} group-hover:bg-brand/20`}>
              <Icon className={`w-3.5 h-3.5 ${iconText} group-hover:text-brand`} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-medium text-text-secondary group-hover:text-brand truncate leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Quick Insert Menu ──────────────────────────────────────────────────────────
// ── Create Workflow Form (alternative to palette) ─────────────────────────────
// ── TriggerConditionEditor ─────────────────────────────────────────────────────
function TriggerConditionEditor({ triggerType, value, onChange }: {
  triggerType: string; value: string; onChange: (json: string) => void;
}) {
  const stagesQ = useDealStages();
  const stages = (stagesQ.data as unknown as CrmDealStageSummaryDto[] | undefined) ?? [];
  const parsed = useMemo(() => { try { return JSON.parse(value || '{}') as Record<string, unknown>; } catch { return {} as Record<string, unknown>; } }, [value]);
  const set = (k: string, v: unknown) => { const next = { ...parsed }; if (v === '' || v == null) delete next[k]; else next[k] = v; onChange(JSON.stringify(next)); };

  const INPUT = 'nodrag w-full px-2 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-bg text-text-primary outline-none focus:border-brand';

  if (triggerType === 'lead.score_threshold') {
    const threshold = Number(parsed.threshold ?? 70);
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-text-muted">Score threshold</span>
          <span className="text-[12px] font-bold text-brand">{threshold}</span>
        </div>
        <input type="range" min={0} max={100} step={5} value={threshold}
          onChange={(e) => set('threshold', Number(e.target.value))}
          className="nodrag w-full accent-brand cursor-pointer" />
        <p className="text-[9px] text-text-muted">Fires once when the lead score crosses this value</p>
      </div>
    );
  }

  if (triggerType === 'funnel.stage_changed') {
    const funnelStages = ['Identified', 'Inquiring', 'Qualified', 'Negotiating', 'Closing', 'Customer', 'Repeat', 'Advocate', 'Dormant'];
    return (
      <select value={String(parsed.toStage ?? 'Qualified')} onChange={(e) => set('toStage', e.target.value)} className={INPUT}>
        <option value="">Any stage change</option>
        {funnelStages.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    );
  }

  if (triggerType === 'deal.stage_changed') {
    return (
      <select value={String(parsed.toStage ?? '')} onChange={(e) => set('toStage', e.target.value)} className={INPUT}>
        <option value="">Any stage change</option>
        {stages.map(s => <option key={s.id} value={s.name}>{s.name}{s.isClosed ? (s.isWon ? ' ✓' : ' ✗') : ''}</option>)}
      </select>
    );
  }

  return <p className="text-[10px] text-text-muted italic py-1">No conditions required for this trigger.</p>;
}

// ── ActionConfigEditor ─────────────────────────────────────────────────────────
function ActionConfigEditor({ actionType, value, onChange }: {
  actionType: string; value: string; onChange: (json: string) => void;
}) {
  const usersQ = useUsers();
  const stagesQ = useDealStages();
  const sequencesQ = useNurtureSequences();
  const processDefsQ = useProcessDefinitions();
  const parsed = useMemo(() => { try { return JSON.parse(value || '{}') as Record<string, unknown>; } catch { return {} as Record<string, unknown>; } }, [value]);
  const set = (k: string, v: unknown) => { const next = { ...parsed }; if (v === '' || v == null) delete next[k]; else next[k] = v; onChange(JSON.stringify(next)); };

  const users = (usersQ.data as unknown as UserDto[] | undefined) ?? [];
  const stages = ((stagesQ.data as unknown as CrmDealStageSummaryDto[] | undefined) ?? []).filter(s => !s.isClosed);
  const sequences = (sequencesQ.data as unknown as NurtureSequenceDto[] | undefined) ?? [];
  const uLabel = (u: { id: string; fullName?: string | null; email?: string | null }) => u.fullName ?? u.email ?? u.id;

  const F = 'nodrag w-full px-2 py-1 border border-border-subtle rounded text-[10px] bg-bg-shell text-text-primary outline-none focus:border-brand';
  const L = 'block text-[9px] font-semibold mb-0.5 text-text-muted uppercase tracking-wide';

  if (actionType === 'create_task') return (
    <div className="space-y-1.5">
      <div><label className={L}>Task title *</label>
        <input className={F} placeholder="e.g. Follow up with lead" value={String(parsed.title ?? '')} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div><label className={L}>Priority</label>
        <select className={F} value={String(parsed.priority ?? 'Medium')} onChange={(e) => set('priority', e.target.value)}>
          {['Low', 'Medium', 'High'].map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div><label className={L}>Description (optional)</label>
        <textarea rows={2} className={F + ' resize-none'} placeholder="Additional details…" value={String(parsed.description ?? '')} onChange={(e) => set('description', e.target.value)} />
      </div>
    </div>
  );

  if (actionType === 'send_notification') return (
    <div className="space-y-1.5">
      <div><label className={L}>Alert title *</label>
        <input className={F} placeholder="e.g. Hot lead alert" value={String(parsed.title ?? '')} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div><label className={L}>Body (optional)</label>
        <textarea rows={2} className={F + ' resize-none'} placeholder="Additional details…" value={String(parsed.body ?? '')} onChange={(e) => set('body', e.target.value)} />
      </div>
      <div><label className={L}>Notify user (optional)</label>
        <select className={F} value={String(parsed.userId ?? '')} onChange={(e) => set('userId', e.target.value)}>
          <option value="">All users</option>
          {users.map(u => <option key={u.id} value={u.id}>{uLabel(u)}</option>)}
        </select>
      </div>
    </div>
  );

  if (actionType === 'update_funnel_stage') return (
    <div><label className={L}>New stage</label>
      <select className={F} value={String(parsed.newStage ?? 'Qualified')} onChange={(e) => set('newStage', e.target.value)}>
        {['Identified', 'Inquiring', 'Qualified', 'Negotiating', 'Closing', 'Customer', 'Repeat', 'Advocate', 'Dormant'].map(s => <option key={s}>{s}</option>)}
      </select>
    </div>
  );

  if (actionType === 'assign_to_user') return (
    <div><label className={L}>Assign to *</label>
      <select className={F} value={String(parsed.userId ?? '')} onChange={(e) => set('userId', e.target.value)}>
        <option value="">Select team member…</option>
        {users.map(u => <option key={u.id} value={u.id}>{uLabel(u)}</option>)}
      </select>
    </div>
  );

  if (actionType === 'create_nurture_entry') return (
    <div><label className={L}>Nurture sequence *</label>
      <select className={F} value={String(parsed.sequenceId ?? '')} onChange={(e) => set('sequenceId', e.target.value)}>
        <option value="">Select sequence…</option>
        {sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  );

  if (actionType === 'send_email') return (
    <div><label className={L}>Send to *</label>
      <select className={F} value={String(parsed.userId ?? '')} onChange={(e) => set('userId', e.target.value)}>
        <option value="">Select user…</option>
        {users.map(u => <option key={u.id} value={u.id}>{uLabel(u)}</option>)}
      </select>
    </div>
  );

  if (actionType === 'adjust_lead_score') {
    const delta = Number(parsed.delta ?? 10);
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={L}>Score change</label>
          <span className={`text-[12px] font-bold ${delta >= 0 ? 'text-success' : 'text-danger'}`}>{delta >= 0 ? `+${delta}` : delta}</span>
        </div>
        <input type="range" min={-50} max={50} step={5} value={delta}
          onChange={(e) => set('delta', Number(e.target.value))}
          className="nodrag w-full accent-brand cursor-pointer" />
        <p className="text-[9px] text-text-muted">Negative values reduce the score</p>
      </div>
    );
  }

  if (actionType === 'create_deal') return (
    <div className="space-y-1.5">
      <div><label className={L}>Stage</label>
        <select className={F} value={String(parsed.stage_name ?? '')} onChange={(e) => set('stage_name', e.target.value)}>
          <option value="">First open stage (default)</option>
          {stages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>
      <div><label className={L}>Assign to (optional)</label>
        <select className={F} value={String(parsed.assign_to ?? '')} onChange={(e) => set('assign_to', e.target.value)}>
          <option value="">Lead's assigned owner</option>
          {users.map(u => <option key={u.id} value={u.id}>{uLabel(u)}</option>)}
        </select>
      </div>
      <div><label className={L}>Deal name (optional)</label>
        <input className={F} placeholder="Auto-generated if empty" value={String(parsed.deal_name ?? '')} onChange={(e) => set('deal_name', e.target.value)} />
      </div>
      <div><label className={L}>Amount (optional)</label>
        <input type="number" min={0} className={F} placeholder="Leave blank if unknown" value={parsed.amount != null ? String(parsed.amount) : ''} onChange={(e) => set('amount', e.target.value ? Number(e.target.value) : undefined)} />
      </div>
    </div>
  );

  if (actionType === 'start_process') {
    const defs = (processDefsQ.data as unknown as ProcessDefinitionDto[] | undefined) ?? [];
    return (
      <div><label className={L}>Process Definition *</label>
        <select className={F} value={String(parsed.definition_id ?? '')} onChange={(e) => set('definition_id', e.target.value)}>
          <option value="">Select a process…</option>
          {defs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {!processDefsQ.data && <p className="text-[9px] text-text-muted mt-0.5">Loading…</p>}
        {defs.length === 0 && processDefsQ.isSuccess && (
          <p className="text-[9px] text-amber-400 mt-0.5">No process definitions found — create one in Process Flows first.</p>
        )}
      </div>
    );
  }

  return null;
}

function CreateWorkflowForm({ onGenerate }: {
  onGenerate: (triggerType: string, conditionsJson: string, steps: CrmWorkflowStepRequest[]) => void;
}) {
  const { data: triggerDefsRaw } = useWorkflowTriggerDefinitions();
  const triggerDefs = triggerDefsRaw as unknown as { triggerType: string; displayName: string }[] | undefined;
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('deal.stage_changed');
  const [triggerConditionsJson, setTriggerConditionsJson] = useState('');
  const [steps, setSteps] = useState<CrmWorkflowStepRequest[]>([{ stepOrder: 1, actionType: 'create_task', actionConfigJson: '{}', delayMinutes: 0 }]);

  const addStep = () => setSteps((s) => [...s, { stepOrder: s.length + 1, actionType: 'create_task', actionConfigJson: '{}', delayMinutes: 0 }]);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i).map((st, idx) => ({ ...st, stepOrder: idx + 1 })));
  const updateStep = (i: number, patch: Partial<CrmWorkflowStepRequest>) =>
    setSteps((s) => s.map((st, idx) => idx === i ? { ...st, ...patch } : st));

  return (
    <div
      className="absolute left-4 top-3 z-10 w-[270px] bg-bg-shell rounded-xl flex flex-col overflow-hidden"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)', border: '1px solid #14302A', maxHeight: 'calc(100% - 24px)' }}
    >
      <div className="px-3 pt-3 pb-2 shrink-0 border-b border-border-subtle">
        <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Create Workflow</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

        {/* Description */}
        <div>
          <label className="block text-2xs font-semibold mb-1 text-text-secondary">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this workflow do?"
            className="nodrag w-full px-2 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-bg text-text-primary placeholder:text-text-muted outline-none focus:border-brand" />
        </div>

        {/* Trigger Type */}
        <div>
          <label className="block text-2xs font-semibold mb-1 text-text-secondary">Trigger</label>
          <select value={triggerType} onChange={(e) => { setTriggerType(e.target.value); setTriggerConditionsJson('{}'); }}
            className="nodrag w-full px-2 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-bg text-text-primary outline-none focus:border-brand">
            {(triggerDefs ?? Object.entries(CRM_WORKFLOW_TRIGGER_LABELS).map(([k, l]) => ({ triggerType: k, displayName: l })))
              .map((d) => <option key={d.triggerType} value={d.triggerType}>{d.displayName}</option>)}
          </select>
        </div>

        {/* Trigger Conditions */}
        <div>
          <label className="block text-2xs font-semibold mb-1 text-text-secondary">Conditions</label>
          <TriggerConditionEditor triggerType={triggerType} value={triggerConditionsJson} onChange={setTriggerConditionsJson} />
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-2xs font-semibold text-text-secondary">Steps</label>
            <button onClick={addStep} className="text-[10px] text-brand hover:underline">+ Add</button>
          </div>
          <div className="space-y-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-1.5 p-2 rounded-lg bg-bg border border-border-subtle">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-muted font-semibold">Step {s.stepOrder}</span>
                    {steps.length > 1 && (
                      <button onClick={() => removeStep(i)} className="p-0.5 rounded text-danger hover:bg-danger-soft transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <select value={s.actionType} onChange={(e) => updateStep(i, { actionType: e.target.value, actionConfigJson: '{}' })}
                    className="nodrag w-full px-2 py-1 border border-border-subtle rounded text-[10px] bg-bg-shell text-text-primary outline-none focus:border-brand">
                    {Object.entries(CRM_WORKFLOW_ACTION_LABELS).map(([k, l]) => (
                      <option key={k} value={k}>{l}</option>
                    ))}
                  </select>
                  <ActionConfigEditor actionType={s.actionType} value={s.actionConfigJson ?? '{}'} onChange={(v) => updateStep(i, { actionConfigJson: v })} />
                  <div className="flex items-center gap-1.5 pt-1 border-t border-border-subtle mt-1">
                    <Clock className="w-3 h-3 text-text-muted shrink-0" />
                    <input type="number" min={0} value={s.delayMinutes ?? 0}
                      onChange={(e) => updateStep(i, { delayMinutes: Number(e.target.value) })}
                      className="nodrag w-14 px-1.5 py-1 border border-border-subtle rounded text-[10px] bg-bg-shell text-text-primary outline-none focus:border-brand" />
                    <span className="text-[9px] text-text-muted">min delay before this step</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-3 py-2 border-t border-border-subtle shrink-0">
        <button onClick={() => onGenerate(triggerType, triggerConditionsJson, steps)}
          className="w-full py-1.5 rounded-lg text-[10px] font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
          Generate to Canvas
        </button>
      </div>
    </div>
  );
}

function QuickInsertMenu({ target, onInsert, onClose }: {
  target: InsertTarget; onInsert: (edgeId: string, subtype: string) => void; onClose: () => void;
}) {
  if (!target) return null;
  const items = PALETTE_GROUPS.flatMap((g) => g.items).filter((i) => i.kind !== 'trigger' && i.kind !== 'end');
  return createPortal(
    <div className="fixed inset-0 z-[210]" onClick={onClose}>
      <div className="absolute p-2 rounded-xl bg-bg-shell border border-border-subtle shadow-2xl flex flex-col gap-1"
        style={{ left: target.x, top: target.y, transform: 'translate(-50%, 8px)', minWidth: 140 }}>
        <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider px-2 pt-1 pb-1">Insert block</p>
        {items.map(({ subtype, label, Icon, iconBg, iconText }) => (
          <button key={subtype} onClick={() => { onInsert(target.edgeId, subtype); onClose(); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-brand-soft transition-colors">
            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon className={`w-3 h-3 ${iconText}`} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-medium text-text-secondary">{label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}

// ── Right panel — Configure + History tabs ────────────────────────────────────

type UpdatePatch = Partial<{ label: string; subtype: string; config: Record<string, string> }>;

// Shared form primitives — exact flow builder className patterns
function CF({ label, value, onChange, placeholder, hint, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; hint?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-2xs font-semibold mb-1 text-text-secondary">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="nodrag w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-bg-shell text-text-muted outline-none focus:border-brand"
      />
      {hint && <p className="text-[10px] text-text-muted mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

function CS({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; hint?: string;
}) {
  return (
    <div>
      <label className="block text-2xs font-semibold mb-1 text-text-secondary">{label}</label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="nodrag w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-bg-shell text-text-muted outline-none focus:border-brand"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p className="text-[10px] text-text-muted mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

function CArea({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-2xs font-semibold mb-1 text-text-secondary">{label}</label>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} rows={3}
        className="nodrag w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-bg-shell text-text-muted outline-none focus:border-brand resize-none"
      />
      {hint && <p className="text-[10px] text-text-muted mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

// Returns palette items that belong to a given canvas node type
function getSubtypeOptions(nodeType: string): PaletteItem[] {
  return PALETTE_GROUPS.flatMap((g) => g.items).filter((i) => {
    if (nodeType === 'trigger')   return i.kind === 'trigger';
    if (nodeType === 'action')    return i.kind === 'action';
    if (nodeType === 'condition') return i.kind === 'condition';
    if (nodeType === 'delay')     return i.kind === 'delay' && i.subtype !== 'end';
    if (nodeType === 'ai')        return i.kind === 'ai';
    if (nodeType === 'api')       return i.kind === 'api';
    return false;
  });
}

function ConfigureTab({ selectedId, nodes, onUpdateNode }: {
  selectedId: string | null; nodes: Node[];
  onUpdateNode: (id: string, patch: UpdatePatch) => void;
}) {
  const { onDelete } = useContext(Ctx);
  const processDefsQ = useProcessDefinitions();
  const node = nodes.find((n) => n.id === selectedId);
  const errors = node ? validateNode(node) : [];
  const cfg = (node?.data.config as Record<string, string>) ?? {};
  const sub = (node?.data.subtype as string) ?? '';
  const sf = (k: string, v: string) => node && onUpdateNode(node.id, { config: { ...cfg, [k]: v } });
  const changeSubtype = (newSub: string) => {
    if (!node) return;
    const m = META[newSub];
    onUpdateNode(node.id, { subtype: newSub, label: m?.label ?? newSub, config: {} });
  };

  // Empty state
  if (!node) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center p-4">
        <Settings className="w-8 h-8 text-border-medium" strokeWidth={1.2} />
        <p className="text-2xs text-text-muted leading-relaxed">Click any block on the canvas to configure it</p>
      </div>
    );
  }

  const isFixed = node.id === 'node-end';
  const subtypeOpts = getSubtypeOptions(node.type as string);

  // Section title per kind
  const kindLabel: Record<string, string> = {
    trigger: 'Trigger Type', action: 'Action Type',
    condition: 'Condition Type', delay: 'Control Type',
    ai: 'AI Model Type', api: 'Request Type',
  };

  return (
    <div className="flex-1 overflow-y-auto">

      {/* Validation error cards — exact flow builder style */}
      {errors.length > 0 && (
        <div className="p-3 space-y-2">
          {errors.map((e) => (
            <div key={e} className="rounded-lg p-3 border text-2xs space-y-1.5 bg-red-500/5 border-red-500/20">
              <div className="font-semibold flex items-center gap-1.5 text-red-400">
                <AlertCircle className="w-3 h-3" /> Problem
              </div>
              <p className="text-text-secondary leading-relaxed">{e}</p>
              <p className="font-medium leading-relaxed text-red-300">→ Fill in the required field below</p>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 space-y-4">

        {/* Label */}
        <div>
          <label className="block text-2xs font-semibold mb-1 text-text-secondary">Name</label>
          <input
            value={(node.data.label as string) ?? ''} onChange={(e) => onUpdateNode(node.id, { label: e.target.value })}
            className="nodrag w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-bg-shell text-text-muted outline-none focus:border-brand"
            placeholder="Block label…"
          />
        </div>

        {/* Type picker — 2-col grid, same pattern as flow builder node palette */}
        {!isFixed && subtypeOpts.length > 0 && !['trigger','action','condition','ai','api'].includes(node.type as string) && (
          <div>
            <label className="block text-2xs font-semibold mb-2 text-text-secondary uppercase tracking-wider">
              {kindLabel[node.type as string] ?? 'Type'}
            </label>
            <div className="grid grid-cols-2 gap-1">
              {subtypeOpts.map(({ subtype: st, label, Icon, iconBg, iconText }) => {
                const active = sub === st;
                return (
                  <button
                    key={st}
                    onClick={() => changeSubtype(st)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all border text-[10px] font-medium ${
                      active
                        ? 'bg-brand-soft border-brand/30 text-brand'
                        : 'bg-bg-shell border-border-subtle text-text-muted hover:text-text-secondary hover:border-border-medium'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${active ? 'bg-brand-soft' : iconBg}`}>
                      <Icon className={`w-3 h-3 ${active ? 'text-brand' : iconText}`} strokeWidth={2} />
                    </div>
                    <span className="truncate leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings — divider */}
        {!isFixed && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xs font-semibold text-text-secondary uppercase tracking-wider">Settings</span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            {/* ── TRIGGER settings — free-text, same as flow builder ── */}
            {node.type === 'trigger' && (
              <div className="space-y-3">
                {/* Type — disabled display field, mirrors flow builder */}
                <div>
                  <label className="block text-2xs font-semibold mb-1 text-text-secondary">Type</label>
                  <input
                    value="Trigger" disabled
                    className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-glass-1 text-text-muted"
                  />
                </div>
                {/* Free-text description */}
                <CArea
                  label="When does this fire?"
                  value={cfg.description ?? ''}
                  placeholder="Describe the trigger event in plain language…&#10;e.g. When a deal moves to Closed Won&#10;e.g. When a new lead signs up via the website form"
                  onChange={(v) => sf('description', v)}
                  hint="Write in plain language — be as specific as you need"
                />
                {/* CRM event mapping */}
                <CS
                  label="CRM Event (for automation)"
                  value={cfg.apiTriggerType ?? 'manual'}
                  onChange={(v) => sf('apiTriggerType', v)}
                  options={[
                    { value: 'deal.stage_changed',    label: 'Deal Stage Changed' },
                    { value: 'funnel.stage_changed',  label: 'Funnel / Pipeline Stage Changed' },
                    { value: 'lead.score_threshold',  label: 'Lead Score Threshold' },
                    { value: 'support_case.created',  label: 'Support Case / Ticket Created' },
                    { value: 'support_case.escalated',label: 'Support Case Escalated' },
                    { value: 'lead.re_engaged',       label: 'Lead Re-engaged' },
                    { value: 'meeting.booked',        label: 'Meeting Booked' },
                    { value: 'proposal.sent',         label: 'Proposal Sent' },
                    { value: 'agent.handoff_requested', label: 'Agent Handoff' },
                    { value: 'manual',                label: 'Manual / Custom Event' },
                  ]}
                  hint="Maps to the automation engine trigger type"
                />
                <div className="rounded-lg p-3 border text-2xs bg-blue-400/5 border-blue-400/20">
                  <p className="text-blue-400 leading-relaxed">This block starts the workflow. Connect action, AI, or API blocks below to define what happens next.</p>
                </div>
              </div>
            )}

            {/* ── ACTION settings — free-text, same pattern as trigger ── */}
            {node.type === 'action' && (
              <div className="space-y-3">
                {/* Type — disabled display, mirrors flow builder */}
                <div>
                  <label className="block text-2xs font-semibold mb-1 text-text-secondary">Type</label>
                  <input value="Action" disabled
                    className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-glass-1 text-text-muted" />
                </div>
                {/* Free-text description */}
                <CArea
                  label="What should this do?"
                  value={cfg.description ?? ''}
                  placeholder="Describe what this action does…&#10;e.g. Send a welcome email to the contact&#10;e.g. Create a follow-up task for the assigned rep&#10;e.g. Update the deal stage to Qualified"
                  onChange={(v) => sf('description', v)}
                  hint="Write in plain language — be as specific as you need"
                />
                {/* Action type mapping */}
                <CS
                  label="Action Type"
                  value={cfg.actionType ?? 'create_task'}
                  onChange={(v) => sf('actionType', v)}
                  options={[
                    { value: 'send_email',    label: 'Send Email' },
                    { value: 'send_sms',      label: 'Send SMS' },
                    { value: 'create_task',   label: 'Create Task' },
                    { value: 'update_record', label: 'Update Record' },
                    { value: 'assign_owner',  label: 'Assign Owner' },
                    { value: 'create_note',   label: 'Add a Note' },
                    { value: 'create_ticket', label: 'Create Ticket' },
                    { value: 'webhook',       label: 'Webhook / API Call' },
                    { value: 'notify',        label: 'Send Notification' },
                    { value: 'enrol_nurture', label: 'Enrol in Nurture Sequence' },
                    { value: 'start_process', label: 'Start Process Workflow' },
                  ]}
                  hint="Defines how this action maps to the automation engine"
                />
                {/* Contextual fields based on selected action type */}
                {cfg.actionType === 'send_email' && <>
                  <CS label="Send To" value={cfg.toField ?? 'contact.email'} onChange={(v) => sf('toField', v)}
                    options={[{ value: 'contact.email', label: 'Contact email' }, { value: 'owner.email', label: 'Owner email' }, { value: 'custom', label: 'Custom address' }]} />
                  {cfg.toField === 'custom' && <CF label="Email Address" value={cfg.to ?? ''} placeholder="hello@example.com" onChange={(v) => sf('to', v)} />}
                  <CF label="Subject" value={cfg.subject ?? ''} placeholder="e.g. Following up on your inquiry" onChange={(v) => sf('subject', v)} />
                  <CArea label="Email Body" value={cfg.value ?? ''} placeholder="Write your email body here…" onChange={(v) => sf('value', v)} />
                </>}
                {cfg.actionType === 'send_sms' && <>
                  <CF label="To (phone field)" value={cfg.toField ?? '{{contact.phone}}'} placeholder="{{contact.phone}}" onChange={(v) => sf('toField', v)} />
                  <CArea label="Message" value={cfg.value ?? ''} placeholder="Your SMS message…" onChange={(v) => sf('value', v)} hint="Keep under 160 characters for one SMS credit" />
                </>}
                {cfg.actionType === 'create_task' && <>
                  <CF label="Task Title" value={cfg.value ?? ''} placeholder="e.g. Follow up with this lead" onChange={(v) => sf('value', v)} />
                  <CF label="Due In (days)" type="number" value={cfg.dueDays ?? '1'} placeholder="1" onChange={(v) => sf('dueDays', v)} />
                  <CS label="Priority" value={cfg.priority ?? 'medium'} onChange={(v) => sf('priority', v)}
                    options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
                  <CF label="Assign To (optional)" value={cfg.assignTo ?? ''} placeholder="Team member name or ID" onChange={(v) => sf('assignTo', v)} />
                </>}
                {cfg.actionType === 'update_record' && <>
                  <CS label="Record Type" value={cfg.recordType ?? 'contact'} onChange={(v) => sf('recordType', v)}
                    options={[{ value: 'contact', label: 'Contact' }, { value: 'lead', label: 'Lead' }, { value: 'deal', label: 'Deal' }, { value: 'ticket', label: 'Ticket' }]} />
                  <CF label="Field to Update" value={cfg.field ?? ''} placeholder="e.g. stage, status" onChange={(v) => sf('field', v)} />
                  <CF label="New Value" value={cfg.value ?? ''} placeholder="e.g. Qualified" onChange={(v) => sf('value', v)} />
                </>}
                {cfg.actionType === 'assign_owner' && <>
                  <CS label="Assignment Method" value={cfg.method ?? 'specific'} onChange={(v) => sf('method', v)}
                    options={[{ value: 'specific', label: 'Specific team member' }, { value: 'round_robin', label: 'Round robin' }, { value: 'least_busy', label: 'Least busy' }]} />
                  {(!cfg.method || cfg.method === 'specific') && <CF label="Team Member" value={cfg.value ?? ''} placeholder="Name or user ID" onChange={(v) => sf('value', v)} />}
                </>}
                {cfg.actionType === 'create_note' && <>
                  <CS label="Visibility" value={cfg.visibility ?? 'internal'} onChange={(v) => sf('visibility', v)}
                    options={[{ value: 'internal', label: 'Internal (team only)' }, { value: 'public', label: 'Public (visible to contact)' }]} />
                  <CArea label="Note Content" value={cfg.value ?? ''} placeholder="Note content…" onChange={(v) => sf('value', v)} />
                </>}
                {cfg.actionType === 'create_ticket' && <>
                  <CF label="Ticket Title" value={cfg.value ?? ''} placeholder="e.g. Onboarding assistance" onChange={(v) => sf('value', v)} />
                  <CS label="Priority" value={cfg.priority ?? 'medium'} onChange={(v) => sf('priority', v)}
                    options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
                  <CF label="Assign To (optional)" value={cfg.assignTo ?? ''} placeholder="Team or individual" onChange={(v) => sf('assignTo', v)} />
                </>}
                {cfg.actionType === 'webhook' && <>
                  <CF label="Endpoint URL" value={cfg.url ?? ''} placeholder="https://api.example.com/hook" onChange={(v) => sf('url', v)} />
                  <CS label="Method" value={cfg.method ?? 'POST'} onChange={(v) => sf('method', v)}
                    options={[{ value: 'POST', label: 'POST' }, { value: 'GET', label: 'GET' }, { value: 'PUT', label: 'PUT' }, { value: 'PATCH', label: 'PATCH' }]} />
                  <CF label="Auth Header (optional)" value={cfg.authHeader ?? ''} placeholder="Bearer your-token" onChange={(v) => sf('authHeader', v)} />
                </>}
                {cfg.actionType === 'notify' && <>
                  <CF label="Alert Title" value={cfg.value ?? ''} placeholder="e.g. Hot lead needs attention" onChange={(v) => sf('value', v)} />
                  <CArea label="Alert Body (optional)" value={cfg.body ?? ''} placeholder="Additional detail…" onChange={(v) => sf('body', v)} />
                </>}
                {cfg.actionType === 'enrol_nurture' && (
                  <CF label="Sequence ID" value={cfg.sequenceId ?? ''} placeholder="Paste nurture sequence ID" onChange={(v) => sf('sequenceId', v)} />
                )}
                {cfg.actionType === 'start_process' && (() => {
                  const defs = (processDefsQ.data as unknown as ProcessDefinitionDto[] | undefined) ?? [];
                  return (
                    <div>
                      <label className="block text-2xs font-semibold mb-1 text-text-secondary">Process Definition *</label>
                      <select
                        value={cfg.definition_id ?? ''}
                        onChange={(e) => sf('definition_id', e.target.value)}
                        className="nodrag w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-bg-shell text-text-muted outline-none focus:border-brand"
                      >
                        <option value="">Select a process…</option>
                        {defs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      {defs.length === 0 && processDefsQ.isSuccess && (
                        <p className="text-[10px] text-amber-400 mt-1">No process definitions found — create one in Process Flows first.</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── CONDITION settings — free-text ── */}
            {node.type === 'condition' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-2xs font-semibold mb-1 text-text-secondary">Type</label>
                  <input value="Condition" disabled className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-glass-1 text-text-muted" />
                </div>
                <CArea label="What is the condition?" value={cfg.description ?? ''}
                  placeholder="Describe the condition in plain language…&#10;e.g. If the lead score is above 80&#10;e.g. If the contact's status is active&#10;e.g. If the deal amount is greater than $10,000"
                  onChange={(v) => sf('description', v)} hint="Write in plain language — be as specific as you need" />
                <CS label="Condition Type" value={cfg.conditionType ?? 'if_else'} onChange={(v) => sf('conditionType', v)}
                  options={[
                    { value: 'if_else',          label: 'If / Else — general branch' },
                    { value: 'lead_score',        label: 'Lead Score — branch on score value' },
                    { value: 'status_check',      label: 'Status Check — branch on a status' },
                    { value: 'field_comparison',  label: 'Field Comparison — compare any field' },
                    { value: 'date_comparison',   label: 'Date Comparison — compare a date field' },
                    { value: 'segment_check',     label: 'Segment Check — is contact in segment?' },
                  ]}
                  hint="Tells the automation engine how to evaluate this branch" />
                {/* Contextual fields */}
                {(cfg.conditionType === 'if_else' || cfg.conditionType === 'field_comparison' || !cfg.conditionType) && <>
                  <CF label="Field / Property" value={cfg.field ?? ''} placeholder="e.g. contact.status" onChange={(v) => sf('field', v)} hint="Use dot notation: contact.status, deal.amount" />
                  <CS label="Operator" value={cfg.operator ?? 'equals'} onChange={(v) => sf('operator', v)}
                    options={[
                      { value: 'equals', label: 'equals' }, { value: 'not_equals', label: 'does not equal' },
                      { value: 'contains', label: 'contains' }, { value: 'not_contains', label: 'does not contain' },
                      { value: 'greater_than', label: 'is greater than' }, { value: 'less_than', label: 'is less than' },
                      { value: 'is_empty', label: 'is empty' }, { value: 'is_not_empty', label: 'is not empty' },
                    ]} />
                  {!['is_empty', 'is_not_empty'].includes(cfg.operator ?? '') && (
                    <CF label="Value" value={cfg.value ?? ''} placeholder="e.g. Qualified" onChange={(v) => sf('value', v)} />
                  )}
                </>}
                {cfg.conditionType === 'lead_score' && <>
                  <CF label="Score Threshold" type="number" value={cfg.value ?? ''} placeholder="e.g. 80" onChange={(v) => sf('value', v)} />
                  <CS label="Direction" value={cfg.direction ?? 'above'} onChange={(v) => sf('direction', v)}
                    options={[{ value: 'above', label: 'Score rises above → Yes path' }, { value: 'below', label: 'Score drops below → Yes path' }]} />
                </>}
                {cfg.conditionType === 'status_check' && <>
                  <CS label="Record Type" value={cfg.recordType ?? 'contact'} onChange={(v) => sf('recordType', v)}
                    options={[{ value: 'contact', label: 'Contact' }, { value: 'lead', label: 'Lead' }, { value: 'deal', label: 'Deal' }]} />
                  <CF label="Expected Status" value={cfg.value ?? ''} placeholder="e.g. active, qualified" onChange={(v) => sf('value', v)} />
                </>}
                {cfg.conditionType === 'date_comparison' && <>
                  <CF label="Date Field" value={cfg.field ?? ''} placeholder="e.g. contact.created_at" onChange={(v) => sf('field', v)} />
                  <CS label="Operator" value={cfg.operator ?? 'before'} onChange={(v) => sf('operator', v)}
                    options={[{ value: 'before', label: 'is before' }, { value: 'after', label: 'is after' }, { value: 'within_days', label: 'is within N days' }]} />
                  <CF label="Value" value={cfg.value ?? ''} placeholder="e.g. 2024-01-01 or 7 (days)" onChange={(v) => sf('value', v)} />
                </>}
                <div className="rounded-lg p-3 border text-2xs bg-amber-500/5 border-amber-500/20">
                  <p className="text-amber-400 leading-relaxed">Green handle (left) = Yes / True path · Red handle (right) = No / False path</p>
                </div>
              </div>
            )}

            {/* ── DELAY / FLOW CONTROL settings ── */}
            {node.type === 'delay' && (
              <div className="space-y-3">
                {sub === 'wait' && <>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-2xs font-semibold mb-1 text-text-secondary">Duration</label>
                      <input type="number" min={0} value={cfg.delayMinutes ?? '0'} onChange={(e) => sf('delayMinutes', e.target.value)} placeholder="0"
                        className="nodrag w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-bg-shell text-text-muted outline-none focus:border-brand" />
                    </div>
                    <CS label="Unit" value={cfg.unit ?? 'minutes'} onChange={(v) => sf('unit', v)}
                      options={[{ value: 'minutes', label: 'Minutes' }, { value: 'hours', label: 'Hours' }, { value: 'days', label: 'Days' }]} />
                  </div>
                  <CF label="Reason (optional)" value={cfg.reason ?? ''} placeholder="e.g. Give lead time to respond" onChange={(v) => sf('reason', v)} />
                </>}
                {sub === 'approval' && <>
                  <CF label="Approver" value={cfg.value ?? ''} placeholder="manager@company.com" onChange={(v) => sf('value', v)} hint="Who must approve before the workflow continues" />
                  <CF label="Timeout (hours)" type="number" value={cfg.timeout ?? '24'} placeholder="24" onChange={(v) => sf('timeout', v)} />
                  <CS label="On Timeout" value={cfg.onTimeout ?? 'continue'} onChange={(v) => sf('onTimeout', v)}
                    options={[{ value: 'continue', label: 'Continue anyway' }, { value: 'stop', label: 'Stop workflow' }, { value: 'escalate', label: 'Escalate to manager' }]} />
                </>}
              </div>
            )}

            {/* ── AI settings — free-text ── */}
            {node.type === 'ai' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-2xs font-semibold mb-1 text-text-secondary">Type</label>
                  <input value="AI" disabled className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-glass-1 text-text-muted" />
                </div>
                <CArea label="What should the AI do?" value={cfg.description ?? ''}
                  placeholder="Describe the AI task in plain language…&#10;e.g. Classify this lead as Hot, Warm, or Cold&#10;e.g. Write a personalised follow-up email&#10;e.g. Summarise the conversation history in 3 sentences"
                  onChange={(v) => sf('description', v)} hint="Write in plain language — be as specific as you need" />
                <CS label="AI Model Type" value={cfg.aiType ?? 'generate'} onChange={(v) => sf('aiType', v)}
                  options={[
                    { value: 'generate',  label: 'Generate Text — write content' },
                    { value: 'classify',  label: 'Classify — categorise data' },
                    { value: 'sentiment', label: 'Sentiment — detect tone / mood' },
                    { value: 'extract',   label: 'Extract Data — pull structured fields' },
                    { value: 'score',     label: 'Score — rank or rate a record' },
                    { value: 'summarize', label: 'Summarize — condense long content' },
                    { value: 'translate', label: 'Translate — convert to another language' },
                    { value: 'custom',    label: 'Custom — any other AI task' },
                  ]}
                  hint="Tells the AI engine how to process this block" />
                {/* Contextual fields based on AI type */}
                {(cfg.aiType === 'generate' || cfg.aiType === 'custom' || !cfg.aiType) && <>
                  <CArea label="Prompt / Instructions" value={cfg.prompt ?? ''}
                    placeholder="Write a follow-up email for {{contact.name}}…" onChange={(v) => sf('prompt', v)}
                    hint="Use {{field_name}} for dynamic CRM values" />
                  <CF label="Max Length (words)" type="number" value={cfg.maxLength ?? '200'} placeholder="200" onChange={(v) => sf('maxLength', v)} />
                </>}
                {cfg.aiType === 'classify' && <>
                  <CS label="Input Field" value={cfg.inputField ?? 'message'} onChange={(v) => sf('inputField', v)}
                    options={[{ value: 'message', label: 'Message' }, { value: 'email_body', label: 'Email body' }, { value: 'notes', label: 'Notes' }, { value: 'custom', label: 'Custom field' }]} />
                  {cfg.inputField === 'custom' && <CF label="Custom Field" value={cfg.customField ?? ''} placeholder="e.g. contact.notes" onChange={(v) => sf('customField', v)} />}
                  <CF label="Categories" value={cfg.categories ?? ''} placeholder="Hot, Warm, Cold" onChange={(v) => sf('categories', v)} hint="Comma-separated — AI assigns one" />
                </>}
                {cfg.aiType === 'sentiment' && <>
                  <CS label="Input Field" value={cfg.inputField ?? 'message'} onChange={(v) => sf('inputField', v)}
                    options={[{ value: 'message', label: 'Message' }, { value: 'email_body', label: 'Email body' }, { value: 'notes', label: 'Notes' }]} />
                  <CS label="Output Format" value={cfg.outputFormat ?? 'label'} onChange={(v) => sf('outputFormat', v)}
                    options={[{ value: 'label', label: 'Label (Positive / Negative / Neutral)' }, { value: 'score', label: 'Score 0–100' }, { value: 'both', label: 'Both label and score' }]} />
                </>}
                {cfg.aiType === 'summarize' && <>
                  <CS label="Input Field" value={cfg.inputField ?? 'notes'} onChange={(v) => sf('inputField', v)}
                    options={[{ value: 'notes', label: 'Notes' }, { value: 'email_body', label: 'Email thread' }, { value: 'message', label: 'Message history' }]} />
                  <CF label="Max Sentences" type="number" value={cfg.maxSentences ?? '3'} placeholder="3" onChange={(v) => sf('maxSentences', v)} />
                </>}
                {cfg.aiType === 'translate' && <>
                  <CF label="Input Field" value={cfg.inputField ?? 'message'} placeholder="e.g. message" onChange={(v) => sf('inputField', v)} />
                  <CF label="Target Language" value={cfg.targetLang ?? ''} placeholder="e.g. Spanish, French, German" onChange={(v) => sf('targetLang', v)} />
                </>}
                <CF label="Save Output To" value={cfg.outputField ?? 'ai_output'} placeholder="ai_output" onChange={(v) => sf('outputField', v)} hint="Field name to store the result" />
                <div className="rounded-lg p-3 border text-2xs bg-purple-500/5 border-purple-500/20">
                  <p className="text-purple-400 leading-relaxed">Powered by Claude AI. The result is saved to the output field and available in downstream blocks.</p>
                </div>
              </div>
            )}

            {/* ── API settings — free-text ── */}
            {node.type === 'api' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-2xs font-semibold mb-1 text-text-secondary">Type</label>
                  <input value="API" disabled className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-glass-1 text-text-muted" />
                </div>
                <CArea label="What does this API call do?" value={cfg.description ?? ''}
                  placeholder="Describe the API call in plain language…&#10;e.g. Fetch the contact's subscription plan from Stripe&#10;e.g. Send a Slack message to the sales channel&#10;e.g. Create a record in the billing system"
                  onChange={(v) => sf('description', v)} hint="Write in plain language — be as specific as you need" />
                <CS label="Request Type" value={cfg.requestType ?? 'rest_post'} onChange={(v) => sf('requestType', v)}
                  options={[
                    { value: 'rest_get',    label: 'REST — GET (fetch data)' },
                    { value: 'rest_post',   label: 'REST — POST (send data)' },
                    { value: 'rest_put',    label: 'REST — PUT (replace record)' },
                    { value: 'rest_patch',  label: 'REST — PATCH (partial update)' },
                    { value: 'rest_delete', label: 'REST — DELETE (remove record)' },
                    { value: 'graphql',     label: 'GraphQL query / mutation' },
                    { value: 'database',    label: 'Database — SQL query' },
                    { value: 'webhook',     label: 'Webhook — fire and forget' },
                  ]}
                  hint="Defines how the request is made" />
                {/* Contextual fields */}
                {!cfg.requestType?.includes('database') && (
                  <CF label="Endpoint URL" value={cfg.url ?? ''} placeholder="https://api.example.com/endpoint" onChange={(v) => sf('url', v)} />
                )}
                <CF label="Auth Header (optional)" value={cfg.authHeader ?? ''} placeholder="Bearer your-api-token" onChange={(v) => sf('authHeader', v)} />
                {!['rest_get', 'rest_delete'].includes(cfg.requestType ?? '') && !cfg.requestType?.includes('graphql') && !cfg.requestType?.includes('database') && (
                  <CArea label="Request Body (JSON)" value={cfg.body ?? ''}
                    placeholder={'{\n  "contactId": "{{contact.id}}"\n}'} onChange={(v) => sf('body', v)}
                    hint="Use {{field}} for dynamic CRM values" />
                )}
                {cfg.requestType === 'graphql' && (
                  <CArea label="GraphQL Query" value={cfg.query ?? ''} placeholder="query { contact(id: $id) { name email } }" onChange={(v) => sf('query', v)} />
                )}
                {cfg.requestType === 'database' && (
                  <CArea label="SQL Query" value={cfg.query ?? ''} placeholder="SELECT * FROM contacts WHERE id = {{contact.id}}" onChange={(v) => sf('query', v)} />
                )}
                <CF label="Save Response To" value={cfg.responseField ?? 'api_response'} placeholder="api_response" onChange={(v) => sf('responseField', v)} hint="Store the response for use in later blocks" />
                <div className="rounded-lg p-3 border text-2xs bg-cyan-500/5 border-cyan-500/20">
                  <p className="text-cyan-400 leading-relaxed">Response is saved as JSON. Use dot notation (api_response.data.id) in downstream blocks to access nested values.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fixed end node */}
        {isFixed && (
          <div className="rounded-lg p-3 border text-2xs bg-glass-1 border-border-subtle">
            <p className="text-text-muted leading-relaxed">The workflow stops here. It will restart from the top when the trigger fires again.</p>
          </div>
        )}

        {/* Delete — exact flow builder style */}
        {!isFixed && (
          <button
            onClick={() => onDelete(node.id)}
            className="w-full py-2 rounded-lg bg-danger-soft text-2xs font-semibold text-danger flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3 h-3" /> Remove Block
          </button>
        )}
      </div>
    </div>
  );
}

function HistoryTab({ workflowId }: { workflowId: string | null }) {
  const { data: raw, isLoading } = useWorkflowExecutions(workflowId ?? undefined);
  const execs = (raw as { items?: unknown[] })?.items ?? (Array.isArray(raw) ? raw : []);

  if (!workflowId) return (
    <div className="flex-1 flex items-center justify-center px-4 text-center">
      <p className="text-2xs text-text-muted">Save the workflow first to see execution history.</p>
    </div>
  );
  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
    </div>
  );
  if (!execs.length) return (
    <div className="flex-1 flex items-center justify-center px-4 text-center">
      <p className="text-2xs text-text-muted">No runs yet. Use Trigger Now on the list.</p>
    </div>
  );

  const STATUS_COLOR: Record<number, string> = { 1:'text-text-muted', 2:'text-brand', 3:'text-success', 4:'text-danger', 5:'text-text-muted' };
  const STATUS_BG:    Record<number, string> = { 1:'bg-bg-elevated', 2:'bg-brand-soft', 3:'bg-success-soft', 4:'bg-danger-soft', 5:'bg-bg-elevated' };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {(execs as Array<Record<string,unknown>>).map((ex) => (
        <div key={ex.id as string} className="rounded-lg bg-bg-shell border border-border-subtle p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_BG[ex.status as number] ?? ''} ${STATUS_COLOR[ex.status as number] ?? ''}`}>
              {(CRM_WORKFLOW_EXECUTION_STATUS_LABELS as Record<number, string>)[ex.status as number] ?? 'Unknown'}
            </span>
            <span className="text-[9px] text-text-muted">
              {ex.startedAt ? format(parseISO(ex.startedAt as string), 'MMM d, HH:mm') : '—'}
            </span>
          </div>
          {ex.errorMessage ? (
            <p className="text-[10px] text-danger truncate">{String(ex.errorMessage)}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function RightPanel({ selectedId, nodes, workflowId, onUpdateNode }: {
  selectedId: string | null; nodes: Node[]; workflowId: string | null;
  onUpdateNode: (id: string, patch: UpdatePatch) => void;
}) {
  const [tab, setTab] = useState<'configure' | 'history'>('configure');
  const node = nodes.find((n) => n.id === selectedId);
  const errors = node ? validateNode(node) : [];

  return (
    <div className="w-[280px] flex-shrink-0 flex flex-col border-l border-border-subtle bg-bg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-subtle">
        <p className="text-xs font-bold text-text-primary">
          {node ? (node.data.label as string) || META[node.data.subtype as string]?.label || 'Block' : 'Inspector'}
        </p>
        <p className="text-2xs text-text-muted mt-0.5">
          {node ? `${node.type} block` : 'Select a block to configure'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle flex-shrink-0">
        {([['configure', 'Configure'], ['history', 'History']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2 text-center text-2xs font-semibold border-b-2 relative transition-colors ${tab === key ? 'text-brand border-brand' : 'text-text-muted border-transparent hover:text-text-secondary'}`}>
            {label}
            {key === 'configure' && errors.length > 0 && (
              <span className="absolute top-1.5 right-4 w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </div>

      {tab === 'configure' ? (
        <ConfigureTab selectedId={selectedId} nodes={nodes} onUpdateNode={onUpdateNode} />
      ) : (
        <HistoryTab workflowId={workflowId} />
      )}
    </div>
  );
}

// ── React Flow Canvas ─────────────────────────────────────────────────────────
// ── Workflow NLP Parser (replaced by LLM backend — kept as reference) ─────────

// ── Workflow AI Chat Bar — persistent input, like the flow builder NLP bar ────
function WorkflowChatWidget({
  setNodes, setEdges, workflowId, onWorkflowCreated,
}: {
  setNodes: (u: (ns: Node[]) => Node[]) => void;
  setEdges: (u: (es: Edge[]) => Edge[]) => void;
  workflowId: string | null;
  onWorkflowCreated: (id: string, name: string) => void;
}) {
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [toast,    setToast]    = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateMutation = useGenerateWorkflow();
  const chatMutation     = useChatWorkflow();

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  };

  const applyDto = (dto: import('../types/crm.types').CrmWorkflowDetailDto) => {
    const { nodes: newNodes, edges: newEdges } = stepsToGraph(dto.steps, dto.triggerType);
    setNodes(() => newNodes);
    setEdges(() => newEdges);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setLoading(true);
    try {
      if (!workflowId) {
        // Generate mode — no workflow exists yet
        // Interceptor unwraps ServiceResult<T> at runtime; cast reflects that
        const dto = await generateMutation.mutateAsync({ Instruction: text }) as unknown as import('../types/crm.types').CrmWorkflowDetailDto;
        applyDto(dto);
        onWorkflowCreated(dto.id, dto.name);
        showToast(`✅ "${dto.name}" created — ${dto.steps.length} step${dto.steps.length !== 1 ? 's' : ''}`);
      } else {
        // Chat-modify mode — refine existing workflow
        const dto = await chatMutation.mutateAsync({ id: workflowId, message: text }) as unknown as import('../types/crm.types').CrmWorkflowDetailDto;
        applyDto(dto);
        showToast(`✅ Workflow updated — ${dto.steps.length} step${dto.steps.length !== 1 ? 's' : ''}`);
      }
    } catch {
      // errors already handled by mutation onError toast
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
  };

  return (
    <div
      className="absolute z-10 flex flex-col items-center gap-2"
      style={{ bottom: 33, left: '50%', transform: 'translateX(-50%)', width: 560, maxWidth: 'calc(100% - 380px)' }}
    >
      {/* Toast response — fades above the bar */}
      {toast && (
        <div
          className="w-full px-4 py-2 rounded-xl text-[11px] font-medium text-center"
          style={{
            background: 'rgba(5,150,105,0.12)',
            border: '1px solid rgba(5,150,105,0.3)',
            color: '#6EE7B7',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Chat input bar — same style as the flow builder NLP bar */}
      <div
        className="w-full flex items-center gap-2.5 px-3 py-2"
        style={{
          background: '#0F1E1A',
          border: `1px solid ${workflowId ? '#1C3B52' : '#1C4132'}`,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* AI icon — green = generate, blue = modify */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: workflowId ? 'linear-gradient(135deg,#1D4ED8,#3B82F6)' : 'linear-gradient(135deg,#047857,#059669)' }}
        >
          {loading
            ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" strokeWidth={2} />
            : <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2} />}
        </div>

        {/* Mode label */}
        <span className="text-[10px] font-bold shrink-0 uppercase tracking-wider" style={{ color: workflowId ? '#60A5FA' : '#34D399' }}>
          {workflowId ? 'Modify' : 'Generate'}
        </span>

        {/* Input */}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={workflowId
            ? 'Describe a change… e.g. "Add a 1-day wait before the task"'
            : 'Describe your workflow… e.g. "When a deal closes, send email to contact"'}
          disabled={loading}
          className="nodrag nopan flex-1 min-w-0 bg-transparent text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-50"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
          style={{ background: input.trim() && !loading ? 'linear-gradient(135deg,#059669,#10B981)' : 'transparent', border: input.trim() && !loading ? 'none' : '1px solid #1C4132' }}
        >
          <Send className="w-3.5 h-3.5" style={{ color: input.trim() && !loading ? '#fff' : '#4A5C52' }} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function WfCanvas({ nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges, onPaneClick, rfRef, workflowId, onWorkflowCreated, showForm }: {
  nodes: Node[]; edges: Edge[]; onNodesChange: OnNodesChange; onEdgesChange: OnEdgesChange;
  setNodes: (u: (ns: Node[]) => Node[]) => void;
  setEdges: (u: (es: Edge[]) => Edge[]) => void;
  onPaneClick: () => void;
  rfRef: React.MutableRefObject<ReactFlowInstance | null>;
  workflowId: string | null;
  onWorkflowCreated: (id: string, name: string) => void;
  showForm: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const isEmpty = nodes.filter((n) => n.type !== 'trigger' && n.type !== 'end').length === 0;

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const subtype = e.dataTransfer.getData('application/wf-block');
    if (!subtype || !rfRef.current) return;
    const meta = META[subtype]; if (!meta) return;
    const pos = rfRef.current.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const newId = `node-${subtype}-${Date.now()}`;
    const nodeType = subtype === 'end' ? 'end' : meta.kind;
    const newNode: Node = { id: newId, type: nodeType, position: pos, data: { subtype, label: meta.label, config: {} } };
    setNodes((ns) => autoLayout([...ns, newNode], edges));
  }, [rfRef, setNodes, edges]);

  const onConnect = useCallback((conn: Parameters<typeof addEdge>[0]) => {
    setEdges((es) => {
      const updated = addEdge(makeEdge(conn.source ?? '', conn.target ?? '', conn.sourceHandle ?? undefined), es);
      setTimeout(() => setNodes((ns) => autoLayout(ns, updated)), 30);
      return updated;
    });
  }, [setEdges, setNodes]);

  const nodeCount   = nodes.filter((n) => n.type !== 'end').length;
  const errorCount  = nodes.filter((n) => validateNode(n).length > 0).length;

  return (
    <div ref={containerRef} className="flex-1 relative crm-wf"
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      style={{ outline: isDragOver ? '2px dashed rgba(0,217,138,0.3)' : undefined, outlineOffset: '-10px' }}
    >
      <style dangerouslySetInnerHTML={{ __html: CANVAS_CSS }} />

      {/* Left panel: Palette or Form */}
      {showForm ? (
        <CreateWorkflowForm onGenerate={(triggerType, conditionsJson, steps) => {
          const graph = stepsToGraph(steps, triggerType, conditionsJson);
          setNodes(() => graph.nodes);
          setEdges(() => graph.edges);
        }} />
      ) : (
        <FloatingPalette />
      )}

      {/* Canvas stat pill */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-shell border border-border-subtle text-2xs text-text-muted"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
        <span>{nodeCount} block{nodeCount !== 1 ? 's' : ''}</span>
        {errorCount > 0 && (
          <span className="flex items-center gap-1 text-red-400">
            <AlertCircle className="w-3 h-3" /> {errorCount} issue{errorCount !== 1 ? 's' : ''}
          </span>
        )}
        {errorCount === 0 && nodeCount > 0 && <CheckCircle2 className="w-3 h-3 text-success" />}
      </div>

      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        defaultEdgeOptions={DEFAULT_EDGE_OPTS}
        proOptions={{ hideAttribution: true }}
        onInit={(inst) => {
          rfRef.current = inst;
          setTimeout(() => {
            const w = containerRef.current?.offsetWidth ?? 900;
            const ns = inst.getNodes();
            if (ns.length > 0) {
              inst.fitView({ padding: 0.15, maxZoom: 1, duration: 0 });
              inst.setViewport({ ...inst.getViewport(), y: 80 }, { duration: 0 });
            } else {
              inst.setViewport({ x: w / 2, y: 80, zoom: 1 }, { duration: 0 });
            }
          }, 60);
        }}
        onPaneClick={onPaneClick}
        deleteKeyCode={['Delete', 'Backspace']}
        snapToGrid snapGrid={[16, 16]}
        style={{ background: '#0A0F0D' }}
      >
        <Background color="#1E2E26" gap={20} size={1} />
        <Controls showInteractive={false} className="!shadow-none" />
        <MiniMap
          nodeColor={(n) => n.type === 'trigger' ? '#3B82F6' : n.type === 'action' ? '#10B981' : n.type === 'condition' ? '#D97706' : n.type === 'delay' ? '#7C3AED' : '#4A5C52'}
          maskColor="rgba(10,15,13,0.8)"
          className="!bg-bg-shell !border-border-subtle !rounded-lg"
        />
      </ReactFlow>

      {/* Empty state */}
      {isEmpty && !isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingLeft: 160 }}>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center border border-dashed border-border-medium">
              <Plus className="w-5 h-5 text-text-muted opacity-40" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-text-muted">Drag blocks from the left panel</p>
            <p className="text-2xs text-text-muted mt-1 opacity-60">or use <span style={{ color: '#10B981' }}>Build with AI</span> ↘</p>
          </div>
        </div>
      )}

      {/* Build-with-AI chat — bottom-right, side of minimap */}
      <WorkflowChatWidget setNodes={setNodes} setEdges={setEdges} workflowId={workflowId} onWorkflowCreated={onWorkflowCreated} />
    </div>
  );
}

// ── Workflow Builder — full-screen portal ─────────────────────────────────────
function WorkflowBuilder({ workflow, onBack }: { workflow: CrmWorkflowSummaryDto | null; onBack: () => void }) {
  const [name,          setName]          = useState(workflow?.name ?? '');
  const [isActive,      setIsActive]      = useState(workflow?.isActive ?? true);
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [isSaving,      setIsSaving]      = useState(false);
  const [isDirty,       setIsDirty]       = useState(false);
  const [insertTarget,  setInsertTarget]  = useState<InsertTarget>(null);
  const [aiWorkflowId,  setAiWorkflowId]  = useState<string | null>(workflow?.id ?? null);
  const [showForm,      setShowForm]      = useState(false);
  const rfRef    = useRef<ReactFlowInstance | null>(null);
  const mountRef = useRef(false);

  const initial = useMemo(() => {
    const g = stepsToGraph(workflow?.steps ?? [], workflow?.triggerType ?? CrmWorkflowTriggerType.DealStageChanged);
    return { nodes: autoLayout(g.nodes, g.edges), edges: g.edges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  const createWf = useCreateWorkflow();
  const updateWf = useUpdateWorkflow();

  // Track unsaved changes (skip first render)
  const nodesLen = nodes.length; const edgesLen = edges.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => { if (mountRef.current) setIsDirty(true); else mountRef.current = true; }, [nodesLen, edgesLen, name, isActive]);

  const handleDelete = useCallback((id: string) => {
    if (id === 'node-end') return;
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => {
      const inE = es.find((e) => e.target === id);
      const outE = es.find((e) => e.source === id);
      const rest = es.filter((e) => e.source !== id && e.target !== id);
      const rewired = inE && outE ? [...rest, makeEdge(inE.source, outE.target)] : rest;
      setTimeout(() => setNodes((ns) => autoLayout(ns, rewired)), 30);
      return rewired;
    });
    setSelectedId(null);
  }, [setNodes, setEdges]);

  const handleUpdateNode = useCallback((id: string, patch: UpdatePatch) => {
    setNodes((ns) => ns.map((n) => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
  }, [setNodes]);

  const handleInsertAfterEdge = useCallback((edgeId: string, x: number, y: number) => {
    setInsertTarget({ edgeId, x, y });
  }, []);

  const handleQuickInsert = useCallback((edgeId: string, subtype: string) => {
    const edge = edges.find((e) => e.id === edgeId); if (!edge) return;
    const meta = META[subtype]; if (!meta) return;
    const newId = `node-${subtype}-${Date.now()}`;
    const srcNode = nodes.find((n) => n.id === edge.source);
    const tgtNode = nodes.find((n) => n.id === edge.target);
    const midPos = { x: ((srcNode?.position.x ?? 0) + (tgtNode?.position.x ?? 0)) / 2, y: ((srcNode?.position.y ?? 0) + (tgtNode?.position.y ?? 0)) / 2 };
    const newNode: Node = { id: newId, type: subtype === 'end' ? 'end' : meta.kind, position: midPos, data: { subtype, label: meta.label, config: {} } };
    setNodes((ns) => [...ns, newNode]);
    setEdges((es) => {
      const rest = es.filter((e) => e.id !== edgeId);
      const newEs = [...rest, makeEdge(edge.source, newId, edge.sourceHandle ?? undefined), makeEdge(newId, edge.target)];
      setTimeout(() => setNodes((ns) => autoLayout(ns, newEs)), 30);
      return newEs;
    });
  }, [edges, nodes, setNodes, setEdges]);

  const nodeErrorMap = useMemo(() => {
    const m = new Map<string, string[]>();
    nodes.forEach((n) => { const e = validateNode(n); if (e.length) m.set(n.id, e); });
    return m;
  }, [nodes]);

  const totalErrors = Array.from(nodeErrorMap.values()).reduce((s, e) => s + e.length, 0);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const steps = graphToSteps(nodes, edges);
      const trigNode = nodes.find((n) => n.type === 'trigger');
      // Prefer the explicit apiTriggerType the user chose in Configure; fall back to subtype mapping
      const trigCfg = (trigNode?.data.config as Record<string,string>) ?? {};
      // API_TO_TRIGGER is the reverse of TRIGGER_TO_API — both use dot-notation keys.
      const triggerType = (trigCfg.apiTriggerType && API_TO_TRIGGER[trigCfg.apiTriggerType])
        || SUBTYPE_TO_TRIGGER[(trigNode?.data.subtype as string) ?? 'trigger']
        || CrmWorkflowTriggerType.Manual;
      const triggerConditionsJson = (trigCfg.conditionsJson as string)?.trim() || undefined;
      // Always send the dot-notation string so the workflow engine can match it.
      const apiTriggerType = trigCfg.apiTriggerType || TRIGGER_TO_API[triggerType] || 'manual';
      const payload = { name: name.trim(), triggerType: apiTriggerType, triggerConditionsJson, isActive, steps } as CrmWorkflowCreateRequest & { isActive: boolean };
      const existingId = workflow?.id ?? aiWorkflowId;
      if (existingId) await updateWf.mutateAsync({ id: existingId, data: payload as CrmWorkflowUpdateRequest });
      else            await createWf.mutateAsync(payload as CrmWorkflowCreateRequest);
      setIsDirty(false);
      onBack();
    } finally { setIsSaving(false); }
  };

  const ctxValue = useMemo<ICtx>(() => ({
    selectedId, onSelect: setSelectedId, onDelete: handleDelete,
    getErrors: (id) => nodeErrorMap.get(id) ?? [],
    onInsertAfterEdge: handleInsertAfterEdge,
  }), [selectedId, handleDelete, nodeErrorMap, handleInsertAfterEdge]);

  return createPortal(
    <Ctx.Provider value={ctxValue}>
      <div className="fixed inset-0 z-[200] flex flex-col bg-bg">

        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-4 h-14 shrink-0 border-b border-border-subtle bg-bg-shell">
          <button onClick={onBack} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-glass-1 transition-all">
            <ArrowLeft className="w-4 h-4" strokeWidth={1.6} />
          </button>
          <div className="w-px h-5 bg-border-subtle" />
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-brand-soft border border-brand/30 flex items-center justify-center">
              <Zap className="w-3 h-3 text-brand" strokeWidth={2} />
            </div>
            <span className="text-2xs font-bold text-text-muted uppercase tracking-wider hidden sm:block">Workflow Builder</span>
          </div>

          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workflow name…"
            className="flex-1 min-w-0 px-3 py-1.5 rounded-lg text-sm font-semibold text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent border border-border-subtle focus:border-brand"
          />

          {/* Unsaved dot */}
          {isDirty && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-2xs text-text-muted hidden sm:block">Unsaved</span>
            </div>
          )}

          {/* Error badge */}
          {totalErrors > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 shrink-0">
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span className="text-[10px] font-bold text-red-400">{totalErrors}</span>
            </div>
          )}

          {/* Palette / Form toggle */}
          <button onClick={() => setShowForm((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-2xs font-semibold transition-all shrink-0 ${showForm ? 'bg-brand-soft text-brand border border-border-glow' : 'bg-transparent text-text-muted border border-border-subtle hover:text-text-secondary'}`}>
            {showForm ? 'Palette' : 'Form'}
          </button>

          {/* Active toggle */}
          <button onClick={() => setIsActive((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-2xs font-semibold transition-all shrink-0"
            style={{ background: isActive ? 'rgba(0,217,138,0.08)' : 'transparent', border: `1px solid ${isActive ? 'rgba(0,217,138,0.25)' : '#14302A'}`, color: isActive ? '#00D98A' : '#7A9B8E' }}>
            {isActive ? <ToggleRight className="w-3.5 h-3.5" strokeWidth={1.8} /> : <ToggleLeft className="w-3.5 h-3.5" strokeWidth={1.8} />}
            {isActive ? 'Active' : 'Paused'}
          </button>

          {/* Save */}
          <button onClick={handleSave} disabled={isSaving || !name.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-bold text-white border-none disabled:opacity-50 transition-all shrink-0"
            style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" strokeWidth={2} />}
            Save
          </button>
        </div>

        {/* ── Canvas + Right panel ── */}
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100% - 56px)' }}>
          <WfCanvas
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            setNodes={setNodes} setEdges={setEdges}
            onPaneClick={() => setSelectedId(null)}
            rfRef={rfRef}
            workflowId={aiWorkflowId}
            showForm={showForm}
            onWorkflowCreated={(id, wfName) => { setAiWorkflowId(id); setName(wfName); setIsDirty(true); }}
          />
          <RightPanel
            selectedId={selectedId} nodes={nodes}
            workflowId={workflow?.id ?? null}
            onUpdateNode={handleUpdateNode}
          />
        </div>
      </div>

      <QuickInsertMenu target={insertTarget} onInsert={handleQuickInsert} onClose={() => setInsertTarget(null)} />
    </Ctx.Provider>,
    document.body,
  );
}

// ── Workflow list card ─────────────────────────────────────────────────────────
const TRIG_CLR: Record<string, string> = {
  'funnel.stage_changed':'#00D98A', 'deal.stage_changed':'#00D98A',
  'support_case.created':'#D97706', 'support_case.escalated':'#F472B6',
  'lead.score_threshold':'#A78BFA', 'task.due_soon':'#60A5FA',
  'manual':'#7A9B8E', 'agent.handoff_requested':'#60A5FA', 'lead.re_engaged':'#00FFA3',
};
const TRIG_LBL: Record<string, string> = {
  'funnel.stage_changed':'Funnel Stage Changed', 'deal.stage_changed':'Deal Stage Changed',
  'support_case.created':'Support Case Opens',   'support_case.escalated':'Case Escalated',
  'lead.score_threshold':'Lead Score Threshold', 'task.due_soon':'Task Due Soon',
  'manual':'Manual', 'agent.handoff_requested':'Agent Handoff', 'lead.re_engaged':'Lead Re-engaged',
};
const ACTION_PILL: Record<string, { label: string; color: string }> = {
  'create_task':         { label: 'Create Task',   color: '#10B981' },
  'send_notification':   { label: 'Notify',        color: '#D97706' },
  'update_funnel_stage': { label: 'Update Stage',  color: '#7C3AED' },
  'assign_to_user':      { label: 'Assign',        color: '#3B82F6' },
  'create_nurture_entry':{ label: 'Nurture',       color: '#EC4899' },
  'send_email':          { label: 'Send Email',    color: '#60A5FA' },
  'adjust_lead_score':   { label: 'Score Adjust',  color: '#F59E0B' },
  'create_deal':         { label: 'Create Deal',   color: '#00D98A' },
};

function WorkflowCard({ wf, onOpen, onRun, onDelete, onToggle }: {
  wf: CrmWorkflowSummaryDto; onOpen:()=>void; onRun:()=>void; onDelete:()=>void; onToggle:()=>void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const clr = TRIG_CLR[wf.triggerType] ?? '#7A9B8E';
  const stepCount = wf.steps?.length ?? 0;
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 cursor-pointer hover:brightness-110 transition-all bg-bg-card border border-border-subtle"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }} onClick={onOpen}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-bg-elevated border border-border-subtle">
          <Zap className="w-4 h-4" style={{ color: clr }} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary truncate">{wf.name}</p>
          <p className="text-2xs mt-0.5 font-medium" style={{ color: clr }}>{TRIG_LBL[wf.triggerType] ?? 'Trigger'}</p>
        </div>
        <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: wf.isActive ? '#00D98A' : '#14302A' }} title={wf.isActive ? 'Active' : 'Paused'} />
      </div>

      {stepCount > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {(wf.steps ?? []).slice(0, 4).map((step) => {
            const pm = ACTION_PILL[step.actionType]; if (!pm) return null;
            return <span key={step.id} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-bg-elevated border border-border-subtle" style={{ color: pm.color }}>{pm.label}</span>;
          })}
          {stepCount > 4 && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-bg-elevated border border-border-subtle text-text-muted">+{stepCount - 4}</span>}
        </div>
      ) : (
        <p className="text-2xs text-text-muted italic">No steps — open to build</p>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
        <span className="text-[10px] text-text-muted flex-1">
          {wf.executionCount ?? 0} run{(wf.executionCount ?? 0) !== 1 ? 's' : ''}
          {wf.lastTriggeredAt ? ` · last ${format(parseISO(wf.lastTriggeredAt), 'MMM d')}` : ''}
        </span>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-glass-1 transition-all" style={{ color: wf.isActive ? '#00D98A' : '#7A9B8E' }}>
            {wf.isActive ? <ToggleRight className="w-3.5 h-3.5" strokeWidth={1.6} /> : <ToggleLeft className="w-3.5 h-3.5" strokeWidth={1.6} />}
          </button>
          <button onClick={onRun} className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand-soft transition-all">
            <Play className="w-3.5 h-3.5" strokeWidth={1.6} />
          </button>
          {confirmDel ? (
            <div className="flex items-center gap-1">
              <button onClick={onDelete} className="px-2 py-0.5 rounded text-[10px] font-bold bg-danger-soft text-danger border border-danger/20">Delete</button>
              <button onClick={() => setConfirmDel(false)} className="text-[10px] text-text-muted px-1">✕</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all">
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page component ─────────────────────────────────────────────────────────────
export function Component() {
  const [builderTarget, setBuilderTarget] = useState<CrmWorkflowSummaryDto | null | 'new'>(null);
  const [activeFilter, setActiveFilter]   = useState<boolean | undefined>(undefined);
  const { data: raw, isLoading } = useWorkflows({ isActive: activeFilter });
  const items: CrmWorkflowSummaryDto[] = (raw as { items?: CrmWorkflowSummaryDto[] })?.items ?? [];
  const updateWf = useUpdateWorkflow();
  const deleteWf = useDeleteWorkflow();
  const runWf    = useRunWorkflow();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Workflows</h2>
          <p className="text-xs text-text-muted mt-0.5">Automate CRM actions triggered by events</p>
        </div>
        <button onClick={() => setBuilderTarget('new')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white border-none transition-all"
          style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Workflow
        </button>
      </div>

      <div className="flex items-center gap-2">
        {([['All', undefined], ['Active', true], ['Paused', false]] as const).map(([label, val]) => (
          <button key={label} onClick={() => setActiveFilter(val)}
            className={`px-3.5 py-1.5 rounded-full text-2xs font-semibold transition-all border ${activeFilter === val ? 'bg-brand-soft border-brand/30 text-brand' : 'bg-bg-card border-border-subtle text-text-muted hover:text-text-secondary'}`}>
            {label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-text-muted">{items.length} workflow{items.length !== 1 ? 's' : ''}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-text-muted" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 gap-4 rounded-2xl bg-bg-card border border-border-subtle">
          <Activity className="w-8 h-8 text-text-muted opacity-20" strokeWidth={1.2} />
          <p className="text-sm text-text-muted">No workflows yet</p>
          <button onClick={() => setBuilderTarget('new')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Create your first workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((wf) => (
            <WorkflowCard key={wf.id} wf={wf}
              onOpen={() => setBuilderTarget(wf)}
              onRun={() => runWf.mutate(wf.id)}
              onDelete={() => deleteWf.mutate(wf.id)}
              onToggle={() => updateWf.mutate({ id: wf.id, data: { isActive: !wf.isActive } as CrmWorkflowUpdateRequest })}
            />
          ))}
        </div>
      )}

      {builderTarget !== null && (
        <WorkflowBuilder workflow={builderTarget === 'new' ? null : builderTarget} onBack={() => setBuilderTarget(null)} />
      )}
    </div>
  );
}
