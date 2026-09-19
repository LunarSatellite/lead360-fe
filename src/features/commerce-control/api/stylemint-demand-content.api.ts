import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for demand content — the answer pages the platform publishes about its own
 * products, generated from approved facts and gated before anything goes live.
 *
 * The gates are the point. A unit cannot be published until every required gate is cleared, and
 * each gate is a different kind of sign-off: a claim needs substantiating, legal and brand need
 * approving, a translation needs checking. Refusals record what the generator would not assert.
 *
 * SuperAdmin, no step-up MFA.
 */

export const DemandContentState = {
  Drafted: 1,
  InReview: 2,
  Approved: 3,
  Rejected: 4,
  Published: 5,
  Withdrawn: 6,
  Superseded: 7,
} as const;
export type DemandContentStateValue =
  (typeof DemandContentState)[keyof typeof DemandContentState];

export const DEMAND_STATE_LABEL: Record<number, string> = {
  1: 'Drafted',
  2: 'In review',
  3: 'Approved',
  4: 'Rejected',
  5: 'Published',
  6: 'Withdrawn',
  7: 'Superseded',
};

export const DEMAND_KIND_LABEL: Record<number, string> = {
  1: 'Product answer',
  2: 'Comparison answer',
};

export type DemandAnswer = { question?: string; answer?: string } & Record<string, unknown>;
export type DemandLink = { slug?: string; label?: string } & Record<string, unknown>;
export type ClearedGate = { gate?: string; clearedUtc?: string; note?: string } & Record<
  string,
  unknown
>;
export type Refusal = { reason?: string; detail?: string } & Record<string, unknown>;

export type DemandContentUnit = {
  id: string;
  kind: number;
  canonicalSlug: string;
  locale: string;
  subjectProductIds: string[];
  metaTitle: string;
  metaDescription: string;
  answers: DemandAnswer[];
  structuredDataJson: string;
  internalLinks: DemandLink[];
  state: number;
  requiredGates: string[];
  outstandingGates: string[];
  clearedGates: ClearedGate[];
  refusals: Refusal[];
};

const BASE = 'v1/admin/catalog/demand-content';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ?? 'Demand content takes the Stylemint SuperAdmin role. An administrator grants it.',
    );
  }
  if (response.status === 409) {
    throw new Error(detail ?? 'That gate is already cleared, or the unit moved on.');
  }
  throw new Error(detail ?? `The demand-content surface returned HTTP ${response.status}.`);
}

/** A unit is publishable only once nothing is outstanding. */
export function isPublishable(unit: DemandContentUnit): boolean {
  return (
    unit.outstandingGates.length === 0 &&
    unit.state !== DemandContentState.Published &&
    unit.state !== DemandContentState.Withdrawn &&
    unit.state !== DemandContentState.Superseded
  );
}

export const stylemintDemandContentApi = {
  list: async (
    state: DemandContentStateValue = DemandContentState.Drafted,
    take = 50,
  ): Promise<DemandContentUnit[]> =>
    unwrap<DemandContentUnit[]>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: BASE,
        query: `state=${state}&take=${take}`,
      }),
    ),

  get: async (unitId: string): Promise<DemandContentUnit> =>
    unwrap<DemandContentUnit>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/${encodeURIComponent(unitId)}`,
      }),
    ),

  /** Signs off one gate. The note is the substantiation. */
  clearGate: async (unitId: string, gate: string, note?: string): Promise<DemandContentUnit> =>
    unwrap<DemandContentUnit>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(unitId)}/gates/${encodeURIComponent(gate)}`,
        body: JSON.stringify({ note: note || null }),
      }),
    ),

  reject: async (unitId: string, reason: string): Promise<DemandContentUnit> =>
    unwrap<DemandContentUnit>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(unitId)}/rejection`,
        body: JSON.stringify({ reason }),
      }),
    ),

  publish: async (unitId: string): Promise<DemandContentUnit> =>
    unwrap<DemandContentUnit>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(unitId)}/publication`,
        body: JSON.stringify({}),
      }),
    ),

  withdraw: async (unitId: string, reason: string): Promise<DemandContentUnit> =>
    unwrap<DemandContentUnit>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(unitId)}/withdrawal`,
        body: JSON.stringify({ reason }),
      }),
    ),

  /** Freshness check — whether the facts behind a published unit still hold. */
  inspect: async (unitId: string): Promise<Record<string, unknown>> =>
    unwrap<Record<string, unknown>>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(unitId)}/inspection`,
      }),
    ),
};
