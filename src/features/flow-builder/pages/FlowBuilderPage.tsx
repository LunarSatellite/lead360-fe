import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Node,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Loader2,
  Send,
  Save,
  Rocket,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  FolderOpen,
  X,
  Check,
  Pencil,
  Mic,
  Smile,
  Paperclip,
} from 'lucide-react';
import {
  useFlows,
  useFlowById,
  useGenerateFlow,
  useChatModifyFlow,
  useActivateFlow,
  useDuplicateFlow,
  useDeleteFlow,
  useFlowRuntimeMessage,
  useFlowValidation,
  useSaveFlow,
} from '../api/flow.queries';
import { useFlowEditor } from '../hooks/useFlowEditor';
import { useChannels } from '@/features/channels/api/channels.queries';
import { CHANNEL_TYPE_LABEL, type ChannelConnectionDto } from '@/features/channels/types/channels.types';
import { TriggerNode } from '../components/CustomNodes/TriggerNode';
import { AiNode } from '../components/CustomNodes/AiNode';
import { ConditionNode } from '../components/CustomNodes/ConditionNode';
import { ResponseNode } from '../components/CustomNodes/ResponseNode';
import { ApiNode } from '../components/CustomNodes/ApiNode';
import { ActionNode } from '../components/CustomNodes/ActionNode';
import { CatalogNode } from '../components/CustomNodes/CatalogNode';
import { FlowSimulator } from '../components/FlowSimulator';
import { VoiceButton } from '@/features/voice/components/VoiceButton';
import { useTranscribeAudio } from '@/features/voice/api/voice.queries';
import {
  NODE_TYPE_META,
  FLOW_STATUS_LABEL,
  type FlowDto,
  type FlowNodeData,
  type FlowNodeTypeValue,
  type FlowValidationResult,
  type FlowValidationIssue,
  type FlowSaveRequest,
} from '../types/flow.types';
import { type FlowRuntimeResult, type FlowMenuItemDto } from '../types/flow-runtime.types';
import { detectGaps, getNodeGap, unresolvedCount } from '../utils/gap-detector';
import type { FlowNodeGap } from '../utils/gap-detector';
import { GapPrompt } from '../components/GapPrompt';

const nodeTypes = {
  trigger: TriggerNode,
  ai: AiNode,
  condition: ConditionNode,
  response: ResponseNode,
  api: ApiNode,
  action: ActionNode,
  catalog: CatalogNode,
};

const HINTS = [
  'Build order tracking flow',
  'Product menu with categories',
  'Customer support with sentiment',
  'Complaint handling flow',
];
const STEPS = [
  'Analyzing...',
  'Identifying paths...',
  'Designing architecture...',
  'Creating nodes...',
  'Connecting...',
];
const PAL = Object.entries(NODE_TYPE_META).map(([k, v]) => ({ type: k as FlowNodeTypeValue, ...v }));

/* ═══════════════════════════════════════════════════════════════
   FLOW BUILDER INNER
   ═══════════════════════════════════════════════════════════════ */
