// ═══════════════════════════════════════════════════════════════
// Flow Builder Feature — Mock Data Layer
// DELETE THIS FILE when backend Bundle 6 is implemented
//
// KEY BEHAVIOR:
// - getByTenant returns EMPTY flow → user sees the input screen first
// - generate returns the SAMPLE flow → only after user describes their chatbot
// - save persists locally → so edits survive within the session
// ═══════════════════════════════════════════════════════════════

import { FlowNodeType, FlowNodeMode } from '../types/flow.types';
import type {
  FlowDto, FlowCreateRequest, FlowSaveRequest, FlowGenerateRequest,
  FlowNodeDto, FlowNodeUpdateRequest,
} from '../types/flow.types';

const MOCK_TENANT_ID = localStorage.getItem('omniflow_tenant_id') ?? '00000000-0000-0000-0000-000000000001';
const MOCK_FLOW_ID = 'flow-001';

// ─── The sample flow that "AI generates" from user's description ───

function buildSampleFlow(): FlowDto {
  return {
    id: MOCK_FLOW_ID,
    tenantId: MOCK_TENANT_ID,
    name: 'Main Chatbot Flow',
    description: 'Generated from your description',
    version: 1,
    isPublished: false,
    nodes: [
      {
        id: 'node-welcome',
        tenantId: MOCK_TENANT_ID,
        flowId: MOCK_FLOW_ID,
        parentId: null,
        type: FlowNodeType.Menu,
        mode: FlowNodeMode.Deterministic,
        label: 'Welcome',
        description: 'Entry point — greets the customer',
        intentId: null,
        intentName: null,
        responseTemplate: 'Hi there! 👋 Welcome to our store. How can I help you today?',
        buttons: [
          { id: 'btn-1', label: '🛍️ Browse Products', targetNodeId: 'node-browse' },
          { id: 'btn-2', label: '📦 Track Order', targetNodeId: 'node-track' },
          { id: 'btn-3', label: '💬 Customer Support', targetNodeId: 'node-support' },
        ],
        position: { x: 300, y: 50 },
        isEntry: true,
        isActive: true,
        apiEndpoint: null,
        apiMethod: null,
        handoffTarget: null,
        sortOrder: 0,
        createdAt: '2026-03-25T10:00:00Z',
        updatedAt: null,
      },
      {
        id: 'node-browse',
        tenantId: MOCK_TENANT_ID,
        flowId: MOCK_FLOW_ID,
        parentId: 'node-welcome',
        type: FlowNodeType.Chat,
        mode: FlowNodeMode.AiDriven,
        label: 'Browse Products',
        description: 'AI-driven product browsing',
        intentId: 'intent-browse',
        intentName: 'Browse Products',
        responseTemplate: 'What are you looking for? I can help you find the perfect product.',
        buttons: [],
        position: { x: 80, y: 250 },
        isEntry: false,
        isActive: true,
        apiEndpoint: null,
        apiMethod: null,
        handoffTarget: null,
        sortOrder: 1,
        createdAt: '2026-03-25T10:00:00Z',
        updatedAt: null,
      },
      {
        id: 'node-track',
        tenantId: MOCK_TENANT_ID,
        flowId: MOCK_FLOW_ID,
        parentId: 'node-welcome',
        type: FlowNodeType.Action,
        mode: FlowNodeMode.Deterministic,
        label: 'Track Order',
        description: 'Calls the order tracking API',
        intentId: 'intent-track',
        intentName: 'Track Order',
        responseTemplate: 'Please enter your order number and I\'ll check the status for you.',
        buttons: [],
        position: { x: 300, y: 250 },
        isEntry: false,
        isActive: true,
        apiEndpoint: 'GET /orders/{order_id}/status',
        apiMethod: 'GET',
        handoffTarget: null,
        sortOrder: 2,
        createdAt: '2026-03-25T10:00:00Z',
        updatedAt: null,
      },
      {
        id: 'node-support',
        tenantId: MOCK_TENANT_ID,
        flowId: MOCK_FLOW_ID,
        parentId: 'node-welcome',
        type: FlowNodeType.Menu,
        mode: FlowNodeMode.Deterministic,
        label: 'Customer Support',
        description: 'Support sub-menu',
        intentId: 'intent-support',
        intentName: 'Customer Support',
        responseTemplate: 'How can our support team help you?',
        buttons: [
          { id: 'btn-s1', label: '🔄 Returns & Refunds', targetNodeId: 'node-returns' },
          { id: 'btn-s2', label: '👤 Talk to Agent', targetNodeId: 'node-agent' },
        ],
        position: { x: 530, y: 250 },
        isEntry: false,
        isActive: true,
        apiEndpoint: null,
        apiMethod: null,
        handoffTarget: null,
        sortOrder: 3,
        createdAt: '2026-03-25T10:00:00Z',
        updatedAt: null,
      },
      {
        id: 'node-returns',
        tenantId: MOCK_TENANT_ID,
        flowId: MOCK_FLOW_ID,
        parentId: 'node-support',
        type: FlowNodeType.Chat,
        mode: FlowNodeMode.AiDriven,
        label: 'Returns & Refunds',
        description: 'AI handles return/refund queries',
        intentId: null,
        intentName: null,
        responseTemplate: 'I can help with returns and refunds. What\'s your order number?',
        buttons: [],
        position: { x: 440, y: 450 },
        isEntry: false,
        isActive: true,
        apiEndpoint: null,
        apiMethod: null,
        handoffTarget: null,
        sortOrder: 4,
        createdAt: '2026-03-25T10:00:00Z',
        updatedAt: null,
      },
      {
        id: 'node-agent',
        tenantId: MOCK_TENANT_ID,
        flowId: MOCK_FLOW_ID,
        parentId: 'node-support',
        type: FlowNodeType.Handoff,
        mode: FlowNodeMode.Deterministic,
        label: 'Talk to Agent',
        description: 'Transfer to human agent',
        intentId: null,
        intentName: null,
        responseTemplate: 'Connecting you to a support agent. Please hold on...',
        buttons: [],
        position: { x: 660, y: 450 },
        isEntry: false,
        isActive: true,
        apiEndpoint: null,
        apiMethod: null,
        handoffTarget: 'support-team',
        sortOrder: 5,
        createdAt: '2026-03-25T10:00:00Z',
        updatedAt: null,
      },
    ],
    edges: [
      { id: 'e-w-b', flowId: MOCK_FLOW_ID, sourceNodeId: 'node-welcome', sourceHandle: 'btn-1', targetNodeId: 'node-browse', targetHandle: null, label: 'Browse Products' },
      { id: 'e-w-t', flowId: MOCK_FLOW_ID, sourceNodeId: 'node-welcome', sourceHandle: 'btn-2', targetNodeId: 'node-track', targetHandle: null, label: 'Track Order' },
      { id: 'e-w-s', flowId: MOCK_FLOW_ID, sourceNodeId: 'node-welcome', sourceHandle: 'btn-3', targetNodeId: 'node-support', targetHandle: null, label: 'Support' },
      { id: 'e-s-r', flowId: MOCK_FLOW_ID, sourceNodeId: 'node-support', sourceHandle: 'btn-s1', targetNodeId: 'node-returns', targetHandle: null, label: 'Returns' },
      { id: 'e-s-a', flowId: MOCK_FLOW_ID, sourceNodeId: 'node-support', sourceHandle: 'btn-s2', targetNodeId: 'node-agent', targetHandle: null, label: 'Agent' },
    ],
    createdAt: '2026-03-25T10:00:00Z',
    updatedAt: null,
  };
}

