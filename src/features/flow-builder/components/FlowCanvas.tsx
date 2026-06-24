import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Node,
  type Edge,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode } from './CustomNodes/TriggerNode';
import { AiNode } from './CustomNodes/AiNode';
import { ConditionNode } from './CustomNodes/ConditionNode';
import { ResponseNode } from './CustomNodes/ResponseNode';
import { ApiNode } from './CustomNodes/ApiNode';
import { ActionNode } from './CustomNodes/ActionNode';
import { NODE_TYPE_META, type FlowNodeData, type FlowNodeTypeValue } from '../types/flow.types';

const nodeTypes = {
  trigger: TriggerNode,
  ai: AiNode,
  condition: ConditionNode,
  response: ResponseNode,
  api: ApiNode,
  action: ActionNode,
};

interface FlowCanvasProps {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeSelect: (node: Node<FlowNodeData> | null) => void;
  onDropNode: (type: FlowNodeTypeValue, name: string, x: number, y: number) => void;
}

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeSelect,
  onDropNode,
}: FlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow-type') as FlowNodeTypeValue;
      if (!type) return;
      const meta = NODE_TYPE_META[type];
      if (!meta) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      onDropNode(type, `New ${meta.label}`, position.x, position.y);
    },
    [screenToFlowPosition, onDropNode],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect(node as Node<FlowNodeData>);
    },
    [onNodeSelect],
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <div ref={reactFlowWrapper} className="flex-1 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#059669', strokeWidth: 2 },
        }}
        style={{ background: '#F8FAFC' }}
      >
        <Background gap={20} size={1} color="#E2E8F0" />
        <Controls
          position="bottom-right"
          showInteractive={false}
          className="!bg-white !border-border-subtle !rounded-lg !shadow-sm"
        />
        <MiniMap
          position="bottom-right"
          style={{ bottom: 140 }}
          nodeColor={(n) => NODE_TYPE_META[(n.data as FlowNodeData)?.nodeType]?.color || '#94A3B8'}
          maskColor="rgba(248,250,252,0.7)"
          className="!bg-white !border-border-subtle !rounded-lg"
        />
      </ReactFlow>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center">
            <div className="text-5xl mb-3 opacity-40">✨</div>
            <div className="text-base font-bold text-text-primary mb-1">Design Your Bot</div>
            <div className="text-xs text-text-muted">Describe it above, or drag blocks from the left</div>
          </div>
        </div>
      )}
    </div>
  );
}
