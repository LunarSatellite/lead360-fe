---
name: omniflow-flow-builder
description: React Flow (xyflow) patterns specific to OmniFlow's visual flow-builder — custom nodes, handles, edges, node palette, autosave, undo/redo, and the dark-green styling applied to the canvas. Use this skill WHENEVER the user works on the flow builder, visual editor, node canvas, drag-and-drop, conversation flow, intent graph, the files under `features/flow-builder/`, or mentions @xyflow/react, reactflow, nodes, edges, handles, or "the builder". Also use when debugging "handles not connecting", "nodes jump on drag", "canvas blank", "infinite re-render on node change", or "nodeTypes changed" warnings — these are the exact footguns of React Flow v12.
---

# OmniFlow Flow Builder

Uses `@xyflow/react` v12+. Lives at `src/features/flow-builder/`. Integrates with the rest of the app through `useFlow(tenantId)` which persists the graph to the backend.

## The 12 rules of React Flow v12 in this codebase

1. **Always import from `@xyflow/react`, never `reactflow`.** The old package is deprecated.
2. **The canvas needs explicit height.** Wrap `<ReactFlow />` in a parent with `h-full` and `w-full`; the parent above that must also have a bounded height. Silent blank-canvas bugs come from this.
3. **`nodeTypes` and `edgeTypes` must be memoized or module-level constants.** Recreating them on every render is the #1 cause of "rendering node types is an anti-pattern" warnings and full canvas re-mounts.
4. **Node `data` must be immutable.** Mutating `node.data.label = 'x'` does nothing. Always `setNodes((ns) => ns.map(n => n.id === id ? { ...n, data: { ...n.data, label: 'x' } } : n))`.
5. **Handles need `id` when more than one exists per side.** `<Handle type="source" position={Position.Right} id="true" />` + `<Handle type="source" position={Position.Right} id="false" />`.
6. **Handles need visible styling** or users can't tell where to connect. Use the project's green-glow handle (see snippet below).
7. **Connection validation uses `isValidConnection`**, not `onConnect`. `onConnect` runs after a valid connection — by then it's too late to reject.
8. **Use `useNodesState` / `useEdgesState` for local-only editors.** For persisted graphs (like ours), lift state up and pass `nodes` + `onNodesChange` explicitly.
9. **Pan/zoom state should NOT be persisted** unless the user explicitly saves a viewport. Store viewport in local ref, not in TanStack Query cache.
10. **`fitView` only on initial mount** — not on every data change, or the canvas jumps on each save.
11. **Selections belong in component state, not in node data.** Don't set `node.data.selected = true`; React Flow handles selection via its own `selected` flag.
12. **Always include `<Background />` and `<Controls />`.** No background means users can't tell it's a canvas; no controls means no zoom reset.

## Canonical canvas shell

```tsx
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes';   // module-level const — see below
import { edgeTypes } from './edges';

export function FlowCanvas({ initialNodes, initialEdges, onChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Propagate changes up, debounced for autosave
  useEffect(() => {
    const t = setTimeout(() => onChange({ nodes, edges }), 400);
    return () => clearTimeout(t);
  }, [nodes, edges]);

  return (
    <div className="h-full w-full bg-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(c) => setEdges((es) => addEdge(c, es))}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1A2B22" gap={24} size={1} />
        <Controls className="!bg-glass-1 !border-thin !border-border-subtle" />
        <MiniMap
          nodeColor="#00D97E"
          maskColor="rgba(10,15,13,0.8)"
          className="!bg-glass-1 !border-thin !border-border-subtle"
        />
      </ReactFlow>
    </div>
  );
}
```

## Custom node — MenuNode example

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { List } from 'lucide-react';

type MenuNodeData = { title: string; options: string[] };

