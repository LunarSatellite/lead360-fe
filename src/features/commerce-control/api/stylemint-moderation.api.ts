import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the Stylemint content moderation queue — reported reels, reviews, comments,
 * profiles and recommendation replies awaiting a decision.
 *
 * Unlike the operator-access surface, nothing here needs a step-up MFA challenge: reads take
 * ContentMod, SuperAdmin or Readonly, and decisions take ContentMod or SuperAdmin. So the
 * actions on this page really work.
 */

export const TargetKind = {
  Reel: 1,
  Review: 2,
  ReelComment: 3,
  Profile: 4,
  RecommendationReply: 5,
} as const;
export const TARGET_KIND_LABEL: Record<number, string> = {
  1: 'Reel',
  2: 'Review',
  3: 'Comment',
  4: 'Profile',
  5: 'Recommendation reply',
};

export const ModerationSource = { UserReport: 1, AutomatedScanner: 2, AdminSpot: 3 } as const;
export const SOURCE_LABEL: Record<number, string> = {
  1: 'Reported by a user',
  2: 'Automated scanner',
  3: 'Spotted by an admin',
};

export const ItemState = { Open: 1, InReview: 2, Decided: 3 } as const;
export const STATE_LABEL: Record<number, string> = { 1: 'Open', 2: 'In review', 3: 'Decided' };

export const ModerationAction = {
  NoAction: 1,
  HideContent: 2,
  RemoveContent: 3,
  WarnAuthor: 4,
  SuspendAuthor: 5,
  BanAuthor: 6,
} as const;
export type ModerationActionValue =
  (typeof ModerationAction)[keyof typeof ModerationAction];

export const ACTION_LABEL: Record<number, string> = {
  1: 'No action',
  2: 'Hide content',
  3: 'Remove content',
  4: 'Warn author',
  5: 'Suspend author (7 days)',
  6: 'Ban author',
};

/** Actions that affect the person rather than the post, ordered by severity. */
export const ACTION_SEVERITY: Record<number, 'low' | 'medium' | 'high'> = {
  1: 'low',
  2: 'medium',
  3: 'medium',
  4: 'medium',
  5: 'high',
  6: 'high',
};

export type ModerationItem = {
  id: string;
  targetKind: number;
  targetId: string;
  source: number;
  reporterAccountId?: string | null;
  reportReasonCode?: string | null;
  state: number;
  assignedReviewerId?: string | null;
  submittedUtc: string;
  decidedUtc?: string | null;
  action?: number | null;
  decisionNote?: string | null;
};

export type ModerationPage = {
  items: ModerationItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

const BASE = 'v1/admin/moderation';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ??
        'Your operator account has no Stylemint moderation role yet. ' +
          'An administrator grants ContentMod before the queue can be worked.',
    );
  }
  throw new Error(detail ?? `The moderation queue returned HTTP ${response.status}.`);
}

export const stylemintModerationApi = {
  queue: async (params: {
    targetKind?: number;
    state?: number;
    source?: number;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<ModerationPage> => {
    const query = new URLSearchParams();
    if (params.targetKind) query.set('targetKind', String(params.targetKind));
    if (params.state) query.set('state', String(params.state));
    if (params.source) query.set('source', String(params.source));
    query.set('pageNumber', String(params.pageNumber ?? 1));
    query.set('pageSize', String(params.pageSize ?? 50));

    return unwrap<ModerationPage>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/queue`,
        query: query.toString(),
      }),
    );
  },

  get: async (moderationItemId: string): Promise<ModerationItem> =>
    unwrap<ModerationItem>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/${encodeURIComponent(moderationItemId)}`,
      }),
    ),

  decide: async (
    moderationItemId: string,
    action: ModerationActionValue,
    decisionNote?: string,
  ): Promise<ModerationItem> =>
    unwrap<ModerationItem>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(moderationItemId)}/decide`,
        body: JSON.stringify({ action, decisionNote: decisionNote || null }),
      }),
    ),
};
