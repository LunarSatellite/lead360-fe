import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { settingsApi } from './settings.api';
import { ApiError } from '@/shared/lib/api-client';
import type { SetApiCredentialsRequest, SetResponseStorageRequest } from '../types/settings.types';

export const settingsKeys = {
  apiCredentials: ['settings', 'api-credentials'] as const,
  responseStorage: ['settings', 'response-storage'] as const,
} as const;

export function useApiCredentials() {
  return useQuery({
    queryKey: settingsKeys.apiCredentials,
    queryFn: settingsApi.getApiCredentials,
  });
}

export function useSetApiCredentials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SetApiCredentialsRequest) => settingsApi.setApiCredentials(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: settingsKeys.apiCredentials });
      toast.success('API credentials saved.');
    },
  });
}

export function useDeleteApiCredentials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.deleteApiCredentials,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: settingsKeys.apiCredentials });
      toast.success('API credentials removed.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to disconnect.'),
  });
}

export function useResponseStorage() {
  return useQuery({
    queryKey: settingsKeys.responseStorage,
    queryFn: settingsApi.getResponseStorage,
  });
}

export function useSetResponseStorage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SetResponseStorageRequest) => settingsApi.setResponseStorage(data),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: settingsKeys.responseStorage });
      if (!vars.enabled) {
        toast.success('Response storage disabled. Existing rows are kept; no new bodies will be saved.');
      }
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to update setting.'),
  });
}
