import { useReducer, useCallback, useRef, useEffect } from 'react';
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, Connection } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { FlowDto, FlowNodeData, FlowNodeTypeValue, FlowSaveRequest } from '../types/flow.types';
import { useSaveFlow } from '../api/flow.queries';
import { useDebounce } from '@/shared/hooks/useDebounce';

interface State {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  flowId: string | null;
  flowName: string;
  flowVersion: number;
  isDirty: boolean;
  undoStack: { nodes: Node<FlowNodeData>[]; edges: Edge[] }[];
  redoStack: { nodes: Node<FlowNodeData>[]; edges: Edge[] }[];
}
type Action =
  | { type: 'SET_FLOW'; flow: FlowDto }
  | { type: 'SET_FLOW_WITH_LAYOUT'; flow: FlowDto }
  | { type: 'SET_NODES'; nodes: Node<FlowNodeData>[] }
  | { type: 'SET_NODES_VISUAL'; nodes: Node<FlowNodeData>[] } // updates nodes WITHOUT setting isDirty
  | { type: 'SET_EDGES'; edges: Edge[] }
  | { type: 'ADD_NODE'; node: Node<FlowNodeData> }
  | { type: 'REMOVE_NODE'; nodeId: string }
  | { type: 'MARK_CLEAN' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' }
  | { type: 'SNAPSHOT' }
  | { type: 'SET_NAME'; name: string };

export function flowToReactFlow(flow: FlowDto) {
  const nodes: Node<FlowNodeData>[] = (flow.nodes || []).map((n) => ({
    id: n.nodeKey,
    type: n.nodeType,
    position: { x: n.positionX, y: n.positionY },
    data: {
      label: n.name,
      nodeType: n.nodeType,
      config: n.configurationJson ? JSON.parse(n.configurationJson) : {},
      intentId: n.intentId,
      capabilityId: n.capabilityId,
      apiEndpointId: n.apiEndpointId,
      isEntryPoint: n.isEntryPoint,
      backendId: n.id,
    },
  }));
  const edges: Edge[] = (flow.connections || []).map((c) => ({
    id: `${c.fromNodeKey}-${c.toNodeKey}`,
    source: c.fromNodeKey,
    target: c.toNodeKey,
    label: c.conditionLabel || undefined,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#059669', strokeWidth: 2 },
    ...(c.conditionLabel
      ? {
          labelStyle: { fill: '#d1fae5', fontSize: 10, fontWeight: 700 },
          labelBgStyle: { fill: '#064e3b', fillOpacity: 0.92 },
          labelBgPadding: [4, 6] as [number, number],
          labelBgBorderRadius: 4,
        }
      : {}),
    data: { backendId: c.id },
  }));
  return { nodes, edges };
}

// ── Auto-layout: hierarchical tree layout for freshly generated flows ──
function applyAutoLayout(nodes: Node<FlowNodeData>[], edges: Edge[]): Node<FlowNodeData>[] {
  if (nodes.length < 2) return nodes;

  // Build forward adjacency
  const childrenOf = new Map<string, string[]>();
  for (const n of nodes) childrenOf.set(n.id, []);
  for (const e of edges) childrenOf.get(e.source)?.push(e.target);

  // Root = trigger / isEntryPoint
  const root = nodes.find(n => (n.data as FlowNodeData).isEntryPoint || (n.data as FlowNodeData).nodeType === 'trigger') ?? nodes[0];

  // BFS rank from root
  const rank = new Map<string, number>();
  const bfsQ = [root.id];
  rank.set(root.id, 0);
  while (bfsQ.length) {
    const cur = bfsQ.shift()!;
    for (const child of childrenOf.get(cur) ?? []) {
      if (!rank.has(child)) { rank.set(child, rank.get(cur)! + 1); bfsQ.push(child); }
    }
  }
  for (const n of nodes) if (!rank.has(n.id)) rank.set(n.id, 99);

  // First condition node reachable from root (the main-menu branch point)
  let mainCondId: string | null = null;
  {
    const q = [root.id];
    const vis = new Set<string>();
    while (q.length && !mainCondId) {
      const cur = q.shift()!;
      if (vis.has(cur)) continue;
      vis.add(cur);
      if (nodes.find(x => x.id === cur)?.data.nodeType === 'condition') { mainCondId = cur; break; }
      for (const ch of childrenOf.get(cur) ?? []) q.push(ch);
    }
  }

  // Spine = nodes on the path from root down to (and including) the condition node
  const spineSet = new Set<string>();
  {
    let cur: string | null = root.id;
    const vis = new Set<string>();
    while (cur && !vis.has(cur)) {
      vis.add(cur); spineSet.add(cur);
      if (cur === mainCondId) break;
      cur = childrenOf.get(cur)?.[0] ?? null;
    }
  }
  const spineList = [...spineSet].sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));

  // Branch roots = direct children of the condition node that are not already in the spine
  const branchRoots = mainCondId
    ? (childrenOf.get(mainCondId) ?? []).filter(id => !spineSet.has(id))
    : [];

  // Assign non-spine nodes to branch columns via BFS from each branch root
  const nodeToCol = new Map<string, number>();
  branchRoots.forEach((br, colIdx) => {
    const q = [br];
    const vis = new Set<string>();
    while (q.length) {
      const cur = q.shift()!;
      if (vis.has(cur) || spineSet.has(cur) || nodeToCol.has(cur)) continue;
      vis.add(cur);
      nodeToCol.set(cur, colIdx);
      for (const ch of childrenOf.get(cur) ?? []) q.push(ch);
    }
  });

  // Layout constants
  const NODE_H  = 90;
  const V_GAP   = 70;
  const NODE_W  = 200;
  const H_GAP   = 70;
  const COL_STEP = NODE_W + H_GAP;

  const numCols    = Math.max(branchRoots.length, 1);
  const totalW     = numCols * COL_STEP - H_GAP;
  const spineX     = Math.round(totalW / 2 - NODE_W / 2);

  const newPos = new Map<string, { x: number; y: number }>();

  // Spine nodes stacked vertically at center x
  spineList.forEach((id, i) => {
    newPos.set(id, { x: spineX, y: 50 + i * (NODE_H + V_GAP) });
  });

  // Column y starts just below the condition node
  const condY = mainCondId ? (newPos.get(mainCondId)?.y ?? 300) : 300;

  // Branch columns
  branchRoots.forEach((_br, colIdx) => {
    const colNodes = [...nodeToCol.entries()]
      .filter(([, c]) => c === colIdx)
      .map(([id]) => id)
      .sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));

    const x = colIdx * COL_STEP;
    colNodes.forEach((id, rowIdx) => {
      newPos.set(id, { x, y: condY + (NODE_H + V_GAP) * (rowIdx + 1) });
    });
  });

  return nodes.map(n => {
    const pos = newPos.get(n.id);
    return pos ? { ...n, position: pos } : n;
  });
}

