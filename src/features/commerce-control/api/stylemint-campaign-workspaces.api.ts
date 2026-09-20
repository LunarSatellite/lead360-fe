import { stylemintOperationsApi, type OperationMethod } from './stylemint-operations.api';

/**
 * Campaign workspaces: the brand-studio pipeline that takes a brief to a live campaign —
 * configure, approve, activate, generate creative, review it through named gates, and read what
 * the campaign actually measured.
 *
 * Vendor credential, like the rest of brand studio.
 *
 * The review gates are the point of this surface. Nothing generated reaches a customer until a
 * named human has cleared every gate it was routed to, and that clearing is what these calls
 * record. A UI that let an operator approve without saying which gate, or without a note, would
 * hollow out the control it exists to operate.
 */

export type Report = Record<string, unknown>;

export const CampaignCreativeKind = {
  Copy: 1,
  ImageInstruction: 2,
  LandingModule: 3,
  VariantCaption: 4,
} as const;

export type CampaignCreativeKindValue =
  (typeof CampaignCreativeKind)[keyof typeof CampaignCreativeKind];

export const CREATIVE_KIND_LABEL: Record<number, string> = {
  1: 'Copy',
  2: 'Image instruction',
  3: 'Landing module',
  4: 'Variant caption',
};

export const CampaignReviewGate = {
  Claim: 1,
  Legal: 2,
  Brand: 3,
  Translation: 4,
  Accessibility: 5,
} as const;

export type CampaignReviewGateValue =
  (typeof CampaignReviewGate)[keyof typeof CampaignReviewGate];

export const REVIEW_GATE_LABEL: Record<number, string> = {
  1: 'Claim',
  2: 'Legal',
  3: 'Brand',
  4: 'Translation',
  5: 'Accessibility',
};

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  // An unmatched upstream route 404s with an empty body; a controller's own 404 carries one.
  if (response.status === 404) {
    const empty = response.body == null || response.body === '';
    throw new Error(empty ? 'NOT_DEPLOYED' : 'NOT_FOUND');
  }
  if (response.status === 409 || response.status === 422) {
    throw new Error(detail ?? 'The workspace is not in a state where that step is allowed.');
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      detail ?? 'Lead360 is not configured with a vendor credential for this environment.',
    );
  }
  throw new Error(detail ?? `The campaign workspace surface returned HTTP ${response.status}.`);
}

const BASE = 'v1/vendor/campaign-workspaces';

async function call<T = Report>(
  method: OperationMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  return unwrap<T>(
    await stylemintOperationsApi.invoke({
      method,
      path,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

const id = (value: string) => encodeURIComponent(value);

export const stylemintCampaignWorkspacesApi = {
  list: () => call('GET', BASE),

  get: (workspaceId: string) => call('GET', `${BASE}/${id(workspaceId)}`),

  create: (params: {
    brandBriefId: string;
    name: string;
    budgetAmount: number;
    budgetCurrency: string;
  }) => call('POST', BASE, params),

  /** The three configuration blocks are free-form JSON the pipeline interprets, not fixed forms. */
  configure: (
    workspaceId: string,
    params: { creativeVariantsJson: string; channelsJson: string; experimentJson: string },
  ) => call('PUT', `${BASE}/${id(workspaceId)}/configuration`, params),

  approve: (workspaceId: string) => call('POST', `${BASE}/${id(workspaceId)}/approve`, {}),

  activate: (workspaceId: string) => call('POST', `${BASE}/${id(workspaceId)}/activate`, {}),

  refreshOutcome: (workspaceId: string) =>
    call('POST', `${BASE}/${id(workspaceId)}/outcomes/refresh`, {}),

  creative: (workspaceId: string) => call('GET', `${BASE}/${id(workspaceId)}/creative`),

  generateCreative: (
    workspaceId: string,
    params: { kind: CampaignCreativeKindValue; channel: string; locale: string; count: number },
  ) => call('POST', `${BASE}/${id(workspaceId)}/creative/generate`, params),

  /** Clearing — or failing — one named gate on one draft. The note is the reviewer's reasoning. */
  reviewCreative: (
    workspaceId: string,
    draftId: string,
    params: { gate: CampaignReviewGateValue; cleared: boolean; note: string },
  ) => call('POST', `${BASE}/${id(workspaceId)}/creative/${id(draftId)}/review`, params),

  retireCreative: (workspaceId: string, draftId: string, reason: string) =>
    call('POST', `${BASE}/${id(workspaceId)}/creative/${id(draftId)}/retire`, { reason }),

  measurement: (workspaceId: string) => call('GET', `${BASE}/${id(workspaceId)}/measurement`),
};
