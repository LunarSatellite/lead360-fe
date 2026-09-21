/**
 * Drill-down contract — lets an analytics widget navigate to the filtered list
 * of the records behind a number ("Contacts: 8" → the Contacts list of those 8).
 *
 * Both sides import from here so a widget mapper and the destination list page
 * never drift:
 *   - widgets → build a `DrillSpec` via a `drillTo*` helper, pass it to useDrillNavigate()
 *   - lists   → read these same query keys via useUrlFilters() to hydrate their filter
 *
 * Query-key names mirror the camelCase *Filter DTO fields (LeadFilter.stage,
 * CrmDealFilter.status, CrmContactFilter.sourceKind …) so the list page can drop
 * the parsed URL value straight into its filter object.
 *
 * Companion to omniflow-backend/.claude/CRM-ANALYTICS-DRILLDOWN-PLAN.md.
 */
import { ROUTES } from '@/app/router/route-paths';

export interface DrillSpec {
  /** Absolute app route of the destination list page. */
  route: string;
  /** Query params to apply as the list's initial filter. Empty values are dropped. */
  query: Record<string, string | number>;
}

function compact(q: Record<string, string | number | undefined | null>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

// ─── DrillSpec builders ──────────────────────────────────────────────────────
// Enum args are the numeric values from the matching crm.types const objects
// (LeadStage, CrmDealStatus, CrmContactSourceKind, CrmSupportCaseStatus).

export function drillToLeads(
  f: { stage?: number; minScore?: number; channel?: number; source?: number; inNurture?: boolean } = {},
): DrillSpec {
  return {
    route: ROUTES.dashboard.crmLeads,
    // inNurture maps to the Leads page's "In Nurture" source tab.
    query: compact({
      stage: f.stage,
      minScore: f.minScore,
      channel: f.channel,
      source: f.source,
      tab: f.inNurture ? 'nurture' : undefined,
    }),
  };
}

export function drillToContacts(
  f: { sourceKind?: number; minChurnProbability?: number; maxChurnProbability?: number; churnKind?: number } = {},
): DrillSpec {
  return {
    route: ROUTES.dashboard.crmContacts,
    query: compact({
      sourceKind: f.sourceKind,
      minChurnProbability: f.minChurnProbability,
      maxChurnProbability: f.maxChurnProbability,
      churnKind: f.churnKind,
    }),
  };
}

/** Open a single contact's detail page (e.g. an at-risk customer from the churn widget). */
export function drillToContactDetail(contactId: string): DrillSpec {
  return { route: ROUTES.dashboard.crmContactDetail(contactId), query: {} };
}

/** Open a single lead's detail page (e.g. the subject of an AI action). */
export function drillToLeadDetail(leadId: string): DrillSpec {
  return { route: ROUTES.dashboard.crmLeadDetail(leadId), query: {} };
}

/** Open a single deal's detail page (e.g. the subject of an AI action). */
export function drillToDealDetail(dealId: string): DrillSpec {
  return { route: ROUTES.dashboard.crmDealDetail(dealId), query: {} };
}

export function drillToDeals(f: { status?: number; stageId?: string; ownedByUserId?: string } = {}): DrillSpec {
  return {
    route: ROUTES.dashboard.crmDeals,
    query: compact({ status: f.status, stageId: f.stageId, ownedByUserId: f.ownedByUserId }),
  };
}

export function drillToSupport(f: { status?: number; priority?: number } = {}): DrillSpec {
  return {
    route: ROUTES.dashboard.crmSupport,
    query: compact({ status: f.status, priority: f.priority }),
  };
}

export function drillToInvoices(f: { status?: number } = {}): DrillSpec {
  return {
    route: ROUTES.dashboard.crmInvoices,
    query: compact({ status: f.status }),
  };
}

export function drillToSubscriptions(f: { planTier?: number; status?: number } = {}): DrillSpec {
  return {
    route: ROUTES.dashboard.crmSubscriptions,
    query: compact({ planTier: f.planTier, status: f.status }),
  };
}

/** Open the Team Management page (e.g. from the team-performance "Members" tile). */
export function drillToTeam(): DrillSpec {
  return { route: ROUTES.dashboard.team, query: {} };
}

export function drillToNps(f: { classification?: number } = {}): DrillSpec {
  return {
    route: ROUTES.dashboard.crmNps,
    query: compact({ classification: f.classification }),
  };
}

/** Serialize a DrillSpec into a `path?query` URL (empty values already dropped). */
export function buildDrillUrl(spec: DrillSpec): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(spec.query)) params.set(k, String(v));
  const qs = params.toString();
  return qs ? `${spec.route}?${qs}` : spec.route;
}