// ─── Mutable state: starts EMPTY, populated only after generate ───

let currentFlow: FlowDto | null = null;

// ─── Simulated delay ───
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Mock API handlers ───

export const flowMockApi = {
  // Returns null/empty until user generates a flow
  getByTenant: async (_tenantId: string): Promise<FlowDto | null> => {
    await delay(300);
    return currentFlow ? structuredClone(currentFlow) : null;
  },

  getById: async (_id: string): Promise<FlowDto> => {
    await delay(300);
    return structuredClone(currentFlow ?? buildSampleFlow());
  },

  create: async (data: FlowCreateRequest): Promise<FlowDto> => {
    await delay(500);
    currentFlow = {
      ...buildSampleFlow(),
      id: `flow-${Date.now()}`,
      tenantId: data.tenantId,
      name: data.name,
      description: data.description ?? null,
      nodes: [],
      edges: [],
    };
    return structuredClone(currentFlow);
  },

  save: async (_id: string, data: FlowSaveRequest): Promise<FlowDto> => {
    await delay(600);
    if (currentFlow) {
      currentFlow = {
        ...currentFlow,
        nodes: data.nodes,
        edges: data.edges,
        updatedAt: new Date().toISOString(),
      };
    }
    return structuredClone(currentFlow!);
  },

  updateNode: async (id: string, data: FlowNodeUpdateRequest): Promise<FlowNodeDto> => {
    await delay(300);
    if (currentFlow) {
      const idx = currentFlow.nodes.findIndex((n) => n.id === id);
      if (idx >= 0) {
        currentFlow.nodes[idx] = { ...currentFlow.nodes[idx], ...data } as FlowNodeDto;
        return structuredClone(currentFlow.nodes[idx]);
      }
    }
    throw new Error('Node not found');
  },

  // THIS is the key method — generates the flow from user's description
  generate: async (_data: FlowGenerateRequest): Promise<FlowDto> => {
    await delay(2500); // Simulate AI thinking
    currentFlow = buildSampleFlow();
    return structuredClone(currentFlow);
  },

  publish: async (_id: string): Promise<void> => {
    await delay(500);
    if (currentFlow) currentFlow.isPublished = true;
  },

  delete: async (_id: string): Promise<void> => {
    await delay(300);
    currentFlow = null;
  },
} as const;