export function reactFlowToSave(s: State): FlowSaveRequest {
  return {
    Name: s.flowName || 'Untitled Flow',
    Nodes: s.nodes.map((n, i) => ({
      NodeKey: n.id,
      NodeType: (n.data as FlowNodeData).nodeType as FlowNodeTypeValue,
      Name: (n.data as FlowNodeData).label,
      PositionX: Math.round(n.position.x),
      PositionY: Math.round(n.position.y),
      ConfigurationJson: JSON.stringify((n.data as FlowNodeData).config || {}),
      SortOrder: i,
      IsEntryPoint: (n.data as FlowNodeData).isEntryPoint ?? false,
      IntentId: (n.data as FlowNodeData).intentId ?? null,
      CapabilityId: (n.data as FlowNodeData).capabilityId ?? null,
      ApiEndpointId: (n.data as FlowNodeData).apiEndpointId ?? null,
    })),
    Connections: s.edges.map((e, i) => ({
      FromNodeKey: e.source,
      ToNodeKey: e.target,
      ConditionLabel: (e.label as string) || null,
      SortOrder: i,
    })),
  };
}

const init: State = {
  nodes: [],
  edges: [],
  flowId: null,
  flowName: '',
  flowVersion: 1,
  isDirty: false,
  undoStack: [],
  redoStack: [],
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'SET_FLOW': {
      const { nodes, edges } = flowToReactFlow(a.flow);
      return {
        ...s,
        nodes,
        edges,
        flowId: a.flow.id,
        flowName: a.flow.name,
        flowVersion: a.flow.version,
        isDirty: false,
        undoStack: [],
        redoStack: [],
      };
    }
    case 'SET_FLOW_WITH_LAYOUT': {
      const { nodes: rawNodes, edges } = flowToReactFlow(a.flow);
      const nodes = applyAutoLayout(rawNodes, edges);
      return {
        ...s,
        nodes,
        edges,
        flowId: a.flow.id,
        flowName: a.flow.name,
        flowVersion: a.flow.version,
        isDirty: true, // positions changed — auto-save will persist the new layout
        undoStack: [],
        redoStack: [],
      };
    }
    case 'SET_NODES':
      return { ...s, nodes: a.nodes, isDirty: true };
    case 'SET_NODES_VISUAL':
      // Used by gap detection / issue level — updates display only, never triggers save
      return { ...s, nodes: a.nodes };
    case 'SET_EDGES':
      return { ...s, edges: a.edges, isDirty: true };
    case 'ADD_NODE':
      return { ...s, nodes: [...s.nodes, a.node], isDirty: true };
    case 'REMOVE_NODE':
      return {
        ...s,
        nodes: s.nodes.filter((n) => n.id !== a.nodeId),
        edges: s.edges.filter((e) => e.source !== a.nodeId && e.target !== a.nodeId),
        isDirty: true,
      };
    case 'MARK_CLEAN':
      return { ...s, isDirty: false };
    case 'SET_NAME':
      return { ...s, flowName: a.name, isDirty: true };
    case 'SNAPSHOT':
      return {
        ...s,
        undoStack: [...s.undoStack.slice(-19), { nodes: [...s.nodes], edges: [...s.edges] }],
        redoStack: [],
      };
    case 'UNDO': {
      if (!s.undoStack.length) return s;
      const p = s.undoStack[s.undoStack.length - 1];
      return {
        ...s,
        nodes: p.nodes,
        edges: p.edges,
        undoStack: s.undoStack.slice(0, -1),
        redoStack: [...s.redoStack, { nodes: [...s.nodes], edges: [...s.edges] }],
        isDirty: true,
      };
    }
    case 'REDO': {
      if (!s.redoStack.length) return s;
      const n = s.redoStack[s.redoStack.length - 1];
      return {
        ...s,
        nodes: n.nodes,
        edges: n.edges,
        redoStack: s.redoStack.slice(0, -1),
        undoStack: [...s.undoStack, { nodes: [...s.nodes], edges: [...s.edges] }],
        isDirty: true,
      };
    }
    case 'CLEAR':
      return {
        ...s,
        nodes: [],
        edges: [],
        isDirty: true,
        undoStack: [...s.undoStack, { nodes: [...s.nodes], edges: [...s.edges] }],
        redoStack: [],
      };
    default:
      return s;
  }
}

