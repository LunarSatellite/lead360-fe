import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData, FlowNodeTypeValue } from '../types/flow.types';

export type GapType = 'no-api-config' | 'dead-end' | 'no-rules';

export interface FlowNodeGap {
  nodeKey:  string;
  nodeType: FlowNodeTypeValue;
  nodeName: string;
  gapType:  GapType;
  resolved: boolean;
}

/**
 * Pure function — runs on every node/edge change, no API call.
 * Returns gaps for nodes that need user attention.
 * A gap is "resolved" when the user has answered the setup questions.
 */
export function detectGaps(nodes: Node<FlowNodeData>[], edges: Edge[]): FlowNodeGap[] {
  const gaps: FlowNodeGap[] = [];
  const outgoingMap = new Map<string, Edge[]>();
  for (const edge of edges) {
    if (!outgoingMap.has(edge.source)) outgoingMap.set(edge.source, []);
    outgoingMap.get(edge.source)!.push(edge);
  }

  for (const node of nodes) {
    const data     = node.data as FlowNodeData;
    const config   = data.config ?? {};
    const outgoing = outgoingMap.get(node.id) ?? [];

    // ── API node ──────────────────────────────────────────────────────
    if (data.nodeType === 'api') {
      const hasIntent  = !!data.intentId || !!data.capabilityId;
      const hasUrl     = !!(config.apiEndpointUrl as string)?.trim();
      const hasMsg     = !!(config.customMessage as string)?.trim();
      const skipped    = config.skipped === true;
      const hasApiFlag = config.hasApi;   // true | false | null | undefined

      // Already fully configured
      if (hasIntent || hasUrl || hasMsg || skipped) {
        // still register as resolved so the pill clears
        gaps.push({ nodeKey: node.id, nodeType: data.nodeType, nodeName: data.label, gapType: 'no-api-config', resolved: true });
        continue;
      }

      // User answered "Yes" but hasn't entered URL yet
      if (hasApiFlag === true && !hasUrl) {
        gaps.push({ nodeKey: node.id, nodeType: data.nodeType, nodeName: data.label, gapType: 'no-api-config', resolved: false });
        continue;
      }

      // User answered "No" to API and "No, skip it" → resolved
      if (hasApiFlag === false && skipped) {
        gaps.push({ nodeKey: node.id, nodeType: data.nodeType, nodeName: data.label, gapType: 'no-api-config', resolved: true });
        continue;
      }

      // Nothing answered yet → unresolved
      if (hasApiFlag === undefined || hasApiFlag === null) {
        gaps.push({ nodeKey: node.id, nodeType: data.nodeType, nodeName: data.label, gapType: 'no-api-config', resolved: false });
      }
    }

    // ── Response node with no outgoing connection ─────────────────────
    if (data.nodeType === 'response' && outgoing.length === 0) {
      const resolved = !!(config.customMessage as string)?.trim()
                    || !!(config.followUpMessage as string)?.trim()
                    || config.skipped === true;
      gaps.push({ nodeKey: node.id, nodeType: data.nodeType, nodeName: data.label, gapType: 'dead-end', resolved });
    }

    // ── Condition node with no rules ──────────────────────────────────
    if (data.nodeType === 'condition') {
      const rules = config.rules as string[] | undefined;
      if (!rules || rules.length === 0)
        gaps.push({ nodeKey: node.id, nodeType: data.nodeType, nodeName: data.label, gapType: 'no-rules', resolved: false });
    }
  }

  return gaps;
}

/** Returns the first UNRESOLVED gap for this node, or undefined if clean. */
export function getNodeGap(nodeKey: string, gaps: FlowNodeGap[]): FlowNodeGap | undefined {
  return gaps.find(g => g.nodeKey === nodeKey && !g.resolved);
}

/** Count of nodes that still need attention. */
export function unresolvedCount(gaps: FlowNodeGap[]): number {
  return gaps.filter(g => !g.resolved).length;
}
