import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import { tenantDomainsApi } from './tenant-domains.api';
import type {
  AddTenantDomainRequest,
  TenantDomainStatus,
  UploadTenantDomainCertificateRequest,
} from '../types/tenant-domain.types';

export const tenantDomainKeys = {
  all: ['tenant-domains'] as const,
} as const;

export function useTenantDomains() {
  return useQuery({
    queryKey: tenantDomainKeys.all,
    queryFn: tenantDomainsApi.list,
  });
}

export function useAddTenantDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: AddTenantDomainRequest) => tenantDomainsApi.add(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tenantDomainKeys.all });
      toast.success('Custom domain added. Add the displayed DNS TXT record to verify it.');
    },
    onError: (error: ApiError) => toast.error(error.message || 'Failed to add custom domain.'),
  });
}

export function useSetTenantDomainStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ domainId, status }: { domainId: string; status: TenantDomainStatus }) =>
      tenantDomainsApi.setStatus(domainId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tenantDomainKeys.all });
      toast.success('Custom domain status updated.');
    },
    onError: (error: ApiError) => toast.error(error.message || 'Failed to update custom domain.'),
  });
}

export function useRemoveTenantDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (domainId: string) => tenantDomainsApi.remove(domainId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tenantDomainKeys.all });
      toast.success('Custom domain removed.');
    },
    onError: (error: ApiError) => toast.error(error.message || 'Failed to remove custom domain.'),
  });
}

export function useUploadTenantDomainCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      domainId,
      request,
    }: {
      domainId: string;
      request: UploadTenantDomainCertificateRequest;
    }) => tenantDomainsApi.uploadCertificate(domainId, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tenantDomainKeys.all });
      toast.success('Certificate saved and validated.');
    },
    onError: (error: ApiError) => toast.error(error.message || 'Failed to upload certificate.'),
  });
}
