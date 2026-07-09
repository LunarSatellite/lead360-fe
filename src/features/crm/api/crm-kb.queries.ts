import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { crmKbApi } from './crm-kb.api';
import { getApiError } from '@/shared/lib/get-api-error';
import type { CrmKbDraftReviewRequest } from '../types/crm-kb.types';

const KEYS = {
  articles: (categoryTag?: string) => ['crm', 'kb', 'articles', categoryTag ?? 'all'] as const,
  articleById: (id: string) => ['crm', 'kb', 'articles', 'byId', id] as const,
  drafts: () => ['crm', 'kb', 'drafts'] as const,
};

export function useKbArticles(categoryTag?: string) {
  return useQuery({ queryKey: KEYS.articles(categoryTag), queryFn: () => crmKbApi.getPublished(categoryTag) });
}

export function useKbArticleById(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.articleById(id ?? ''),
    queryFn: () => crmKbApi.getById(id!),
    enabled: !!id,
  });
}

export function useUpdateKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => crmKbApi.updateArticle(id, content),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.articles() });
      qc.invalidateQueries({ queryKey: KEYS.articleById(vars.id) });
      toast.success('Article updated');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useKbPendingDrafts() {
  return useQuery({ queryKey: KEYS.drafts(), queryFn: () => crmKbApi.getPendingDrafts() });
}

export function useReviewKbDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: CrmKbDraftReviewRequest }) => crmKbApi.reviewDraft(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.drafts() });
      qc.invalidateQueries({ queryKey: KEYS.articles() });
      toast.success('Draft reviewed');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useGenerateKbDraftFromCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) => crmKbApi.generateDraftFromCase(caseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.drafts() });
      toast.success('KB draft generated — review it on the Knowledge Base page.');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}
