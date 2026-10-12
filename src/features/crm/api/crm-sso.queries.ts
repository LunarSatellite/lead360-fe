import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { crmSsoApi } from './crm-sso.api';
import { getApiError } from '@/shared/lib/get-api-error';
import type { CreateSsoConfigurationRequest } from '../types/crm-sso.types';

const KEY = ['crm', 'sso'] as const;

export function useSsoConfigurations() {
  return useQuery({ queryKey: KEY, queryFn: () => crmSsoApi.getAll() });
}

export function useCreateSsoConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateSsoConfigurationRequest) => crmSsoApi.create(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('SSO connection saved');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useUpdateSsoConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: CreateSsoConfigurationRequest }) =>
      crmSsoApi.update(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('SSO connection updated');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useDeleteSsoConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmSsoApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('SSO connection removed');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useRecordSsoTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmSsoApi.recordTest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      // Not "Connection OK" — the endpoint never contacted anything.
      toast.success('Checked-on date recorded');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}
