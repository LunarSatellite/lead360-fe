import { apiClient } from '@/shared/lib/api-client';
import type { CrmKbArticleDto, CrmKbDraftDto, CrmKbDraftReviewRequest } from '../types/crm-kb.types';

const BASE = '/v1/crm/knowledge-base';

export const crmKbApi = {
  getPublished: (categoryTag?: string): Promise<CrmKbArticleDto[]> =>
    apiClient.get(`${BASE}/articles`, { params: categoryTag ? { categoryTag } : undefined }) as unknown as Promise<CrmKbArticleDto[]>,

  getById: (id: string): Promise<CrmKbArticleDto> =>
    apiClient.get(`${BASE}/articles/${id}`) as unknown as Promise<CrmKbArticleDto>,

  updateArticle: (id: string, content: string): Promise<CrmKbArticleDto> =>
    apiClient.put(`${BASE}/articles/${id}`, { content }) as unknown as Promise<CrmKbArticleDto>,

  getPendingDrafts: (): Promise<CrmKbDraftDto[]> =>
    apiClient.get(`${BASE}/drafts`) as unknown as Promise<CrmKbDraftDto[]>,

  reviewDraft: (id: string, req: CrmKbDraftReviewRequest): Promise<CrmKbDraftDto> =>
    apiClient.post(`${BASE}/drafts/${id}/review`, req) as unknown as Promise<CrmKbDraftDto>,

  generateDraftFromCase: (caseId: string): Promise<CrmKbDraftDto> =>
    apiClient.post(`${BASE}/drafts/from-case/${caseId}`, {}) as unknown as Promise<CrmKbDraftDto>,
};
