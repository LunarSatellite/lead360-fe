import { FlowNodeType, FlowNodeMode } from '../types/flow.types';
import type { FlowNodeDto, FlowNodeTypeValue, FlowNodeData } from '../types/flow.types';

let nodeCounter = 100;

export function generateNodeId(): string {
  return `node-${Date.now()}-${++nodeCounter}`;
}

export function generateEdgeId(sourceId: string, targetId: string): string {
  return `e-${sourceId}-${targetId}-${Date.now()}`;
}

export function createFlowNode(
  type: FlowNodeTypeValue,
  position: { x: number; y: number },
  flowId: string,
  tenantId: string,
): FlowNodeDto {
  const id = generateNodeId();

  const defaults: Record<FlowNodeTypeValue, { label: string; template: string }> = {
    [FlowNodeType.Menu]: { label: 'New Menu', template: 'Choose an option:' },
    [FlowNodeType.Chat]: { label: 'New Chat', template: 'How can I help you?' },
    [FlowNodeType.Action]: { label: 'New Action', template: 'Processing your request...' },
    [FlowNodeType.Handoff]: { label: 'Agent Handoff', template: 'Connecting you to an agent...' },
  };

  const d = defaults[type];

  return {
    id,
    tenantId,
    flowId,
    parentId: null,
    type,
    mode: type === FlowNodeType.Chat ? FlowNodeMode.AiDriven : FlowNodeMode.Deterministic,
    label: d.label,
    description: null,
    intentId: null,
    intentName: null,
    responseTemplate: d.template,
    buttons: type === FlowNodeType.Menu
      ? [{ id: `btn-${id}-1`, label: 'Option 1', targetNodeId: null }]
      : [],
    position,
    isEntry: false,
    isActive: true,
    apiEndpoint: null,
    apiMethod: null,
    handoffTarget: type === FlowNodeType.Handoff ? 'support-team' : null,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
}

/** Convert FlowNodeDto to FlowNodeData for React Flow */
export function toNodeData(node: FlowNodeDto): FlowNodeData {
  return {
    label: node.label,
    nodeType: node.type,
    mode: node.mode,
    description: node.description ?? '',
    intentId: node.intentId,
    intentName: node.intentName,
    responseTemplate: node.responseTemplate ?? '',
    buttons: node.buttons ?? [],
    isEntry: node.isEntry,
    isActive: node.isActive,
    apiEndpoint: node.apiEndpoint,
    apiMethod: node.apiMethod,
    handoffTarget: node.handoffTarget,
  };
}