export function useFlowEditor() {
  const [state, dispatch] = useReducer(reducer, init);
  const saveFlow = useSaveFlow();
  const dirtyRef = useRef(state.isDirty);
  dirtyRef.current = state.isDirty;
  const loadedAtRef = useRef<number>(0); // timestamp of last SET_FLOW
  const debouncedDirty = useDebounce(state.isDirty, 5000);

  useEffect(() => {
    // Skip auto-save during first 3 seconds after flow load to avoid saving before canvas renders
    const elapsed = Date.now() - loadedAtRef.current;
    if (debouncedDirty && state.flowId && dirtyRef.current && elapsed > 3000)
      saveFlow.mutate(
        { id: state.flowId, data: reactFlowToSave(state) },
        { onSuccess: () => dispatch({ type: 'MARK_CLEAN' }) },
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDirty]);

  const setFlow = useCallback((f: FlowDto) => {
    loadedAtRef.current = Date.now();
    dispatch({ type: 'SET_FLOW', flow: f });
  }, []);

  const setFlowWithLayout = useCallback((f: FlowDto) => {
    loadedAtRef.current = Date.now();
    dispatch({ type: 'SET_FLOW_WITH_LAYOUT', flow: f });
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (c) => {
      dispatch({ type: 'SNAPSHOT' });
      dispatch({ type: 'SET_NODES', nodes: applyNodeChanges(c, state.nodes) as Node<FlowNodeData>[] });
    },
    [state.nodes],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (c) => {
      dispatch({ type: 'SNAPSHOT' });
      dispatch({ type: 'SET_EDGES', edges: applyEdgeChanges(c, state.edges) });
    },
    [state.edges],
  );

  const onConnect: OnConnect = useCallback(
    (conn: Connection) => {
      dispatch({ type: 'SNAPSHOT' });
      dispatch({
        type: 'SET_EDGES',
        edges: addEdge(
          { ...conn, type: 'smoothstep', animated: true, style: { stroke: '#059669', strokeWidth: 2 } },
          state.edges,
        ),
      });
    },
    [state.edges],
  );

  const addNode = useCallback(
    (type: FlowNodeTypeValue, name: string, x?: number, y?: number) => {
      const maxY = state.nodes.length ? Math.max(...state.nodes.map((n) => n.position.y)) : 0;
      dispatch({ type: 'SNAPSHOT' });
      dispatch({
        type: 'ADD_NODE',
        node: {
          id: `n${state.nodes.length + 1}`,
          type,
          position: { x: x ?? 280, y: y ?? maxY + 120 },
          data: {
            label: name,
            nodeType: type,
            config: {},
            intentId: null,
            capabilityId: null,
            apiEndpointId: null,
            isEntryPoint: type === 'trigger',
            backendId: '',
          },
        },
      });
    },
    [state.nodes],
  );

  const removeNode = useCallback((id: string) => {
    dispatch({ type: 'SNAPSHOT' });
    dispatch({ type: 'REMOVE_NODE', nodeId: id });
  }, []);
  const setFlowName = useCallback((name: string) => dispatch({ type: 'SET_NAME', name }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const manualSave = useCallback(() => {
    if (state.flowId)
      saveFlow.mutate(
        { id: state.flowId, data: reactFlowToSave(state) },
        { onSuccess: () => dispatch({ type: 'MARK_CLEAN' }) },
      );
  }, [state, saveFlow]);

  return {
    ...state,
    dispatch,
    setFlow,
    setFlowWithLayout,
    setFlowName,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    removeNode,
    undo,
    redo,
    clear,
    manualSave,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    isSaving: saveFlow.isPending,
  };
}