export function MenuNode({ data, selected }: NodeProps<MenuNodeData>) {
  return (
    <div
      className={[
        'min-w-48 rounded-card border-thin bg-glass-1 px-3.5 py-2.5',
        selected ? 'border-border-glow' : 'border-border-subtle',
      ].join(' ')}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-brand !border-thin !border-border-glow"
      />

      <div className="flex items-center gap-2">
        <List className="w-4 h-4 text-brand" strokeWidth={1.6} />
        <span className="text-xs font-extrabold text-text-primary">{data.title}</span>
      </div>

      <ul className="mt-2 flex flex-col gap-0.5">
        {data.options.map((o, i) => (
          <li key={i} className="text-2xs text-text-secondary">{o}</li>
        ))}
      </ul>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-brand !border-thin !border-border-glow"
      />
    </div>
  );
}
```

## nodeTypes registry — ALWAYS module-level

```tsx
// src/features/flow-builder/nodes/index.ts
import { MenuNode } from './MenuNode';
import { MessageNode } from './MessageNode';
import { ConditionNode } from './ConditionNode';
import { ActionNode } from './ActionNode';

export const nodeTypes = {
  menu: MenuNode,
  message: MessageNode,
  condition: ConditionNode,
  action: ActionNode,
} as const;
```

Do NOT declare `nodeTypes` inside the component body. That's the single most common React Flow bug in v12.

## Styling the canvas to match the theme

```css
/* Override React Flow's defaults to the OmniFlow palette */
.react-flow__edge-path { stroke: #1E3328; stroke-width: 1.5; }
.react-flow__edge.selected .react-flow__edge-path,
.react-flow__edge:focus .react-flow__edge-path { stroke: #00D97E; }
.react-flow__connectionline { stroke: #00FFAA; stroke-width: 1.5; }
.react-flow__handle { transition: all 150ms; }
.react-flow__handle:hover { box-shadow: 0 0 0 4px rgba(0,217,126,0.2); }
.react-flow__controls-button {
  background: #162019 !important; border: 0.5px solid #1A2B22 !important;
  color: #8A9B91 !important;
}
.react-flow__controls-button:hover { background: #1A2B22 !important; color: #E8F0EC !important; }
```

Put this in `features/flow-builder/canvas.css` and import it once from the canvas shell.

## Undo/redo

Keep it simple: maintain a ring buffer of `{ nodes, edges }` snapshots in a `useReducer`. Debounce snapshot creation (300–500ms) so rapid drags produce one undo entry. Keyboard: `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z`.

## Autosave

The canvas emits `{ nodes, edges }` on change (debounced 400ms). The page-level hook calls `useUpdateFlow` with those values. Follow the autosave+RHF rule from `omniflow-forms`: the mutation must NOT invalidate the query that seeds the canvas, or you'll get a feedback loop.

## Known footguns — quick fixes

| Symptom | Cause | Fix |
|---|---|---|
| Blank canvas | parent has no bounded height | wrap in `h-full` container; make grandparent bounded |
| "nodeTypes changed" warning | declared inline | move to module-level const |
| Node label doesn't update | mutated `node.data` directly | `setNodes` with fresh object |
| Canvas jumps on save | `fitView` runs on every update | `fitViewOnInit` only; remove `fitView` on data change |
| Connection snaps back | `onConnect` mutated edges wrong | `setEdges((es) => addEdge(conn, es))` |
| Drag is laggy on 100+ nodes | rerenders are unbounded | memoize node components with `React.memo` and stable `data` |
| Two connections where one expected | multi-handle without `id` | give each `<Handle>` a unique `id` |
| Cmd+Z does nothing | React Flow swallows keys when focused input is inside a node | add `nodrag` class to the input: `<input className="nodrag">` |

## Interaction shortcuts (established convention)

- `Delete` / `Backspace` — remove selected
- `Cmd/Ctrl+D` — duplicate selected
- `Cmd/Ctrl+Z` / `Cmd/Ctrl+Shift+Z` — undo / redo
- `Space+drag` or middle-click-drag — pan
- `Cmd/Ctrl+scroll` — zoom
- `F` — fit view
