import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { crmGdprApi } from './crm-gdpr.api';
import { getApiError } from '@/shared/lib/get-api-error';
import type {
  CreateDataRetentionPolicyRequest,
  CreateDataSubjectRequestRequest,
} from '../types/crm-gdpr.types';

const KEYS = {
  subjectRequests: (page: number) => ['crm', 'gdpr', 'subject-requests', page] as const,
  retentionPolicies: (page: number) => ['crm', 'gdpr', 'retention-policies', page] as const,
};

export function useGdprSubjectRequests(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: KEYS.subjectRequests(page),
    queryFn: () => crmGdprApi.getSubjectRequests(page, pageSize),
  });
}

export function useCreateGdprSubjectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateDataSubjectRequestRequest) =>
      crmGdprApi.createSubjectRequest(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'gdpr', 'subject-requests'] });
      toast.success('Request logged');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useMarkErasureProcessed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmGdprApi.markErasureProcessed(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'gdpr', 'subject-requests'] });
      // Deliberately not "Data erased" — the endpoint only records that
      // someone dealt with it. See the note on `markErasureProcessed`.
      toast.success('Marked as processed');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useGdprRetentionPolicies(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: KEYS.retentionPolicies(page),
    queryFn: () => crmGdprApi.getRetentionPolicies(page, pageSize),
  });
}

export function useCreateGdprRetentionPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateDataRetentionPolicyRequest) =>
      crmGdprApi.createRetentionPolicy(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'gdpr', 'retention-policies'] });
      toast.success('Retention policy created');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}