function FlowBuilderInner() {
  const { data: flowsRaw, isLoading } = useFlows();
  const flows = useMemo(() => (flowsRaw as unknown as FlowDto[]) ?? [], [flowsRaw]);
  const editor = useFlowEditor();
  const { data: loadedFlowRaw } = useFlowById(editor.flowId || undefined);
  const loadedFlow = loadedFlowRaw as unknown as FlowDto | undefined;

  useEffect(() => {
    if (loadedFlow && loadedFlow.nodes && loadedFlow.nodes.length > 0 && loadedFlow.id === editor.flowId)
      if (editor.nodes.length === 0) editor.setFlow(loadedFlow);
  }, [loadedFlow]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateFlow = useGenerateFlow();
  const chatModify = useChatModifyFlow();
  const activateFlow = useActivateFlow();
  const duplicateFlow = useDuplicateFlow();
  const deleteFlow = useDeleteFlow();
  const transcribe = useTranscribeAudio();

  const { data: validationRaw, refetch: refetchValidation } = useFlowValidation(editor.flowId ?? undefined);
  const validation = validationRaw as unknown as FlowValidationResult | undefined;

  const [nlpInput, setNlpInput] = useState('');
  const [thinkStep, setThinkStep] = useState(-1);
  const [chatInput, setChatInput] = useState('');
  const [chatMsgs, setChatMsgs] = useState<{ role: 'user' | 'bot'; text: string; isVoice?: boolean }[]>([
    {
      role: 'bot',
      text: '👋 Hi! Describe your bot above, or ask me to modify it.\n\nTry: "Add error handling", "Route complaints to agents"\n\n💡 Tap the mic to speak.',
    },
  ]);
  const [isAiChatRecording, setIsAiChatRecording] = useState(false);
  const [tab, setTab] = useState<0 | 1 | 2>(0);
  const [sel, setSel] = useState<Node<FlowNodeData> | null>(null);
  const [showList, setShowList] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [simSession] = useState(() => crypto.randomUUID());
  const [gaps, setGaps] = useState<FlowNodeGap[]>([]);

  const [aiPendingFlow, setAiPendingFlow] = useState<FlowDto | null>(null);
  const saveFlow = useSaveFlow();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingSaveRef = useRef(false);
  const prevSnapshotRef = useRef<{
    nodes: Node<FlowNodeData>[];
    edges: import('@xyflow/react').Edge[];
  } | null>(null);
  const { screenToFlowPosition } = useReactFlow();
  const autoLoadedRef = useRef(false);

  useEffect(() => {
    if (autoLoadedRef.current || flows.length === 0 || editor.flowId) return;
    autoLoadedRef.current = true;
    const active = flows.find((f) => f.isActive) || flows[0];
    if (active) editor.setFlow(active);
  }, [flows]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs.length]);

  // ── Real-time gap detection + issue level (instant, no API) ──
  useEffect(() => {
    if (editor.nodes.length === 0) {
      setGaps([]);
      return;
    }
    const computed = detectGaps(editor.nodes, editor.edges);
    setGaps(computed);

    const gapKeys = new Set(computed.filter((g) => !g.resolved).map((g) => g.nodeKey));
    const llmCritical = new Set(
      validation?.issues.filter((i) => i.severity === 1).flatMap((i) => i.affectedNodeKeys) ?? [],
    );
    const llmWarning = new Set(
      validation?.issues.filter((i) => i.severity === 2).flatMap((i) => i.affectedNodeKeys) ?? [],
    );
    const llmSuggest = new Set(
      validation?.issues.filter((i) => i.severity === 3).flatMap((i) => i.affectedNodeKeys) ?? [],
    );

    const updated = editor.nodes.map((n) => {
      const level = llmCritical.has(n.id)
        ? 'critical'
        : gapKeys.has(n.id)
          ? 'critical'
          : llmWarning.has(n.id)
            ? 'warning'
            : llmSuggest.has(n.id)
              ? 'suggestion'
              : null;
      return { ...n, data: { ...n.data, hasGap: gapKeys.has(n.id), issueLevel: level } as FlowNodeData };
    });
    // SET_NODES_VISUAL updates display (issueLevel/hasGap) without setting isDirty
    // so the validator never causes the auto-save to fire with bad state
    editor.dispatch({ type: 'SET_NODES_VISUAL', nodes: updated });
  }, [editor.nodes.length, editor.edges.length, validation]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced LLM validation (4s after last change) ──
  useEffect(() => {
    if (!editor.flowId) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      refetchValidation();
    }, 4000);
    return () => clearTimeout(debounceRef.current);
  }, [editor.nodes.length, editor.edges.length, editor.flowId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── NLP Generate ──
  const processNlp = useCallback(() => {
    if (!nlpInput.trim() || generateFlow.isPending) return;
    setThinkStep(0);
    const iv = setInterval(
      () =>
        setThinkStep((s) => {
          if (s >= STEPS.length - 1) {
            clearInterval(iv);
            return s;
          }
          return s + 1;
        }),
      800,
    );
    generateFlow.mutate(
      { Instruction: nlpInput.trim(), FlowName: nlpInput.trim().slice(0, 50) },
      {
        onSuccess: (f) => {
          clearInterval(iv);
          setThinkStep(-1);
          setNlpInput('');
          editor.setFlowWithLayout(f);
          setSel(null);
          setChatMsgs((p) => [
            ...p,
            {
              role: 'bot',
              text: `✨ Built "${f.name}" (${f.nodeCount} nodes, ${f.connectionCount} connections)`,
            },
          ]);
        },
        onError: () => {
          clearInterval(iv);
          setThinkStep(-1);
        },
      },
    );
  }, [nlpInput, generateFlow, editor]);

  // ── AI Chat ──
  const sendChatText = useCallback(
    (msg: string, isVoice = false) => {
      if (!msg.trim() || !editor.flowId || chatModify.isPending) return;
      if (editor.nodes.length === 0) {
        setChatMsgs((p) => [
          ...p,
          { role: 'user', text: msg },
          {
            role: 'bot',
            text: '⚠️ No flow loaded yet. Generate or load a flow first, then I can modify it.',
          },
        ]);
        return;
      }
      setChatMsgs((p) => [...p, { role: 'user', text: msg, isVoice }]);
      setChatInput('');
      chatModify.mutate(
        { id: editor.flowId, data: { Message: msg } },
        {
          onSuccess: (f) => {
            // Snapshot current state so the user can discard if needed
            prevSnapshotRef.current = {
              nodes: [...editor.nodes],
              edges: [...editor.edges],
            };
            // Update canvas with AI changes and apply layout
            editor.setFlowWithLayout(f);
            setSel(null);
            // Hold pending — let the user review on the canvas, then Save or Discard
            setAiPendingFlow(f);
            setChatMsgs((p) => [
              ...p,
              {
                role: 'bot',
                text: `✅ v${f.version}: ${f.nodeCount} nodes — review the changes, then tap Save or Discard.`,
              },
            ]);
          },
          onError: (err) => {
            const msg = (err as Error)?.message || 'Unknown error';
            const friendly =
              msg.includes('parse') || msg.includes('JSON')
                ? `❌ The AI returned an unexpected response. Try a simpler request.\n\nDetail: ${msg}`
                : msg.includes('budget') || msg.includes('token')
                  ? `❌ Token budget reached. Please wait a moment and try again.`
                  : msg.includes('No LLM provider')
                    ? `❌ No AI provider is configured. Check your LLM settings.`
                    : msg.includes('trigger')
                      ? `❌ The AI generated an invalid flow (missing trigger). Try again.`
                      : msg.includes('node type')
                        ? `❌ The AI used an unrecognised node type. Try a simpler request.`
                        : `❌ ${msg}`;
            setChatMsgs((p) => [...p, { role: 'bot', text: friendly }]);
          },
        },
      );
    },
    [editor, chatModify],
  );

  const sendChat = useCallback(() => sendChatText(chatInput.trim()), [chatInput, sendChatText]);

  const handleAiChatVoice = useCallback(
    async (blob: Blob) => {
      setIsAiChatRecording(false);
      if (!editor.flowId || chatModify.isPending || transcribe.isPending) return;
      try {
        const result = await transcribe.mutateAsync({ audio: blob });
        const text = result.text?.trim();
        if (!text) {
          setChatMsgs((p) => [...p, { role: 'bot', text: 'Could not understand the audio.' }]);
          return;
        }
        sendChatText(text, true);
      } catch {
        setChatMsgs((p) => [...p, { role: 'bot', text: '❌ Voice transcription failed.' }]);
      }
    },
    [editor.flowId, chatModify.isPending, transcribe, sendChatText],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow-type') as FlowNodeTypeValue;
      if (!type || !NODE_TYPE_META[type]) return;
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      editor.addNode(type, `New ${NODE_TYPE_META[type].label}`, pos.x, pos.y);
    },
    [screenToFlowPosition, editor],
  );

  const updateNodeData = useCallback(
    (nodeId: string, patch: Partial<FlowNodeData>) => {
      const newNodes = editor.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...patch } as FlowNodeData } : n,
      );
      editor.dispatch({ type: 'SNAPSHOT' });
      editor.dispatch({ type: 'SET_NODES', nodes: newNodes });
      if (sel?.id === nodeId)
        setSel((prev) => (prev ? { ...prev, data: { ...prev.data, ...patch } as FlowNodeData } : prev));
    },
    [editor, sel],
  );

  const saveGapResolution = useCallback(
    (nodeId: string, resolution: Record<string, unknown>) => {
      // 1. Apply config change
      const withConfig = editor.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        return {
          ...n,
          data: {
            ...n.data,
            config: { ...((n.data as FlowNodeData).config ?? {}), ...resolution },
          } as FlowNodeData,
        };
      });

      // 2. Immediately re-detect gaps on updated nodes (don't wait for useEffect)
      const newGaps = detectGaps(withConfig as Node<FlowNodeData>[], editor.edges);
      setGaps(newGaps);

      // 3. Apply issueLevel from both fresh gaps and existing LLM validation
      const gapKeys = new Set(newGaps.filter((g) => !g.resolved).map((g) => g.nodeKey));
      const llmCritical = new Set(
        validation?.issues.filter((i) => i.severity === 1).flatMap((i) => i.affectedNodeKeys) ?? [],
      );
      const llmWarning = new Set(
        validation?.issues.filter((i) => i.severity === 2).flatMap((i) => i.affectedNodeKeys) ?? [],
      );
      const llmSuggest = new Set(
        validation?.issues.filter((i) => i.severity === 3).flatMap((i) => i.affectedNodeKeys) ?? [],
      );

      const withLevels = withConfig.map((n) => {
        const level = llmCritical.has(n.id)
          ? 'critical'
          : gapKeys.has(n.id)
            ? 'critical'
            : llmWarning.has(n.id)
              ? 'warning'
              : llmSuggest.has(n.id)
                ? 'suggestion'
                : null;
        return { ...n, data: { ...n.data, hasGap: gapKeys.has(n.id), issueLevel: level } as FlowNodeData };
      });

      // 4. Save real config changes (triggers isDirty + auto-save)
      editor.dispatch({ type: 'SNAPSHOT' });
      editor.dispatch({ type: 'SET_NODES', nodes: withConfig });
      // Update visual issueLevel separately — does NOT re-trigger auto-save
      editor.dispatch({ type: 'SET_NODES_VISUAL', nodes: withLevels });

      // 5. Keep selected node in sync so Configure tab reflects cleared state
      if (sel?.id === nodeId) {
        const updated = withLevels.find((n) => n.id === nodeId);
        if (updated) setSel(updated as Node<FlowNodeData>);
      }

      // 6. Signal: fire a real backend save on the next render
      //    (can't call manualSave() now — its closure has the OLD state)
      pendingSaveRef.current = true;
    },
    [editor, validation, sel],
  );

  // Runs after every render. When pendingSaveRef is set, manualSave() now has
  // the fresh state closure (post-dispatch re-render) and saves immediately.
  useEffect(() => {
    if (pendingSaveRef.current && editor.flowId) {
      pendingSaveRef.current = false;
      editor.manualSave();
    }
  });

  // ── AI pending flow: save or discard ──
  const buildSaveRequest = useCallback(
    (f: FlowDto): FlowSaveRequest => ({
      Name: f.name,
      Description: f.description ?? null,
      Nodes: f.nodes.map((n, i) => ({
        NodeKey: n.nodeKey,
        NodeType: n.nodeType,
        Name: n.name,
        PositionX: n.positionX,
        PositionY: n.positionY,
        ConfigurationJson: n.configurationJson ?? '{}',
        SortOrder: i,
        IsEntryPoint: n.isEntryPoint,
        IntentId: n.intentId ?? null,
        CapabilityId: n.capabilityId ?? null,
        ApiEndpointId: n.apiEndpointId ?? null,
      })),
      Connections: f.connections.map((c, i) => ({
        FromNodeKey: c.fromNodeKey,
        ToNodeKey: c.toNodeKey,
        ConditionLabel: c.conditionLabel,
        SortOrder: i,
      })),
    }),
    [],
  );

  const saveAiChanges = useCallback(() => {
    if (!aiPendingFlow) return;
    saveFlow.mutate(
      { id: aiPendingFlow.id, data: buildSaveRequest(aiPendingFlow) },
      {
        onSuccess: () => {
          setChatMsgs((p) => [...p, { role: 'bot', text: '💾 Changes saved!' }]);
          setAiPendingFlow(null);
          prevSnapshotRef.current = null;
        },
        onError: () => {
          setChatMsgs((p) => [
            ...p,
            { role: 'bot', text: '❌ Save failed. Try the 💾 button in the toolbar.' },
          ]);
        },
      },
    );
  }, [aiPendingFlow, saveFlow, buildSaveRequest]);

  const discardAiChanges = useCallback(() => {
    if (!prevSnapshotRef.current) return;
    editor.dispatch({ type: 'SET_NODES', nodes: prevSnapshotRef.current.nodes });
    editor.dispatch({ type: 'SET_EDGES', edges: prevSnapshotRef.current.edges });
    setAiPendingFlow(null);
    prevSnapshotRef.current = null;
    setChatMsgs((p) => [...p, { role: 'bot', text: '↩ Changes discarded.' }]);
  }, [editor]);

  // Helpers for inline issues display
  const nameMap = useMemo(
    () => new Map(editor.nodes.map((n) => [n.id, (n.data as FlowNodeData).label])),
    [editor.nodes],
  );

  function cleanIssueText(text: string, affectedKeys: string[]): string {
    let result = text
      .replace(/\bn\d+\b/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    affectedKeys.forEach((key) => {
      const name = nameMap.get(key);
      if (name) result = result.replace(new RegExp(key, 'g'), `"${name}"`);
    });
    return result;
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    );

  /* ═══ PREVIEW ═══ */
  if (showPreview)
    return (
      <div
        className="flex flex-col rounded-2xl border border-border-subtle bg-bg"
        style={{ height: 'calc(100vh - 180px)', minHeight: 500 }}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle flex-shrink-0">
          <h3 className="text-sm font-bold text-text-primary">📱 Multi-Channel Live Preview</h3>
          <button
            onClick={() => setShowPreview(false)}
            className="px-3 py-1.5 rounded-lg text-2xs font-semibold border border-border-subtle hover:bg-glass-1 transition-colors"
          >
            ← Back to Builder
          </button>
        </div>
        <PreviewPanel sessionId={simSession} />
      </div>
    );

  /* ═══ MAIN ═══ */
  const totalIssues = unresolvedCount(gaps) + (validation?.issues.length ?? 0);
  const hasCritical =
    unresolvedCount(gaps) > 0 || (validation?.issues.some((i) => i.severity === 1) ?? false);

  return (
    <div
      className="flex rounded-2xl border border-border-subtle bg-bg"
      style={{ height: 'calc(100vh - 180px)', minHeight: 630 }}
    >
      {/* ═══ LEFT CANVAS ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* NLP Bar */}
        <div className="flex-shrink-0 px-4 pt-3 pb-1 relative z-20">
          <div className="max-w-[560px] mx-auto">
            <div
              className="rounded-2xl overflow-hidden bg-bg-shell border border-border-subtle"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}
            >
              <div className="flex items-center p-2 gap-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#047857,#059669)' }}
                >
                  ✨
                </div>
                <input
                  value={nlpInput}
                  onChange={(e) => setNlpInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && processNlp()}
                  placeholder="Describe your bot..."
                  disabled={generateFlow.isPending}
                  className="flex-1 bg-transparent border-none outline-none text-sm py-2.5 px-2 text-text-primary placeholder:text-text-muted"
                />
                <button
                  onClick={processNlp}
                  disabled={generateFlow.isPending || !nlpInput.trim()}
                  className="w-10 h-10 rounded-xl border-none text-white text-lg cursor-pointer flex-shrink-0 flex items-center justify-center disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
                >
                  {generateFlow.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : '→'}
                </button>
              </div>
              {generateFlow.isPending && thinkStep >= 0 && (
                <div
                  className="px-4 pb-3 pt-2 border-t border-border-subtle"
                  style={{
                    background:
                      'linear-gradient(90deg,rgba(0,217,126,0.04),rgba(167,139,250,0.06),rgba(0,217,126,0.04))',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s linear infinite',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🧠</span>
                    <span className="text-xs font-bold text-brand">AI designing...</span>
                  </div>
                  {STEPS.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 text-xs mb-px"
                      style={{
                        color: i < thinkStep ? '#10B981' : i === thinkStep ? '#059669' : '#708A7E',
                        fontWeight: i === thinkStep ? 600 : 400,
                      }}
                    >
                      <span className="w-3 text-center">
                        {i < thinkStep ? '✓' : i === thinkStep ? '●' : '○'}
                      </span>
                      {s}
                    </div>
                  ))}
                </div>
              )}
              {!generateFlow.isPending && (
                <div className="px-4 pb-2.5 pt-1.5 border-t border-border-subtle bg-glass-1">
                  <div className="text-[11px] font-semibold text-text-muted mb-1.5">✨ Try:</div>
                  <div className="flex flex-wrap gap-1">
                    {HINTS.map((h) => (
                      <button
                        key={h}
                        onClick={() => setNlpInput(h)}
                        className="px-2.5 py-1 rounded-md text-2xs cursor-pointer bg-bg-shell border border-border-subtle text-text-secondary hover:border-brand hover:text-brand hover:bg-brand-soft transition-all"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative min-h-0">
          <div
            className="absolute left-4 top-2 bg-bg-shell rounded-xl p-3 z-10 select-none"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,.4)', width: 140 }}
          >
            <h4 className="text-[11px] font-bold text-text-muted uppercase mb-2 tracking-wider">
              Drag to canvas
            </h4>
            {PAL.map((p) => (
              <div
                key={p.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow-type', p.type);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onClick={() => editor.addNode(p.type, `New ${p.label}`)}
                className="flex items-center gap-2 px-2 py-[7px] rounded-lg text-2xs cursor-grab mb-px hover:bg-brand-soft hover:text-brand transition-colors text-text-secondary active:cursor-grabbing"
              >
                <span
                  className="w-5 h-5 rounded flex items-center justify-center text-[11px]"
                  style={{ background: p.bg }}
                >
                  {p.icon}
                </span>
                {p.label}
              </div>
            ))}
          </div>

          <ReactFlow
            nodes={editor.nodes}
            edges={editor.edges}
            onNodesChange={editor.onNodesChange}
            onEdgesChange={editor.onEdgesChange}
            onConnect={editor.onConnect}
            onNodeClick={(_, n) => {
              setSel(n as Node<FlowNodeData>);
              setTab(1);
            }}
            onPaneClick={() => setSel(null)}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, minZoom: 0.9, maxZoom: 1.2 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#059669', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#059669', width: 14, height: 14 },
            }}
            style={{ width: '100%', height: '100%', background: '#0A0F0D' }}
          >
            <Background gap={20} size={1} color="#1E2E26" />
            <Controls
              position="bottom-right"
              showInteractive={false}
              className="!bg-bg-shell !border-border-subtle !rounded-lg !shadow-none text-black"
            />
            <MiniMap
              position="bottom-right"
              style={{ bottom: 80 }}
              nodeColor={(n) => NODE_TYPE_META[(n.data as FlowNodeData)?.nodeType]?.color || '#708A7E'}
              maskColor="rgba(10,15,13,0.7)"
              className="!bg-bg-shell !border-border-subtle !rounded-lg"
            />
          </ReactFlow>

          {editor.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-5xl mb-3 opacity-40">✨</div>
                <div className="text-base font-bold text-text-primary mb-1">Design Your Bot</div>
                <div className="text-xs text-text-muted">Describe it above, or drag blocks from the left</div>
              </div>
            </div>
          )}

          {/* ── AI pending save banner ── */}
          {aiPendingFlow && (
            <div className="absolute bottom-3 left-4 right-4 z-30 rounded-2xl border border-brand/40 bg-bg-card shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-text-primary">AI updated the flow ✨</p>
                <p className="text-2xs text-text-muted mt-0.5">
                  Review the changes on the canvas — then save to keep them or discard to go back
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={discardAiChanges}
                  disabled={saveFlow.isPending}
                  className="px-3 py-2 rounded-xl text-2xs font-semibold text-text-muted border border-border-subtle hover:bg-glass-1 transition-colors disabled:opacity-40"
                >
                  ↩ Discard
                </button>
                <button
                  onClick={saveAiChanges}
                  disabled={saveFlow.isPending}
                  className="px-4 py-2 rounded-xl text-2xs font-bold text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
                >
                  {saveFlow.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save changes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border-subtle bg-bg flex-shrink-0">
          <button
            onClick={() => setShowList(true)}
            className="p-1.5 rounded-md hover:bg-glass-1 text-text-muted"
            title="Saved flows"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          {editingName ? (
            <input
              autoFocus
              value={editor.flowName}
              onChange={(e) => editor.setFlowName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false);
              }}
              className="text-xs font-semibold max-w-[180px] px-1.5 py-0.5 border border-brand rounded-md outline-none bg-bg-shell text-text-primary"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="flex items-center gap-1 text-xs font-semibold text-text-primary truncate max-w-[160px] hover:text-brand transition-colors"
              title="Click to rename"
            >
              {editor.flowName || 'Untitled Flow'}
              <Pencil className="w-3 h-3 text-text-muted flex-shrink-0" />
            </button>
          )}
          {editor.isDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Unsaved" />
          )}
          {loadedFlow?.isActive && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-brand flex-shrink-0">
              LIVE
            </span>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={editor.undo}
              disabled={!editor.canUndo}
              className="p-1.5 rounded-md hover:bg-glass-1 text-text-muted disabled:opacity-30"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={editor.redo}
              disabled={!editor.canRedo}
              className="p-1.5 rounded-md hover:bg-glass-1 text-text-muted disabled:opacity-30"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-5 bg-border-subtle mx-1" />
            <button
              onClick={editor.manualSave}
              disabled={!editor.flowId || editor.isSaving}
              className="p-1.5 rounded-md hover:bg-glass-1 text-text-muted disabled:opacity-30"
              title="Save"
            >
              {editor.isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => editor.flowId && duplicateFlow.mutate(editor.flowId)}
              disabled={!editor.flowId}
              className="p-1.5 rounded-md hover:bg-glass-1 text-text-muted disabled:opacity-30"
              title="Duplicate"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={editor.clear}
              className="p-1.5 rounded-md hover:bg-glass-1 text-danger"
              title="Clear"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-5 bg-border-subtle mx-1" />

            {/* Issue count pill — clicking opens Configure tab */}
            {totalIssues > 0 && (
              <button
                onClick={() => {
                  setSel(null);
                  setTab(1);
                }}
                title="Click to see issues"
                className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 ${hasCritical ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}
              >
                {hasCritical ? '●' : '◐'} {totalIssues} {totalIssues === 1 ? 'issue' : 'issues'}
              </button>
            )}

            {/* ✨ Enhance with AI button */}
            {editor.flowId && (
              <button
                onClick={() => {
                  setTab(0);
                  sendChatText(
                    'Improve this flow by adding the single most important missing element — likely an error path, fallback response, or human handoff. IMPORTANT: Keep all existing nodes, keys and positions unchanged. Only add new nodes and connect them. New nodes go directly below the node they connect from.',
                  );
                }}
                disabled={chatModify.isPending || !!aiPendingFlow}
                title={
                  aiPendingFlow
                    ? 'Save or discard current AI changes first'
                    : 'Ask AI to improve the whole flow'
                }
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border border-brand/30 text-brand hover:bg-brand-soft transition-colors disabled:opacity-30 flex items-center gap-1"
              >
                ✨ Enhance
              </button>
            )}

            <button
              onClick={() => editor.flowId && activateFlow.mutate(editor.flowId)}
              disabled={!editor.flowId || activateFlow.isPending}
              className="px-3 py-1.5 rounded-lg text-2xs font-bold text-white border-none cursor-pointer disabled:opacity-40 flex items-center gap-1.5 hover:-translate-y-px transition-all"
              style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
            >
              {activateFlow.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Rocket className="w-3.5 h-3.5" />
              )}
              Deploy
            </button>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      <div className="w-[280px] flex-shrink-0 flex flex-col border-l border-border-subtle bg-bg">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-xs font-bold text-text-primary">🤖 AI Assistant</h3>
            <p className="text-2xs text-text-muted mt-0.5">Chat to modify your bot</p>
          </div>
          <button
            onClick={() => setShowPreview(true)}
            className="px-2 py-1 rounded-md text-[10px] font-semibold text-brand border border-brand/30 hover:bg-brand-soft transition-colors"
          >
            📱 Preview
          </button>
        </div>

        {/* Tabs — 3 only, dot on Configure when issues exist */}
        <div className="flex border-b border-border-subtle flex-shrink-0">
          {(['AI Chat', 'Configure', 'Test'] as const).map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i as 0 | 1 | 2)}
              className={`flex-1 py-2 text-center text-2xs font-semibold border-b-2 transition-colors relative ${tab === i ? 'text-brand border-brand' : 'text-text-muted border-transparent hover:text-text-secondary'}`}
            >
              {t}
              {i === 1 && totalIssues > 0 && (
                <span
                  className={`absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full ${hasCritical ? 'bg-red-500' : 'bg-amber-400'}`}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {/* ── TAB 0: AI Chat ── */}
          {tab === 0 && (
            <>
              {sel && (
                <div className="px-3 py-2.5 border-b border-border-subtle flex-shrink-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Selected
                  </div>
                  <input
                    value={(sel.data as FlowNodeData).label}
                    onChange={(e) => updateNodeData(sel.id, { label: e.target.value })}
                    className="w-full px-2 py-1 rounded-md bg-bg border border-border-subtle text-2xs text-text-muted outline-none focus:border-brand mb-1"
                  />
                  <div className="flex items-center gap-1">
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center text-[11px]"
                      style={{ background: NODE_TYPE_META[(sel.data as FlowNodeData).nodeType]?.bg }}
                    >
                      {NODE_TYPE_META[(sel.data as FlowNodeData).nodeType]?.icon}
                    </span>
                    <span className="text-2xs text-text-muted">
                      {NODE_TYPE_META[(sel.data as FlowNodeData).nodeType]?.label}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      editor.removeNode(sel.id);
                      setSel(null);
                    }}
                    className="mt-1.5 w-full py-1 rounded-md bg-danger-soft border border-[rgba(244,63,94,.12)] text-2xs font-semibold text-danger cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-3 py-2">
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`mb-2 ${m.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className="inline-block max-w-[90%] px-3 py-2 text-2xs leading-relaxed whitespace-pre-wrap"
                      style={{
                        borderRadius: 10,
                        ...(m.role === 'user'
                          ? {
                              background: 'linear-gradient(135deg,#059669,#10B981)',
                              color: '#fff',
                              borderBottomRightRadius: 3,
                            }
                          : {
                              background: '#0D1410',
                              color: '#8A9B91',
                              border: '1px solid #1E2E26',
                              borderBottomLeftRadius: 3,
                            }),
                      }}
                    >
                      {m.role === 'user' && m.isVoice && (
                        <span className="inline-flex items-center gap-0.5 mr-1 text-[8px] font-bold opacity-70">
                          <Mic className="w-2 h-2" strokeWidth={2} />
                        </span>
                      )}
                      {m.text}
                    </div>
                  </div>
                ))}
                {chatModify.isPending && (
                  <div className="mb-2">
                    <div
                      className="inline-block px-3 py-2 text-2xs rounded-[10px]"
                      style={{
                        background:
                          'linear-gradient(90deg,rgba(0,217,126,0.04),rgba(167,139,250,0.06),rgba(0,217,126,0.04))',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s linear infinite',
                      }}
                    >
                      <span className="text-xs">🧠</span>{' '}
                      <span className="text-brand font-semibold">Modifying...</span>
                    </div>
                  </div>
                )}
                {transcribe.isPending && (
                  <div className="mb-2">
                    <div className="inline-block px-3 py-2 text-2xs rounded-[10px] bg-bg-card border border-border-subtle text-text-secondary">
                      <Loader2 className="w-3 h-3 animate-spin text-brand inline mr-1" />
                      Transcribing...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {/* ── Quick AI actions ── */}
              {editor.flowId && !chatModify.isPending && (
                <div className="px-2.5 py-2 border-t border-border-subtle flex-shrink-0">
                  <p className="text-[10px] font-semibold text-text-muted mb-1.5">✨ Enhance with AI</p>
                  <div className="grid grid-cols-2 gap-1">
                    {(
                      [
                        {
                          label: '🔍 Fix a logical gap',
                          msg: 'Find the most critical logical gap in this flow (dead end, missing route, or orphaned node) and fix it. Keep all existing nodes and positions. Only add or connect what is needed.',
                        },
                        {
                          label: '⚠️ Add error path',
                          msg: 'Add an error response node after the first API node that has no error path. Place it 110px below and 180px to the right of that API node. Keep all other nodes unchanged.',
                        },
                        {
                          label: '👤 Add human handoff',
                          msg: 'Add a human handoff action node (type: action, config: {action: handoff}) and connect it from the condition or response node that handles frustrated or unresolved users. Keep all existing nodes and positions.',
                        },
                        {
                          label: '🔁 Add fallback',
                          msg: 'Add a fallback response node for when the user sends something unrecognised. Connect it from the main condition node as a default branch. Keep all existing nodes and positions.',
                        },
                        {
                          label: '📋 Add welcome message',
                          msg: "Improve the first response node: make the welcome message friendlier and clearer about what the bot can help with. Only edit that one node's config message text. Do not change any other nodes.",
                        },
                        {
                          label: '🌍 Add unknown handler',
                          msg: 'Add a response node for completely unknown input (not matching any intent). Connect it as the final fallback branch of the main condition. Keep all existing nodes and positions.',
                        },
                      ] as { label: string; msg: string }[]
                    ).map(({ label, msg }) => (
                      <button
                        key={label}
                        onClick={() => sendChatText(msg)}
                        disabled={!editor.flowId || chatModify.isPending}
                        className="px-2 py-1.5 rounded-lg text-[10px] font-semibold bg-bg-shell border border-border-subtle text-text-secondary hover:border-brand hover:text-brand hover:bg-brand-soft transition-all text-left disabled:opacity-40 leading-tight"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5 p-2.5 border-t border-border-subtle flex-shrink-0">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                  placeholder={
                    isAiChatRecording ? 'Recording...' : editor.flowId ? 'Ask AI...' : 'Generate a flow first'
                  }
                  disabled={
                    !editor.flowId || chatModify.isPending || isAiChatRecording || transcribe.isPending
                  }
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-glass-1 border border-border-subtle text-2xs text-text-primary outline-none focus:border-brand disabled:opacity-50"
                />
                <VoiceButton
                  onRecordingComplete={handleAiChatVoice}
                  onRecordingStart={() => setIsAiChatRecording(true)}
                  onRecordingCancel={() => setIsAiChatRecording(false)}
                  isProcessing={transcribe.isPending}
                  disabled={!editor.flowId || chatModify.isPending}
                  size="xs"
                />
                <button
                  onClick={sendChat}
                  disabled={
                    !editor.flowId ||
                    !chatInput.trim() ||
                    chatModify.isPending ||
                    isAiChatRecording ||
                    transcribe.isPending
                  }
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white border-none cursor-pointer disabled:opacity-40 flex-shrink-0"
                  style={{ background: '#059669' }}
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </>
          )}

          {/* ── TAB 1: Configure ── */}
          {tab === 1 && (
            <div className="flex-1 overflow-y-auto p-4">
              {sel ? (
                <div className="space-y-3">
                  {/* Structural gap — two questions */}
                  {(() => {
                    const gap = getNodeGap(sel.id, gaps);
                    return gap ? (
                      <GapPrompt
                        gap={gap}
                        currentConfig={(sel.data as FlowNodeData).config ?? {}}
                        onSave={(r) => saveGapResolution(sel.id, r as Record<string, unknown>)}
                      />
                    ) : null;
                  })()}

                  {/* LLM issues for this node — plain English, no node keys */}
                  {(() => {
                    const nodeIssues = (validation?.issues ?? []).filter((i) =>
                      i.affectedNodeKeys.includes(sel.id),
                    );
                    if (nodeIssues.length === 0) return null;
                    return (
                      <div className="space-y-2">
                        {nodeIssues.map((issue: FlowValidationIssue) => {
                          const color =
                            issue.severity === 1 ? 'red' : issue.severity === 2 ? 'amber' : 'blue';
                          const icon = issue.severity === 1 ? '🔴' : issue.severity === 2 ? '⚠️' : '💡';
                          const label =
                            issue.severity === 1
                              ? 'Problem'
                              : issue.severity === 2
                                ? 'Heads up'
                                : 'Suggestion';
                          const desc = cleanIssueText(issue.description, issue.affectedNodeKeys);
                          const sug = cleanIssueText(issue.suggestion, issue.affectedNodeKeys);
                          return (
                            <div
                              key={issue.id}
                              className={`rounded-lg p-3 border text-2xs space-y-1.5 ${color === 'red' ? 'bg-red-500/5 border-red-500/20' : color === 'amber' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-blue-400/5 border-blue-400/20'}`}
                            >
                              <div
                                className={`font-semibold flex items-center gap-1.5 ${color === 'red' ? 'text-red-400' : color === 'amber' ? 'text-amber-400' : 'text-blue-400'}`}
                              >
                                <span>{icon}</span> {label}
                              </div>
                              <p className="text-text-secondary leading-relaxed">{desc}</p>
                              {issue.missingStep && (
                                <p className="text-text-muted">
                                  What's missing:{' '}
                                  <span className="text-text-secondary">{issue.missingStep}</span>
                                </p>
                              )}
                              <p
                                className={`font-medium leading-relaxed ${color === 'red' ? 'text-red-300' : color === 'amber' ? 'text-amber-300' : 'text-blue-300'}`}
                              >
                                → {sug}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Standard fields */}
                  <div>
                    <label className="block text-2xs font-semibold mb-1 text-text-secondary">Name</label>
                    <input
                      value={(sel.data as FlowNodeData).label}
                      onChange={(e) => updateNodeData(sel.id, { label: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-xs outline-none focus:border-brand bg-bg-shell text-text-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold mb-1 text-text-secondary">Type</label>
                    <input
                      value={
                        NODE_TYPE_META[(sel.data as FlowNodeData).nodeType]?.label ||
                        (sel.data as FlowNodeData).nodeType
                      }
                      disabled
                      className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-xs bg-glass-1 text-text-muted"
                    />
                  </div>
                  {/* ✨ AI fix this specific node — scoped to known issues */}
                  {editor.flowId && (
                    <button
                      onClick={() => {
                        const nodeLabel = (sel.data as FlowNodeData).label;
                        const nodeType = (sel.data as FlowNodeData).nodeType;
                        const nodePos = sel.position;

                        // Collect the exact issues already detected for this node
                        const nodeIssues = (validation?.issues ?? []).filter((i) =>
                          i.affectedNodeKeys.includes(sel.id),
                        );

                        const issueLines =
                          nodeIssues.length > 0
                            ? '\n\nKnown issues to fix:\n' +
                              nodeIssues
                                .map((iss, idx) => `${idx + 1}. ${iss.title}: ${iss.suggestion}`)
                                .join('\n')
                            : '\n\nNo specific issues detected — look for missing connections, better response text, or edge cases.';

                        const prompt =
                          `Apply fixes to ONLY the "${nodeLabel}" ${nodeType} node (key: ${sel.id}).` +
                          issueLines +
                          `\n\nRules (strictly follow these):\n` +
                          `- Only change this specific node and its direct outgoing connections.\n` +
                          `- If new nodes are needed, place them at x:${Math.round(nodePos.x)}, y:${Math.round(nodePos.y + 140)} and increment y by 110 for each additional node.\n` +
                          `- Keep all other existing nodes, their keys, names, positions and connections exactly as they are.\n` +
                          `- Return the complete flow JSON with the fix applied.`;

                        setTab(0);
                        sendChatText(prompt);
                      }}
                      disabled={chatModify.isPending}
                      className="w-full py-2 rounded-lg border border-brand/25 text-2xs font-semibold text-brand hover:bg-brand-soft transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      ✨ Fix this node with AI
                    </button>
                  )}

                  <button
                    onClick={() => {
                      editor.removeNode(sel.id);
                      setSel(null);
                    }}
                    className="w-full py-2 rounded-lg bg-danger-soft text-2xs font-semibold text-danger flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3 h-3" /> Delete Node
                  </button>
                </div>
              ) : (
                /* No node selected — overall health summary */
                <div className="space-y-3">
                  {totalIssues > 0 ? (
                    <>
                      <p className="text-2xs text-text-muted">
                        Click any highlighted node on the canvas to see what needs fixing.
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {unresolvedCount(gaps) > 0 && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                            {unresolvedCount(gaps)} unconfigured
                          </span>
                        )}
                        {(validation?.warningCount ?? 0) > 0 && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {validation!.warningCount} warnings
                          </span>
                        )}
                        {(validation?.suggestionCount ?? 0) > 0 && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-blue-400/10 text-blue-400 border border-blue-400/20">
                            {validation!.suggestionCount} suggestions
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      {validation ? (
                        <>
                          <div className="text-2xl mb-2">✓</div>
                          <p className="text-xs font-semibold text-brand">Flow looks good</p>
                          <p className="text-2xs text-text-muted mt-1">Click any node to configure it</p>
                        </>
                      ) : (
                        <p className="text-xs text-text-muted">Click any node to configure it</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: Test ── */}
          {tab === 2 && <FlowSimulator />}
        </div>
      </div>

      {showList && (
        <FlowListOverlay
          flows={flows}
          onSelect={(f) => {
            editor.setFlow(f);
            setSel(null);
            setShowList(false);
          }}
          onClose={() => setShowList(false)}
          onDelete={(id) => deleteFlow.mutate(id)}
          onDuplicate={(id) => duplicateFlow.mutate(id)}
        />
      )}
    </div>
  );
}

/* ═══ FLOW LIST ═══ */
function FlowListOverlay({
  flows,
  onSelect,
  onClose,
  onDelete,
  onDuplicate,
}: {
  flows: FlowDto[];
  onSelect: (f: FlowDto) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg-shell rounded-2xl w-[480px] max-h-[70vh] flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.5)] border border-border-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle flex-shrink-0">
          <h3 className="text-sm font-bold text-text-primary">Saved Flows</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-glass-1">
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {flows.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-2 opacity-40">📋</div>
              <p className="text-xs text-text-muted">No flows yet.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {flows.map((f) => (
                <div
                  key={f.id}
                  onClick={() => onSelect(f)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle hover:border-brand hover:bg-brand-soft/30 transition-all cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary truncate">{f.name}</span>
                      {f.isActive && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-brand">
                          <Check className="w-2.5 h-2.5" /> Live
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      v{f.version} • {f.nodeCount} nodes • {FLOW_STATUS_LABEL[f.status] || 'Draft'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(f.id);
                      }}
                      className="p-1.5 rounded-md hover:bg-glass-1"
                    >
                      <Copy className="w-3 h-3 text-text-muted" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${f.name}"?`)) onDelete(f.id);
                      }}
                      disabled={f.isActive}
                      className="p-1.5 rounded-md hover:bg-danger-soft disabled:opacity-30"
                    >
                      <Trash2 className="w-3 h-3 text-danger" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ PREVIEW PANEL ═══ */
function PreviewPanel({ sessionId: _sessionId }: { sessionId: string }) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);
  type Msg = {
    role: 'user' | 'bot';
    text: string;
    buttons?: { label: string; value: string }[];
    isVoice?: boolean;
  };
  const [msgs, setMsgs] = useState<Record<string, Msg[]>>({});
  const [pendingChannels, setPendingChannels] = useState<Set<string>>(new Set());
  const channelSessionIds = useRef<Record<string, string>>({});
  const flowMessage = useFlowRuntimeMessage();
  const transcribe = useTranscribeAudio();
  const { data: channelsRaw } = useChannels();
  const channels = useMemo(() => {
    const list = (channelsRaw as unknown as ChannelConnectionDto[]) ?? [];
    const connected = list.filter((c) => !c.isDeleted);
    if (connected.length > 0)
      return connected.map((c) => ({
        key: CHANNEL_TYPE_LABEL[c.channelType] || `Channel ${c.channelType}`,
        apiType: (CHANNEL_TYPE_LABEL[c.channelType] || '').toLowerCase().replace(/\s+/g, ''),
        displayName: c.displayName || CHANNEL_TYPE_LABEL[c.channelType] || `Channel ${c.channelType}`,
      }));
    return [
      { key: 'WhatsApp', apiType: 'whatsapp', displayName: 'WhatsApp' },
      { key: 'WebChat', apiType: 'webchat', displayName: 'Web Chat' },
    ];
  }, [channelsRaw]);

  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  useEffect(() => {
    if (selectedChannels.length === 0 && channels.length > 0) setSelectedChannels(channels.map((c) => c.key));
  }, [channels]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeChannels = useMemo(
    () => channels.filter((c) => selectedChannels.includes(c.key)),
    [channels, selectedChannels],
  );
  const gridCols =
    activeChannels.length <= 2 ? 'grid-cols-2' : activeChannels.length === 3 ? 'grid-cols-3' : 'grid-cols-4';

  const send = useCallback(
    (text: string, channelKey: string) => {
      if (!text.trim() || pendingChannels.has(channelKey)) return;
      if (!channelSessionIds.current[channelKey]) {
        channelSessionIds.current[channelKey] = crypto.randomUUID();
      }
      const chSessionId = channelSessionIds.current[channelKey];
      setPendingChannels((prev) => new Set(prev).add(channelKey));
      setMsgs((p) => ({ ...p, [channelKey]: [...(p[channelKey] || []), { role: 'user', text }] }));
      setInputs((p) => ({ ...p, [channelKey]: '' }));
      flowMessage.mutate(
        { SessionId: chSessionId, Message: text.trim() },
        {
          onSuccess: (res: FlowRuntimeResult) => {
            const buttons = (res.menuItems || []).map((it: FlowMenuItemDto) => ({
              label: it.label,
              value: it.value,
            }));
            setMsgs((p) => ({
              ...p,
              [channelKey]: [
                ...(p[channelKey] || []),
                { role: 'bot', text: res.response || '-', buttons: buttons.length > 0 ? buttons : undefined },
              ],
            }));
            setPendingChannels((prev) => { const s = new Set(prev); s.delete(channelKey); return s; });
          },
          onError: () => {
            setMsgs((p) => ({ ...p, [channelKey]: [...(p[channelKey] || []), { role: 'bot', text: '❌ Error' }] }));
            setPendingChannels((prev) => { const s = new Set(prev); s.delete(channelKey); return s; });
          },
        },
      );
    },
    [flowMessage, pendingChannels],
  );

  const handleVoiceRecording = useCallback(
    async (blob: Blob, channelKey: string) => {
      setIsRecording(false);
      if (pendingChannels.has(channelKey)) return;
      if (!channelSessionIds.current[channelKey]) {
        channelSessionIds.current[channelKey] = crypto.randomUUID();
      }
      const chSessionId = channelSessionIds.current[channelKey];
      setPendingChannels((prev) => new Set(prev).add(channelKey));
      try {
        const result = await transcribe.mutateAsync({ audio: blob });
        const text = result.text?.trim();
        if (!text) {
          setMsgs((p) => ({
            ...p,
            [channelKey]: [...(p[channelKey] || []), { role: 'bot' as const, text: 'Could not understand.' }],
          }));
          setPendingChannels((prev) => { const s = new Set(prev); s.delete(channelKey); return s; });
          return;
        }
        setMsgs((p) => ({ ...p, [channelKey]: [...(p[channelKey] || []), { role: 'user' as const, text, isVoice: true }] }));
        flowMessage.mutate(
          { SessionId: chSessionId, Message: text },
          {
            onSuccess: (res: FlowRuntimeResult) => {
              const buttons = (res.menuItems || []).map((it: FlowMenuItemDto) => ({
                label: it.label,
                value: it.value,
              }));
              setMsgs((p) => ({
                ...p,
                [channelKey]: [
                  ...(p[channelKey] || []),
                  { role: 'bot' as const, text: res.response || '-', buttons: buttons.length > 0 ? buttons : undefined },
                ],
              }));
              setPendingChannels((prev) => { const s = new Set(prev); s.delete(channelKey); return s; });
            },
            onError: () => {
              setMsgs((p) => ({ ...p, [channelKey]: [...(p[channelKey] || []), { role: 'bot' as const, text: '❌ Error' }] }));
              setPendingChannels((prev) => { const s = new Set(prev); s.delete(channelKey); return s; });
            },
          },
        );
      } catch {
        setMsgs((p) => ({ ...p, [channelKey]: [...(p[channelKey] || []), { role: 'bot' as const, text: '❌ Voice failed' }] }));
        setPendingChannels((prev) => { const s = new Set(prev); s.delete(channelKey); return s; });
      }
    },
    [flowMessage, transcribe, pendingChannels],
  );

  const getStyle = (name: string) => {
    const n = name.toLowerCase();
    // WhatsApp — beige chat bg, white bot bubbles
    if (n.includes('whatsapp'))
      return { hdr: '#075E54', bg: '#ECE5DD', userBg: '#075E54', botBg: '#fff', dark: false };
    // Telegram — dark navy bg, dark bubbles
    if (n.includes('telegram'))
      return { hdr: '#517DA2', bg: '#0E1621', userBg: '#2B5278', botBg: '#182533', dark: true };
    // WebChat — dark app-themed
    if (n.includes('web') || n.includes('chat'))
      return { hdr: '#059669', bg: '#0A0F0D', userBg: '#059669', botBg: '#0D1410', dark: true };
    // SMS / iMessage — iOS light grey, blue user bubbles, grey bot bubbles
    if (n.includes('sms'))
      return { hdr: '#007AFF', bg: '#F2F2F7', userBg: '#007AFF', botBg: '#E9E9EB', dark: false };
    // Messenger — white bg, blue user bubbles, light grey bot bubbles
    if (n.includes('messenger'))
      return { hdr: '#0084FF', bg: '#FFFFFF', userBg: '#0084FF', botBg: '#F0F2F5', dark: false };
    // Instagram — white bg, gradient-pink user bubbles, light grey bot bubbles
    if (n.includes('instagram'))
      return { hdr: '#C13584', bg: '#FFFFFF', userBg: '#E1306C', botBg: '#EFEFEF', dark: false };
    // Email — dark
    if (n.includes('email'))
      return { hdr: '#4A90D9', bg: '#0A0F0D', userBg: '#4A90D9', botBg: '#0D1410', dark: true };
    // Voice — dark
    if (n.includes('voice'))
      return { hdr: '#6B7280', bg: '#0A0F0D', userBg: '#4B5563', botBg: '#0D1410', dark: true };
    return { hdr: '#374151', bg: '#0A0F0D', userBg: '#6B7280', botBg: '#0D1410', dark: true };
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle bg-glass-1 flex-shrink-0 flex-wrap">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Channels:</span>
        {channels.map((ch) => (
          <button
            key={ch.key}
            onClick={() =>
              setSelectedChannels((prev) =>
                prev.includes(ch.key) ? prev.filter((k) => k !== ch.key) : [...prev, ch.key],
              )
            }
            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${selectedChannels.includes(ch.key) ? 'bg-brand text-white' : 'bg-bg-shell border border-border-subtle text-text-muted hover:border-brand hover:text-brand'}`}
          >
            {ch.displayName}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className={`grid ${gridCols} gap-2 p-3`}>
        {activeChannels.map((ch) => {
          const s = getStyle(ch.key);
          const chInput = inputs[ch.key] || '';
          return (
            <div
              key={ch.key}
              className="flex flex-col rounded-xl overflow-hidden border border-border-subtle h-[393px]"
            >
              <div
                className="text-center text-[10px] font-bold uppercase tracking-wider py-1.5 text-white flex-shrink-0"
                style={{ background: s.hdr }}
              >
                {ch.displayName}
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ background: s.bg }}>
                {(msgs[ch.key] || []).length === 0 && (
                  <div className="text-center py-4 text-[10px] opacity-50">Send a message</div>
                )}
                {(msgs[ch.key] || []).map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[92%]">
                      <div
                        className="px-2 py-1.5 text-[10px] leading-relaxed whitespace-pre-wrap rounded-lg"
                        style={{
                          background: m.role === 'user' ? s.userBg : s.botBg,
                          color: s.dark || m.role === 'user' ? '#fff' : '#333',
                        }}
                      >
                        {m.text}
                      </div>
                      {m.buttons && m.buttons.length > 0 && (
                        <div className="mt-0.5 space-y-0.5">
                          {m.buttons.slice(0, 3).map((b, j) => (
                            <button
                              key={j}
                              onClick={() => send(b.value, ch.key)}
                              className="w-full py-1 rounded text-[9px] font-medium bg-bg-shell/90 border border-border-subtle hover:bg-glass-1 text-center truncate text-text-secondary"
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Per-channel input bar — native-inspired per platform */}
              {(() => {
                const t = ch.apiType;
                const chPending = pendingChannels.has(ch.key);
                const sharedInput = (placeholder: string, textColor: string, bgColor: string) => (
                  <input
                    value={chInput}
                    onChange={(e) => setInputs((p) => ({ ...p, [ch.key]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && send(chInput, ch.key)}
                    placeholder={isRecording ? 'Recording...' : placeholder}
                    disabled={isRecording || chPending}
                    className="flex-1 min-w-0 text-[10px] outline-none bg-transparent disabled:opacity-40"
                    style={{ color: textColor, background: bgColor }}
                  />
                );
                const circleBtn = (bg: string) => (
                  <button
                    onClick={() => send(chInput, ch.key)}
                    disabled={chPending || isRecording || activeChannels.length === 0}
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
                    style={{ background: bg }}
                  >
                    {chPending ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : chInput.trim() ? <Send className="w-3 h-3 text-white" /> : <Mic className="w-3.5 h-3.5 text-white" />}
                  </button>
                );

                /* ── WhatsApp ── */
                if (t === 'whatsapp') return (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 flex-shrink-0" style={{ background: '#F0F0F0', borderTop: '1px solid #ddd' }}>
                    <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1 min-w-0" style={{ background: '#fff', borderRadius: 20 }}>
                      <Smile className="w-3.5 h-3.5 shrink-0" style={{ color: '#919191' }} />
                      {sharedInput('Message', '#111', 'transparent')}
                      <Paperclip className="w-3 h-3 shrink-0" style={{ color: '#919191' }} />
                    </div>
                    {circleBtn('#25D366')}
                  </div>
                );

                /* ── Telegram ── */
                if (t === 'telegram') return (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 flex-shrink-0" style={{ background: '#17212B', borderTop: '1px solid #232e3c' }}>
                    <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1 min-w-0" style={{ background: '#232e3c', borderRadius: 20 }}>
                      <Smile className="w-3.5 h-3.5 shrink-0" style={{ color: '#5c7a99' }} />
                      {sharedInput('Message', '#e8f1f9', 'transparent')}
                      <Paperclip className="w-3 h-3 shrink-0" style={{ color: '#5c7a99' }} />
                    </div>
                    {circleBtn('#2AABEE')}
                  </div>
                );

                /* ── SMS / iMessage ── */
                if (t === 'sms') return (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 flex-shrink-0" style={{ background: '#F2F2F7', borderTop: '1px solid #E5E5EA' }}>
                    <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1 min-w-0" style={{ background: '#fff', borderRadius: 20, border: '1px solid #C7C7CC' }}>
                      {sharedInput('iMessage', '#000', 'transparent')}
                    </div>
                    {circleBtn('#007AFF')}
                  </div>
                );

                /* ── Messenger ── */
                if (t === 'messenger') return (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 flex-shrink-0" style={{ background: '#fff', borderTop: '1px solid #E4E6EB' }}>
                    <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1 min-w-0" style={{ background: '#F0F2F5', borderRadius: 20 }}>
                      <Smile className="w-3.5 h-3.5 shrink-0" style={{ color: '#65676B' }} />
                      {sharedInput('Aa', '#050505', 'transparent')}
                    </div>
                    {circleBtn('#0084FF')}
                  </div>
                );

                /* ── Instagram ── */
                if (t === 'instagram') return (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 flex-shrink-0" style={{ background: '#fff', borderTop: '1px solid #DBDBDB' }}>
                    <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1 min-w-0" style={{ background: '#fff', borderRadius: 20, border: '1px solid #DBDBDB' }}>
                      <Smile className="w-3.5 h-3.5 shrink-0" style={{ color: '#8e8e8e' }} />
                      {sharedInput('Message…', '#000', 'transparent')}
                      <Mic className="w-3 h-3 shrink-0" style={{ color: '#8e8e8e' }} />
                    </div>
                    <button
                      onClick={() => send(chInput, ch.key)}
                      disabled={chPending || isRecording || activeChannels.length === 0}
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
                      style={{ background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}
                    >
                      {chPending ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Send className="w-3 h-3 text-white" />}
                    </button>
                  </div>
                );

                /* ── Default dark (WebChat, Voice, Email, etc.) ── */
                return (
                  <div className="flex items-center gap-1.5 px-2 py-2 flex-shrink-0 bg-bg" style={{ borderTop: `1px solid ${s.hdr}40` }}>
                    <input
                      value={chInput}
                      onChange={(e) => setInputs((p) => ({ ...p, [ch.key]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && send(chInput, ch.key)}
                      placeholder={isRecording ? 'Recording...' : 'Type a message…'}
                      disabled={isRecording || chPending}
                      className="flex-1 min-w-0 px-2 py-1 text-[10px] rounded-lg outline-none border border-border-subtle bg-bg-input text-text-primary placeholder:text-text-muted disabled:opacity-40 focus:border-brand"
                    />
                    <VoiceButton onRecordingComplete={(blob) => handleVoiceRecording(blob, ch.key)} onRecordingStart={() => setIsRecording(true)} onRecordingCancel={() => setIsRecording(false)} isProcessing={transcribe.isPending} disabled={chPending || activeChannels.length === 0} size="sm" />
                    <button onClick={() => send(chInput, ch.key)} disabled={!chInput.trim() || chPending || isRecording} className="p-1.5 rounded-lg text-white disabled:opacity-40 flex items-center justify-center shrink-0 transition-opacity" style={{ background: s.hdr }}>
                      {chPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        })}
        {activeChannels.length === 0 && (
          <div className="col-span-full flex items-center justify-center py-12 text-sm text-text-muted">
            Select at least one channel above to preview
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export function Component() {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner />
    </ReactFlowProvider>
  );
}
