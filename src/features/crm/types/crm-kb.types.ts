export const CrmKbArticleStatus = { Draft: 1, Published: 2, Stale: 3, Archived: 4 } as const;
export type CrmKbArticleStatusValue = (typeof CrmKbArticleStatus)[keyof typeof CrmKbArticleStatus];

export const CRM_KB_ARTICLE_STATUS_LABELS: Record<CrmKbArticleStatusValue, string> = {
  1: 'Draft', 2: 'Published', 3: 'Stale', 4: 'Archived',
};

export const CrmKbDraftStatus = { Pending: 1, Approved: 2, Rejected: 3 } as const;
export type CrmKbDraftStatusValue = (typeof CrmKbDraftStatus)[keyof typeof CrmKbDraftStatus];

export interface CrmKbArticleDto {
  id: string;
  title: string;
  summary: string;
  bodyContent: string;
  categoryTag?: string | null;
  status: CrmKbArticleStatusValue;
  viewCount: number;
  lastVerifiedAt?: string | null;
  createdAt: string;
}

export interface CrmKbDraftDto {
  id: string;
  articleId?: string | null;
  sourceCaseId?: string | null;
  proposedTitle: string;
  proposedContent: string;
  draftStatus: CrmKbDraftStatusValue;
  createdAt: string;
}

export interface CrmKbDraftReviewRequest {
  decision: CrmKbDraftStatusValue;
  rejectionReason?: string | null;
}
